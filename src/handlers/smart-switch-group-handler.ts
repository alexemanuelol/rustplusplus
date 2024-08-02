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
import { getSecondsFromStringTime, secondsToFullScale } from '../util/timer';
const { RustPlus } = require('../structures/RustPlus');
const Config = require('../../config');

export async function updateSwitchGroupIfContainSwitch(guildId: string, serverId: string, switchId: string) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    for (const [groupId, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
        if (content.switches.includes(`${switchId}`)) {
            await discordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
        }
    }
}

export function getGroupsFromSwitchList(guildId: string, serverId: string, switches: string[]): string[] {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    let groupsId: string[] = [];
    for (let entity of switches) {
        for (const [groupId, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
            if (content.switches.includes(entity) && !groupsId.includes(groupId)) {
                groupsId.push(groupId);
            }
        }
    }

    return groupsId;
}

export async function turnOnOffGroup(rustplus: typeof RustPlus, guildId: string, serverId: string, groupId: string,
    value: boolean) {
    const instance = guildInstance.readGuildInstanceFile(guildId);

    const switches = instance.serverList[serverId].switchGroups[groupId].switches;

    const actionSwitches = [];
    for (const [entityId, content] of Object.entries(instance.serverList[serverId].switches)) {
        if (switches.includes(entityId)) {
            if (rustplus.currentSwitchTimeouts.hasOwnProperty(entityId)) {
                clearTimeout(rustplus.currentSwitchTimeouts[entityId]);
                delete rustplus.currentSwitchTimeouts[entityId];
            }

            if (value && !content.active) {
                actionSwitches.push(entityId);
            }
            else if (!value && content.active) {
                actionSwitches.push(entityId);
            }
        }
    }

    for (const entityId of actionSwitches) {
        const prevActive = instance.serverList[serverId].switches[entityId].active;
        instance.serverList[serverId].switches[entityId].active = value;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        rustplus.interactionSwitches.push(entityId);

        const response = await rustplus.turnSmartSwitchAsync(entityId, value);
        if (!(await rustplus.isResponseValid(response))) {
            if (instance.serverList[serverId].switches[entityId].reachable) {
                await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
            }
            instance.serverList[serverId].switches[entityId].reachable = false;
            instance.serverList[serverId].switches[entityId].active = prevActive;
            guildInstance.writeGuildInstanceFile(guildId, instance);

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
        }
        else {
            instance.serverList[serverId].switches[entityId].reachable = true;
            guildInstance.writeGuildInstanceFile(guildId, instance);
        }

        await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
    }

    if (actionSwitches.length !== 0) {
        await discordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
    }
}

export async function smartSwitchGroupCommandHandler(rustplus: typeof RustPlus, command: string): Promise<boolean> {
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const switchGroups = instance.serverList[serverId].switchGroups;
    const prefix = instance.generalSettings.prefix;

    const onCap = lm.getIntl(language, 'onCap');
    const offCap = lm.getIntl(language, 'offCap');
    const notFoundCap = lm.getIntl(language, 'notFoundCap');

    const onEn = lm.getIntl('en', 'commandSyntaxOn');
    const onLang = lm.getIntl(language, 'commandSyntaxOn');
    const offEn = lm.getIntl('en', 'commandSyntaxOff');
    const offLang = lm.getIntl(language, 'commandSyntaxOff');
    const statusEn = lm.getIntl('en', 'commandSyntaxStatus');
    const statusLang = lm.getIntl(language, 'commandSyntaxStatus');

    const groupId = Object.keys(switchGroups).find(e =>
        command === `${prefix}${switchGroups[e].command}` ||
        command.startsWith(`${prefix}${switchGroups[e].command} `));

    if (!groupId) return false;

    const groupCommand = `${prefix}${switchGroups[groupId].command}`;
    let rest = command.replace(`${groupCommand} ${onEn}`, '');
    rest = rest.replace(`${groupCommand} ${onLang}`, '');
    rest = rest.replace(`${groupCommand} ${offEn}`, '');
    rest = rest.replace(`${groupCommand} ${offLang}`, '');
    rest = rest.replace(`${groupCommand}`, '').trim();

    let active: boolean = false;
    if (command.startsWith(`${groupCommand} ${onEn}`) || command.startsWith(`${groupCommand} ${onLang}`)) {
        active = true;
    }
    else if (command.startsWith(`${groupCommand} ${offEn}`) || command.startsWith(`${groupCommand} ${offLang}`)) {
        active = false;
    }
    else if (command === `${groupCommand} ${statusEn}` || command === `${groupCommand} ${statusLang}`) {
        const switchStatus = switchGroups[groupId].switches.map(switchId => {
            const { active, name, reachable } = instance.serverList[serverId].switches[switchId];
            return { active, name, reachable }
        });
        const statusMessage = switchStatus.map(status =>
            `${status.name}: ${status.reachable ? (status.active ? onCap : offCap) : notFoundCap}`).join(', ');
        rustplus.sendInGameMessage(`${lm.getIntl(language, 'status')}: ${statusMessage}`);
        return true;
    }
    else {
        return true;
    }

    if (rustplus.currentSwitchTimeouts.hasOwnProperty(groupId)) {
        clearTimeout(rustplus.currentSwitchTimeouts[groupId]);
        delete rustplus.currentSwitchTimeouts[groupId];
    }

    const timeSeconds = getSecondsFromStringTime(rest);

    let str = lm.getIntl(language, 'turningGroupOnOff', {
        group: switchGroups[groupId].name,
        status: active ? onCap : offCap
    });

    rustplus.info(lm.getIntl(Config.general.language, `logSmartSwitchGroupValueChange`, {
        value: active
    }));

    if (timeSeconds === null) {
        rustplus.sendInGameMessage(str);
        await turnOnOffGroup(rustplus, guildId, serverId, groupId, active);
        return true;
    }

    const time = secondsToFullScale(timeSeconds);
    str += lm.getIntl(language, 'automaticallyTurnBackOnOff', {
        status: active ? offCap : onCap,
        time: time
    });

    rustplus.currentSwitchTimeouts[groupId] = setTimeout(async function () {
        const instance = guildInstance.readGuildInstanceFile(guildId);
        if (!instance.serverList.hasOwnProperty(serverId) ||
            !instance.serverList[serverId].switchGroups.hasOwnProperty(groupId)) {
            return;
        }

        const str = lm.getIntl(language, 'automaticallyTurningBackOnOff', {
            device: instance.serverList[serverId].switchGroups[groupId].name,
            status: !active ? onCap : offCap
        });
        rustplus.sendInGameMessage(str);

        await turnOnOffGroup(rustplus, guildId, serverId, groupId, !active);
    }, timeSeconds * 1000);

    rustplus.sendInGameMessage(str);
    await turnOnOffGroup(rustplus, guildId, serverId, groupId, active);
    return true;
}