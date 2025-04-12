/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

import * as fs from 'fs';
import * as path from 'path';

import { log } from '../../index';
import * as types from '../utils/types';
import * as vu from '../utils/validationUtils';
import { DiscordManager } from './discordManager';
import { sendCredentialsExpiredMessage } from '../discordUtils/discordMessages';

export const VERSION = 1;

export enum ReadError {
    NotFound = 0,
    ReadFailed = 1,
    ParseFailed = 2,
    InvalidVersion = 3,
    InvalidFormat = 4
}

export enum WriteError {
    NoError = 0,
    InvalidFormat = 1,
    InvalidVersion = 2,
    WriteFailed = 3
}

export type CredentialsMap = { [steamId: types.SteamId]: Credentials };

export interface Credentials {
    version: number;
    steamId: types.SteamId;
    gcm: Gcm;
    discordUserId: types.UserId;
    associatedGuilds: types.GuildId[];
    issueDate: types.Timestamp;
    expireDate: types.Timestamp;
    expirationNotified: boolean;
}

export interface Gcm {
    androidId: string;
    securityToken: string;
}

export class CredentialsManager {
    private credentialFilesPath: string;
    private credentialsMap: CredentialsMap;
    private expirationTimeouts: Map<types.SteamId, NodeJS.Timeout>;

    constructor(credentialFilesPath: string) {
        const funcName = '[CredentialsManager: Init]';
        log.info(`${funcName} Credentials files path '${credentialFilesPath}'.`);
        this.credentialFilesPath = credentialFilesPath;
        this.credentialsMap = {};
        this.expirationTimeouts = new Map();

        this.loadAllCredentials();
    }

    private loadAllCredentials(): void {
        const funcName = '[CredentialsManager: loadAllCredentials]';
        const credentialFiles = fs.readdirSync(this.credentialFilesPath);

        credentialFiles.forEach((file) => {
            const steamId = path.basename(file, '.json');
            const credentials = this.readCredentialsFile(steamId);

            if (typeof credentials === 'number') {
                log.error(`${funcName} Failed to load Credentials file '${file}'. Exiting...`);
                process.exit(1);
            }

            this.credentialsMap[steamId] = credentials;
        });
    }

    private readCredentialsFile(steamId: types.SteamId): Credentials | ReadError {
        const funcName = `[CredentialsManager: readCredentialsFile: ${steamId}]`;
        log.info(`${funcName} Reading Credentials file.`);

        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);

        if (!fs.existsSync(credentialsFilePath)) {
            log.warn(`${funcName} Credentials file could not be found.`);
            return ReadError.NotFound;
        }

        let credentialsFileContent: string;
        try {
            credentialsFileContent = fs.readFileSync(credentialsFilePath, 'utf8');
        }
        catch (error) {
            log.warn(`${funcName} Failed to read Credentials file '${credentialsFilePath}', ${error}`);
            return ReadError.ReadFailed;
        }

        let credentialsFileContentParsed: Credentials;
        try {
            credentialsFileContentParsed = JSON.parse(credentialsFileContent);
        }
        catch (error) {
            log.warn(`${funcName} Credentials file failed parse. Data: ${credentialsFileContent}, ${error}`);
            return ReadError.ParseFailed;
        }

        if (!isValidCredentials(credentialsFileContentParsed)) {
            log.warn(`${funcName} Credentials file have invalid format. Data: ` +
                `${JSON.stringify(credentialsFileContentParsed)}`);
            return ReadError.InvalidFormat;
        }

        if (credentialsFileContentParsed.version !== VERSION) {
            log.warn(`${funcName} Credentials file have invalid version. ` +
                `Expected: ${VERSION}, Actual: ${credentialsFileContentParsed.version}`);
            return ReadError.InvalidVersion;
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (credentialsFileContentParsed.expireDate < currentTimestamp) {
            log.warn(`${funcName} Credentials have expired. Expire date: ${credentialsFileContentParsed.expireDate}`);
        }

        log.info(`${funcName} Credentials file was successfully read.`);
        return credentialsFileContentParsed as Credentials;
    }

    private writeCredentialsFile(steamId: types.SteamId, credentials: Credentials): WriteError {
        const funcName = `[CredentialsManager: writeCredentialsFile: ${steamId}]`;
        log.info(`${funcName} Writing Credentials to file.`);

        if (!isValidCredentials(credentials)) {
            log.warn(`${funcName} Credentials have invalid format. Data: ${JSON.stringify(credentials)}`);
            return WriteError.InvalidFormat;
        }

        if (credentials.version !== VERSION) {
            log.warn(`${funcName} Credentials have invalid version. Expected: ${VERSION}, ` +
                `Actual: ${credentials.version}`);
            return WriteError.InvalidVersion;
        }

        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);
        const credentialsString = JSON.stringify(credentials, null, 2);

        try {
            fs.writeFileSync(credentialsFilePath, credentialsString);
        }
        catch (error) {
            log.warn(`${funcName} Failed to write Credentials file '${credentialsFilePath}', ${error}`);
            return WriteError.WriteFailed;
        }

