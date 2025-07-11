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
    issueDate: types.Timestamp;
    expireDate: types.Timestamp;
    expirationNotified: boolean;
}

export interface Gcm {
    androidId: string;
    securityToken: string;
}

export type DiscordUserIdToSteamIdsMap = {
    [discordUserId: types.UserId]: types.SteamId[];
};

export class CredentialsManager {
    private credentialFilesPath: string;
    private credentialsMap: CredentialsMap;
    private expirationTimeouts: Map<types.SteamId, NodeJS.Timeout>;

    constructor(credentialFilesPath: string) {
        const fName = '[CredentialsManager: Init]';
        log.info(`${fName} Credentials files path '${credentialFilesPath}'.`);

        this.credentialFilesPath = credentialFilesPath;
        this.credentialsMap = {};
        this.expirationTimeouts = new Map();

        this.loadAllCredentials();
    }

    private loadAllCredentials(): void {
        const fName = '[CredentialsManager: loadAllCredentials]';

        const credentialFiles = fs.readdirSync(this.credentialFilesPath);

        credentialFiles.forEach((file) => {
            const steamId = path.basename(file, '.json');
            const credentials = this.readCredentialsFile(steamId);

            if (typeof credentials === 'number') {
                throw new Error(`${fName} Failed to load Credentials file '${file}'. Exiting...`);
            }

            this.credentialsMap[steamId] = credentials;
        });
    }

    private readCredentialsFile(steamId: types.SteamId): Credentials | ReadError {
        const fName = `[CredentialsManager: readCredentialsFile: ${steamId}]`;
        log.debug(`${fName} Reading Credentials file.`);

        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);

        if (!fs.existsSync(credentialsFilePath)) {
            log.warn(`${fName} Credentials file could not be found.`);
            return ReadError.NotFound;
        }

        let credentialsFileContent: string;
        try {
            credentialsFileContent = fs.readFileSync(credentialsFilePath, 'utf8');
        }
        catch (error) {
            log.warn(`${fName} Failed to read Credentials file '${credentialsFilePath}', ${error}`);
            return ReadError.ReadFailed;
        }

        let credentialsFileContentParsed: Credentials;
        try {
            credentialsFileContentParsed = JSON.parse(credentialsFileContent);
        }
        catch (error) {
            log.warn(`${fName} Credentials file failed parse. Data: ${credentialsFileContent}, ${error}`);
            return ReadError.ParseFailed;
        }

        if (!isValidCredentials(credentialsFileContentParsed)) {
            log.warn(`${fName} Credentials file have invalid format. Data: ` +
                `${JSON.stringify(credentialsFileContentParsed)}`);
            return ReadError.InvalidFormat;
        }

        if (credentialsFileContentParsed.version !== VERSION) {
            log.warn(`${fName} Credentials file have invalid version. ` +
                `Expected: ${VERSION}, Actual: ${credentialsFileContentParsed.version}`);
            return ReadError.InvalidVersion;
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (credentialsFileContentParsed.expireDate < currentTimestamp) {
            log.warn(`${fName} Credentials have expired. Expire date: ${credentialsFileContentParsed.expireDate}`);
        }

        log.debug(`${fName} Credentials file was successfully read.`);
        return credentialsFileContentParsed as Credentials;
    }

    private writeCredentialsFile(steamId: types.SteamId, credentials: Credentials): WriteError {
        const fName = `[CredentialsManager: writeCredentialsFile: ${steamId}]`;
        log.debug(`${fName} Writing Credentials to file.`);

        if (!isValidCredentials(credentials)) {
            log.warn(`${fName} Credentials have invalid format. Data: ${JSON.stringify(credentials)}`);
            return WriteError.InvalidFormat;
        }

        if (credentials.version !== VERSION) {
            log.warn(`${fName} Credentials have invalid version. Expected: ${VERSION}, ` +
                `Actual: ${credentials.version}`);
            return WriteError.InvalidVersion;
        }

        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);
        const credentialsString = JSON.stringify(credentials, null, 2);

        try {
            fs.writeFileSync(credentialsFilePath, credentialsString);
        }
        catch (error) {
            log.warn(`${fName} Failed to write Credentials file '${credentialsFilePath}', ${error}`);
            return WriteError.WriteFailed;
        }

        log.debug(`${fName} Credentials was successfully written.`);
        return WriteError.NoError;
    }

    private deleteCredentialsFile(steamId: types.SteamId): boolean {
        const fName = `[CredentialsManager: deleteCredentialsFile: ${steamId}]`;
        log.debug(`${fName} Delete Credentials file.`);

        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);

        if (!fs.existsSync(credentialsFilePath)) {
            log.warn(`${fName} Could not find Credentials file '${credentialsFilePath}'.`);
            return false;
        }

        try {
            fs.unlinkSync(credentialsFilePath);
        }
        catch (error) {
            log.warn(`${fName} Failed to delete Credentials file '${credentialsFilePath}', ${error}`);
            return false;
        }

        log.debug(`${fName} Credentials file '${credentialsFilePath}' was successfully deleted.`);
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

    public getDiscordUserIdToSteamIdsMap(): DiscordUserIdToSteamIdsMap {
        const steamIds = this.getCredentialSteamIds();
        const map: DiscordUserIdToSteamIdsMap = {};
        for (const steamId of steamIds) {
            const credentials = this.getCredentialsDeepCopy(steamId) as Credentials;
            if (Object.hasOwn(map, credentials.discordUserId)) {
                map[credentials.discordUserId].push(steamId);
            }
            else {
                map[credentials.discordUserId] = [steamId];
            }
        }

        return map;
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
        const fName = `[CredentialsManager: updateCredentials: ${steamId}]`;

        const credentials = this.credentialsMap[steamId];
        if (!credentials) {
            log.warn(`${fName} Credentials could not be found.`);
            return false;
        }

        const result = this.writeCredentialsFile(steamId, credentials);
        if (result !== WriteError.NoError) {
            log.warn(`${fName} Failed to update Credentials file.`);
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
        const fName = `[CredentialsManager: addCredentials: ${steamId}]`;

        if (steamId in this.credentialsMap) {
            log.warn(`${fName} Old Credentials will be overwritten.`);
        }

        const result = this.writeCredentialsFile(steamId, credentials);
        if (result !== WriteError.NoError) {
            log.warn(`${fName} Failed to write Credentials to file.`);
            return false;
        }

        this.credentialsMap[steamId] = credentials;

        return true;
    }

    public addExpireTimeout(steamId: types.SteamId, dm: DiscordManager) {
        const fName = `[CredentialsManager: addExpireTimeout: ${steamId}]`;

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
        log.info(`${fName} Expires in ${timeout / 1000} seconds.`);
    }

    public deleteExpireTimeout(steamId: types.SteamId) {
        const fName = `[CredentialsManager: deleteExpireTimeout: ${steamId}]`;

        const timeoutId = this.expirationTimeouts.get(steamId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            this.expirationTimeouts.delete(steamId);
        }
        log.info(`${fName} Expire timeout deleted.`);
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
        'issueDate',
        'expireDate',
        'expirationNotified'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('version', obj.version, 'number'));
    errors.push(vu.validateType('steamId', obj.steamId, 'string'));
    errors.push(vu.validateInterface('gcm', obj.gcm, isValidGcm));
    errors.push(vu.validateType('discordUserId', obj.discordUserId, 'string'));
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