const { MessageEmbed, MessageAttachment } = require('discord.js');
const DiscordTools = require('./discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.settings);

    if (!channel) {
        client.log('Invalid guild or channel.');
        return;
    }

    DiscordTools.clearTextChannel(guild.id, instance.channelId.settings, 100);

    /* GENERAL SETTINGS */
    await channel.send({ files: [new MessageAttachment('src/images/general_settings_logo.png')] });

    const embed = new MessageEmbed()
        .setColor('#861c0c')
        .setTitle('Select what in-game command prefix that should be used:')
    const row = DiscordTools.getPrefixSelectMenu(instance.generalSettings.prefix);
    await channel.send({ embeds: [embed], components: [row] });

    /* NOTIFICATION SETTINGS */
    await channel.send({ files: [new MessageAttachment('src/images/notification_settings_logo.png')] });

    for (let setting in instance.notificationSettings) {
        let description = instance.notificationSettings[setting].description;
        let image = instance.notificationSettings[setting].image;
        let discord = instance.notificationSettings[setting].discord;
        let inGame = instance.notificationSettings[setting].inGame;

        let file = new MessageAttachment(`src/images/${image}`);
        const embed = new MessageEmbed()
            .setColor('#861c0c')
            .setTitle(description)
            .setThumbnail(`attachment://${image}`);

        let row = DiscordTools.getNotificationButtonsRow(setting, discord, inGame);

        await channel.send({ embeds: [embed], components: [row], files: [file] });
    }
};