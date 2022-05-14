const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    for (const [key, value] of Object.entries(instance.alarms)) {
        if (rustplus.serverId !== `${value.serverId}`) continue;

        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            await DiscordTools.sendSmartAlarmNotFound(rustplus.guildId, key);
            instance.alarms[key].reachable = false;
        }
        else {
            instance.alarms[key].reachable = true;
        }
        client.writeInstanceFile(rustplus.guildId, instance);

        if (instance.alarms[key].reachable) {
            if (instance.alarms[key].active !== info.entityInfo.payload.value) {
                instance.alarms[key].active = info.entityInfo.payload.value;
                client.writeInstanceFile(rustplus.guildId, instance);
            }
        }

        await DiscordTools.sendSmartAlarmMessage(rustplus.guildId, key);
    }
};
