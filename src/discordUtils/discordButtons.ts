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

import * as types from '../utils/types';
import * as constants from '../utils/constants';
import { guildInstanceManager as gim, localeManager as lm } from '../../index';
import { GuildInstance, ServerInfo, SmartAlarm, StorageMonitor, StorageMonitorType } from '../managers/guildInstanceManager';
import { NewsNewsBody, isValidUrl } from '../managers/fcmListenerManager';

export const ButtonLimits = {
    CustomId: 100,
    Url: 512,
    Label: 80,
    LabelWithEmoji: 34,
    LabelWithoutEmoji: 38
}

export enum ButtonConnectionTypes {
    Connected = 0,
    Disconnected = 1,
    Reconnecting = 2
}

function truncate(text: string, maxLength: number): string {
    return text.length > maxLength ? text.slice(0, maxLength) : text;
}

/**
 * Button help functions
 */

export function getButton(options: discordjs.ButtonComponentData): discordjs.ButtonBuilder {
    const funcName = `[getButton]`;
    const button = new discordjs.ButtonBuilder();

    if (options.style) button.setStyle(options.style);
    if ('customId' in options && options.customId) {
        if (options.customId.length > ButtonLimits.CustomId) {
            throw new Error(`${funcName} CustomId exceed limit ${ButtonLimits.CustomId}, actual: ` +
                `${options.customId.length}. CustomId: '${options.customId}'`);
        }
        button.setCustomId(options.customId);
    }
    if ('url' in options && options.url) {
        if (options.url.length <= ButtonLimits.Url) {
            button.setURL(options.url);
        }
    }

    if (options.label !== undefined) {
        const maxLength = options.emoji !== undefined ? ButtonLimits.LabelWithEmoji : ButtonLimits.Label;
        button.setLabel(truncate(options.label, maxLength));
    }

    if (options.emoji !== undefined) button.setEmoji(options.emoji);
    if ('disabled' in options) button.setDisabled(options.disabled);

    return button;
}


/**
 * Direct-Message based buttons
 */

export function getCredentialsExpiredButtons(): discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'CREDENTIALS APP',
                url: constants.CREDENTIALS_APP_LATEST_URL,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'CREDENTIALS WEBSITE',
                url: constants.CREDENTIALS_WEBSITE_URL,
                type: discordjs.ComponentType.Button
            })
        )];
}


/**
 * Slash Command based buttons
 */

export function getHelpButtons(): discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'DISCORD',
                url: constants.DISCORD_INVITATION_URL,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'REPOSITORY',
                url: constants.RUSTPLUSPLUS_REPOSITORY_URL,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'DOCUMENTATION',
                url: constants.RUSTPLUSPLUS_DOCUMENTATION_URL,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'FAQ',
                url: constants.RUSTPLUSPLUS_FAQ_URL,
                type: discordjs.ComponentType.Button
            }),
            getButton({
                style: discordjs.ButtonStyle.Link,
                label: 'CREDENTIALS',
                url: constants.CREDENTIALS_APP_LATEST_URL,
                type: discordjs.ComponentType.Button
            })
        )];
}


/**
 * Guild based buttons
 */

export function getServerButtons(guildId: types.GuildId, serverId: types.ServerId, connection: ButtonConnectionTypes):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder>[] {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const language = gInstance.generalSettings.language;
    const identifier = JSON.stringify({ 'serverId': serverId });

    const connectionMap = {
        [ButtonConnectionTypes.Connected]: ['ServerDisconnect', 'buttonDisconnect', discordjs.ButtonStyle.Danger],
        [ButtonConnectionTypes.Disconnected]: ['ServerConnect', 'buttonConnect', discordjs.ButtonStyle.Primary],
        [ButtonConnectionTypes.Reconnecting]: ['ServerReconnecting', 'buttonReconnecting', discordjs.ButtonStyle.Danger]
    }

    const connectionButton = getButton({
        customId: `${connectionMap[connection][0] as string}${identifier}`,
        label: lm.getIntl(language, connectionMap[connection][1] as string),
        style: connectionMap[connection][2] as discordjs.ButtonStyle.Danger | discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });

    const editButton = getButton({
        customId: `ServerEdit${identifier}`,
        label: lm.getIntl(language, 'buttonEdit'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button
    });

    const websiteButton = getButton({
        label: lm.getIntl(language, 'websiteCap'),
        style: discordjs.ButtonStyle.Link,
        url: serverInfo.url,
        type: discordjs.ComponentType.Button
    });

    const deleteButton = getButton({
        customId: `ServerDelete${identifier}`,
        style: discordjs.ButtonStyle.Secondary,
        emoji: '🗑️',
        type: discordjs.ComponentType.Button
    });

    return [
        new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
            connectionButton, editButton, websiteButton, deleteButton
        )
    ];
}