        log.info(`${funcName} Credentials was successfully written.`);
        return WriteError.NoError;
    }

    private deleteCredentialsFile(steamId: types.SteamId): boolean {
        const funcName = `[CredentialsManager: deleteCredentialsFile: ${steamId}]`;
        log.info(`${funcName} Delete Credentials file.`);
        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);

        if (!fs.existsSync(credentialsFilePath)) {
            log.warn(`${funcName} Could not find Credentials file '${credentialsFilePath}'.`);
            return false;
        }

        try {
            fs.unlinkSync(credentialsFilePath);
        }
        catch (error) {
            log.warn(`${funcName} Failed to delete Credentials file '${credentialsFilePath}', ${error}`);
            return false;
        }

        log.info(`${funcName} Credentials file '${credentialsFilePath}' was successfully deleted.`);
        return true;
    }

    private async handleExpiredCredentials(steamId: types.SteamId, dm: DiscordManager) {
        const credentials = this.getCredentials(steamId);
        if (credentials === null) return;

        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (credentials.expireDate < currentTimestamp && !credentials.expirationNotified) {
            await sendCredentialsExpiredMessage(dm, steamId);
            credentials.expirationNotified = true;
            this.updateCredentials(steamId);
        }

        this.deleteExpireTimeout(steamId);
    }

    public getCredentialSteamIds(): types.SteamId[] {
        return Object.keys(this.credentialsMap);
    }

    public getCredentialSteamIdsFromGuildId(guildId: types.GuildId): types.SteamId[] {
        const steamIds: types.SteamId[] = [];

        for (const [steamId, credentials] of Object.entries(this.credentialsMap)) {
            if (credentials.associatedGuilds.includes(guildId)) {
                steamIds.push(steamId);
            }
        }

        return steamIds;
    }

    public getCredentialSteamIdsFromDiscordUserId(discordUserId: types.UserId): types.SteamId[] {
        const steamIds: types.SteamId[] = [];

        for (const [steamId, credentials] of Object.entries(this.credentialsMap)) {
            if (credentials.discordUserId === discordUserId) {
                steamIds.push(steamId);
            }
        }

        return steamIds;
    }

    public getCredentials(steamId: types.SteamId): Credentials | null {
        return this.credentialsMap[steamId] ?? null;
    }

    public getCredentialsDeepCopy(steamId: types.SteamId): Credentials | null {
        const credentials = this.credentialsMap[steamId];
        return credentials ? structuredClone(credentials) : null;
    }

    public updateCredentials(steamId: types.SteamId): boolean {
        const funcName = `[CredentialsManager: updateCredentials: ${steamId}]`;
        const credentials = this.credentialsMap[steamId];
        if (!credentials) {
            log.warn(`${funcName} Credentials could not be found.`);
            return false;
        }

        const result = this.writeCredentialsFile(steamId, credentials);
        if (result !== WriteError.NoError) {
            log.warn(`${funcName} Failed to update Credentials file.`);
            return false;
        }

        return true;
    }

    public deleteCredentials(steamId: types.SteamId): boolean {
        this.deleteExpireTimeout(steamId);

        const result = this.deleteCredentialsFile(steamId);
        if (result) {
            delete this.credentialsMap[steamId];
            return true;
        }
        return false;
    }

    public addCredentials(steamId: types.SteamId, credentials: Credentials): boolean {
        const funcName = `[CredentialsManager: addCredentials: ${steamId}]`;

        if (steamId in this.credentialsMap) {
            log.warn(`${funcName} Old Credentials will be overwritten.`);
        }

        const result = this.writeCredentialsFile(steamId, credentials);
        if (result !== WriteError.NoError) {
            log.warn(`${funcName} Failed to write Credentials to file.`);
            return false;
        }

        this.credentialsMap[steamId] = credentials;

        return true;
    }

    public addExpireTimeout(steamId: types.SteamId, dm: DiscordManager) {
        if (this.expirationTimeouts.has(steamId)) {
            /* Ensure no duplicate timeouts exist. */
            this.deleteExpireTimeout(steamId);
        }

        const credentials = this.getCredentials(steamId);
        if (credentials === null) return;

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const timeoutBuffer = 5000; /* 5 seconds buffer to ensure the timeout triggers after expiration. */
        const timeout = ((credentials.expireDate - currentTimestamp) * 1000) + timeoutBuffer;

        if (timeout <= 0) {
            this.handleExpiredCredentials(steamId, dm);
            return;
        }

        const timeoutId = setTimeout(() => {
            this.handleExpiredCredentials(steamId, dm);
        }, timeout);

        this.expirationTimeouts.set(steamId, timeoutId);
    }

    public deleteExpireTimeout(steamId: types.SteamId) {
        const timeoutId = this.expirationTimeouts.get(steamId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.expirationTimeouts.delete(steamId);
        }
    }
}

/**
 * Validation functions.
 */

export function isValidCredentials(object: unknown): object is Credentials {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as Credentials;

    const interfaceName = 'Credentials';
    const validKeys = [
        'version',
        'steamId',
        'gcm',
        'discordUserId',
        'associatedGuilds',
        'issueDate',
        'expireDate',
        'expirationNotified'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('version', obj.version, 'number'));
    errors.push(vu.validateType('steamId', obj.steamId, 'string'));
    errors.push(vu.validateInterface('gcm', obj.gcm, isValidGcm));
    errors.push(vu.validateType('discordUserId', obj.discordUserId, 'string'));
    errors.push(vu.validateArrayOfTypes('associatedGuilds', obj.associatedGuilds, 'string'));
    errors.push(vu.validateType('issueDate', obj.issueDate, 'number'));
    errors.push(vu.validateType('expireDate', obj.expireDate, 'number'));
    errors.push(vu.validateType('expirationNotified', obj.expirationNotified, 'boolean'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidGcm(object: unknown): object is Gcm {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as Gcm;

    const interfaceName = 'Gcm';
    const validKeys = [
        'androidId',
        'securityToken'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('androidId', obj.androidId, 'string'));
    errors.push(vu.validateType('securityToken', obj.securityToken, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}