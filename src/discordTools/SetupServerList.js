const { MessageEmbed } = require('discord.js');
const DiscordTools = require('./discordTools.js');

module.exports = (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.servers);

    client.serverListMessages[guild.id] = {};

    if (!channel) {
        client.log('Invalid guild or channel.');
        return;
    }

    DiscordTools.clearTextChannel(guild.id, instance.channelId.servers, 100);

    for (const [key, value] of Object.entries(instance.serverList)) {
        let embed = new MessageEmbed()
            .setTitle(value.title)
            .setColor('#ce412b')
            .setDescription(value.description)
            .setThumbnail(value.img)
            .addField('Connect', `connect ${value.serverIp}:${value.appPort}`);

        let state = 0;
        if (value.active) {
            state = 1;
        }

        let row = DiscordTools.getServerButtonsRow(key, state, value.url);

        channel.send({ embeds: [embed], components: [row] }).then((msg) => {
            client.serverListMessages[guild.id][key] = msg;
        });
    }
};
