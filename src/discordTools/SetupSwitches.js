const DiscordTools = require('./discordTools.js');
const { MessageAttachment } = require('discord.js');

module.exports = (client, rustplus) => {
    let instance = client.readInstanceFile(rustplus.guildId);
    let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.switches);

    client.switchesMessages[rustplus.guildId] = {};

    if (!channel) {
        client.log('ERROR', 'Invalid guild or channel.', 'error');
        return;
    }

    DiscordTools.clearTextChannel(rustplus.guildId, instance.channelId.switches, 100);

    let prefix = rustplus.generalSettings.prefix;
    for (const [key, value] of Object.entries(instance.switches)) {
        if (`${rustplus.server}-${rustplus.port}` !== `${value.ipPort}`) continue;

        rustplus.getEntityInfo(key, (msg) => {
            let active = msg.response.entityInfo.payload.value;
            instance = client.readInstanceFile(rustplus.guildId);
            instance.switches[key].active = active;
            client.writeInstanceFile(rustplus.guildId, instance);

            let file = new MessageAttachment(`src/images/${(active) ? 'on_logo.png' : 'off_logo.png'}`);
            let embed = DiscordTools.getSwitchButtonsEmbed(
                key, value.name, `${prefix}${value.command}`, value.server, active);

            let row = DiscordTools.getSwitchButtonsRow(key, active);

            channel.send({ embeds: [embed], components: [row], files: [file] }).then((msg) => {
                client.switchesMessages[rustplus.guildId][key] = msg;
            });
        });
    }
};
