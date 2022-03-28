const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    if (interaction.customId === 'prefix') {
        instance.generalSettings.prefix = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.prefix = interaction.values[0];
        }

        let row = DiscordTools.getPrefixSelectMenu(interaction.values[0]);
        await interaction.update({ components: [row] });
    }
    else if (interaction.customId.endsWith('AutoDayNight')) {
        let id = interaction.customId.replace('AutoDayNight', '');

        if (!instance.switches.hasOwnProperty(id)) {
            await client.switchesMessages[guildId][id].delete();
            delete client.switchesMessages[guildId][id];
            return;
        }

        instance.switches[id].autoDayNight = parseInt(interaction.values[0]);
        client.writeInstanceFile(guildId, instance);

        DiscordTools.sendSmartSwitchMessage(guildId, id, false, true, false, interaction);
    }
}