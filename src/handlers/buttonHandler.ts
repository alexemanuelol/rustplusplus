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

import { guildInstanceManager as gim, rustPlusManager as rpm } from '../../index';
import { ConnectionStatus } from '../managers/rustPlusManager';
import { DiscordManager } from "../managers/discordManager";
import * as types from '../utils/types';
import { EventNotificationSettings, GuildInstance } from '../managers/guildInstanceManager';
import * as discordMessages from '../discordUtils/discordMessages';
import * as discordModals from '../discordUtils/discordModals';

export async function buttonHandler(dm: DiscordManager, interaction: discordjs.ButtonInteraction):
    Promise<boolean> {
    /* GeneralSettings / EventNotificationSettings */
    if (interaction.customId === 'GeneralSetting-inGameChatFunctionalityEnabled') {
        return await inGameChatFunctionalityEnabledButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatBotUnmuted') {
        return await inGameChatBotUnmutedButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatTrademark') {
        return await inGameChatTrademarkButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatCommandPrefix') {
        return await inGameChatCommandPrefixButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatCommandsEnabled') {
        return await inGameChatCommandsEnabledButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-leaderCommandEnabled') {
        return await leaderCommandEnabledButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-leaderCommandOnlyPaired') {
        return await leaderCommandOnlyPairedButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatNotifySmartSwitchChangedFromDiscord') {
        return await inGameChatNotifySmartSwitchChangedFromDiscordButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatNotifyConnection') {
        return await inGameChatNotifyConnectionButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatNotifyAfk') {
        return await inGameChatNotifyAfkButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-inGameChatNotifyDeath') {
        return await inGameChatNotifyDeathButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-mapWipeNotifyEveryone') {
        return await mapWipeNotifyEveryoneButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-fcmAlarmNotify') {
        return await fcmAlarmNotifyButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-fcmAlarmNotifyEveryone') {
        return await fcmAlarmNotifyEveryoneButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-fcmAlarmPluginNotify') {
        return await fcmAlarmPluginNotifyButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-fcmAlarmPluginNotifyEveryone') {
        return await fcmAlarmPluginNotifyEveryoneButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-fcmAlarmPluginNotifyInGame') {
        return await fcmAlarmPluginNotifyInGameButtonHandler(dm, interaction);
    }
    else if (interaction.customId === 'GeneralSetting-fcmAlarmPluginNotifyActiveServer') {
        return await fcmAlarmPluginNotifyActiveServerButtonHandler(dm, interaction);
    }
    else if (interaction.customId.startsWith('EventNotificationSetting-')) {
        return await eventNotificationSettingButtonHandler(dm, interaction);
    }
    /* Servers Channel buttons */
    else if (interaction.customId.startsWith('ServerConnect')) {
        return await serverConnectButtonHandler(dm, interaction);
    }
    else if (interaction.customId.startsWith('ServerConnecting') ||
        interaction.customId.startsWith('ServerDisconnect') ||
        interaction.customId.startsWith('ServerReconnecting')) {
        return await serverConnectingDisconnectReconnectingButtonHandler(dm, interaction);
    }
    else if (interaction.customId.startsWith('ServerView')) {
        return await serverViewButtonHandler(dm, interaction);
    }
    else if (interaction.customId.startsWith('ServerDelete')) {
        return await serverDeleteButtonHandler(dm, interaction);
    }

    return false;
}


/**
 * General Settings / Event Notification Settings
 */

async function inGameChatFunctionalityEnabledButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatFunctionalityEnabled =
        !gInstance.generalSettings.inGameChatFunctionalityEnabled;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatFunctionalityEnabledMessage(dm, guildId, true, false, interaction);

    return true;
}

async function inGameChatBotUnmutedButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatBotUnmuted = !gInstance.generalSettings.inGameChatBotUnmuted;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatBotUnmutedMessage(dm, guildId, true, false, interaction);

    return true;
}

async function inGameChatTrademarkButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;

    const modal = discordModals.getSettingInGameChatTrademarkModal(guildId);
    await interaction.showModal(modal);

    return true;
}

async function inGameChatCommandPrefixButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;

    const modal = discordModals.getSettingInGameChatCommandPrefixModal(guildId);
    await interaction.showModal(modal);

    return true;
}

async function inGameChatCommandsEnabledButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatCommandsEnabled = !gInstance.generalSettings.inGameChatCommandsEnabled;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatCommandsEnabledMessage(dm, guildId, true, false, interaction);

    return true;
}

async function leaderCommandEnabledButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.leaderCommandEnabled = !gInstance.generalSettings.leaderCommandEnabled;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingLeaderCommandMessage(dm, guildId, true, false, interaction);

    return true;
}

async function leaderCommandOnlyPairedButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.leaderCommandOnlyPaired = !gInstance.generalSettings.leaderCommandOnlyPaired;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingLeaderCommandMessage(dm, guildId, true, false, interaction);

    return true;
}

async function inGameChatNotifySmartSwitchChangedFromDiscordButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatNotifySmartSwitchChangedFromDiscord =
        !gInstance.generalSettings.inGameChatNotifySmartSwitchChangedFromDiscord;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatNotifySmartSwitchChangedFromDiscordMessage(dm, guildId, true, false,
        interaction);

    return true;
}

async function inGameChatNotifyConnectionButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatNotifyConnection = !gInstance.generalSettings.inGameChatNotifyConnection;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function inGameChatNotifyAfkButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatNotifyAfk = !gInstance.generalSettings.inGameChatNotifyAfk;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function inGameChatNotifyDeathButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.inGameChatNotifyDeath = !gInstance.generalSettings.inGameChatNotifyDeath;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingInGameChatNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function mapWipeNotifyEveryoneButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.mapWipeNotifyEveryone = !gInstance.generalSettings.mapWipeNotifyEveryone;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingMapWipeNotifyEveryoneMessage(dm, guildId, true, false, interaction);

    return true;
}

async function fcmAlarmNotifyButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.fcmAlarmNotify = !gInstance.generalSettings.fcmAlarmNotify;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingFcmAlarmNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function fcmAlarmNotifyEveryoneButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.fcmAlarmNotifyEveryone = !gInstance.generalSettings.fcmAlarmNotifyEveryone;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingFcmAlarmNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function fcmAlarmPluginNotifyButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.fcmAlarmPluginNotify = !gInstance.generalSettings.fcmAlarmPluginNotify;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingFcmAlarmPluginNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function fcmAlarmPluginNotifyEveryoneButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.fcmAlarmPluginNotifyEveryone = !gInstance.generalSettings.fcmAlarmPluginNotifyEveryone;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingFcmAlarmPluginNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function fcmAlarmPluginNotifyInGameButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.fcmAlarmPluginNotifyInGame = !gInstance.generalSettings.fcmAlarmPluginNotifyInGame;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingFcmAlarmPluginNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function fcmAlarmPluginNotifyActiveServerButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    gInstance.generalSettings.fcmAlarmPluginNotifyActiveServer =
        !gInstance.generalSettings.fcmAlarmPluginNotifyActiveServer;
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingFcmAlarmPluginNotifyMessage(dm, guildId, true, false, interaction);

    return true;
}

async function eventNotificationSettingButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    const parts = interaction.customId.split('-');
    const typeString = parts[1];
    const setting = parts[2] as keyof EventNotificationSettings;

    const validTypes = ['discord', 'inGame', 'voice'] as const;

    if (!validTypes.includes(typeString as typeof validTypes[number]) ||
        !(setting in gInstance.eventNotificationSettings)) {
        interaction.deferUpdate();
        return false;
    }

    const type = typeString as 'discord' | 'inGame' | 'voice';

    gInstance.eventNotificationSettings[setting][type] =
        !gInstance.eventNotificationSettings[setting][type];
    gim.updateGuildInstance(guildId);

    await discordMessages.sendSettingEventNotificationSettingMessage(dm, guildId, setting, true, false, interaction);

    return true;
}


