/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

const ROOT_DIR = path.join(__dirname, '..', '..', '..');

export interface Credentials {
    [steamId: string]: UserData;
}

export interface UserData {
    fcmCredentials: FCMCredentials;
    discordUserId: string;
}

export interface FCMCredentials {
    keys: FCMKeys;
    fcm: FCMFcm;
    gcm: FCMGcm;
}

export interface FCMKeys {
    privateKey: string;
    publicKey: string;
    authSecret: string;
}

export interface FCMFcm {
    token: string;
    pushSet: string;
}

export interface FCMGcm {
    token: string;
    androidId: string;
    securityToken: string;
    appId: string;
}

export function readCredentialsFile(): Credentials {
    const credentialsFilePath: string = path.join(ROOT_DIR, 'credentials', 'credentials.json');
    const credentialsFileContent: string = fs.readFileSync(credentialsFilePath, 'utf8');
    return JSON.parse(credentialsFileContent);
}

export function writeCredentialsFile(credentials: Credentials): void {
    const credentialsFilePath: string = path.join(ROOT_DIR, 'credentials', 'credentials.json');
    const credentialsString: string = JSON.stringify(credentials, null, 2);
    fs.writeFileSync(credentialsFilePath, credentialsString);
}

export function createCredentialsFile(): void {
    const credentialsPath: string = path.join(ROOT_DIR, 'credentials', 'credentials.json');

    if (!fs.existsSync(credentialsPath)) {
        writeCredentialsFile({});
    }
}