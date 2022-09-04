const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordSelectMenus = require('../discordTools/discordSelectMenus.js');

module.exports = async (client, interaction) => {
    let guildId = interaction.guildId;
    let instance = client.readInstanceFile(guildId);
    let rustplus = client.rustplusInstances[guildId];

    if (interaction.customId === 'Prefix') {
        instance.generalSettings.prefix = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.prefix = interaction.values[0];
        }

        let row = DiscordSelectMenus.getPrefixSelectMenu(interaction.values[0]);

        await client.interactionUpdate(interaction, { components: [row] });
    }
    else if (interaction.customId === 'Trademark') {
        instance.generalSettings.trademark = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.trademark = interaction.values[0];
            rustplus.trademarkString = (instance.generalSettings.trademark === 'NOT SHOWING') ?
                '' : `${instance.generalSettings.trademark} | `;
        }

        let row = DiscordSelectMenus.getTrademarkSelectMenu(interaction.values[0]);

        await client.interactionUpdate(interaction, { components: [row] });
    }
    else if (interaction.customId === 'CommandDelay') {
        instance.generalSettings.commandDelay = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.commandDelay = interaction.values[0];
        }

        let row = DiscordSelectMenus.getCommandDelaySelectMenu(interaction.values[0]);

        await client.interactionUpdate(interaction, { components: [row] });
    }
    else if (interaction.customId.startsWith('AutoDayNight')) {
        let id = interaction.customId.replace('AutoDayNightId', '');

        instance.serverList[rustplus.serverId].switches[id].autoDayNight = parseInt(interaction.values[0]);
        client.writeInstanceFile(guildId, instance);

        DiscordMessages.sendSmartSwitchMessage(guildId, rustplus.serverId, id, interaction);
    }
}