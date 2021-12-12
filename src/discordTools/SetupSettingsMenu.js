const { MessageEmbed } = require('discord.js');
const DiscordTools = require('./discordTools.js');

module.exports = (client, guild) => {
    let channel = DiscordTools.getChannel(guild.id, client.guildsAndChannelsIds[guild.id].settings);
    let instance = client.readInstanceFile(guild.id);

    if (channel === undefined) {
        client.log('Invalid guild or channel.');
        return;
    }

    DiscordTools.clearTextChannel(guild.id, client.guildsAndChannelsIds[guild.id].settings, 100);


    /* GENERAL SETTINGS */
    channel.send({
        embeds: [
            new MessageEmbed()
                .setColor('#ce412b')
                .setAuthor('GENERAL SETTINGS', 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Windows_Settings_app_icon.png')
        ],
    });

    const embed = new MessageEmbed()
        .setColor('#861c0c')
        .setDescription('Select what in-game command prefix that should be used:')

    const row = DiscordTools.getPrefixSelectMenu(instance.generalSettings.prefix);
    channel.send({ embeds: [embed], components: [row] });


    /* NOTIFICATION SETTINGS */
    channel.send({
        embeds: [
            new MessageEmbed()
                .setColor('#ce412b')
                .setAuthor('NOTIFICATION SETTINGS', 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Windows_Settings_app_icon.png')
        ],
    });

    for (let setting in instance.notificationSettings) {
        let discord = instance.notificationSettings[setting].discord;
        let inGame = instance.notificationSettings[setting].inGame;

        const embed = new MessageEmbed()
            .setColor('#861c0c')
            .setDescription(instance.notificationSettings[setting].description);
        let row = DiscordTools.getNotificationButtonsRow(
            `${setting}Discord`,
            discord,
            `${setting}InGame`,
            inGame);
        channel.send({ embeds: [embed], components: [row] });
    }

};

function clearChannel(channel, amount) {
    channel.bulkDelete(amount, true);
}