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
const Timer = require('../util/timer');

module.exports = {
    handler: async function (rustplus, client) {
    },

    updateSwitchGroupIfContainSwitch: async function (client, guildId, serverId, switchId) {
        const instance = client.getInstance(guildId);

        for (const [groupId, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
            if (content.switches.includes(`${switchId}`)) {
                await DiscordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
            }
        }

    },

    getGroupsFromSwitchList: function (client, guildId, serverId, switches) {
        const instance = client.getInstance(guildId);

        let groupsId = [];
        for (let entity of switches) {
            for (const [groupId, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
                if (content.switches.includes(entity) && !groupsId.includes(groupId)) {
                    groupsId.push(groupId);
                }
            }
        }

        return groupsId;
    },

    TurnOnOffGroup: async function (client, rustplus, guildId, serverId, groupId, value) {
        const instance = client.getInstance(guildId);

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
            client.setInstance(guildId, instance);

            rustplus.interactionSwitches.push(entityId);

            const response = await rustplus.turnSmartSwitchAsync(entityId, value);
            if (!(await rustplus.isResponseValid(response))) {
                if (instance.serverList[serverId].switches[entityId].reachable) {
                    await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
                }
                instance.serverList[serverId].switches[entityId].reachable = false;
                instance.serverList[serverId].switches[entityId].active = prevActive;
                client.setInstance(guildId, instance);

                rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== entityId);
            }
            else {
                instance.serverList[serverId].switches[entityId].reachable = true;
                client.setInstance(guildId, instance);
            }

            DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
        }

        if (actionSwitches.length !== 0) {
            await DiscordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
        }
    },

    smartSwitchGroupCommandHandler: async function (rustplus, client, command) {
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const instance = client.getInstance(guildId);
        const switchGroups = instance.serverList[serverId].switchGroups;
        const prefix = rustplus.generalSettings.prefix;

        const onCap = client.intlGet(rustplus.guildId, 'onCap');
        const offCap = client.intlGet(rustplus.guildId, 'offCap');
        const notFoundCap = client.intlGet(rustplus.guildId, 'notFoundCap');

        const onEn = client.intlGet('en', 'commandSyntaxOn');
        const onLang = client.intlGet(guildId, 'commandSyntaxOn');
        const offEn = client.intlGet('en', 'commandSyntaxOff');
        const offLang = client.intlGet(guildId, 'commandSyntaxOff');
        const statusEn = client.intlGet('en', 'commandSyntaxStatus');
        const statusLang = client.intlGet(guildId, 'commandSyntaxStatus');

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

        let active;
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
            rustplus.sendInGameMessage(`${client.intlGet(guildId, 'status')}: ${statusMessage}`);
            return true;
        }
        else {
            return true;
        }

        if (rustplus.currentSwitchTimeouts.hasOwnProperty(groupId)) {
            clearTimeout(rustplus.currentSwitchTimeouts[groupId]);
            delete rustplus.currentSwitchTimeouts[groupId];
        }

        const timeSeconds = Timer.getSecondsFromStringTime(rest);

        let str = client.intlGet(guildId, 'turningGroupOnOff', {
            group: switchGroups[groupId].name,
            status: active ? onCap : offCap
        });

        rustplus.log(client.intlGet(null, 'infoCap'), client.intlGet(null, `logSmartSwitchGroupValueChange`, {
            value: active
        }));

        if (timeSeconds === null) {
            rustplus.sendInGameMessage(str);
            await module.exports.TurnOnOffGroup(client, rustplus, guildId, serverId, groupId, active);
            return true;
        }

        const time = Timer.secondsToFullScale(timeSeconds);
        str += client.intlGet(guildId, 'automaticallyTurnBackOnOff', {
            status: active ? offCap : onCap,
            time: time
        });

        rustplus.currentSwitchTimeouts[groupId] = setTimeout(async function () {
            const instance = client.getInstance(guildId);
            if (!instance.serverList.hasOwnProperty(serverId) ||
                !instance.serverList[serverId].switchGroups.hasOwnProperty(groupId)) {
                return;
            }

            const str = client.intlGet(guildId, 'automaticallyTurningBackOnOff', {
                device: instance.serverList[serverId].switchGroups[groupId].name,
                status: !active ? onCap : offCap
            });
            rustplus.sendInGameMessage(str);

            await module.exports.TurnOnOffGroup(client, rustplus, guildId, serverId, groupId, !active);
        }, timeSeconds * 1000);

        rustplus.sendInGameMessage(str);
        await module.exports.TurnOnOffGroup(client, rustplus, guildId, serverId, groupId, active);
        return true;
    },
}