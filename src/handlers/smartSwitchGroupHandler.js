const DiscordMessages = require('../discordTools/discordMessages.js');

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
}