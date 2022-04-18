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
            delete instance.switches[key];
            client.writeInstanceFile(rustplus.guildId, instance);
            continue;
        }

        let active = info.entityInfo.payload.value;
        instance.switches[key].active = active;
        client.writeInstanceFile(rustplus.guildId, instance);

        await DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key);
    }
};
