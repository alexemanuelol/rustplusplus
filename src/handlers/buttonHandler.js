const DiscordTools = require('../discordTools/discordTools.js');

module.exports = (client, interaction) => {
    let guildId = interaction.guildId;

    /* Button from notification settings */
    if (interaction.customId.endsWith('DiscordNotification') ||
        interaction.customId.endsWith('InGameNotification')) {
        let setting = interaction.customId.replace('DiscordNotification', '');
        setting = setting.replace('InGameNotification', '');

        /* Update instance file */
        let instance = client.readInstanceFile(guildId);
        if (interaction.customId.endsWith('DiscordNotification')) {
            instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;
        }
        else {
            instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;
        }
        client.writeInstanceFile(guildId, instance);

        /* Update rustplusInstances object */
        if (client.rustplusInstances.hasOwnProperty(guildId)) {
            if (interaction.customId.endsWith('DiscordNotification')) {
                client.rustplusInstances[guildId].notificationSettings[setting].discord =
                    instance.notificationSettings[setting].discord;
            }
            else {
                client.rustplusInstances[guildId].notificationSettings[setting].inGame =
                    instance.notificationSettings[setting].inGame;
            }
        }

        let row = DiscordTools.getNotificationButtonsRow(
            `${setting}DiscordNotification`,
            instance.notificationSettings[setting].discord,
            `${setting}InGameNotification`,
            instance.notificationSettings[setting].inGame);

        interaction.update({ components: [row] });
    }
}
