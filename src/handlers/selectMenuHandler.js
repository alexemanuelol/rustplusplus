const DiscordTools = require('../discordTools/discordTools.js');

module.exports = (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);

    switch (interaction.customId) {
        case 'prefix':
            instance.generalSettings.prefix = interaction.values[0];
            client.writeInstanceFile(guildId, instance);

            if (client.rustplusInstances.hasOwnProperty(guildId)) {
                client.rustplusInstances[guildId].generalSettings.prefix = interaction.values[0];
            }

            let row = DiscordTools.getPrefixSelectMenu(interaction.values[0]);
            interaction.update({ components: [row] });
            break;
        case 'botchatprefix':
            instance.generalSettings.botchatprefix = interaction.values[0];
            client.writeInstanceFile(guildId, instance);

            if (client.rustplusInstances.hasOwnProperty(guildId)) {
                client.rustplusInstances[guildId].generalSettings.botchatprefix = interaction.values[0];
            }

            let row2 = DiscordTools.getBotChatPrefixSelectMenu(interaction.values[0]);
            interaction.update({ components: [row2] });
            break;

        default:
            break;
    }
}