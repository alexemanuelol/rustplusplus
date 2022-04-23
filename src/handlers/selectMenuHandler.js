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

        await client.interactionUpdate(interaction, { components: [row] });
    }
    else if (interaction.customId === 'trademark') {
        instance.generalSettings.trademark = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.trademark = interaction.values[0];
            rustplus.trademarkString = (instance.generalSettings.trademark === 'NOT SHOWING') ?
                '' : `${instance.generalSettings.trademark} | `;
        }

        let row = DiscordTools.getTrademarkSelectMenu(interaction.values[0]);

        await client.interactionUpdate(interaction, { components: [row] });
    }
    else if (interaction.customId.endsWith('AutoDayNight')) {
        let id = interaction.customId.replace('AutoDayNight', '');

        if (!instance.switches.hasOwnProperty(id)) {
            try {
                await client.switchesMessages[guildId][id].delete();
            }
            catch (e) {
                client.log('ERROR', `Could not delete switch message for entityId: ${id}.`, 'error');
            }
            delete client.switchesMessages[guildId][id];
            return;
        }

        instance.switches[id].autoDayNight = parseInt(interaction.values[0]);
        client.writeInstanceFile(guildId, instance);

        DiscordTools.sendSmartSwitchMessage(guildId, id, false, true, false, interaction);
    }
}