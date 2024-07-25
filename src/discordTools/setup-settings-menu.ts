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

import * as path from 'path';
import { Guild, AttachmentBuilder, Channel } from 'discord.js';

import { log } from '../../index';
import * as constants from '../util/constants';
import { getTextChannel, clearTextChannel } from './discord-tools';
import { getLanguageSelectMenu, getPrefixSelectMenu, getTrademarkSelectMenu, getCommandDelaySelectMenu, getVoiceGenderSelectMenu } from './discord-select-menus';
const DiscordButtons = require('./discordButtons.js');
const DiscordEmbeds = require('./discordEmbeds.js');
const { DiscordBot } = require('../structures/DiscordBot.js');


export async function setupSettingsMenu(client: typeof DiscordBot, guild: Guild, forced: boolean = false) {
    const guildId = guild.id;
    const instance = client.getInstance(guildId);
    const channel = await getTextChannel(client, guildId, instance.channelIds.settings);

    if (!channel) {
        log.error('SetupSettingsMenu: ' + client.intlGet(null, 'invalidGuildOrChannel'));
        return;
    }

    if (instance.firstTime || forced) {
        await clearTextChannel(client, guildId, instance.channelIds.settings, 100);

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
        components: [getLanguageSelectMenu(guildId, instance.generalSettings.language)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'commandsVoiceGenderDesc'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [getVoiceGenderSelectMenu(guildId, instance.generalSettings.voiceGender)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'selectInGamePrefixSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [getPrefixSelectMenu(guildId, instance.generalSettings.prefix)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'selectTrademarkSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [getTrademarkSelectMenu(guildId, instance.generalSettings.trademark)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'shouldCommandsEnabledSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [DiscordButtons.getInGameCommandsEnabledButton(guildId,
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
        components: [DiscordButtons.getBotMutedInGameButton(guildId, instance.generalSettings.muteInGameBotMessages)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'inGameTeamNotificationsSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [DiscordButtons.getInGameTeammateNotificationsButtons(guildId)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'commandDelaySetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [getCommandDelaySelectMenu(guildId, instance.generalSettings.commandDelay)],
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
            DiscordButtons.getFcmAlarmNotificationButtons(
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
        components: [DiscordButtons.getSmartAlarmNotifyInGameButton(guildId,
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
        components: [DiscordButtons.getSmartSwitchNotifyInGameWhenChangedFromDiscordButton(guildId,
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
        components: [DiscordButtons.getLeaderCommandEnabledButton(guildId,
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
        components: [DiscordButtons.getLeaderCommandOnlyForPairedButton(guildId,
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
        components: [DiscordButtons.getMapWipeNotifyEveryoneButton(instance.generalSettings.mapWipeNotifyEveryone)],
        files: [new AttachmentBuilder(
            path.join(__dirname, '..', 'resources/images/settings_logo.png'))]
    });

    await client.messageSend(channel, {
        embeds: [DiscordEmbeds.getEmbed({
            color: constants.COLOR_SETTINGS,
            title: client.intlGet(guildId, 'itemAvailableNotifyInGameSetting'),
            thumbnail: `attachment://settings_logo.png`
        })],
        components: [DiscordButtons.getItemAvailableNotifyInGameButton(guildId,
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
        components: [DiscordButtons.getDisplayInformationBattlemetricsAllOnlinePlayersButton(guildId,
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
        components: DiscordButtons.getSubscribeToChangesBattlemetricsButtons(guildId),
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
                DiscordButtons.getNotificationButtons(
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