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

import * as axios from 'axios';

import * as constants from '../util/constants';
import { decodeHtml } from '../util/utils';
import { localeManager as lm } from '../../index';

// TODO! Make a logger module and use it here

export async function request(url: string): Promise<axios.AxiosResponse<any>> {
    try {
        return await axios.default.get(url);
    }
    catch (error: any) {
        console.error('Error requesting:', error.message);

        return {
            data: {},
            status: error.response?.status || 500,
            statusText: error.response?.statusText || 'Internal Server Error',
            headers: {},
            config: error.config,
            request: {},
        };
    }
}

export async function requestSteamProfilePicture(steamId: string): Promise<string | null> {
    const response: axios.AxiosResponse<any> = await request(`${constants.STEAM_PROFILES_URL}${steamId}`);

    if (response.status !== 200) {
        console.error(lm.getIntl(null, 'errorCap'), lm.getIntl(null, 'failedToScrapeProfilePicture', {
            link: `${constants.STEAM_PROFILES_URL}${steamId}`
        }));
        return null;
    }

    const png: string[] | null = response.data.match(/<img src="(.*_full.jpg)(.*?(?="))/);
    if (png) {
        return png[1];
    }

    return null;
}

export async function requestSteamProfileName(steamId: string): Promise<string | null> {
    const response: axios.AxiosResponse = await request(`${constants.STEAM_PROFILES_URL}${steamId}`);

    if (response.status !== 200) {
        console.error(lm.getIntl(null, 'errorCap'), lm.getIntl(null, 'failedToScrapeProfileName', {
            link: `${constants.STEAM_PROFILES_URL}${steamId}`
        }));
        return null;
    }

    const regex: RegExp = new RegExp(`class="actual_persona_name">(.+?)</span>`, 'gm');
    const data: RegExpExecArray | null = regex.exec(response.data);
    if (data) {
        return decodeHtml(data[1]);
    }

    return null;
}