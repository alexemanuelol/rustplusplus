const DiscordTools = require('./discordTools.js');
const { MessageAttachment } = require('discord.js');

module.exports = async (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.switches);

    client.switchesMessages[rustplus.guildId] = {};

    if (!channel) {
        client.log('ERROR', 'SetupSwitches: Invalid guild or channel.', 'error');
        return;
    }

    DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);

    let prefix = rustplus.generalSettings.prefix;
    for (const [key, value] of Object.entries(instance.switches)) {
        if (`${rustplus.server}-${rustplus.port}` !== `${value.ipPort}`) continue;

        rustplus.getEntityInfo(key, async (msg) => {
            instance = client.readInstanceFile(rustplus.guildId);

            if (!rustplus.isResponseValid(msg)) {
                delete instance.switches[key];
                client.writeInstanceFile(rustplus.guildId, instance);
                return;
            }

            let active = msg.response.entityInfo.payload.value;
            instance.switches[key].active = active;
            client.writeInstanceFile(rustplus.guildId, instance);

            let file = new MessageAttachment(`src/images/electrics/${instance.switches[key].image}`);
            let embed = DiscordTools.getSwitchButtonsEmbed(key, instance.switches[key], prefix);

            let row = DiscordTools.getSwitchButtonsRow(key, active);

            client.switchesMessages[rustplus.guildId][key] =
                await channel.send({ embeds: [embed], components: [row], files: [file] });
        });
    }
};