export function getSmartSwitchButtons(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId,
    active: boolean): discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const identifier = JSON.stringify({ 'serverId': serverId, 'entityId': entityId });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `SmartSwitch${active ? 'Off' : 'On'}${identifier}`,
            label: active ? lm.getIntl(language, 'buttonOff') : lm.getIntl(language, 'buttonOn'),
            style: active ? discordjs.ButtonStyle.Danger : discordjs.ButtonStyle.Success,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartSwitchEdit${identifier}`,
            label: lm.getIntl(language, 'buttonEdit'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartSwitchDelete${identifier}`,
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));
}

export function getSmartAlarmButtons(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const smartAlarm = serverInfo.smartAlarmMap[entityId] as SmartAlarm;
    const language = gInstance.generalSettings.language;
    const identifier = JSON.stringify({ 'serverId': serverId, 'entityId': entityId });

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            customId: `SmartAlarmEveryone${identifier}`,
            label: '@everyone',
            style: smartAlarm.everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartAlarmInGame${identifier}`,
            label: lm.getIntl(language, 'buttonInGame'),
            style: smartAlarm.inGame ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartAlarmEdit${identifier}`,
            label: lm.getIntl(language, 'buttonEdit'),
            style: discordjs.ButtonStyle.Primary,
            type: discordjs.ComponentType.Button
        }),
        getButton({
            customId: `SmartAlarmDelete${identifier}`,
            style: discordjs.ButtonStyle.Secondary,
            emoji: '🗑️',
            type: discordjs.ComponentType.Button
        }));
}

export function getStorageMonitorButtons(guildId: types.GuildId, serverId: types.ServerId, entityId: types.EntityId):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const serverInfo = gInstance.serverInfoMap[serverId] as ServerInfo;
    const storageMonitor = serverInfo.storageMonitorMap[entityId] as StorageMonitor;
    const language = gInstance.generalSettings.language;
    const identifier = JSON.stringify({ 'serverId': serverId, 'entityId': entityId });

    const everyoneButton = getButton({
        customId: `StorageMonitorEveryone${identifier}`,
        label: '@everyone',
        style: storageMonitor.everyone ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
        type: discordjs.ComponentType.Button,
        disabled: storageMonitor.type === StorageMonitorType.Unknown ? true : false
    });

    const inGameButton = getButton({
        customId: `StorageMonitorInGame${identifier}`,
        label: lm.getIntl(language, 'buttonInGame'),
        style: storageMonitor.inGame ? discordjs.ButtonStyle.Success : discordjs.ButtonStyle.Danger,
        type: discordjs.ComponentType.Button,
        disabled: storageMonitor.type === StorageMonitorType.Unknown ? true : false
    });

    const recycleButton = getButton({
        customId: `StorageMonitorRecycle${identifier}`,
        label: lm.getIntl(language, 'buttonRecycle'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button,
        disabled: storageMonitor.type === StorageMonitorType.Unknown ? true : false
    });

    const editButton = getButton({
        customId: `StorageMonitorEdit${identifier}`,
        label: lm.getIntl(language, 'buttonEdit'),
        style: discordjs.ButtonStyle.Primary,
        type: discordjs.ComponentType.Button,
        disabled: storageMonitor.type === StorageMonitorType.Unknown ? true : false
    });

    const deleteButton = getButton({
        customId: `StorageMonitorDelete${identifier}`,
        style: discordjs.ButtonStyle.Secondary,
        emoji: '🗑️',
        type: discordjs.ComponentType.Button
    });

    const components = storageMonitor.type === StorageMonitorType.ToolCupboard ?
        [everyoneButton, inGameButton, editButton, deleteButton] :
        [recycleButton, editButton, deleteButton];

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(...components);
}


/**
 * Notifications based buttons
 */

export function getFcmNewsNewsButton(guildId: types.GuildId, body: NewsNewsBody):
    discordjs.ActionRowBuilder<discordjs.ButtonBuilder> {
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const url = encodeURI(decodeURI(body.url));

    return new discordjs.ActionRowBuilder<discordjs.ButtonBuilder>().addComponents(
        getButton({
            style: discordjs.ButtonStyle.Link,
            label: lm.getIntl(language, 'linkCap'),
            url: isValidUrl(url) ? url : constants.DEFAULT_SERVER_URL,
            type: discordjs.ComponentType.Button
        }));
}