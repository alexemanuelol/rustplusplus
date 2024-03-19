/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

const DiscordMessages = require('../discordTools/discordMessages.js');
const Map = require('../util/map.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const Timer = require('../util/timer');

module.exports = {
    handler: async function (rustplus, client, time) {
        const instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
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
                        await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        instance.serverList[serverId].switches[entityId].reachable = false;
                        client.setInstance(guildId, instance);

                        await DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                        changedSwitches.push(entityId);
                    }
                }
                else {
                    if (!instance.serverList[serverId].switches[entityId].reachable) {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                        client.setInstance(guildId, instance);

                        await DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
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
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchOnAsync(entityId);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
                else if (content.autoDayNightOnOff === 2) {
                    instance.serverList[serverId].switches[entityId].active = false;
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchOffAsync(entityId);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
            }
        }
        else if (rustplus.time.isTurnedNight(time)) {
            for (const [entityId, content] of Object.entries(instance.serverList[serverId].switches)) {
                if (content.autoDayNightOnOff === 1) {
                    instance.serverList[serverId].switches[entityId].active = false;
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchOffAsync(entityId);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
                else if (content.autoDayNightOnOff === 2) {
                    instance.serverList[serverId].switches[entityId].active = true;
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchOnAsync(entityId);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
            }
        }

        for (const [entityId, content] of Object.entries(instance.serverList[serverId].switches)) {
            if (content.autoDayNightOnOff === 3) { /* AUTO-ON */
                if (content.active) continue;

                instance.serverList[serverId].switches[entityId].active = true;
                client.setInstance(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchOnAsync(entityId);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                client.setInstance(guildId, instance);

                DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
            else if (content.autoDayNightOnOff === 4) { /* AUTO-OFF */
                if (!content.active) continue;

                instance.serverList[serverId].switches[entityId].active = false;
                client.setInstance(guildId, instance);

                rustplus.interactionSwitches.push(entityId);

                const response = await rustplus.turnSmartSwitchOffAsync(entityId);
                if (!(await rustplus.isResponseValid(response))) {
                    if (instance.serverList[serverId].switches[entityId].reachable) {
                        await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                    }
                    instance.serverList[serverId].switches[entityId].reachable = false;

                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                }
                else {
                    instance.serverList[serverId].switches[entityId].reachable = true;
                }
                client.setInstance(guildId, instance);

                DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                changedSwitches.push(entityId);
            }
            else if (content.autoDayNightOnOff === 5 && content.location !== null) { /* AUTO-ON-PROXIMITY */
                let shouldBeOn = false;
                for (const player of rustplus.team.players) {
                    if (Map.getDistance(content.x, content.y, player.x, player.y) <= content.proximity) {
                        shouldBeOn = true;
                    }
                }

                if ((shouldBeOn && !content.active) || (!shouldBeOn && content.active)) {
                    instance.serverList[serverId].switches[entityId].active = shouldBeOn;
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
            }
            else if (content.autoDayNightOnOff === 6 && content.location !== null) { /* AUTO-OFF-PROXIMITY */
                let shouldBeOn = true;
                for (const player of rustplus.team.players) {
                    if (Map.getDistance(content.x, content.y, player.x, player.y) <= content.proximity) {
                        shouldBeOn = false;
                    }
                }

                if ((shouldBeOn && !content.active) || (!shouldBeOn && content.active)) {
                    instance.serverList[serverId].switches[entityId].active = shouldBeOn;
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
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
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
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
                    client.setInstance(guildId, instance);

                    rustplus.interactionSwitches.push(entityId);

                    const response = await rustplus.turnSmartSwitchAsync(entityId, shouldBeOn);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[serverId].switches[entityId].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                        }
                        instance.serverList[serverId].switches[entityId].reachable = false;

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
                    }
                    else {
                        instance.serverList[serverId].switches[entityId].reachable = true;
                    }
                    client.setInstance(guildId, instance);

                    DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                    changedSwitches.push(entityId);
                }
            }
        }

        let groupsId = SmartSwitchGroupHandler.getGroupsFromSwitchList(
            client, guildId, serverId, changedSwitches);

        for (let groupId of groupsId) {
            await DiscordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
        }
    },

    smartSwitchCommandHandler: async function (rustplus, client, command) {
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const instance = client.getInstance(guildId);
        const switches = instance.serverList[serverId].switches;
        const prefix = rustplus.generalSettings.prefix;

        const onCap = client.intlGet(guildId, 'onCap');
        const offCap = client.intlGet(guildId, 'offCap');

        const onEn = client.intlGet('en', 'commandSyntaxOn');
        const onLang = client.intlGet(guildId, 'commandSyntaxOn');
        const offEn = client.intlGet('en', 'commandSyntaxOff');
        const offLang = client.intlGet(guildId, 'commandSyntaxOff');
        const statusEn = client.intlGet('en', 'commandSyntaxStatus');
        const statusLang = client.intlGet(guildId, 'commandSyntaxStatus');

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

        let active;
        if (command.startsWith(`${entityCommand} ${onEn}`) || command.startsWith(`${entityCommand} ${onLang}`)) {
            if (!switches[entityId].active) {
                active = true;
            }
            else {
                const str = client.intlGet(guildId, 'deviceIsAlreadyOnOff', {
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
                const str = client.intlGet(guildId, 'deviceIsAlreadyOnOff', {
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
                client.setInstance(guildId, instance);
                DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
                SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(client, guildId, serverId, entityId);

                rustplus.sendInGameMessage(client.intlGet(guildId, 'noCommunicationSmartSwitch', {
                    name: switches[entityId].name
                }));
                return true;
            }

            rustplus.sendInGameMessage(client.intlGet(guildId, 'deviceIsCurrentlyOnOff', {
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

        const timeSeconds = Timer.getSecondsFromStringTime(rest);

        rustplus.log(client.intlGet(null, 'infoCap'), client.intlGet(null, `logSmartSwitchValueChange`, {
            value: active
        }));

        module.exports.smartSwitchCommandTurnOnOff(rustplus, client, entityId, active);

        if (!switches[entityId].reachable) return true;

        let str = client.intlGet(guildId, 'deviceWasTurnedOnOff', {
            device: switches[entityId].name,
            status: active ? onCap : offCap
        });

        if (timeSeconds === null) {
            rustplus.sendInGameMessage(str);
            return true;
        }

        const time = Timer.secondsToFullScale(timeSeconds);
        str += client.intlGet(guildId, 'automaticallyTurnBackOnOff', {
            status: active ? offCap : onCap,
            time: time
        });

        rustplus.currentSwitchTimeouts[entityId] = setTimeout(async function () {
            const instance = client.getInstance(guildId);
            if (!instance.serverList[serverId].switches.hasOwnProperty(entityId)) return;

            await module.exports.smartSwitchCommandTurnOnOff(rustplus, client, entityId, !active);

            const str = client.intlGet(guildId, 'automaticallyTurningBackOnOff', {
                device: instance.serverList[serverId].switches[entityId].name,
                status: !active ? onCap : offCap
            });

            rustplus.sendInGameMessage(str);
        }, timeSeconds * 1000);

        rustplus.sendInGameMessage(str);
        return true;
    },

    smartSwitchCommandTurnOnOff: async function (rustplus, client, entityId, active) {
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const instance = client.getInstance(guildId);
        const switches = instance.serverList[serverId].switches;

        const prevActive = switches[entityId].active;
        switches[entityId].active = active;
        client.setInstance(guildId, instance);

        rustplus.interactionSwitches.push(entityId);

        const response = await rustplus.turnSmartSwitchAsync(entityId, active);
        if (!(await rustplus.isResponseValid(response))) {
            rustplus.sendInGameMessage(client.intlGet(guildId, 'noCommunicationSmartSwitch', {
                name: switches[entityId].name
            }));
            if (switches[entityId].reachable) {
                await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
            }
            switches[entityId].reachable = false;
            switches[entityId].active = prevActive;

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
        }
        else {
            switches[entityId].reachable = true;
        }
        client.setInstance(guildId, instance);

        DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
        SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(client, guildId, serverId, entityId);
    },
}