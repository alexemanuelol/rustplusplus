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
                    if (instance.alarms[key].reachable) {
                        await DiscordTools.sendSmartAlarmNotFound(rustplus.guildId, key);

                        instance.alarms[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordTools.sendSmartAlarmMessage(rustplus.guildId, key, true, false, false);
                    }
                }
                else {
                    if (!instance.alarms[key].reachable) {
                        instance.alarms[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordTools.sendSmartAlarmMessage(rustplus.guildId, key, true, false, false);
                    }
                }
            }
        }
        else {
            rustplus.smartAlarmIntervalCounter += 1;
        }
    },
}