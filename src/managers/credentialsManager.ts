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

export interface AllCredentials {
    [steamId: types.SteamId]: Credentials
}

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
    private allCredentials: AllCredentials;
    private expirationTimeouts: Map<types.SteamId, NodeJS.Timeout>;

    constructor(credentialFilesPath: string) {
        log.info(`[CredentialsManager Init] Credentials path '${credentialFilesPath}'.`);
        this.credentialFilesPath = credentialFilesPath;
        this.allCredentials = {};
        this.expirationTimeouts = new Map();

        this.loadAllCredentials();
    }

    private loadAllCredentials(): void {
        const credentialFiles = fs.readdirSync(this.credentialFilesPath);

        credentialFiles.forEach((file) => {
            const steamId = path.basename(file, '.json');
            const credentials = this.readCredentialsFile(steamId);

            if (typeof credentials === 'number') {
                return;
            }

            this.allCredentials[steamId] = credentials;
        });
    }

    private readCredentialsFile(steamId: types.SteamId): Credentials | ReadError {
        const funcName = '[readCredentialsFile]';
        log.info(`${funcName} Reading credentials file for steamId ${steamId}.`);

        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);

        if (!fs.existsSync(credentialsFilePath)) {
            log.warn(`${funcName} Credentials for steamId ${steamId} could not be found.`);
            return ReadError.NotFound;
        }

        let credentialsFileContent: string;
        try {
            credentialsFileContent = fs.readFileSync(credentialsFilePath, 'utf8');
        }
        catch (error) {
            log.warn(`${funcName} Failed to read credentials file '${credentialsFilePath}', ${error}`);
            return ReadError.ReadFailed;
        }

        let credentialsFileContentParsed: any;
        try {
            credentialsFileContentParsed = JSON.parse(credentialsFileContent);
        }
        catch (error) {
            log.warn(`${funcName} Credentials file for steamId ${steamId} failed to be parsed. Data: ` +
                `${credentialsFileContent}, ${error}`);
            return ReadError.ParseFailed;
        }

        if (!isValidCredentials(credentialsFileContentParsed)) {
            log.warn(`${funcName} Credentials file for steamId ${steamId} have invalid format. Data: ` +
                `${JSON.stringify(credentialsFileContentParsed)}`);
            return ReadError.InvalidFormat;
        }

        if (credentialsFileContentParsed.version !== VERSION) {
            log.warn(`${funcName} Credentials file for steamId ${steamId} have invalid version. ` +
                `Expected: ${VERSION}, Actual: ${credentialsFileContentParsed.version}`);
            return ReadError.InvalidVersion;
        }

        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (credentialsFileContentParsed.expireDate < currentTimestamp) {
            log.warn(`${funcName} Credentials for steamId ${steamId} have expired. ` +
                `Expire date: ${credentialsFileContentParsed.expireDate}`);
        }

        log.info(`${funcName} Credentials file for steamId ${steamId} was successfully read.`);
        return credentialsFileContentParsed as Credentials;
    }

    private writeCredentialsFile(steamId: types.SteamId, credentials: Credentials): WriteError {
        const funcName = '[writeCredentialsFile]';
        log.info(`${funcName} Writing credentials to file for steamId ${steamId}.`);

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
            log.warn(`${funcName} Failed to write credentials file '${credentialsFilePath}', ${error}`);
            return WriteError.WriteFailed;
        }

        log.info(`${funcName} Credentials for steamId ${steamId} was successfully written.`);
        return WriteError.NoError;
    }

    private deleteCredentialsFile(steamId: types.SteamId): boolean {
        const funcName = '[deleteCredentialsFile]';
        log.info(`${funcName} Delete credentials file for steamId ${steamId}.`);
        const credentialsFilePath = path.join(this.credentialFilesPath, `${steamId}.json`);

        if (!fs.existsSync(credentialsFilePath)) {
            log.warn(`${funcName} Could not find credentials file '${credentialsFilePath}'.`);
            return false;
        }

        try {
            fs.unlinkSync(credentialsFilePath);
        }
        catch (error) {
            log.warn(`${funcName} Failed to delete credentials file '${credentialsFilePath}', ${error}`);
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
            await sendCredentialsExpiredMessage(dm, credentials.discordUserId, credentials);
            credentials.expirationNotified = true;
            this.updateCredentials(steamId);
        }

        this.deleteExpireTimeout(steamId);
    }

    public getCredentialSteamIds(): types.SteamId[] {
        return Object.keys(this.allCredentials);
    }

    public getCredentialSteamIdsFromGuildId(guildId: types.GuildId): types.SteamId[] {
        const steamIds: types.SteamId[] = [];

        for (const [steamId, credentials] of Object.entries(this.allCredentials)) {
            if (credentials.associatedGuilds.includes(guildId)) {
                steamIds.push(steamId);
            }
        }

        return steamIds;
    }

    public getCredentialSteamIdsFromDiscordUserId(discordUserId: types.UserId): types.SteamId[] {
        const steamIds: types.SteamId[] = [];

        for (const [steamId, credentials] of Object.entries(this.allCredentials)) {
            if (credentials.discordUserId === discordUserId) {
                steamIds.push(steamId);
            }
        }

        return steamIds;
    }

    public getCredentials(steamId: types.SteamId): Credentials | null {
        const credentials = this.allCredentials[steamId];
        return credentials ?? null;
    }

    public getCredentialsDeepCopy(steamId: types.SteamId): Credentials | null {
        const credentials = this.allCredentials[steamId];
        return credentials ? structuredClone(credentials) : null;
    }

    public updateCredentials(steamId: types.SteamId): boolean {
        const funcName = '[updateCredentials]';
        const credentials = this.allCredentials[steamId];
        if (!credentials) {
            log.warn(`${funcName} Credentials not found for steamId ${steamId}.`);
            return false;
        }

        const result = this.writeCredentialsFile(steamId, credentials);
        if (result !== WriteError.NoError) {
            log.warn(`${funcName} Failed to update credentials for steamId ${steamId}.`);
            return false;
        }

        return true;
    }

    public deleteCredentials(steamId: types.SteamId): boolean {
        this.deleteExpireTimeout(steamId);

        const result = this.deleteCredentialsFile(steamId);
        if (result) {
            delete this.allCredentials[steamId];
            return true;
        }
        return false;
    }

    public addCredentials(steamId: types.SteamId, credentials: Credentials): boolean {
        const funcName = '[addCredentials]';

        if (steamId in this.allCredentials) {
            log.warn(`${funcName} Old credentials will be overwritten for steamId ${steamId}.`);
        }

        const result = this.writeCredentialsFile(steamId, credentials);
        if (result !== WriteError.NoError) {
            log.warn(`${funcName} Failed to write credentials to file for steamId ${steamId}.`);
            return false;
        }

        this.allCredentials[steamId] = credentials;

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

export function isValidCredentials(object: any): object is Credentials {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

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
    errors.push(vu.validateType('version', object.version, 'number'));
    errors.push(vu.validateType('steamId', object.steamId, 'string'));
    errors.push(vu.validateInterface('gcm', object.gcm, isValidGcm));
    errors.push(vu.validateType('discordUserId', object.discordUserId, 'string'));
    errors.push(vu.validateArrayOfTypes('associatedGuilds', object.associatedGuilds, 'string'));
    errors.push(vu.validateType('issueDate', object.issueDate, 'number'));
    errors.push(vu.validateType('expireDate', object.expireDate, 'number'));
    errors.push(vu.validateType('expirationNotified', object.expirationNotified, 'boolean'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidGcm(object: any): object is Gcm {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const interfaceName = 'Gcm';
    const validKeys = [
        'androidId',
        'securityToken'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('androidId', object.androidId, 'string'));
    errors.push(vu.validateType('securityToken', object.securityToken, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}