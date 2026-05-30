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

import * as rp from 'rustplus-ts';
import * as discordjs from 'discord.js';

import { log, guildInstanceManager as gim, localeManager as lm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { secondsToFullScale } from '../utils/timer';
import { getPos, getPosString } from '../utils/map';
import { TRAVELLING_VENDOR_ACTIVE_TIME_MS } from '../structures/rustPlusMapMarkers';

export const name = 'travellingvendor';

export async function execute(rpInstance: RustPlusInstance, args: string[],
    message: rp.AppTeamMessage | discordjs.Message):
    Promise<boolean> {
    const fn = `[prefixCommand: ${name}]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    const inGame = Object.hasOwn(message, 'steamId') ? true : false;
    const guildId = rpInstance.guildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    if (rpInstance.rpMapMarkers === null) return false;

    const response: string[] = [];
    if (rpInstance.rpMapMarkers.travellingVendors.length === 0) {
        const dateWhenLeftMap = rpInstance.rpMapMarkers.dateTravellingVendorLeftMap;

        if (dateWhenLeftMap !== null) {
            const timeSinceLeftMapSeconds = (new Date().getTime() - dateWhenLeftMap.getTime()) / 1000;
            response.push(lm.getIntl(language, 'timeSinceLeftMap', {
                time: secondsToFullScale(timeSinceLeftMapSeconds)
            }));
        }
        else {
            response.push(lm.getIntl(language, 'travellingVendorNotOnMap'));
        }
    }
    else {
        for (const travellingVendor of rpInstance.rpMapMarkers.travellingVendors) {
            const pos = getPos(travellingVendor.x, travellingVendor.y, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                lm.getIntl(language, 'unknown');
            const dateWhenSpawned = rpInstance.rpMapMarkers.dateTravellingVendorSpawned[travellingVendor.id];

            const timeSinceSpawnSeconds = (new Date().getTime() - dateWhenSpawned.getTime()) / 1000;
            const timeTillDespawn = (TRAVELLING_VENDOR_ACTIVE_TIME_MS / 1000) - timeSinceSpawnSeconds;

            response.push(lm.getIntl(language, 'travellingVendorIsActive', {
                pos: posString,
                time1: secondsToFullScale(timeSinceSpawnSeconds),
                time2: secondsToFullScale(timeTillDespawn)
            }));
        }
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}