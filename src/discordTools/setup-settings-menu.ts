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

import { Guild, AttachmentBuilder, Channel } from 'discord.js';
import * as path from 'path';

import { log } from '../../index';
import * as constants from '../util/constants';
import * as discordTools from './discord-tools';
import * as discordSelectMenus from './discord-select-menus';
import * as discordButtons from './discord-buttons';
const DiscordEmbeds = require('./discordEmbeds.js');
const { DiscordBot } = require('../structures/DiscordBot.js');

export async function setupSettingsMenu(client: typeof DiscordBot, guild: Guild, forced: boolean = false) {
    const guildId = guild.id;
    const instance = client.getInstance(guildId);
    const channel = await discordTools.getTextChannel(client, guildId, instance.channelIds.settings);

    if (!channel) {
        log.error('SetupSettingsMenu: ' + client.intlGet(null, 'invalidGuildOrChannel'));
        return;
    }

    if (instance.firstTime || forced) {
        await discordTools.clearTextChannel(client, guildId, instance.channelIds.settings, 100);

        await setupGeneralSettings(client, guildId, channel);
        await setupNotificationSettings(client, guildId, channel);

        instance.firstTime = false;
        client.setInstance(guildId, instance);
    }
}

async function setupGeneralSettings(client: typeof DiscordBot, guildId: string, channel: Channel) {
    const instance = client.getInstance(guildId);

    await client.messageSend(channel, {
        files: [new AttachmentBuilder(
            path.join(__dirname, '..',
                `resources/images/settings/general_settings_logo_${instance.generalSettings.language}.png`))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'selectLanguageSetting'),
            thumbnail: `attachment://settings_logo.png`,
            fields: [
                {
                    name: client.intlGet(guildId, 'noteCap'),
                    value: client.intlGet(guildId, 'selectLanguageExtendSetting'),
                    inline: true
                }]
        })],
        components: [discordSelectMenus.getLanguageSelectMenu(guildId, instance.generalSettings.language)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'commandsVoiceGenderDesc'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordSelectMenus.getVoiceGenderSelectMenu(guildId, instance.generalSettings.voiceGender)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'selectInGamePrefixSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordSelectMenus.getPrefixSelectMenu(guildId, instance.generalSettings.prefix)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'selectTrademarkSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordSelectMenus.getTrademarkSelectMenu(guildId, instance.generalSettings.trademark)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldCommandsEnabledSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordButtons.getInGameCommandsEnabledButton(guildId,
            instance.generalSettings.inGameCommandsEnabled)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldBotBeMutedSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordButtons.getBotMutedInGameButton(guildId, instance.generalSettings.muteInGameBotMessages)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'inGameTeamNotificationsSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordButtons.getInGameTeammateNotificationsButtons(guildId)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'commandDelaySetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordSelectMenus.getCommandDelaySelectMenu(guildId, instance.generalSettings.commandDelay)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldSmartAlarmNotifyNotConnectedSetting'),
            thumbnail: `attachment://settings_logo.png`,
            fields: [
                {
                    name: client.intlGet(guildId, 'noteCap'),
                    value: client.intlGet(guildId, 'smartAlarmNotifyExtendSetting'),
                    inline: true
                }]
        })],
        components: [
            discordButtons.getFcmAlarmNotificationButtons(
                guildId,
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldSmartAlarmsNotifyInGameSetting'),
            thumbnail: `attachment://settings_logo.png`,
        })],
        components: [discordButtons.getSmartAlarmNotifyInGameButton(guildId,
            instance.generalSettings.smartAlarmNotifyInGame)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldSmartSwitchNotifyInGameWhenChangedFromDiscord'),
            thumbnail: `attachment://settings_logo.png`,
        })],
        components: [discordButtons.getSmartSwitchNotifyInGameWhenChangedFromDiscordButton(guildId,
            instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldLeaderCommandEnabledSetting'),
            thumbnail: `attachment://settings_logo.png`,
        })],
        components: [discordButtons.getLeaderCommandEnabledButton(guildId,
            instance.generalSettings.leaderCommandEnabled)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldLeaderCommandOnlyForPairedSetting'),
            thumbnail: `attachment://settings_logo.png`,
        })],
        components: [discordButtons.getLeaderCommandOnlyForPairedButton(guildId,
            instance.generalSettings.leaderCommandOnlyForPaired)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'mapWipeDetectedNotifySetting', { group: '@everyone' }),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordButtons.getMapWipeNotifyEveryoneButton(instance.generalSettings.mapWipeNotifyEveryone)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'itemAvailableNotifyInGameSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordButtons.getItemAvailableNotifyInGameButton(guildId,
            instance.generalSettings.itemAvailableInVendingMachineNotifyInGame)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'displayInformationBattlemetricsAllOnlinePlayers'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [discordButtons.getDisplayInformationBattlemetricsAllOnlinePlayersButton(guildId,
            instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'subscribeToChangesBattlemetrics'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId),
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });
}

async function setupNotificationSettings(client: typeof DiscordBot, guildId: string, channel: Channel) {
    const instance = client.getInstance(guildId);

    await client.messageSend(channel, {
        files: [new AttachmentBuilder(
            path.join(__dirname, '..',
                `resources/images/settings/notification_settings_logo_${instance.generalSettings.language}.png`))]
    });

    for (const setting in instance.notificationSettings) {
        await client.messageSend(channel, {
            embeds: [DiscordEmbeds.getEmbed({
                color: constants.COLOR_SETTINGS,
                title: client.intlGet(guildId, setting),
                thumbnail: `attachment://${instance.notificationSettings[setting].image}`
            })],
            components: [
                discordButtons.getNotificationButtons(
                    guildId, setting,
                    instance.notificationSettings[setting].discord,
                    instance.notificationSettings[setting].inGame,
                    instance.notificationSettings[setting].voice)],
            files: [
                new AttachmentBuilder(
                    path.join(__dirname, '..',
                        `resources/images/events/${instance.notificationSettings[setting].image}`))]
        });
    }
}