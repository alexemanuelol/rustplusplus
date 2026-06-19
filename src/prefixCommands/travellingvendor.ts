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
import { GuildInstance, ServerInfo } from '../managers/guildInstanceManager';
import { secondsToFullScale } from '../utils/timer';
import { getPos, getPosString } from '../utils/map';

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
    const serverId = rpInstance.serverId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const language = gInstance.generalSettings.language;

    if (rpInstance.rpMapMarkers === null) return false;

    const unixTimestampNow = Math.floor(new Date().getTime() / 1000);
    const dateDespawned = rpInstance.rpMapMarkers.dateTravellingVendorDespawned;

    const response: string[] = [];
    if (rpInstance.rpMapMarkers.travellingVendors.length === 0) {
        if (dateDespawned !== null) {
            const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
            const secondsSinceDespawned = unixTimestampNow - unixTimestampDespawned;
            response.push(lm.getIntl(language, 'timeSinceLeftMap', {
                time: secondsToFullScale(secondsSinceDespawned)
            }));
        }
        else {
            response.push(lm.getIntl(language, 'travellingVendorNotOnMap'));
        }
    }
    else {
        for (const travellingVendor of rpInstance.rpMapMarkers.travellingVendors) {
            const dateSpawned = rpInstance.rpMapMarkers.dateTravellingVendorSpawned[travellingVendor.id];

            const pos = getPos(travellingVendor.x, travellingVendor.y, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                lm.getIntl(language, 'unknown');

            if (dateSpawned !== null) {
                const unixTimestampSpawned = Math.floor(dateSpawned.getTime() / 1000);
                const eventDurationSeconds = Math.floor(
                    serverInfo.customVariables.travellingVendorDurationTimeMs / 1000);
                const unixTimestampDespawn = unixTimestampSpawned + eventDurationSeconds;

                const secondsSinceSpawned = unixTimestampNow - unixTimestampSpawned;
                const secondsTillDespawn = unixTimestampDespawn - unixTimestampNow;

                response.push(lm.getIntl(language, 'travellingVendorIsActive', {
                    pos: posString,
                    time1: secondsToFullScale(secondsSinceSpawned),
                    time2: secondsToFullScale(secondsTillDespawn)
                }));
            }
            else {
                response.push(lm.getIntl(language, 'locatedAtPos', {
                    pos: posString
                }));
            }
        }
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}