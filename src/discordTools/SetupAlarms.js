const DiscordMessages = require('./discordMessages.js');

module.exports = async (client, rustplus) => {
    let instance = client.getInstance(rustplus.guildId);
    const guildId = rustplus.guildId;
    const serverId = rustplus.serverId;

    for (const entityId in instance.serverList[serverId].alarms) {
        instance = client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const info = await rustplus.getEntityInfoAsync(entityId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordMessages.sendSmartAlarmNotFoundMessage(guildId, serverId, entityId);
            entity.reachable = false;
        }
        else {
            entity.reachable = true;
        }

        if (entity.reachable) {
            if (entity.active !== info.entityInfo.payload.value) {
                entity.active = info.entityInfo.payload.value;
            }
        }
        client.setInstance(guildId, instance);

        await DiscordMessages.sendSmartAlarmMessage(guildId, serverId, entityId);
    }
};
