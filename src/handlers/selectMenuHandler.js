const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    switch (interaction.customId) {
        case 'prefix':
            instance.generalSettings.prefix = interaction.values[0];
            client.writeInstanceFile(guildId, instance);

            if (rustplus) {
                rustplus.generalSettings.prefix = interaction.values[0];
            }

            let row = DiscordTools.getPrefixSelectMenu(interaction.values[0]);
            await interaction.update({ components: [row] });
            break;

        default:
            break;
    }
}