const { MessageEmbed } = require('discord.js');
const DiscordTools = require('./discordTools.js');

const icon = 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Windows_Settings_app_icon.png';

module.exports = (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.settings);

    if (!channel) {
        client.log('Invalid guild or channel.');
        return;
    }

    DiscordTools.clearTextChannel(guild.id, instance.channelId.settings, 100);

    /* GENERAL SETTINGS */
    channel.send({ embeds: [new MessageEmbed().setColor('#ce412b').setAuthor('GENERAL SETTINGS', icon)] });

    const embed = new MessageEmbed()
        .setColor('#861c0c')
        .setDescription('Select what in-game command prefix that should be used:')

    const row = DiscordTools.getPrefixSelectMenu(instance.generalSettings.prefix);
    channel.send({ embeds: [embed], components: [row] });

    /* NOTIFICATION SETTINGS */
    channel.send({ embeds: [new MessageEmbed().setColor('#ce412b').setAuthor('NOTIFICATION SETTINGS', icon)] });

    for (let setting in instance.notificationSettings) {
        let discord = instance.notificationSettings[setting].discord;
        let inGame = instance.notificationSettings[setting].inGame;

        const embed = new MessageEmbed()
            .setColor('#861c0c')
            .setDescription(instance.notificationSettings[setting].description);
        let row = DiscordTools.getNotificationButtonsRow(
            `${setting}DiscordNotification`,
            discord,
            `${setting}InGameNotification`,
            inGame);
        channel.send({ embeds: [embed], components: [row] });
    }
};
