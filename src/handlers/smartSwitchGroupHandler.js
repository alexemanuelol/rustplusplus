const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client) {
    },

    updateSwitchGroupIfContainSwitch: async function (client, guildId, serverId, switchId) {
        let instance = client.readInstanceFile(guildId);

        for (const [groupId, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
            if (content.switches.includes(`${switchId}`)) {
                await DiscordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
            }
        }

    },

    getGroupsFromSwitchList: function (client, guildId, serverId, switches) {
        let instance = client.readInstanceFile(guildId);

        let groupsId = [];
        for (let sw of switches) {
            for (const [groupId, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
                if (content.switches.includes(sw) && !groups.includes(groupId)) {
                    groupsId.push(groupId);
                }
            }
        }

        return groupsId;
    },

    TurnOnOffGroup: async function (client, rustplus, guildId, serverId, groupId, value) {
        let instance = client.readInstanceFile(guildId);

        let switches = instance.serverList[serverId].switchGroups[groupId].switches;

        let actionSwitches = [];
        for (const [id, content] of Object.entries(instance.serverList[serverId].switches)) {
            if (switches.includes(id)) {
                if (value) {
                    if (!content.active) {
                        actionSwitches.push(id);
                    }
                }
                else {
                    if (content.active) {
                        actionSwitches.push(id);

                    }
                }
            }
        }

        for (let id of actionSwitches) {
            let prevActive = instance.serverList[serverId].switches[id].active;
            instance.serverList[serverId].switches[id].active = value;
            client.writeInstanceFile(guildId, instance);

            rustplus.interactionSwitches.push(id);

            let response = null;
            if (value) {
                response = await rustplus.turnSmartSwitchOnAsync(id);
            }
            else {
                response = await rustplus.turnSmartSwitchOffAsync(id);
            }

            if (!(await rustplus.isResponseValid(response))) {
                if (instance.serverList[serverId].switches[id].reachable) {
                    await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, id);
                }
                instance.serverList[serverId].switches[id].reachable = false;
                instance.serverList[serverId].switches[id].active = prevActive;
                client.writeInstanceFile(guildId, instance);

                rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);
            }
            else {
                instance.serverList[serverId].switches[id].reachable = true;
                client.writeInstanceFile(guildId, instance);
            }

            DiscordMessages.sendSmartSwitchMessage(guildId, serverId, id);
        }

        if (actionSwitches.length !== 0) {
            await DiscordMessages.sendSmartSwitchGroupMessage(guildId, serverId, groupId);
        }
    },
}