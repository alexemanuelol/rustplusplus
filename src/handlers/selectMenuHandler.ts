/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import { guildInstanceManager as gim, localeManager as lm, rustPlusManager as rpm } from '../../index';
import { DiscordManager } from "../managers/discordManager";
import * as types from '../utils/types';
import { GuildInstance, ServerInfo, VoiceGenders } from '../managers/guildInstanceManager';
import { Languages } from '../managers/LocaleManager';
import * as discordMessages from '../discordUtils/discordMessages';
import { ConnectionStatus } from '../managers/rustPlusManager';

export async function selectMenuHandler(dm: DiscordManager, interaction: discordjs.AnySelectMenuInteraction):
    Promise<boolean> {
    /* GeneralSettings */
    if (interaction.customId === 'GeneralSetting-language') {
        return await languageSelectMenuHandler(dm, interaction as discordjs.StringSelectMenuInteraction);
    }
    else if (interaction.customId === 'GeneralSetting-voiceGender') {
        return await voiceGenderSelectMenuHandler(dm, interaction as discordjs.StringSelectMenuInteraction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatCommandResponseDelay') {
        return await inGameChatCommandResponseDelaySelectMenuHandler(dm,
            interaction as discordjs.StringSelectMenuInteraction);
    }
    else if (interaction.customId.startsWith('MainRequesterSteamId')) {
        return await mainRequesterSteamIdSelectMenuHandler(dm,
            interaction as discordjs.StringSelectMenuInteraction);
    }

    return false;
}


/**
 * General Settings
 */

async function languageSelectMenuHandler(dm: DiscordManager, interaction: discordjs.StringSelectMenuInteraction):
    Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const selectedLanguage = interaction.values[0] as Languages;

    if (dm.languageChangeTimeout.includes(guildId)) {
        await dm.handleInteractionReply(interaction, {
            content: `**${lm.getIntl(language, 'pleaseTryAgainLater')}**`
        }, 'update');

        if (dm.tryAgainLaterTimeout.has(guildId)) {
            clearTimeout(dm.tryAgainLaterTimeout.get(guildId));
        }

        const timeoutId = setTimeout(async () => {
            const channelId = gInstance.guildChannelIds.settings;
            const messageId = interaction.message.id;
            if (!channelId || !messageId) return;
            const message = await dm.getMessage(guildId, channelId, messageId);
            if (!message) return;
            await dm.handleMessage(message, {
                content: null
            }, 'edit');
        }, 10_000);
        dm.tryAgainLaterTimeout.set(guildId, timeoutId);

        return true;
    }

    gInstance.generalSettings.language = selectedLanguage;
    gim.updateGuildInstance(guildId);

    await interaction.deferUpdate();

    dm.languageChangeTimeout.push(guildId);
    setTimeout(() => {
        dm.languageChangeTimeout = dm.languageChangeTimeout.filter(id => id !== guildId);
    }, 60_000);

    const guild = await dm.getGuild(guildId) as discordjs.Guild;
    await dm.registerGuildSlashCommands(guild);

    for (const [key, value] of Object.entries(gInstance.guildChannelIds)) {
        if (key === 'category') continue;

        const newName = lm.getIntl(selectedLanguage, `guildChannelDisplayName-${key}`);
        await dm.renameChannel(guildId, value, newName);
    }

    await dm.setupGuild(guild);

    // TODO! Loop through servers, smartswitches, smartalarms, storageMonitors, smartswitchgroups, trackers

    return true;
}

async function voiceGenderSelectMenuHandler(dm: DiscordManager, interaction: discordjs.StringSelectMenuInteraction):
    Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const selectedGender = interaction.values[0] as VoiceGenders;

    gInstance.generalSettings.voiceGender = selectedGender;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingVoiceGenderMessage(dm, guildId, true, false, interaction);

    return true;
}

async function inGameChatCommandResponseDelaySelectMenuHandler(dm: DiscordManager,
    interaction: discordjs.StringSelectMenuInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const commandResponseDelay = interaction.values[0];

    gInstance.generalSettings.inGameChatCommandResponseDelay = Number(commandResponseDelay);
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatCommandResponseDelayMessage(dm, guildId, true, false, interaction);

    return true;
}

async function mainRequesterSteamIdSelectMenuHandler(dm: DiscordManager,
    interaction: discordjs.StringSelectMenuInteraction): Promise<boolean> {
    const identifier = JSON.parse(interaction.customId.replace('MainRequesterSteamId', ''));
    const serverId = identifier.serverId as types.ServerId;
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const server = gInstance.serverInfoMap[serverId] as ServerInfo;
    const steamId = interaction.values[0] as types.SteamId;

    server.mainRequesterSteamId = steamId;
    gim.updateGuildInstance(guildId);

    let connectionStatus = ConnectionStatus.Disconnected;
    const rpInstance = rpm.getInstance(guildId, serverId);
    if (rpInstance) {
        connectionStatus = rpInstance.connectionStatus;
    }

    await discordMessages.sendServerMessage(dm, guildId, serverId, connectionStatus, interaction);

    return true;
}