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

export const name = 'chinook';

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

    const unixTimestampNow = Math.floor(new Date().getTime() / 1000);
    const dateDespawned = rpInstance.rpMapMarkers.dateCh47Despawned;

    const response: string[] = [];
    if (rpInstance.rpMapMarkers.ch47s.length === 0) {
        if (dateDespawned === null) {
            response.push(lm.getIntl(language, 'chinook47NotOnMap'));
        }
        else {
            const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
            const secondsSinceDespawned = Math.floor(unixTimestampNow - unixTimestampDespawned);
            response.push(lm.getIntl(language, 'timeSinceChinook47Left', {
                time: secondsToFullScale(secondsSinceDespawned)
            }));
        }
    }

    for (const ch47 of rpInstance.rpMapMarkers.ch47s) {
        const metaData = rpInstance.rpMapMarkers.ch47MetaData[ch47.id];
        const dateSpawned = rpInstance.rpMapMarkers.dateCh47Spawned[ch47.id];

        const pos = getPos(ch47.x, ch47.y, rpInstance);
        const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
            lm.getIntl(language, 'unknown');

        let str = lm.getIntl(language, 'chinook47LocatedAt', { pos: posString });

        if (dateSpawned) {
            const unixTimestampSpawned = Math.floor(dateSpawned.getTime() / 1000);
            const secondsSinceSpawned = Math.floor(unixTimestampNow - unixTimestampSpawned);
            str += ` ${lm.getIntl(language, 'chinook47BeenOutFor', {
                time: secondsToFullScale(secondsSinceSpawned)
            })}`;
        }

        if (metaData.lockedCrateNotified) {
            const monumentName = lm.getIntl(language, metaData.lockedCrateDropLocation as string);
            str += ` ${lm.getIntl(language, 'chinook47MayHaveDroppedLockedCrateAt', { monument: monumentName })}`;
        }

        response.push(str.trim());
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}