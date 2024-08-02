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
import { getDistance } from '../util/map';
import { getGroupsFromSwitchList, updateSwitchGroupIfContainSwitch } from './smart-switch-group-handler';
const RustPlus = require('../structures/RustPlus');
const Config = require('../../config');


export async function smartSwitchHandler(rustplus: typeof RustPlus, time: any) {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const serverId = rustplus.serverId;

    if (!instance.serverList.hasOwnProperty(serverId)) return;

    if (rustplus.smartSwitchIntervalCounter === 29) {
        rustplus.smartSwitchIntervalCounter = 0;
    }
    else {
        rustplus.smartSwitchIntervalCounter += 1;
    }

    /* Go through all Smart Switches and see if some of them do not answer on request. */
    const changedSwitches = [];
    if (rustplus.smartSwitchIntervalCounter === 0) {
        for (const entityId in instance.serverList[serverId].switches) {
            const info = await rustplus.getEntityInfoAsync(entityId);
            if (!(await rustplus.isResponseValid(info))) {
                if (instance.serverList[serverId].switches[entityId].reachable) {
                    await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    instance.serverList[serverId].switches[entityId].reachable = false;
                    guildInstance.writeGuildInstanceFile(guildId, instance);

                    await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
            }
            else {
                if (!instance.serverList[serverId].switches[entityId].reachable) {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                    guildInstance.writeGuildInstanceFile(guildId, instance);

                    await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
            }
        }
    }

    /* Go through all Smart Switches and see if the auto day/night setting is on and if it just became day/night */
    if (rustplus.time.isTurnedDay(time)) {
        for (const [entityId, content] of Object.entries(instance.serverList[serverId].switches)) {
            if (content.autoDayNightOnOff === 1) {
                instance.serverList[serverId].switches[entityId].active = true;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchOnAsync(entityId);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
            else if (content.autoDayNightOnOff === 2) {
                instance.serverList[serverId].switches[entityId].active = false;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchOffAsync(entityId);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
        }
    }
    else if (rustplus.time.isTurnedNight(time)) {
        for (const [entityId, content] of Object.entries(instance.serverList[serverId].switches)) {
            if (content.autoDayNightOnOff === 1) {
                instance.serverList[serverId].switches[entityId].active = false;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchOffAsync(entityId);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
            else if (content.autoDayNightOnOff === 2) {
                instance.serverList[serverId].switches[entityId].active = true;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchOnAsync(entityId);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
        }
    }

    for (const [entityId, content] of Object.entries(instance.serverList[serverId].switches)) {
        if (content.autoDayNightOnOff === 3) { /* AUTO-ON */
            if (content.active) continue;

            instance.serverList[serverId].switches[entityId].active = true;
            guildInstance.writeGuildInstanceFile(guildId, instance);

            rustplus.interactionSwitches.push(entityId);

            const response = await rustplus.turnSmartSwitchOnAsync(entityId);
            if (!(await rustplus.isResponseValid(response))) {
                if (instance.serverList[serverId].switches[entityId].reachable) {
                    await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                }
                instance.serverList[serverId].switches[entityId].reachable = false;

                rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
            }
            else {
                instance.serverList[serverId].switches[entityId].reachable = true;
            }
            guildInstance.writeGuildInstanceFile(guildId, instance);

            await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
            changedSwitches.push(entityId);
        }
        else if (content.autoDayNightOnOff === 4) { /* AUTO-OFF */
            if (!content.active) continue;

            instance.serverList[serverId].switches[entityId].active = false;
            guildInstance.writeGuildInstanceFile(guildId, instance);

            rustplus.interactionSwitches.push(entityId);

            const response = await rustplus.turnSmartSwitchOffAsync(entityId);
            if (!(await rustplus.isResponseValid(response))) {
                if (instance.serverList[serverId].switches[entityId].reachable) {
                    await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                }
                instance.serverList[serverId].switches[entityId].reachable = false;

                rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
            }
            else {
                instance.serverList[serverId].switches[entityId].reachable = true;
            }
            guildInstance.writeGuildInstanceFile(guildId, instance);

            await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
            changedSwitches.push(entityId);
        }
        else if (content.autoDayNightOnOff === 5 && content.location !== null) { /* AUTO-ON-PROXIMITY */
            let shouldBeOn = false;
            for (const player of rustplus.team.players) {
                if (content.x !== null && content.y !== null) {
                    if (getDistance(content.x, content.y, player.x, player.y) <= content.proximity) {
                        shouldBeOn = true;
                    }
                }
            }

            if ((shouldBeOn && !content.active) || (!shouldBeOn && content.active)) {
                instance.serverList[serverId].switches[entityId].active = shouldBeOn;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
        }
        else if (content.autoDayNightOnOff === 6 && content.location !== null) { /* AUTO-OFF-PROXIMITY */
            let shouldBeOn = true;
            for (const player of rustplus.team.players) {
                if (content.x !== null && content.y !== null) {
                    if (getDistance(content.x, content.y, player.x, player.y) <= content.proximity) {
                        shouldBeOn = false;
                    }
                }
            }

            if ((shouldBeOn && !content.active) || (!shouldBeOn && content.active)) {
                instance.serverList[serverId].switches[entityId].active = shouldBeOn;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
        }
        else if (content.autoDayNightOnOff === 7) { /* AUTO-ON-ANY-ONLINE */
            let shouldBeOn = false;
            for (const player of rustplus.team.players) {
                if (player.isOnline) shouldBeOn = true;
            }

            if ((shouldBeOn && !content.active) || (!shouldBeOn && content.active)) {
                instance.serverList[serverId].switches[entityId].active = shouldBeOn;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
        }
        else if (content.autoDayNightOnOff === 8) { /* AUTO-OFF-ANY-ONLINE */
            let shouldBeOn = true;
            for (const player of rustplus.team.players) {
                if (player.isOnline) shouldBeOn = false;
            }

            if ((shouldBeOn && !content.active) || (!shouldBeOn && content.active)) {
                instance.serverList[serverId].switches[entityId].active = shouldBeOn;
                guildInstance.writeGuildInstanceFile(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                guildInstance.writeGuildInstanceFile(guildId, instance);

                await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
        }
    }

    let groupsId = getGroupsFromSwitchList(guildId, serverId, changedSwitches);

    for (let groupId of groupsId) {
        await discordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
    }
}

export async function smartSwitchCommandHandler(rustplus: typeof RustPlus, command: string): Promise<boolean> {
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const switches = instance.serverList[serverId].switches;
    const prefix = rustplus.generalSettings.prefix;

    const onCap = lm.getIntl(language, 'onCap');
    const offCap = lm.getIntl(language, 'offCap');

    const onEn = lm.getIntl('en', 'commandSyntaxOn');
    const onLang = lm.getIntl(language, 'commandSyntaxOn');
    const offEn = lm.getIntl('en', 'commandSyntaxOff');
    const offLang = lm.getIntl(language, 'commandSyntaxOff');
    const statusEn = lm.getIntl('en', 'commandSyntaxStatus');
    const statusLang = lm.getIntl(language, 'commandSyntaxStatus');

    const entityId = Object.keys(switches).find(e =>
        command === `${prefix}${switches[e].command}` ||
        command.startsWith(`${prefix}${switches[e].command} `));

    if (!entityId) return false;

    const entityCommand = `${prefix}${switches[entityId].command}`;
    let rest = command.replace(`${entityCommand} ${onEn}`, '');
    rest = rest.replace(`${entityCommand} ${onLang}`, '');
    rest = rest.replace(`${entityCommand} ${offEn}`, '');
    rest = rest.replace(`${entityCommand} ${offLang}`, '');
    rest = rest.replace(`${entityCommand}`, '').trim();

    let active: boolean = false;
    if (command.startsWith(`${entityCommand} ${onEn}`) || command.startsWith(`${entityCommand} ${onLang}`)) {
        if (!switches[entityId].active) {
            active = true;
        }
        else {
            const str = lm.getIntl(language, 'deviceIsAlreadyOnOff', {
                device: switches[entityId].name,
                status: onCap
            });
            rustplus.sendInGameMessage(str);
            return true;
        }
    }
    else if (command.startsWith(`${entityCommand} ${offEn}`) || command.startsWith(`${entityCommand} ${offLang}`)) {
        if (switches[entityId].active) {
            active = false;
        }
        else {
            const str = lm.getIntl(language, 'deviceIsAlreadyOnOff', {
                device: switches[entityId].name,
                status: offCap
            });
            rustplus.sendInGameMessage(str);
            return true;
        }
    }
    else if (command === `${entityCommand} ${statusEn}` || command === `${entityCommand} ${statusLang}`) {
        const info = await rustplus.getEntityInfoAsync(entityId);
        if (!(await rustplus.isResponseValid(info))) {
            switches[entityId].reachable = false;
            guildInstance.writeGuildInstanceFile(guildId, instance);
            await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
            await updateSwitchGroupIfContainSwitch(guildId, serverId, entityId);

            rustplus.sendInGameMessage(lm.getIntl(language, 'noCommunicationSmartSwitch', {
                name: switches[entityId].name
            }));
            return true;
        }

        rustplus.sendInGameMessage(lm.getIntl(language, 'deviceIsCurrentlyOnOff', {
            device: switches[entityId].name,
            status: info.entityInfo.payload.value ? onCap : offCap
        }));
        return true;
    }
    else if (command.startsWith(`${entityCommand}`)) {
        active = !switches[entityId].active;
    }
    else {
        return true;
    }

    if (rustplus.currentSwitchTimeouts.hasOwnProperty(entityId)) {
        clearTimeout(rustplus.currentSwitchTimeouts[entityId]);
        delete rustplus.currentSwitchTimeouts[entityId];
    }

    const timeSeconds = getSecondsFromStringTime(rest);

    rustplus.info(lm.getIntl(Config.general.language, `logSmartSwitchValueChange`, {
        value: active
    }));

    smartSwitchCommandTurnOnOff(rustplus, entityId, active);

    if (!switches[entityId].reachable) return true;

    let str = lm.getIntl(language, 'deviceWasTurnedOnOff', {
        device: switches[entityId].name,
        status: active ? onCap : offCap
    });

    if (timeSeconds === null) {
        rustplus.sendInGameMessage(str);
        return true;
    }

    const time = secondsToFullScale(timeSeconds);
    str += lm.getIntl(language, 'automaticallyTurnBackOnOff', {
        status: active ? offCap : onCap,
        time: time
    });

    rustplus.currentSwitchTimeouts[entityId] = setTimeout(async function () {
        const instance = guildInstance.readGuildInstanceFile(guildId);
        if (!instance.serverList[serverId].switches.hasOwnProperty(entityId)) return;

        await smartSwitchCommandTurnOnOff(rustplus, entityId, !active);

        const str = lm.getIntl(language, 'automaticallyTurningBackOnOff', {
            device: instance.serverList[serverId].switches[entityId].name,
            status: !active ? onCap : offCap
        });

        rustplus.sendInGameMessage(str);
    }, timeSeconds * 1000);

    rustplus.sendInGameMessage(str);
    return true;
}

async function smartSwitchCommandTurnOnOff(rustplus: typeof RustPlus, entityId: string, active: boolean) {
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const switches = instance.serverList[serverId].switches;

    const prevActive = switches[entityId].active;
    switches[entityId].active = active;
    guildInstance.writeGuildInstanceFile(guildId, instance);

    rustplus.interactionSwitches.push(entityId);

    const response = await rustplus.turnSmartSwitchAsync(entityId, active);
    if (!(await rustplus.isResponseValid(response))) {
        rustplus.sendInGameMessage(lm.getIntl(language, 'noCommunicationSmartSwitch', {
            name: switches[entityId].name
        }));
        if (switches[entityId].reachable) {
            await discordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
        }
        switches[entityId].reachable = false;
        switches[entityId].active = prevActive;

        rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== entityId);
    }
    else {
        switches[entityId].reachable = true;
    }
    guildInstance.writeGuildInstanceFile(guildId, instance);

    await discordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
    await updateSwitchGroupIfContainSwitch(guildId, serverId, entityId);
}