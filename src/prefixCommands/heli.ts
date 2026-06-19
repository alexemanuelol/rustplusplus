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

// TODO! Extend command: See variables available on rustPlusMapMarkers.ts
// - !heli
//       - Just shows default info about cargo ship(s) on the map (Current implementation).
// - !heli time
//       - Time that helis been out
// - !heli location
//      - Show current location of patrol helicopter(s).

import * as rp from 'rustplus-ts';
import * as discordjs from 'discord.js';

import { log, guildInstanceManager as gim, localeManager as lm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { secondsToFullScale } from '../utils/timer';
import { getPos, getPosString } from '../utils/map';

export const name = 'heli';

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

    const response: string[] = [];
    if (rpInstance.rpMapMarkers.patrolHelicopters.length === 0) {
        const dateDestroyed = rpInstance.rpMapMarkers.datePatrolHelicopterDestroyed;
        const dateDespawned = rpInstance.rpMapMarkers.datePatrolHelicopterDespawned;
        const destroyedLocation = rpInstance.rpMapMarkers.patrolHelicopterLastDestroyedLocation;

        if (dateDestroyed) {
            const unixTimestampDestroyed = Math.floor(dateDestroyed.getTime() / 1000);
            const secondsSinceDestroyed = unixTimestampNow - unixTimestampDestroyed;
            response.push(lm.getIntl(language, 'timeSinceDestroyed', {
                time: secondsToFullScale(secondsSinceDestroyed),
                location: destroyedLocation ?? lm.getIntl(language, 'unknown')
            }));
        }

        if (dateDespawned) {
            const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
            const secondsSinceDespawned = unixTimestampNow - unixTimestampDespawned;
            response.push(lm.getIntl(language, 'timeSinceLeftMap', {
                time: secondsToFullScale(secondsSinceDespawned)
            }));
        }

        if (response.length === 0) {
            response.push(lm.getIntl(language, 'patrolHelicopterNotOnMap'));
        }
    }

    for (const patrolHelicopter of rpInstance.rpMapMarkers.patrolHelicopters) {
        const metaData = rpInstance.rpMapMarkers.patrolHelicopterMetaData[patrolHelicopter.id];

        const pos = getPos(patrolHelicopter.x, patrolHelicopter.y, rpInstance);
        const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
            lm.getIntl(language, 'unknown');

        if (metaData.isLeaving) {
            response.push(lm.getIntl(language, 'patrolHelicopterLeavingAt', { pos: posString }));
        }
        else {
            response.push(lm.getIntl(language, 'patrolHelicopterLocatedAt', { pos: posString }));
        }
    }

    rpInstance.sendPrefixCommandResponse(response.join(' '), inGame);
    log.info(`${fn} ${response.join(' ')}`, logParam);

    return true;
}