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
import * as guildInstance from '../util/guild-instance';
import * as discordTools from '../discordTools/discord-tools';
import * as discordButtons from '../discordTools/discord-buttons';
import * as discordModals from '../discordTools/discord-modals';
import * as discordMessages from '../discordTools/discord-messages';
import { updateSwitchGroupIfContainSwitch, turnOnOffGroup } from './smart-switch-group-handler';
const Config = require('../../config');

export async function buttonHandler(interaction: discordjs.ButtonInteraction) {
    const guildId = interaction.guildId as string;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const rustplus = client.rustplusInstances[guildId];

    const verifyId = Math.floor(100000 + Math.random() * 900000);
    await client.logInteraction(interaction, verifyId, 'userButton');

    if (instance.blacklist['discordIds'].includes(interaction.user.id) && interaction.member !== null &&
        !(interaction.member.permissions as discordjs.PermissionsBitField).has(
            discordjs.PermissionsBitField.Flags.Administrator)) {
        log.info(lm.getIntl(Config.general.language, 'userPartOfBlacklist', {
            id: `${verifyId}`,
            user: `${interaction.user.username} (${interaction.user.id})`
        }));
        return;
    }

    if (interaction.customId.startsWith('DiscordNotification')) {
        const ids = JSON.parse(interaction.customId.replace('DiscordNotification', ''));
        const setting = instance.notificationSettings[ids.setting];

        setting.discord = !setting.discord;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.notificationSettings[ids.setting].discord = setting.discord;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${setting.discord}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getNotificationButtons(
                guildId, ids.setting, setting.discord, setting.inGame, setting.voice)]
        });
    }
    else if (interaction.customId.startsWith('InGameNotification')) {
        const ids = JSON.parse(interaction.customId.replace('InGameNotification', ''));
        const setting = instance.notificationSettings[ids.setting];

        setting.inGame = !setting.inGame;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.notificationSettings[ids.setting].inGame = setting.inGame;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${setting.inGame}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getNotificationButtons(
                guildId, ids.setting, setting.discord, setting.inGame, setting.voice)]
        });
    }
    else if (interaction.customId.startsWith('VoiceNotification')) {
        const ids = JSON.parse(interaction.customId.replace('VoiceNotification', ''));
        const setting = instance.notificationSettings[ids.setting];

        setting.voice = !setting.voice;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.notificationSettings[ids.setting].voice = setting.voice;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${setting.voice}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getNotificationButtons(
                guildId, ids.setting, setting.discord, setting.inGame, setting.voice)]
        });
    }
    else if (interaction.customId === 'AllowInGameCommands') {
        instance.generalSettings.inGameCommandsEnabled = !instance.generalSettings.inGameCommandsEnabled;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.inGameCommandsEnabled = instance.generalSettings.inGameCommandsEnabled;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.inGameCommandsEnabled}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getInGameCommandsEnabledButton(guildId,
                instance.generalSettings.inGameCommandsEnabled)]
        });
    }
    else if (interaction.customId === 'BotMutedInGame') {
        instance.generalSettings.muteInGameBotMessages = !instance.generalSettings.muteInGameBotMessages;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.muteInGameBotMessages = instance.generalSettings.muteInGameBotMessages;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.muteInGameBotMessages}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getBotMutedInGameButton(guildId,
                instance.generalSettings.muteInGameBotMessages)]
        });
    }
    else if (interaction.customId === 'InGameTeammateConnection') {
        instance.generalSettings.connectionNotify = !instance.generalSettings.connectionNotify;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.connectionNotify = instance.generalSettings.connectionNotify;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.connectionNotify}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getInGameTeammateNotificationsButtons(guildId)]
        });
    }
    else if (interaction.customId === 'InGameTeammateAfk') {
        instance.generalSettings.afkNotify = !instance.generalSettings.afkNotify;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.afkNotify = instance.generalSettings.afkNotify;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.afkNotify}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getInGameTeammateNotificationsButtons(guildId)]
        });
    }
    else if (interaction.customId === 'InGameTeammateDeath') {
        instance.generalSettings.deathNotify = !instance.generalSettings.deathNotify;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.deathNotify = instance.generalSettings.deathNotify;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.deathNotify}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getInGameTeammateNotificationsButtons(guildId)]
        });
    }
    else if (interaction.customId === 'FcmAlarmNotification') {
        instance.generalSettings.fcmAlarmNotificationEnabled = !instance.generalSettings.fcmAlarmNotificationEnabled;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.fcmAlarmNotificationEnabled =
            instance.generalSettings.fcmAlarmNotificationEnabled;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.fcmAlarmNotificationEnabled}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getFcmAlarmNotificationButtons(
                guildId,
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)]
        });
    }
    else if (interaction.customId === 'FcmAlarmNotificationEveryone') {
        instance.generalSettings.fcmAlarmNotificationEveryone = !instance.generalSettings.fcmAlarmNotificationEveryone;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.fcmAlarmNotificationEveryone =
            instance.generalSettings.fcmAlarmNotificationEveryone;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.fcmAlarmNotificationEveryone}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getFcmAlarmNotificationButtons(
                guildId,
                instance.generalSettings.fcmAlarmNotificationEnabled,
                instance.generalSettings.fcmAlarmNotificationEveryone)]
        });
    }
    else if (interaction.customId === 'SmartAlarmNotifyInGame') {
        instance.generalSettings.smartAlarmNotifyInGame = !instance.generalSettings.smartAlarmNotifyInGame;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.smartAlarmNotifyInGame =
            instance.generalSettings.smartAlarmNotifyInGame;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.smartAlarmNotifyInGame}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getSmartAlarmNotifyInGameButton(guildId,
                instance.generalSettings.smartAlarmNotifyInGame)]
        });
    }
    else if (interaction.customId === 'SmartSwitchNotifyInGameWhenChangedFromDiscord') {
        instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord =
            !instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord =
            instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getSmartSwitchNotifyInGameWhenChangedFromDiscordButton(guildId,
                instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord)]
        });
    }
    else if (interaction.customId === 'LeaderCommandEnabled') {
        instance.generalSettings.leaderCommandEnabled = !instance.generalSettings.leaderCommandEnabled;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.leaderCommandEnabled = instance.generalSettings.leaderCommandEnabled;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.leaderCommandEnabled}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getLeaderCommandEnabledButton(guildId,
                instance.generalSettings.leaderCommandEnabled)]
        });
    }
    else if (interaction.customId === 'LeaderCommandOnlyForPaired') {
        instance.generalSettings.leaderCommandOnlyForPaired = !instance.generalSettings.leaderCommandOnlyForPaired;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.leaderCommandOnlyForPaired =
            instance.generalSettings.leaderCommandOnlyForPaired;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.leaderCommandOnlyForPaired}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getLeaderCommandOnlyForPairedButton(guildId,
                instance.generalSettings.leaderCommandOnlyForPaired)]
        });
    }
    else if (interaction.customId === 'MapWipeNotifyEveryone') {
        instance.generalSettings.mapWipeNotifyEveryone = !instance.generalSettings.mapWipeNotifyEveryone;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.mapWipeNotifyEveryone =
            instance.generalSettings.mapWipeNotifyEveryone;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.mapWipeNotifyEveryone}`
        }));
        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getMapWipeNotifyEveryoneButton(instance.generalSettings.mapWipeNotifyEveryone)]
        });
    }
    else if (interaction.customId === 'ItemAvailableNotifyInGame') {
        instance.generalSettings.itemAvailableInVendingMachineNotifyInGame =
            !instance.generalSettings.itemAvailableInVendingMachineNotifyInGame;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.itemAvailableInVendingMachineNotifyInGame =
            instance.generalSettings.itemAvailableInVendingMachineNotifyInGame;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.itemAvailableInVendingMachineNotifyInGame}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getItemAvailableNotifyInGameButton(guildId,
                instance.generalSettings.itemAvailableInVendingMachineNotifyInGame)]
        });
    }
    else if (interaction.customId === 'DisplayInformationBattlemetricsAllOnlinePlayers') {
        instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers =
            !instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.displayInformationBattlemetricsAllOnlinePlayers =
            instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: [discordButtons.getDisplayInformationBattlemetricsAllOnlinePlayersButton(guildId,
                instance.generalSettings.displayInformationBattlemetricsAllOnlinePlayers)]
        });
    }
    else if (interaction.customId === 'BattlemetricsServerNameChanges') {
        instance.generalSettings.battlemetricsServerNameChanges =
            !instance.generalSettings.battlemetricsServerNameChanges;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.battlemetricsServerNameChanges =
            instance.generalSettings.battlemetricsServerNameChanges;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.battlemetricsServerNameChanges}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId)
        });
    }
    else if (interaction.customId === 'BattlemetricsTrackerNameChanges') {
        instance.generalSettings.battlemetricsTrackerNameChanges =
            !instance.generalSettings.battlemetricsTrackerNameChanges;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.battlemetricsTrackerNameChanges =
            instance.generalSettings.battlemetricsTrackerNameChanges;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.battlemetricsTrackerNameChanges}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId)
        });
    }
    else if (interaction.customId === 'BattlemetricsGlobalNameChanges') {
        instance.generalSettings.battlemetricsGlobalNameChanges =
            !instance.generalSettings.battlemetricsGlobalNameChanges;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.battlemetricsGlobalNameChanges =
            instance.generalSettings.battlemetricsGlobalNameChanges;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.battlemetricsGlobalNameChanges}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId)
        });
    }
    else if (interaction.customId === 'BattlemetricsGlobalLogin') {
        instance.generalSettings.battlemetricsGlobalLogin =
            !instance.generalSettings.battlemetricsGlobalLogin;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.battlemetricsGlobalLogin =
            instance.generalSettings.battlemetricsGlobalLogin;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.battlemetricsGlobalLogin}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId)
        });
    }
    else if (interaction.customId === 'BattlemetricsGlobalLogout') {
        instance.generalSettings.battlemetricsGlobalLogout =
            !instance.generalSettings.battlemetricsGlobalLogout;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) rustplus.generalSettings.battlemetricsGlobalLogout =
            instance.generalSettings.battlemetricsGlobalLogout;

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${instance.generalSettings.battlemetricsGlobalLogout}`
        }));

        await discordTools.interactionUpdate(interaction, {
            components: discordButtons.getSubscribeToChangesBattlemetricsButtons(guildId)
        });
    }
    else if (interaction.customId.startsWith('ServerConnect')) {
        const ids = JSON.parse(interaction.customId.replace('ServerConnect', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        client.resetRustplusVariables(guildId);

        if (instance.activeServer !== null) {
            await discordMessages.sendServerMessage(guildId, instance.activeServer, null);
        }

        instance.activeServer = ids.serverId;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        /* Disconnect previous instance is any */
        if (rustplus) {
            rustplus.isDeleted = true;
            rustplus.disconnect();
        }

        /* Create the rustplus instance */
        const newRustplus = client.createRustplusInstance(
            guildId, server.serverIp, server.appPort, server.steamId, server.playerToken);

        await discordMessages.sendServerMessage(guildId, ids.serverId, null, interaction);

        newRustplus.isNewConnection = true;
    }
    else if (interaction.customId.startsWith('ServerEdit')) {
        const ids = JSON.parse(interaction.customId.replace('ServerEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getServerEditModal(guildId, ids.serverId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('DeleteUnreachableDevices')) {
        const ids = JSON.parse(interaction.customId.replace('DeleteUnreachableDevices', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        const groupsToUpdate: string[] = [];
        for (const [entityId, content] of Object.entries(server.switches)) {
            if (!content.reachable) {
                if (instance.channelIds.switches !== null && content.messageId !== null) {
                    await discordTools.deleteMessage(guildId, instance.channelIds.switches, content.messageId);
                }
                delete server.switches[entityId];

                for (const [groupId, groupContent] of Object.entries(server.switchGroups)) {
                    if (groupContent.switches.includes(`${entityId}`) && !groupsToUpdate.includes(groupId)) {
                        groupsToUpdate.push(groupId);
                    }
                }
            }
        }

        for (const groupId of groupsToUpdate) {
            await discordMessages.sendSmartSwitchGroupMessage(guildId, ids.serverId, groupId);
        }

        for (const [entityId, content] of Object.entries(server.alarms)) {
            if (!content.reachable) {
                if (instance.channelIds.alarms !== null && content.messageId !== null) {
                    await discordTools.deleteMessage(guildId, instance.channelIds.alarms, content.messageId)
                }
                delete server.alarms[entityId];
            }
        }

        for (const [entityId, content] of Object.entries(server.storageMonitors)) {
            if (!content.reachable) {
                if (instance.channelIds.storageMonitors !== null && content.messageId !== null) {
                    await discordTools.deleteMessage(guildId, instance.channelIds.storageMonitors, content.messageId)
                }
                delete server.storageMonitors[entityId];
            }
        }

        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('CustomTimersEdit')) {
        const ids = JSON.parse(interaction.customId.replace('CustomTimersEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getCustomTimersEditModal(guildId, ids.serverId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('CreateTracker')) {
        const ids = JSON.parse(interaction.customId.replace('CreateTracker', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        /* Find an available tracker id */
        const trackerId = client.findAvailableTrackerId(guildId);

        instance.trackers[trackerId] = {
            name: 'Tracker',
            serverId: ids.serverId,
            battlemetricsId: server.battlemetricsId === null ? '' : server.battlemetricsId,
            title: server.title,
            image: server.image,
            clanTag: '',
            everyone: false,
            inGame: true,
            players: [],
            messageId: null
        }
        guildInstance.writeGuildInstanceFile(guildId, instance);

        await discordMessages.sendTrackerMessage(guildId, trackerId);
    }
    else if (interaction.customId.startsWith('CreateGroup')) {
        const ids = JSON.parse(interaction.customId.replace('CreateGroup', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        const groupId = client.findAvailableGroupId(guildId, ids.serverId);

        server.switchGroups[groupId] = {
            name: 'Group',
            command: `${groupId}`,
            switches: [],
            image: 'smart_switch.png',
            messageId: null
        }
        guildInstance.writeGuildInstanceFile(guildId, instance);

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${groupId}`
        }));

        await discordMessages.sendSmartSwitchGroupMessage(guildId, ids.serverId, groupId);
    }
    else if (interaction.customId.startsWith('ServerDisconnect') ||
        interaction.customId.startsWith('ServerReconnecting')) {
        const ids = JSON.parse(interaction.customId.replace('ServerDisconnect', '')
            .replace('ServerReconnecting', ''));
        const server = instance.serverList[ids.serverId];

        if (!server) {
            await interaction.message.delete();
            return;
        }
        instance.activeServer = null;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        client.resetRustplusVariables(guildId);

        if (rustplus) {
            rustplus.isDeleted = true;
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }

        await discordMessages.sendServerMessage(guildId, ids.serverId, null, interaction);
    }
    else if (interaction.customId.startsWith('ServerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('ServerDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!server) {
            await interaction.message.delete();
            return;
        }

        if (rustplus && (rustplus.serverId === ids.serverId || rustplus.serverId === instance.activeServer)) {
            if (instance.channelIds.switches !== null) {
                await discordTools.clearTextChannel(rustplus.guildId, instance.channelIds.switches, 100);
            }
            if (instance.channelIds.switchGroups !== null) {
                await discordTools.clearTextChannel(rustplus.guildId, instance.channelIds.switchGroups, 100);
            }
            if (instance.channelIds.storageMonitors !== null) {
                await discordTools.clearTextChannel(rustplus.guildId, instance.channelIds.storageMonitors, 100);
            }

            instance.activeServer = null;
            guildInstance.writeGuildInstanceFile(guildId, instance);

            client.resetRustplusVariables(guildId);

            rustplus.isDeleted = true;
            rustplus.disconnect();
            delete client.rustplusInstances[guildId];
        }

        for (const [entityId, content] of Object.entries(server.alarms)) {
            if (instance.channelIds.alarms !== null && content.messageId !== null) {
                await discordTools.deleteMessage(guildId, instance.channelIds.alarms, content.messageId);
            }
        }

        if (instance.channelIds.servers !== null && server.messageId !== null) {
            await discordTools.deleteMessage(guildId, instance.channelIds.servers, server.messageId);
        }

        delete instance.serverList[ids.serverId];
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartSwitchOn') ||
        interaction.customId.startsWith('SmartSwitchOff')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchOn', '').replace('SmartSwitchOff', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        if (!rustplus || (rustplus && (rustplus.serverId !== ids.serverId))) {
            interaction.deferUpdate();
            return;
        }

        clearTimeout(rustplus.currentSwitchTimeouts[ids.entityId]);
        delete rustplus.currentSwitchTimeouts[ids.entityId];

        const active = (interaction.customId.startsWith('SmartSwitchOn')) ? true : false;
        const prevActive = server.switches[ids.entityId].active;
        server.switches[ids.entityId].active = active;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        rustplus.interactionSwitches.push(ids.entityId);

        const response = await rustplus.turnSmartSwitchAsync(ids.entityId, active);
        if (!(await rustplus.isResponseValid(response))) {
            if (server.switches[ids.entityId].reachable) {
                await discordMessages.sendSmartSwitchNotFoundMessage(guildId, ids.serverId, ids.entityId);
            }
            server.switches[ids.entityId].reachable = false;
            server.switches[ids.entityId].active = prevActive;
            guildInstance.writeGuildInstanceFile(guildId, instance);

            rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== ids.entityId);
        }
        else {
            server.switches[ids.entityId].reachable = true;
            guildInstance.writeGuildInstanceFile(guildId, instance);
        }

        if (instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord) {
            const user = interaction.user.username;
            const name = server.switches[ids.entityId].name;
            const status = active ? lm.getIntl(language, 'onCap') : lm.getIntl(language, 'offCap');
            const str = lm.getIntl(language, 'userTurnedOnOffSmartSwitchFromDiscord', {
                user: user,
                name: name,
                status: status
            });

            await rustplus.sendInGameMessage(str);
        }

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${active}`
        }));

        await discordMessages.sendSmartSwitchMessage(guildId, ids.serverId, ids.entityId, interaction);
        await updateSwitchGroupIfContainSwitch(guildId, ids.serverId, ids.entityId);
    }
    else if (interaction.customId.startsWith('SmartSwitchEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getSmartSwitchEditModal(guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('SmartSwitchDelete')) {
        const ids = JSON.parse(interaction.customId.replace('SmartSwitchDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!server || (server && !server.switches.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        if (instance.channelIds.switches !== null && server.switches[ids.entityId].messageId !== null) {
            await discordTools.deleteMessage(guildId, instance.channelIds.switches,
                server.switches[ids.entityId].messageId as string);
        }

        delete server.switches[ids.entityId];
        guildInstance.writeGuildInstanceFile(guildId, instance);

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.entityId]);
            delete rustplus.currentSwitchTimeouts[ids.entityId];
        }

        for (const [groupId, content] of Object.entries(server.switchGroups)) {
            if (content.switches.includes(ids.entityId.toString())) {
                server.switchGroups[groupId].switches = content.switches.filter(e => e !== ids.entityId.toString());
                guildInstance.writeGuildInstanceFile(guildId, instance);
                await discordMessages.sendSmartSwitchGroupMessage(guildId, ids.serverId, groupId);
            }
        }
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartAlarmEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEveryone', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.alarms.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.alarms[ids.entityId].everyone = !server.alarms[ids.entityId].everyone;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${server.alarms[ids.entityId].everyone}`
        }));

        await discordMessages.sendSmartAlarmMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('SmartAlarmDelete')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!server || (server && !server.alarms.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        if (instance.channelIds.alarms !== null && server.alarms[ids.entityId].messageId !== null) {
            await discordTools.deleteMessage(guildId, instance.channelIds.alarms,
                server.alarms[ids.entityId].messageId as string);
        }

        delete server.alarms[ids.entityId];
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('SmartAlarmEdit')) {
        const ids = JSON.parse(interaction.customId.replace('SmartAlarmEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.alarms.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getSmartAlarmEditModal(guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardEveryone', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.storageMonitors[ids.entityId].everyone = !server.storageMonitors[ids.entityId].everyone;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${server.storageMonitors[ids.entityId].everyone}`
        }));

        await discordMessages.sendStorageMonitorMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardInGame')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardInGame', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        server.storageMonitors[ids.entityId].inGame = !server.storageMonitors[ids.entityId].inGame;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${server.storageMonitors[ids.entityId].inGame}`
        }));

        await discordMessages.sendStorageMonitorMessage(guildId, ids.serverId, ids.entityId, interaction);
    }
    else if (interaction.customId.startsWith('StorageMonitorEdit')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getStorageMonitorEditModal(guildId, ids.serverId, ids.entityId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('StorageMonitorToolCupboardDelete')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorToolCupboardDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        if (instance.channelIds.storageMonitors !== null && server.storageMonitors[ids.entityId].messageId !== null) {
            await discordTools.deleteMessage(guildId, instance.channelIds.storageMonitors,
                server.storageMonitors[ids.entityId].messageId as string);
        }

        delete server.storageMonitors[ids.entityId];
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('StorageMonitorRecycle')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorRecycle', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        if (!rustplus || (rustplus && rustplus.serverId !== ids.serverId)) return;

        const entityInfo = await rustplus.getEntityInfoAsync(ids.entityId);
        if (!(await rustplus.isResponseValid(entityInfo))) {
            if (server.storageMonitors[ids.entityId].reachable) {
                await discordMessages.sendStorageMonitorNotFoundMessage(guildId, ids.serverId, ids.entityId);
            }
            server.storageMonitors[ids.entityId].reachable = false;
            guildInstance.writeGuildInstanceFile(guildId, instance);

            await discordMessages.sendStorageMonitorMessage(guildId, ids.serverId, ids.entityId);
            return;
        }

        server.storageMonitors[ids.entityId].reachable = true;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        const items = client.rustlabs.getRecycleDataFromArray(entityInfo.entityInfo.payload.items);

        const message = await discordMessages.sendStorageMonitorRecycleMessage(
            guildId, ids.serverId, ids.entityId, items);

        setTimeout(async () => {
            if (instance.channelIds.storageMonitors !== null && message !== undefined) {
                await discordTools.deleteMessage(guildId, instance.channelIds.storageMonitors, message.id);
            }
        }, 30000);
    }
    else if (interaction.customId.startsWith('StorageMonitorContainerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('StorageMonitorContainerDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!server || (server && !server.storageMonitors.hasOwnProperty(ids.entityId))) {
            await interaction.message.delete();
            return;
        }

        if (instance.channelIds.storageMonitors !== null && server.storageMonitors[ids.entityId].messageId !== null) {
            await discordTools.deleteMessage(guildId, instance.channelIds.storageMonitors,
                server.storageMonitors[ids.entityId].messageId as string);
        }

        delete server.storageMonitors[ids.entityId];
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId === 'RecycleDelete') {
        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        await interaction.message.delete();
    }
    else if (interaction.customId.startsWith('GroupTurnOn') ||
        interaction.customId.startsWith('GroupTurnOff')) {
        const ids = JSON.parse(interaction.customId.replace('GroupTurnOn', '').replace('GroupTurnOff', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        interaction.deferUpdate();

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.group]);
            delete rustplus.currentSwitchTimeouts[ids.group];

            if (rustplus.serverId === ids.serverId) {
                const active = (interaction.customId.startsWith('GroupTurnOn') ? true : false);

                if (instance.generalSettings.smartSwitchNotifyInGameWhenChangedFromDiscord) {
                    const user = interaction.user.username;
                    const name = server.switchGroups[ids.groupId].name;
                    const status = active ? lm.getIntl(language, 'onCap') : lm.getIntl(language, 'offCap');
                    const str = lm.getIntl(language, 'userTurnedOnOffSmartSwitchGroupFromDiscord', {
                        user: user,
                        name: name,
                        status: status
                    });

                    await rustplus.sendInGameMessage(str);
                }

                log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
                    id: `${verifyId}`,
                    value: `${active}`
                }));

                await turnOnOffGroup(rustplus, guildId, ids.serverId, ids.groupId, active);
            }
        }
    }
    else if (interaction.customId.startsWith('GroupEdit')) {
        const ids = JSON.parse(interaction.customId.replace('GroupEdit', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getGroupEditModal(guildId, ids.serverId, ids.groupId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('GroupDelete')) {
        const ids = JSON.parse(interaction.customId.replace('GroupDelete', ''));
        const server = instance.serverList[ids.serverId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        if (rustplus) {
            clearTimeout(rustplus.currentSwitchTimeouts[ids.groupId]);
            delete rustplus.currentSwitchTimeouts[ids.groupId];
        }

        if (server.switchGroups.hasOwnProperty(ids.groupId)) {
            if (instance.channelIds.switchGroups !== null && server.switchGroups[ids.groupId].messageId !== null) {
                await discordTools.deleteMessage(guildId, instance.channelIds.switchGroups,
                    server.switchGroups[ids.groupId].messageId as string);
            }

            delete server.switchGroups[ids.groupId];
            guildInstance.writeGuildInstanceFile(guildId, instance);
        }
    }
    else if (interaction.customId.startsWith('GroupAddSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupAddSwitch', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getGroupAddSwitchModal(guildId, ids.serverId, ids.groupId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('GroupRemoveSwitch')) {
        const ids = JSON.parse(interaction.customId.replace('GroupRemoveSwitch', ''));
        const server = instance.serverList[ids.serverId];

        if (!server || (server && !server.switchGroups.hasOwnProperty(ids.groupId))) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getGroupRemoveSwitchModal(guildId, ids.serverId, ids.groupId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerEveryone')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEveryone', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        tracker.everyone = !tracker.everyone;
        guildInstance.writeGuildInstanceFile(guildId, instance);

        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${tracker.everyone}`
        }));

        await discordMessages.sendTrackerMessage(guildId, ids.trackerId, interaction);
    }
    else if (interaction.customId.startsWith('TrackerUpdate')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerUpdate', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        // TODO! Remove name change icon from status

        await discordMessages.sendTrackerMessage(guildId, ids.trackerId, interaction);
    }
    else if (interaction.customId.startsWith('TrackerEdit')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerEdit', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getTrackerEditModal(guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerDelete')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerDelete', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            interaction.deferUpdate();
            return;
        }

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        if (instance.channelIds.trackers !== null && tracker.messageId !== null) {
            await discordTools.deleteMessage(guildId, instance.channelIds.trackers, tracker.messageId);
        }

        delete instance.trackers[ids.trackerId];
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }
    else if (interaction.customId.startsWith('TrackerAddPlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerAddPlayer', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getTrackerAddPlayerModal(guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerRemovePlayer')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerRemovePlayer', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        const modal = discordModals.getTrackerRemovePlayerModal(guildId, ids.trackerId);
        await interaction.showModal(modal);
    }
    else if (interaction.customId.startsWith('TrackerInGame')) {
        const ids = JSON.parse(interaction.customId.replace('TrackerInGame', ''));
        const tracker = instance.trackers[ids.trackerId];

        if (!tracker) {
            await interaction.message.delete();
            return;
        }

        tracker.inGame = !tracker.inGame;
        guildInstance.writeGuildInstanceFile(guildId, instance);


        log.info(lm.getIntl(Config.general.language, 'buttonValueChange', {
            id: `${verifyId}`,
            value: `${tracker.inGame}`
        }));

        await discordMessages.sendTrackerMessage(guildId, ids.trackerId, interaction);
    }

    log.info(lm.getIntl(Config.general.language, 'userButtonInteractionSuccess', {
        id: `${verifyId}`
    }));
}