/**
 * Server channel
 */

async function serverConnectButtonHandler(dm: DiscordManager, interaction: discordjs.ButtonInteraction):
    Promise<boolean> {
    const identifier = JSON.parse(interaction.customId.replace('ServerConnect', ''));
    const serverId = identifier.serverId as types.ServerId;
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const server = gInstance.serverInfoMap[serverId];

    interaction.deferUpdate();
    if (!server) return false;

    if (gInstance.serverToView === null) {
        gInstance.serverToView = serverId;
    }
    else if (gInstance.serverToView !== serverId) {
        const previousServerToView = gInstance.serverToView;
        gInstance.serverToView = serverId;

        let connectionStatus = ConnectionStatus.Disconnected;
        const rpInstance = rpm.getInstance(guildId, previousServerToView);
        if (rpInstance) {
            connectionStatus = rpInstance.connectionStatus;
        }

        await discordMessages.sendServerMessage(dm, guildId, previousServerToView, connectionStatus);
    }

    const creationPromises: Promise<void>[] = [];
    for (const content of Object.values(server.smartSwitchMap)) {
        creationPromises.push(discordMessages.sendSmartSwitchMessage(dm, guildId, serverId, content.entityId));
    }

    for (const content of Object.values(server.smartAlarmMap)) {
        creationPromises.push(discordMessages.sendSmartAlarmMessage(dm, guildId, serverId, content.entityId));
    }

    for (const content of Object.values(server.storageMonitorMap)) {
        creationPromises.push(discordMessages.sendStorageMonitorMessage(dm, guildId, serverId, content.entityId));
    }

    // TODO! Create smartswitchgroup messages
    //for (const content of Object.values(server.smartSwitchGroupMap)) {
    //}
    await Promise.allSettled(creationPromises);

    server.active = true;
    gim.updateGuildInstance(guildId);

    if (rpm.addInstance(guildId, serverId)) {
        const rpInstance = rpm.getInstance(guildId, serverId);
        if (rpInstance) {
            await rpInstance.startup();
        }
    }

    return true;
}

async function serverConnectingDisconnectReconnectingButtonHandler(dm: DiscordManager,
    interaction: discordjs.ButtonInteraction): Promise<boolean> {
    const identifier = JSON.parse(interaction.customId.replace('ServerConnecting', '')
        .replace('ServerDisconnect', '')
        .replace('ServerReconnecting', ''));
    const serverId = identifier.serverId as types.ServerId;
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const server = gInstance.serverInfoMap[serverId];

    if (!server) {
        interaction.deferUpdate();
        return false;
    }

    if (gInstance.serverToView === serverId) {
        gInstance.serverToView = null;

        /* Check if there are any other active servers that we can set view to. */
        for (const [sId, content] of Object.entries(gInstance.serverInfoMap)) {
            if (sId !== serverId && content.active) {
                gInstance.serverToView = sId;

                let connectionStatus = ConnectionStatus.Disconnected;
                const rpInstance = rpm.getInstance(guildId, sId);
                if (rpInstance) {
                    connectionStatus = rpInstance.connectionStatus;
                }

                await discordMessages.sendServerMessage(dm, guildId, sId, connectionStatus);
                break;
            }
        }

        // TODO! Remove embeds from information channel if serverToView === null
    }

    const deletionPromises: Promise<boolean>[] = [];
    for (const content of Object.values(server.smartSwitchMap)) {
        const channelId = gInstance.guildChannelIds.smartSwitches;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
            content.messageId = null;
        }
    }

    for (const content of Object.values(server.smartAlarmMap)) {
        const channelId = gInstance.guildChannelIds.smartAlarms;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
            content.messageId = null;
        }
    }

    for (const content of Object.values(server.storageMonitorMap)) {
        const channelId = gInstance.guildChannelIds.storageMonitors;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
            content.messageId = null;
        }
    }

    for (const content of Object.values(server.smartSwitchGroupMap)) {
        const channelId = gInstance.guildChannelIds.smartSwitchGroups;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
            content.messageId = null;
        }
    }
    await Promise.allSettled(deletionPromises);

    server.active = false;
    gim.updateGuildInstance(guildId);

    rpm.removeInstance(guildId, serverId);
    await discordMessages.sendServerMessage(dm, guildId, serverId, ConnectionStatus.Disconnected, interaction);

    return true;
}

