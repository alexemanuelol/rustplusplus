const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    handler: async function (rustplus, client, time) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let server = `${rustplus.server}-${rustplus.port}`;

        if (rustplus.time.isTurnedDay(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;

                if (value.autoDayNight === 1) {
                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.turnSmartSwitchOnAsync(key);
                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = true;
                }
                else if (value.autoDayNight === 2) {
                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.turnSmartSwitchOffAsync(key);
                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = false;
                }
            }
        }
        else if (rustplus.time.isTurnedNight(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;

                if (value.autoDayNight === 1) {
                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.turnSmartSwitchOffAsync(key);
                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = false;
                }
                else if (value.autoDayNight === 2) {
                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.turnSmartSwitchOnAsync(key);
                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = true;
                }
            }
        }
    },
}