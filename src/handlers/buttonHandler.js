const Buttons = require('../discordTools/buttons.js');

module.exports = (client, interaction) => {
    let guildId = interaction.guildId;

    let setting = interaction.customId.replace('Discord', '').replace('InGame', '');

    let instance = client.readInstanceFile(guildId);
    if (interaction.customId.endsWith('Discord')) {
        instance.notificationSettings[setting].discord = !instance.notificationSettings[setting].discord;
    }
    else {
        instance.notificationSettings[setting].inGame = !instance.notificationSettings[setting].inGame;
    }
    client.writeInstanceFile(guildId, instance);

    if (client.rustplusInstances.hasOwnProperty(guildId)) {
        if (interaction.customId.endsWith('Discord')) {
            client.rustplusInstances[guildId].notificationSettings[setting].discord =
                instance.notificationSettings[setting].discord;
        }
        else {
            client.rustplusInstances[guildId].notificationSettings[setting].inGame =
                instance.notificationSettings[setting].inGame;
        }
    }

    let row = Buttons.getSettingsButtonsRow(
        `${setting}Discord`,
        instance.notificationSettings[setting].discord,
        `${setting}InGame`,
        instance.notificationSettings[setting].inGame);

    interaction.update({ components: [row] });
}