async function serverViewButtonHandler(dm: DiscordManager, interaction: discordjs.ButtonInteraction):
    Promise<boolean> {
    const identifier = JSON.parse(interaction.customId.replace('ServerView', ''));
    const serverId = identifier.serverId as types.ServerId;
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    if (gInstance.serverToView === serverId) {
        gInstance.serverToView = null;
    }
    else if (gInstance.serverToView === null) {
        gInstance.serverToView = serverId;
    }
    else {
        const previousServerToView = gInstance.serverToView;
        gInstance.serverToView = serverId;

        let connectionStatus = ConnectionStatus.Disconnected;
        const rpInstance = rpm.getInstance(guildId, previousServerToView);
        if (rpInstance) {
            connectionStatus = rpInstance.connectionStatus;
        }

        await discordMessages.sendServerMessage(dm, guildId, previousServerToView, connectionStatus);
    }
    gim.updateGuildInstance(guildId);

    let connectionStatus = ConnectionStatus.Disconnected;
    const rpInstance = rpm.getInstance(guildId, serverId);
    if (rpInstance) {
        connectionStatus = rpInstance.connectionStatus;
    }

    await discordMessages.sendServerMessage(dm, guildId, serverId, connectionStatus, interaction);

    return true;
}

async function serverDeleteButtonHandler(dm: DiscordManager, interaction: discordjs.ButtonInteraction):
    Promise<boolean> {
    const identifier = JSON.parse(interaction.customId.replace('ServerDelete', ''));
    const serverId = identifier.serverId as types.ServerId;
    const guildId = interaction.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const server = gInstance.serverInfoMap[serverId];

    if (!server) {
        await interaction.message.delete();
        return true;
    }

    interaction.deferUpdate();

    rpm.removeInstance(guildId, serverId);

    const deletionPromises: Promise<boolean>[] = [];
    for (const content of Object.values(server.smartSwitchMap)) {
        const channelId = gInstance.guildChannelIds.smartSwitches;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
        }
    }

    for (const content of Object.values(server.smartAlarmMap)) {
        const channelId = gInstance.guildChannelIds.smartAlarms;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
        }
    }

    for (const content of Object.values(server.storageMonitorMap)) {
        const channelId = gInstance.guildChannelIds.storageMonitors;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
        }
    }

    for (const content of Object.values(server.smartSwitchGroupMap)) {
        const channelId = gInstance.guildChannelIds.smartSwitchGroups;
        if (channelId !== null && content.messageId !== null) {
            deletionPromises.push(dm.deleteMessage(guildId, channelId, content.messageId));
        }
    }

    if (gInstance.guildChannelIds.servers !== null && server.messageId !== null) {
        deletionPromises.push(dm.deleteMessage(guildId, gInstance.guildChannelIds.servers, server.messageId));
    }

    await Promise.allSettled(deletionPromises);

    if (gInstance.serverToView === serverId) {
        gInstance.serverToView = null;

        /* Check if there are any other active servers that we can set view to. */
        for (const [sId, content] of Object.entries(gInstance.serverInfoMap)) {
            if (sId !== serverId && content.active) {
                gInstance.serverToView = sId;

                let connectionStatus = ConnectionStatus.Disconnected;
                const rpInstance = rpm.getInstance(guildId, sId);
                if (rpInstance) {
                    connectionStatus = rpInstance.connectionStatus;
                }

                await discordMessages.sendServerMessage(dm, guildId, sId, connectionStatus);
                break;
            }
        }

        // TODO! Remove embeds from information channel if serverToView === null
    }

    delete gInstance.serverInfoMap[serverId];
    gim.updateGuildInstance(guildId);

    return true;
}