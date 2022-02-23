const { MessageEmbed } = require('discord.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.servers);

    client.serverListMessages[guild.id] = {};

    if (!channel) {
        client.log('ERROR', 'SetupServerList: Invalid guild or channel.', 'error');
        return;
    }

    DiscordTools.clearTextChannel(guild.id, instance.channelId.servers, 100);

    for (const [key, value] of Object.entries(instance.serverList)) {
        let embed = new MessageEmbed()
            .setTitle(value.title)
            .setColor('#ce412b')
            .setDescription(value.description)
            .setThumbnail(value.img);

        let state = 0;
        if (value.active) {
            state = 1;
        }

        let row = DiscordTools.getServerButtonsRow(key, state, value.url);

        client.serverListMessages[guild.id][key] = await channel.send({ embeds: [embed], components: [row] });
    }
};
