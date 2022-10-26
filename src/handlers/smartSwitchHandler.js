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

    https://github.com/alexemanuelol/rustPlusPlus

*/

const DiscordMessages = require('../discordTools/discordMessages.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');

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
                if (content.autoDayNight === 1) {
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
                else if (content.autoDayNight === 2) {
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
                if (content.autoDayNight === 1) {
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
                else if (content.autoDayNight === 2) {
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

        let groupsId = SmartSwitchGroupHandler.getGroupsFromSwitchList(
            client, guildId, serverId, changedSwitches);

        for (let groupId of groupsId) {
            await DiscordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
        }
    },
}