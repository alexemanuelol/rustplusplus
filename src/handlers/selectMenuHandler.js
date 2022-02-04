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
        default:
            break;
    }
}