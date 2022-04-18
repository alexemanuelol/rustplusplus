const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    handler: async function (rustplus, client) {
        if (rustplus.smartAlarmIntervalCounter === 29) {
            rustplus.smartAlarmIntervalCounter = 0;
            let instance = client.readInstanceFile(rustplus.guildId);
            for (const [key, value] of Object.entries(instance.alarms)) {
                if (rustplus.serverId !== `${value.serverId}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    await DiscordTools.sendSmartAlarmNotFound(rustplus.guildId, key);

                    let messageId = instance.alarms[key].messageId;
                    let message = await DiscordTools.getMessageById(
                        rustplus.guildId, instance.channelId.alarms, messageId);
                    if (message !== undefined) {
                        try {
                            await message.delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete alarm message for entityId: ${key}.`, 'error');
                        }
                    }

                    delete instance.alarms[key];
                    client.writeInstanceFile(rustplus.guildId, instance);
                    continue;
                }
            }
        }
        else {
            rustplus.smartAlarmIntervalCounter += 1;
        }
    },
}