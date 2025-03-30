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
import dotenv from 'dotenv';

import { createLogger } from './src/managers/loggerManager';
import { LocaleManager, Languages, isValidLanguage } from './src/managers/LocaleManager';
import { CredentialsManager } from './src/managers/credentialsManager';
import { GuildInstanceManager } from './src/managers/guildInstanceManager';
import { DiscordManager } from './src/managers/discordManager';
//import { RustPlusMananger } from './src/managers/rustPlusManager';
import { FcmListenerManager } from './src/managers/fcmListenerManager';

dotenv.config();

/* Function to get a required string value (throws an error if missing) */
function getStringEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`[index.ts] Missing required environment variable '${key}'`);
    }
    return value;
}

/* Function to get an optional number value (uses default if missing or invalid) */
function getNumberEnv(key: string, defaultValue: number): number {
    const value = Number(process.env[key]);
    return Number.isNaN(value) ? defaultValue : value;
};

/* Function to get a boolean value (treats 'true' as true, everything else as false) */
function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
    const value = process.env[key];
    return value === 'true' ? true : defaultValue;
};

export const config = {
    general: {
        debug: getBooleanEnv('RPP_DEBUG', false),
        language: isValidLanguage(getStringEnv('RPP_LANGUAGE', 'en')) ?
            getStringEnv('RPP_LANGUAGE', 'en') as Languages : Languages.ENGLISH,
        pollingIntervalMs: getNumberEnv('RPP_POLLING_INTERVAL_MS', 10_000),
        showCallStackOnError: getBooleanEnv('RPP_SHOW_CALL_STACK_ON_ERROR', false),
        reconnectIntervalMs: getNumberEnv('RPP_RECONNECT_INTERVAL_MS', 15_000)
    },
    discord: {
        username: getStringEnv('RPP_DISCORD_USERNAME', 'rustplusplus'),
        clientId: getStringEnv('RPP_DISCORD_CLIENT_ID'),
        token: getStringEnv('RPP_DISCORD_TOKEN'),
        useCache: getBooleanEnv('RPP_USE_CACHE', true),
        enforceNameChange: getBooleanEnv('RPP_ENFORCE_NAME_CHANGE', true),
        enforceAvatarChange: getBooleanEnv('RPP_ENFORCE_AVATAR_CHANGE', true),
        enforceChannelPermissions: getBooleanEnv('RPP_ENFORCE_CHANNEL_PERMISSIONS', true)
    }
}

export const log = createLogger(path.join(__dirname, 'logs', 'rustplusplus.log'));

function createMissingDirectories() {
    const directories = ['logs', 'guildInstances', 'credentials', 'maps'];

    directories.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
}
createMissingDirectories();

export const localeManager = new LocaleManager(config.general.language);
export const credentialsManager = new CredentialsManager(path.join(__dirname, 'credentials'));
export const guildInstanceManager = new GuildInstanceManager(
    path.join(__dirname, 'guildInstances'),
    path.join(__dirname, 'src', 'templates')
);

export const discordManager = new DiscordManager();
discordManager.build();

//export const rustPlusManager = new RustPlusMananger();
export const fcmListenerManager = new FcmListenerManager(discordManager);

process.on('unhandledRejection', error => {
    log.error(`[index.ts] Unhandled Rejection: ${error}`);
    console.log(error);
});