const DiscordMessages = require('./discordMessages.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;

    if (rustplus.isNewConnection) {
        await DiscordTools.clearTextChannel(guildId, instance.channelId.switches, 100);
    }

    for (const entityId in instance.serverList[serverId].switches) {
        instance = client.readInstanceFile(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const info = await rustplus.getEntityInfoAsync(entityId);


        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendSmartSwitchNotFoundMessage(guildId, serverId, entityId);
            entity.reachable = false;
        }
        else {
            entity.reachable = true;
        }
        client.writeInstanceFile(guildId, instance);

        if (entity.reachable) {
            entity.active = info.entityInfo.payload.value;
            client.writeInstanceFile(guildId, instance);
        }

        await DiscordMessages.sendSmartSwitchMessage(guildId, serverId, entityId);
    }
};
