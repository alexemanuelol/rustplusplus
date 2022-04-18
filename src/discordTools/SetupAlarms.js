const DiscordTools = require('./discordTools.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);

    for (const [key, value] of Object.entries(instance.alarms)) {
        if (rustplus.serverId !== `${value.serverId}`) continue;

        let info = await rustplus.getEntityInfoAsync(key);

        instance = client.readInstanceFile(rustplus.guildId);

        if (!(await rustplus.isResponseValid(info))) {
            let messageId = instance.alarms[key].messageId;
            let message = await DiscordTools.getMessageById(rustplus.guildId, instance.channelId.alarms, messageId);
            if (message !== undefined) {
                try {
                    await message.delete();
                }
                catch (e) {
                    client.log('ERROR', `Could not delete alarm message with id: ${messageId}.`, 'error');
                }
            }

            delete instance.alarms[key];
            client.writeInstanceFile(rustplus.guildId, instance);
            continue;
        }

        if (instance.alarms[key].active !== info.entityInfo.payload.value) {
            instance.alarms[key].active = info.entityInfo.payload.value;
            client.writeInstanceFile(rustplus.guildId, instance);

            await DiscordTools.sendSmartAlarmMessage(rustplus.guildId, key);
        }
    }
};
