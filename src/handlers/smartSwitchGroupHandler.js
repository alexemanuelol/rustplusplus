const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    handler: async function (rustplus, client) {
    },

    updateSwitchGroupIfContainSwitch: async function (client, guildId, serverId, switchId) {
        let instance = client.readInstanceFile(guildId);

        for (const [groupName, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
            if (content.switches.includes(`${switchId}`)) {
                await DiscordTools.sendSmartSwitchGroupMessage(guildId, groupName, true, false, false);
            }
        }

    },

    getGroupsFromSwitchList: function (client, guildId, serverId, switches) {
        let instance = client.readInstanceFile(guildId);

        let groups = [];
        for (let sw of switches) {
            for (const [groupName, content] of Object.entries(instance.serverList[serverId].switchGroups)) {
                if (content.switches.includes(sw) && !groups.includes(groupName)) {
                    groups.push(groupName);
                }
            }
        }

        return groups;
    },

    TurnOnOffGroup: async function (client, rustplus, guildId, serverId, group, value) {
        let instance = client.readInstanceFile(guildId);

        let switches = instance.serverList[serverId].switchGroups[group].switches;

        let actionSwitches = [];
        for (const [id, content] of Object.entries(instance.switches)) {
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
            instance.switches[id].active = value;
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
                await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, id);

                delete instance.switches[id];
                client.writeInstanceFile(rustplus.guildId, instance);

                rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);

                try {
                    await client.switchesMessages[rustplus.guildId][id].delete();
                }
                catch (e) {
                    client.log('ERROR', `Could not delete switch group message for entityId: ${id}.`, 'error');
                }
                delete client.switchesMessages[rustplus.guildId][id];
                return;
            }

            DiscordTools.sendSmartSwitchMessage(guildId, id, true, true, false);
        }

        if (actionSwitches.length !== 0) {
            await DiscordTools.sendSmartSwitchGroupMessage(guildId, group, true, false, false);
        }
    },
}