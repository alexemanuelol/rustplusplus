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

export const name = 'large';

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
    const dateLastTriggered = rpInstance.rpMapMarkers.dateLargeOilRigLastTriggered;

    const response: string[] = [];
    for (const content of Object.values(rpInstance.rpMapMarkers.oilRigLockedCrateUnlockedMetaData)) {
        if (content.oilRig === 'large_oil_rig') {
            const dateTriggered = content.dateTriggered;
            const unixTimestampTriggered = Math.floor(dateTriggered.getTime() / 1000);
            const eventDurationSeconds = Math.floor(serverInfo.oilRigLockedCrateUnlockTimeMs / 1000);
            const unixTimestampUnlocks = unixTimestampTriggered + eventDurationSeconds;
            const secondsTillUnlocks = unixTimestampUnlocks - unixTimestampNow;

            const location = lm.getIntl(language, `monumentName-${content.oilRig}`);

            response.push(lm.getIntl(language, 'timeUntilUnlocksAt', {
                time: secondsToFullScale(secondsTillUnlocks),
                location: location
            }));
        }
    }

    if (response.length === 0) {
        if (dateLastTriggered !== null) {
            const unixTimestampLastTriggered = Math.floor(dateLastTriggered.getTime() / 1000);
            const secondsSinceTriggered = unixTimestampNow - unixTimestampLastTriggered;
            response.push(lm.getIntl(language, 'timeSinceHeavyScientistsOnLarge', {
                time: secondsToFullScale(secondsSinceTriggered)
            }));
        }
        else {
            response.push(lm.getIntl(language, 'noDataOnLargeOilRig'));
        }
    }

    rpInstance.sendPrefixCommandResponse(response.join(' '), inGame);
    log.info(`${fn} ${response.join(' ')}`, logParam);

    return true;
}