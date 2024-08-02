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

import { localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import * as discordMessages from '../discordTools/discord-messages';
import { secondsToFullScale } from '../util/timer';
const { RustPlus } = require('../structures/RustPlus');

export async function smartAlarmHandler(rustplus: typeof RustPlus) {
    const guildId = rustplus.guildId;
    let instance = guildInstance.readGuildInstanceFile(guildId);
    const serverId = rustplus.serverId;

    if (!instance.serverList.hasOwnProperty(serverId)) return;

    if (rustplus.smartAlarmIntervalCounter === 29) {
        rustplus.smartAlarmIntervalCounter = 0;
    }
    else {
        rustplus.smartAlarmIntervalCounter += 1;
    }

    if (rustplus.smartAlarmIntervalCounter === 0) {
        for (const entityId in instance.serverList[serverId].alarms) {
            instance = guildInstance.readGuildInstanceFile(guildId);

            const info = await rustplus.getEntityInfoAsync(entityId);
            if (!(await rustplus.isResponseValid(info))) {
                if (instance.serverList[serverId].alarms[entityId].reachable) {
                    await discordMessages.sendSmartAlarmNotFoundMessage(guildId, serverId, entityId);

                    instance.serverList[serverId].alarms[entityId].reachable = false;
                    guildInstance.writeGuildInstanceFile(guildId, instance);

                    await discordMessages.sendSmartAlarmMessage(guildId, serverId, entityId);
                }
            }
            else {
                if (!instance.serverList[serverId].alarms[entityId].reachable) {
                    instance.serverList[serverId].alarms[entityId].reachable = true;
                    guildInstance.writeGuildInstanceFile(guildId, instance);

                    await discordMessages.sendSmartAlarmMessage(guildId, serverId, entityId);
                }
            }
        }
    }
}

export function smartAlarmCommandHandler(rustplus: typeof RustPlus, command: string): boolean {
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const alarms = instance.serverList[serverId].alarms;
    const prefix = rustplus.generalSettings.prefix;

    const entityId = Object.keys(alarms).find(e => command === `${prefix}${alarms[e].command}`);
    if (!entityId) return false;

    if (alarms[entityId].lastTrigger === null) {
        rustplus.sendInGameMessage(lm.getIntl(language, 'alarmHaveNotBeenTriggeredYet', {
            alarm: alarms[entityId].name
        }));
        return true;
    }

    const lastTriggerDate = new Date((alarms[entityId].lastTrigger as number) * 1000);
    const timeSinceTriggerSeconds = Math.floor(((new Date()).getTime() - lastTriggerDate.getTime()) / 1000);
    const time = secondsToFullScale(timeSinceTriggerSeconds);

    rustplus.sendInGameMessage(lm.getIntl(language, 'timeSinceAlarmWasTriggered', {
        alarm: alarms[entityId].name,
        time: time
    }));

    return true;
}