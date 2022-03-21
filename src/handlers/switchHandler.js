const DiscordTools = require('../discordTools/discordTools.js');
const { MessageAttachment } = require('discord.js');

module.exports = {
    handler: async function (rustplus, client, time) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let server = `${rustplus.server}-${rustplus.port}`;
        let prefix = rustplus.generalSettings.prefix;

        if (rustplus.time.isTurnedDay(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;

                if (value.autoDayNight === 1) {
                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let file = new MessageAttachment(`src/images/electrics/${value.image}`);
                    let embed = DiscordTools.getSwitchEmbed(key, value, prefix);

                    let buttonRow = DiscordTools.getSwitchButtonsRow(key, value);
                    let selectMenu = DiscordTools.getSwitchSelectMenu(key, value);

                    rustplus.interactionSwitches[key] = true;

                    rustplus.turnSmartSwitchOn(key, async (msg) => {
                        await client.switchesMessages[rustplus.guildId][key].edit({
                            embeds: [embed], components: [selectMenu, buttonRow], files: [file]
                        });
                    });
                }
                else if (value.autoDayNight === 2) {
                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let file = new MessageAttachment(`src/images/electrics/${value.image}`);
                    let embed = DiscordTools.getSwitchEmbed(key, value, prefix);

                    let buttonRow = DiscordTools.getSwitchButtonsRow(key, value);
                    let selectMenu = DiscordTools.getSwitchSelectMenu(key, value);

                    rustplus.interactionSwitches[key] = false;

                    rustplus.turnSmartSwitchOff(key, async (msg) => {
                        await client.switchesMessages[rustplus.guildId][key].edit({
                            embeds: [embed], components: [selectMenu, buttonRow], files: [file]
                        });
                    });
                }
            }
        }
        else if (rustplus.time.isTurnedNight(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;

                if (value.autoDayNight === 1) {
                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let file = new MessageAttachment(`src/images/electrics/${value.image}`);
                    let embed = DiscordTools.getSwitchEmbed(key, value, prefix);

                    let buttonRow = DiscordTools.getSwitchButtonsRow(key, value);
                    let selectMenu = DiscordTools.getSwitchSelectMenu(key, value);

                    rustplus.interactionSwitches[key] = false;

                    rustplus.turnSmartSwitchOff(key, async (msg) => {
                        await client.switchesMessages[rustplus.guildId][key].edit({
                            embeds: [embed], components: [selectMenu, buttonRow], files: [file]
                        });
                    });
                }
                else if (value.autoDayNight === 2) {
                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let file = new MessageAttachment(`src/images/electrics/${value.image}`);
                    let embed = DiscordTools.getSwitchEmbed(key, value, prefix);

                    let buttonRow = DiscordTools.getSwitchButtonsRow(key, value);
                    let selectMenu = DiscordTools.getSwitchSelectMenu(key, value);

                    rustplus.interactionSwitches[key] = true;

                    rustplus.turnSmartSwitchOn(key, async (msg) => {
                        await client.switchesMessages[rustplus.guildId][key].edit({
                            embeds: [embed], components: [selectMenu, buttonRow], files: [file]
                        });
                    });
                }
            }
        }
    },
}