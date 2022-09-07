const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordSelectMenus = require('../discordTools/discordSelectMenus.js');

module.exports = async (client, interaction) => {
    const instance = client.readInstanceFile(interaction.guildId);
    const guildId = interaction.guildId;
    const rustplus = client.rustplusInstances[guildId];

    if (interaction.customId === 'Prefix') {
        instance.generalSettings.prefix = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.prefix = interaction.values[0];

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getPrefixSelectMenu(interaction.values[0])]
        });
    }
    else if (interaction.customId === 'Trademark') {
        instance.generalSettings.trademark = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.trademark = interaction.values[0];
            rustplus.trademarkString = (instance.generalSettings.trademark === 'NOT SHOWING') ?
                '' : `${instance.generalSettings.trademark} | `;
        }

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getTrademarkSelectMenu(interaction.values[0])]
        });
    }
    else if (interaction.customId === 'CommandDelay') {
        instance.generalSettings.commandDelay = interaction.values[0];
        client.writeInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.commandDelay = interaction.values[0];

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getCommandDelaySelectMenu(interaction.values[0])]
        });
    }
    else if (interaction.customId.startsWith('AutoDayNight')) {
        const ids = JSON.parse(interaction.customId.replace('AutoDayNight', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.switches[ids.entityId].autoDayNight = parseInt(interaction.values[0]);
        client.writeInstanceFile(guildId, instance);

        DiscordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
}