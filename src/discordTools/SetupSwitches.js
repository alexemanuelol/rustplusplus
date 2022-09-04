const DiscordMessages = require('./discordMessages.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus, newConnection = false) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    if (newConnection) {
        await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);
    }

    for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].switches)) {
        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId, rustplus.serverId, key);
            instance.serverList[rustplus.serverId].switches[key].reachable = false;
        }
        else {
            instance.serverList[rustplus.serverId].switches[key].reachable = true;
        }
        client.writeInstanceFile(rustplus.guildId, instance);

        if (instance.serverList[rustplus.serverId].switches[key].reachable) {
            instance.serverList[rustplus.serverId].switches[key].active = info.entityInfo.payload.value;
            client.writeInstanceFile(rustplus.guildId, instance);
        }

        await DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
    }
};
