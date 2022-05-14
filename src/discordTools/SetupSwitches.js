const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    client.switchesMessages[rustplus.guildId] = {};

    await DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);

    for (const [key, value] of Object.entries(instance.switches)) {
        if (rustplus.serverId !== `${value.serverId}`) continue;

        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);
            instance.switches[key].reachable = false;
        }
        else {
            instance.switches[key].reachable = true;
        }
        client.writeInstanceFile(rustplus.guildId, instance);

        if (instance.switches[key].reachable) {
            instance.switches[key].active = info.entityInfo.payload.value;
            client.writeInstanceFile(rustplus.guildId, instance);
        }

        await DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key);
    }
};
