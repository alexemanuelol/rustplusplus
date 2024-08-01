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

import { Guild, AttachmentBuilder, TextChannel } from 'discord.js';
import * as path from 'path';

import { log, localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import * as constants from '../util/constants';
import * as discordTools from './discord-tools';
import * as discordSelectMenus from './discord-select-menus';
import * as discordButtons from './discord-buttons';
import * as discordEmbeds from './discord-embeds';
const Config = require('../../config');

export async function setupSettingsMenu(guild: Guild, forced: boolean = false) {
    const guildId = guild.id;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const channel = instance.channelIds.settings !== null ?
        await discordTools.getTextChannel(guildId, instance.channelIds.settings) : null;

    if (!channel) {
        log.error('SetupSettingsMenu: ' + lm.getIntl(Config.general.language, 'invalidGuildOrChannel'));
        return;
    }

    if (instance.firstTime || forced) {
        if (instance.channelIds.settings !== null) {
            await discordTools.clearTextChannel(guildId, instance.channelIds.settings, 100);
        }

        await setupGeneralSettings(guildId, channel);
        await setupNotificationSettings(guildId, channel);

        instance.firstTime = false;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
}

async function setupGeneralSettings(guildId: string, channel: TextChannel) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    await discordTools.messageSend(channel, {
        files: [new AttachmentBuilder(
            path.join(__dirname, '..',
                `resources/images/settings/general_settings_logo_${instance.generalSettings.language}.png`))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'selectLanguageSetting'),
            thumbnail: { url: `attachment://settings_logo.png` },
            fields: [
                {
                    name: lm.getIntl(language, 'noteCap'),
                    value: lm.getIntl(language, 'selectLanguageExtendSetting'),
                    inline: true
                }]
        })],
        components: [discordSelectMenus.getLanguageSelectMenu(guildId, instance.generalSettings.language)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'commandsVoiceGenderDesc'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordSelectMenus.getVoiceGenderSelectMenu(guildId, instance.generalSettings.voiceGender)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'selectInGamePrefixSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordSelectMenus.getPrefixSelectMenu(guildId, instance.generalSettings.prefix)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'selectTrademarkSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordSelectMenus.getTrademarkSelectMenu(guildId, instance.generalSettings.trademark)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldCommandsEnabledSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getInGameCommandsEnabledButton(guildId,
            instance.generalSettings.inGameCommandsEnabled)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldBotBeMutedSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getBotMutedInGameButton(guildId, instance.generalSettings.muteInGameBotMessages)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'inGameTeamNotificationsSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getInGameTeammateNotificationsButtons(guildId)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'commandDelaySetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordSelectMenus.getCommandDelaySelectMenu(guildId, instance.generalSettings.commandDelay)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldSmartAlarmNotifyNotConnectedSetting'),
            thumbnail: { url: `attachment://settings_logo.png` },
            fields: [
                {
                    name: lm.getIntl(language, 'noteCap'),
                    value: lm.getIntl(language, 'smartAlarmNotifyExtendSetting'),
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

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldSmartAlarmsNotifyInGameSetting'),
            thumbnail: { url: `attachment://settings_logo.png` },
        })],
        components: [discordButtons.getSmartAlarmNotifyInGameButton(guildId,
            instance.generalSettings.smartAlarmNotifyInGame)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldSmartSwitchNotifyInGameWhenChangedFromDiscord'),
            thumbnail: { url: `attachment://settings_logo.png` },
        })],
        components: [discordButtons.getSmartSwitchNotifyInGameWhenChangedFromDiscordButton(guildId,
            instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldLeaderCommandEnabledSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getLeaderCommandEnabledButton(guildId,
            instance.generalSettings.leaderCommandEnabled)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'shouldLeaderCommandOnlyForPairedSetting'),
            thumbnail: { url: `attachment://settings_logo.png` },
        })],
        components: [discordButtons.getLeaderCommandOnlyForPairedButton(guildId,
            instance.generalSettings.leaderCommandOnlyForPaired)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'mapWipeDetectedNotifySetting', { group: '@everyone' }),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getMapWipeNotifyEveryoneButton(instance.generalSettings.mapWipeNotifyEveryone)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'itemAvailableNotifyInGameSetting'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getItemAvailableNotifyInGameButton(guildId,
            instance.generalSettings.itemAvailableInVendingMachineNotifyInGame)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'displayInformationBattlemetricsAllOnlinePlayers'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: [discordButtons.getDisplayInformationBattlemetricsAllOnlinePlayersButton(guildId,
            instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await discordTools.messageSend(channel, {
        embeds: [discordEmbeds.getEmbed({
            color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
            title: lm.getIntl(language, 'subscribeToChangesBattlemetrics'),
            thumbnail: { url: `attachment://settings_logo.png` }
        })],
        components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId),
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });
}

async function setupNotificationSettings(guildId: string, channel: TextChannel) {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    await discordTools.messageSend(channel, {
        files: [new AttachmentBuilder(
            path.join(__dirname, '..',
                `resources/images/settings/notification_settings_logo_${instance.generalSettings.language}.png`))]
    });

    for (const setting in instance.notificationSettings) {
        await discordTools.messageSend(channel, {
            embeds: [discordEmbeds.getEmbed({
                color: discordEmbeds.colorHexToNumber(constants.COLOR_SETTINGS),
                title: lm.getIntl(language, setting),
                thumbnail: { url: `attachment://${instance.notificationSettings[setting].image}` }
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