const { MessageEmbed } = require('discord.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.servers);

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

        let message = await channel.send({ embeds: [embed], components: [row] });
        instance.serverList[key].messageId = message.id;
    }

    client.writeInstanceFile(guild.id, instance);
};
