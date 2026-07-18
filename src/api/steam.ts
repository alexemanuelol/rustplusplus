/*
    Copyright (C) 2026 Alexander Emanuelsson (alexemanuelol)

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

import { XMLParser } from "fast-xml-parser";
import { tryFetchUrl } from './fetch';

import * as types from '../utils/types';
import { log } from '../../index';

/**
 * Interfaces from the steam profile API call
 */

interface SteamAPIProfileXml {
    steamID64: string;
    steamID: string;
    onlineState?: string;
    stateMessage?: string;
    privacyState?: string;
    visibilityState?: number;
    avatarIcon?: string;
    avatarMedium?: string;
    avatarFull?: string;
    vacBanned: number;
    tradeBanState: string;
    isLimitedAccount?: number;
    customURL?: string;
    memberSince?: string;
    steamRating?: string;
    hoursPlayed2Wk?: number;
    headline?: string;
    location?: string;
    realname?: string;
    summary?: string;
    mostPlayedGames?: {
        mostPlayedGame: SteamAPIMostPlayedGameXml | SteamAPIMostPlayedGameXml[];
    };
    groups?: {
        group: SteamAPIGroupXml | SteamAPIGroupXml[];
    };
    privacyMessage?: SteamAPIPrivacyMessageXml;
}

interface SteamAPIMostPlayedGameXml {
    gameName: string;
    gameLink: string;
    gameIcon: string;
    gameLogo: string;
    gameLogoSmall: string;
    hoursPlayed: number;
    hoursOnRecord: number;
    statsName?: number;
}

interface SteamAPIGroupXml {
    groupID64: string;
    groupName?: string;
    groupURL?: string;
    headline?: string;
    summary?: string;
    avatarIcon?: string;
    avatarMedium?: string;
    avatarFull?: string;
    memberCount?: number;
    membersInChat?: number;
    membersInGame?: number;
    membersOnline?: number;
    "@_isPrimary": string;
}

interface SteamAPIPrivacyMessageXml {
    br: string;
    "#text": string;
}

/**
 * Custom interfaces for the steam profile data
 */

export interface SteamProfile {
    steamId: types.SteamId;
    personaName: string;
    privateProfile: boolean;
    realName: string | null;
    location: string | null;
    imageUrl: string | null;
    summary: string | null;
    vacBan: boolean;
    memberSince: string | null;
}

async function fetchSteamAPIProfileXml(steamId: types.SteamId): Promise<SteamAPIProfileXml | null> {
    const url = `https://steamcommunity.com/profiles/${steamId}/?xml=1`;

    const xml = await tryFetchUrl<string>(url);
    if (!xml) {
        return null;
    }

    const parser = new XMLParser({
        ignoreAttributes: false,
        trimValues: true,
    });

    const parsed = parser.parse(xml);
    const profileXml = parsed.profile as SteamAPIProfileXml;

    return profileXml;
}

export async function fetchSteamProfile(steamId: types.SteamId): Promise<SteamProfile | null> {
    const fn = `[fetchSteamProfile]`;
    const logParam = { steamId: steamId };

    const profileXml = await fetchSteamAPIProfileXml(steamId);
    if (!profileXml) {
        log.error(`${fn} Invalid Steam profile XML response.`, logParam);
        return null;
    }

    let memberSince: string | null = profileXml.memberSince ?? null;
    if (memberSince) {
        const date = new Date(memberSince);

        if (!isNaN(date.getTime())) {
            memberSince = Math.floor(date.getTime() / 1000).toString();
        }
    }

    return {
        steamId: profileXml.steamID64,
        personaName: profileXml.steamID,
        privateProfile: profileXml.privacyState && profileXml.privacyState === 'public' ? true : false,
        realName: profileXml.realname ?? null,
        location: profileXml.location ?? null,
        imageUrl: profileXml.avatarFull ?? null,
        summary: profileXml.summary ?? null,
        vacBan: profileXml.vacBanned === 1,
        memberSince: profileXml.memberSince ?? null
    };
}