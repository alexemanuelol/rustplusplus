const { MessageEmbed } = require('discord.js');
const Buttons = require('./buttons.js');

module.exports = (client, guild) => {
    let channel = client.getChannel(guild.id, client.guildsAndChannelsIds[guild.id].settings);
    let instance = client.readInstanceFile(guild.id);

    clearChannel(channel, 100);

    for (let setting in instance.notificationSettings) {
        let discord = instance.notificationSettings[setting].discord;
        let inGame = instance.notificationSettings[setting].inGame;

        const embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(instance.notificationSettings[setting].description);

        let row = Buttons.getSettingsButtonsRow(
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