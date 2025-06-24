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

import axios, { AxiosResponse } from 'axios';

import * as types from './types';
import * as constants from './constants';
import { decodeHtml } from './utils';
import { log } from '../../index';

const STEAM_PROFILE_PICTURE_REGEX = /<img src="(.*_full.jpg)(.*?(?="))/;
const PROFILE_NAME_REGEX = /class="actual_persona_name">(.+?)<\/span>/gm;

async function fetchUrl(url: string): Promise<AxiosResponse> {
    const fName = `[fetchUrl: ${url}]`;

    try {
        const response = await axios.get(url);
        return response;
    }
    catch (error) {
        log.error(`${fName} Error fetching, Error: ${error}`);
        throw error;
    }
}

export async function fetchSteamProfilePicture(steamId: types.SteamId): Promise<string | null> {
    const fName = `[fetchSteamProfilePicture: ${steamId}]`;

    const url = `${constants.STEAM_PROFILES_URL}${steamId}`;

    try {
        const response = await fetchUrl(url);

        if (response.status !== 200) {
            log.error(`${fName} Failed to fetch steam profile picture. Status: ${response.status}`);
            return null;
        }

        if (!response.data) {
            log.error(`${fName} No data received from the fetched url.`);
            return null;
        }

        const match = response.data.match(STEAM_PROFILE_PICTURE_REGEX);
        return match ? match[1] : null;
    }
    catch (error) {
        log.error(`${fName} Error fetching steam profile picture. Error: ${error}`);
        return null;
    }
}

export async function fetchSteamProfileName(steamId: types.SteamId): Promise<string | null> {
    const fName = `[fetchSteamProfileName: ${steamId}]`;

    const url = `${constants.STEAM_PROFILES_URL}${steamId}`;

    try {
        const response = await fetchUrl(url);

        if (response.status !== 200) {
            log.error(`${fName} Failed to fetch steam profile name. Status: ${response.status}`);
            return null;
        }

        if (!response.data) {
            log.error(`${fName} No data received from the fetched url.`);
            return null;
        }

        const regex = new RegExp(PROFILE_NAME_REGEX);
        const match = regex.exec(response.data);

        if (match && match[1]) {
            return decodeHtml(match[1]);
        }
        else {
            log.error(`${fName} Could not find profile name in the response.`);
            return null;
        }
    }
    catch (error) {
        log.error(`${fName} Error fetching steam profile name. Error: ${error}`);
        return null;
    }
}