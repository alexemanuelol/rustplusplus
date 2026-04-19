/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const Discord = require('discord.js');

const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordSelectMenus = require('../discordTools/discordSelectMenus.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, interaction) => {
    const instance = client.getInstance(interaction.guildId);
    const guildId = interaction.guildId;
    const rustplus = client.rustplusInstances[guildId];

    const verifyId = Math.floor(100000 + Math.random() * 900000);
    client.logInteraction(interaction, verifyId, 'userSelectMenu');

    if (instance.blacklist['discordIds'].includes(interaction.user.id) &&
        !interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'userPartOfBlacklist', {
            id: `${verifyId}`,
            user: `${interaction.user.username} (${interaction.user.id})`
        }));
        return;
    }

    if (interaction.customId === 'language') {
        instance.generalSettings.language = interaction.values[0];
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.language = interaction.values[0];

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.language}`
        }));

        await interaction.deferUpdate();

        client.loadGuildIntl(guildId);

        await client.interactionEditReply(interaction, {
            components: [DiscordSelectMenus.getLanguageSelectMenu(guildId, interaction.values[0])]
        });

        const guild = DiscordTools.getGuild(guildId);
        await require('../discordTools/RegisterSlashCommands')(client, guild);
    }
    else if (interaction.customId === 'Prefix') {
        instance.generalSettings.prefix = interaction.values[0];
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.prefix = interaction.values[0];

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.prefix}`
        }));

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getPrefixSelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId === 'Trademark') {
        instance.generalSettings.trademark = interaction.values[0];
        client.setInstance(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.trademark = interaction.values[0];
            rustplus.trademarkString = (instance.generalSettings.trademark === 'NOT SHOWING') ?
                '' : `${instance.generalSettings.trademark} | `;
        }

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.trademark}`
        }));

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getTrademarkSelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId === 'CommandDelay') {
        instance.generalSettings.commandDelay = interaction.values[0];
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.commandDelay = interaction.values[0];

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.commandDelay}`
        }));

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getCommandDelaySelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId === 'VoiceGender') {
        instance.generalSettings.voiceGender = interaction.values[0];
        client.setInstance(guildId, instance);

        if (rustplus) rustplus.generalSettings.voiceGender = interaction.values[0];

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.voiceGender}`
        }));

        await client.interactionUpdate(interaction, {
            components: [DiscordSelectMenus.getVoiceGenderSelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId.startsWith('AutoDayNightOnOff')) {
        const ids = JSON.parse(interaction.customId.replace('AutoDayNightOnOff', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const value = parseInt(interaction.values[0]);
        if ((value !== 5 && value !== 6) ||
            ((value === 5 || value === 6) && server.switches[ids.entityId].location !== null)) {
            server.switches[ids.entityId].autoDayNightOnOff = value;
            client.setInstance(guildId, instance);
        }

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${server.switches[ids.entityId].autoDayNightOnOff}`
        }));

        DiscordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('TrackerAddPlayerBMPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerAddPlayerBMPlayer', ''));
        const tracker = instance.trackers[ids.trackerId];
        const playerId = interaction.values[0];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const bmInstance = client.battlemetricsInstances[tracker.battlemetricsId];

        if (tracker.players.some(e => e.playerId === playerId && e.steamId === null)) {
            // Already tracked
            await interaction.reply({
                content: Client.client.intlGet(guildId, 'playerAlreadyTracked') || 'Player is already being tracked.',
                ephemeral: true
            });
            return;
        }

        let name = '-';
        if (bmInstance && bmInstance.players.hasOwnProperty(playerId)) {
            name = bmInstance.players[playerId]['name'];
        }

        tracker.players.push({
            name: name,
            steamId: null,
            playerId: playerId,
            activityLog: []
        });
        client.setInstance(interaction.guildId, instance);

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${playerId}`
        }));

        await interaction.deferUpdate();
        interaction.message.delete().catch(() => {});
        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);
    }
    else if (interaction.customId.startsWith('TrackerRemovePlayerBMPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerRemovePlayerBMPlayer', ''));
        const tracker = instance.trackers[ids.trackerId];
        const id = interaction.values[0];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const Constants = require('../util/constants.js');
        const isSteamId64 = id.length === Constants.STEAMID64_LENGTH ? true : false;

        if (isSteamId64) {
            tracker.players = tracker.players.filter(e => e.steamId !== id);
        }
        else {
            tracker.players = tracker.players.filter(e => e.playerId != id);
        }
        client.setInstance(interaction.guildId, instance);

        client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${id}`
        }));

        await interaction.deferUpdate();
        interaction.message.delete().catch(() => {});
        await DiscordMessages.sendTrackerMessage(interaction.guildId, ids.trackerId);
    }

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'userSelectMenuInteractionSuccess', {
        id: `${verifyId}`
    }));
}