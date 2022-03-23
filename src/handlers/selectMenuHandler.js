const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    let command = (interaction.customId.endsWith('AutoDayNight')) ? 'AutoDayNight' : 'prefix';
    let id = (command === 'AutoDayNight') ? interaction.customId.replace('AutoDayNight', '') : 0;

    switch (command) {
        case 'prefix':
            instance.generalSettings.prefix = interaction.values[0];
            client.writeInstanceFile(guildId, instance);

            if (rustplus) {
                rustplus.generalSettings.prefix = interaction.values[0];
            }

            let row = DiscordTools.getPrefixSelectMenu(interaction.values[0]);
            await interaction.update({ components: [row] });
            break;

        case 'AutoDayNight':
            if (!instance.switches.hasOwnProperty(id)) {
                await client.switchesMessages[guildId][id].delete();
                delete client.switchesMessages[guildId][id];
                return;
            }

            instance.switches[id].autoDayNight = parseInt(interaction.values[0]);
            client.writeInstanceFile(guildId, instance);

            DiscordTools.sendSmartSwitchMessage(guildId, id, interaction);
            break;

        default:
            break;
    }
}