/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';

import { log, client, localeManager as lm } from '../../index';
import { registerSlashCommands } from '../discordTools/register-slash-commands';
import * as guildInstance from '../util/guild-instance';
import * as discordTools from '../discordTools/discord-tools';
import * as discordSelectMenus from '../discordTools/discord-select-menus';
import * as discordMessages from '../discordTools/discord-messages';
const Config = require('../../config');

export async function selectMenuHandler(interaction: discordjs.StringSelectMenuInteraction) {
    const guildId = interaction.guildId as string;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const rustplus = client.rustplusInstances[guildId];

    const verifyId = Math.floor(100000 + Math.random() * 900000);
    await client.logInteraction(interaction, verifyId, 'userSelectMenu');

    if (instance.blacklist['discordIds'].includes(interaction.user.id) && interaction.member !== null &&
        !(interaction.member.permissions as discordjs.PermissionsBitField).has(
            discordjs.PermissionsBitField.Flags.Administrator)) {
        log.info(lm.getIntl(Config.general.language, 'userPartOfBlacklist', {
            id: `${verifyId}`,
            user: `${interaction.user.username} (${interaction.user.id})`
        }));
        return;
    }

    if (interaction.customId === 'language') {
        instance.generalSettings.language = interaction.values[0];
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.language = interaction.values[0];

        log.info(lm.getIntl(Config.general.language, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.language}`
        }));

        await interaction.deferUpdate();

        client.loadGuildIntl(guildId);

        await discordTools.interactionUpdate(interaction, {
            components: [discordSelectMenus.getLanguageSelectMenu(guildId, interaction.values[0])]
        });

        const guild = await discordTools.getGuild(guildId);
        if (guild instanceof discordjs.Guild) {
            await registerSlashCommands(guild);
        }
    }
    else if (interaction.customId === 'Prefix') {
        instance.generalSettings.prefix = interaction.values[0];
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.prefix = interaction.values[0];

        log.info(lm.getIntl(Config.general.language, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.prefix}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordSelectMenus.getPrefixSelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId === 'Trademark') {
        instance.generalSettings.trademark = interaction.values[0];
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) {
            rustplus.generalSettings.trademark = interaction.values[0];
            rustplus.trademarkString = (instance.generalSettings.trademark === 'NOT SHOWING') ?
                '' : `${instance.generalSettings.trademark} | `;
        }

        log.info(lm.getIntl(Config.general.language, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.trademark}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordSelectMenus.getTrademarkSelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId === 'CommandDelay') {
        instance.generalSettings.commandDelay = interaction.values[0];
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.commandDelay = interaction.values[0];

        log.info(lm.getIntl(Config.general.language, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.commandDelay}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordSelectMenus.getCommandDelaySelectMenu(guildId, interaction.values[0])]
        });
    }
    else if (interaction.customId === 'VoiceGender') {
        instance.generalSettings.voiceGender = interaction.values[0];
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.voiceGender = interaction.values[0];

        log.info(lm.getIntl(Config.general.language, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.voiceGender}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordSelectMenus.getVoiceGenderSelectMenu(guildId, interaction.values[0])]
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
            guildInstance.writeGuildInstanceFile(guildId, instance);
        }

        log.info(lm.getIntl(Config.general.language, 'selectMenuValueChange', {
            id: `${verifyId}`,
            value: `${server.switches[ids.entityId].autoDayNightOnOff}`
        }));

        await discordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId, interaction);
    }

    log.info(lm.getIntl(Config.general.language, 'userSelectMenuInteractionSuccess', {
        id: `${verifyId}`
    }));
}