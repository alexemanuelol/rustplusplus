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

import * as guildInstance from '../util/guild-instance';
import * as credentials from '../util/credentials';
import { client, localeManager as lm } from '../../index';
import * as constants from '../util/constants';
import { secondsToFullScale } from '../util/timer';
import * as discordTools from './discord-tools';
const { RustPlus } = require('../structures/RustPlus.js');

/* Convert hexadecimal color string (with #) to a number. */
export function colorHexToNumber(hex: string): number {
    return parseInt(hex.replace(/^#/, ''), 16);
}

export function getEmbed(options: discordjs.EmbedData): discordjs.EmbedBuilder {
    const embed = new discordjs.EmbedBuilder();

    if (options.hasOwnProperty('title') && options.title !== undefined) {
        embed.setTitle(options.title);
    }

    if (options.hasOwnProperty('description') && options.description !== undefined) {
        embed.setDescription(options.description);
    }

    if (options.hasOwnProperty('url') && options.url !== undefined && options.url !== '') {
        embed.setURL(options.url);
    }

    if (options.hasOwnProperty('timestamp')) {
        embed.setTimestamp();
    }

    if (options.hasOwnProperty('color') && options.color !== undefined) {
        embed.setColor(options.color);
    }

    if (options.hasOwnProperty('footer') && options.footer !== undefined) {
        embed.setFooter(options.footer);
    }

    if (options.hasOwnProperty('image') && options.image !== undefined &&
        options.image.hasOwnProperty('url') && options.image.url !== undefined &&
        options.image.url !== '') {
        embed.setImage(options.image.url);
    }

    if (options.hasOwnProperty('thumbnail') && options.thumbnail !== undefined &&
        options.thumbnail.hasOwnProperty('url') && options.thumbnail.url !== undefined &&
        options.thumbnail.url !== '') {
        embed.setThumbnail(options.thumbnail.url);
    }

    if (options.hasOwnProperty('author') && options.author !== undefined) {
        embed.setAuthor(options.author);
    }

    if (options.hasOwnProperty('fields') && options.fields !== undefined) {
        embed.setFields(...options.fields);
    }

    return embed;
}

export function getSmartSwitchEmbed(guildId: string, serverId: string, entityId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].switches[entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: `${entity.name}${grid}`,
        color: colorHexToNumber(entity.active ? constants.COLOR_ACTIVE : constants.COLOR_INACTIVE),
        description: `**ID**: \`${entityId}\``,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        fields: [{
            name: lm.getIntl(language, 'customCommand'),
            value: `\`${instance.generalSettings.prefix}${entity.command}\``,
            inline: true
        }],
        timestamp: new Date()
    });
}

export async function getServerEmbed(guildId: string, serverId: string): Promise<discordjs.EmbedBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const creds = credentials.readCredentialsFile();
    const server = instance.serverList[serverId];

    let hoster = lm.getIntl(language, 'unknown');
    if (creds.hasOwnProperty(server.steamId)) {
        const member = await discordTools.getMember(guildId, creds[server.steamId].discordUserId);
        if (member !== undefined) {
            hoster = member.user.username;
        }
    }

    let description = '';
    if (server.battlemetricsId !== null) {
        const bmId = server.battlemetricsId;
        const bmIdLink = `[${bmId}](${constants.BATTLEMETRICS_SERVER_URL}${bmId})`;
        description += `__**${lm.getIntl(language, 'battlemetricsId')}:**__ ${bmIdLink}\n`;

        const bmInstance = client.battlemetricsInstances[bmId];
        if (bmInstance) {
            description += `__**${lm.getIntl(language, 'streamerMode')}:**__ `;
            description += (bmInstance.streamerMode ? lm.getIntl(language, 'onCap') :
                lm.getIntl(language, 'offCap')) + '\n';
        }
    }
    description += `\n${server.description}`;

    return getEmbed({
        title: `${server.title}`,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: description,
        thumbnail: { url: `${server.image}` },
        fields: [{
            name: lm.getIntl(language, 'connect'),
            value: `\`${server.connect === null ?
                lm.getIntl(language, 'unavailable') : server.connect}\``,
            inline: true
        },
        {
            name: lm.getIntl(language, 'hoster'),
            value: `\`${hoster} (${server.steamId})\``,
            inline: false
        }]
    });
}

export function getTrackerEmbed(guildId: string, trackerId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const tracker = instance.trackers[trackerId];
    const battlemetricsId = tracker.battlemetricsId;
    const bmInstance = client.battlemetricsInstances[battlemetricsId];

    const successful = bmInstance && bmInstance.lastUpdateSuccessful ? true : false;

    const battlemetricsLink = `[${battlemetricsId}](${constants.BATTLEMETRICS_SERVER_URL}${battlemetricsId})`;
    const serverStatus = !successful ? constants.NOT_FOUND_EMOJI :
        (bmInstance.server_status ? constants.ONLINE_EMOJI : constants.OFFLINE_EMOJI);

    let description = `__**Battlemetrics ID:**__ ${battlemetricsLink}\n`;
    description += `__**${lm.getIntl(language, 'serverId')}:**__ ${tracker.serverId}\n`;
    description += `__**${lm.getIntl(language, 'serverStatus')}:**__ ${serverStatus}\n`;
    description += `__**${lm.getIntl(language, 'streamerMode')}:**__ `;
    description += (!bmInstance ? constants.NOT_FOUND_EMOJI : (bmInstance.streamerMode ?
        lm.getIntl(language, 'onCap') : lm.getIntl(language, 'offCap'))) + '\n';
    description += `__**${lm.getIntl(language, 'clanTag')}:**__ `;
    description += tracker.clanTag !== '' ? `\`${tracker.clanTag}\`` : '';

    let totalCharacters = description.length;
    let fieldIndex = 0
    let playerName = [''], playerId = [''], playerStatus = [''];
    let playerNameCharacters = 0, playerIdCharacters = 0, playerStatusCharacters = 0;
    for (const player of tracker.players) {
        let name = `${player.name}`;

        const nameMaxLength = constants.EMBED_FIELD_MAX_WIDTH_LENGTH_3;
        name = name.length <= nameMaxLength ? name : name.substring(0, nameMaxLength - 2) + '..';
        name += '\n';

        let id = '';
        let status = '';

        const steamIdLink = constants.GET_STEAM_PROFILE_LINK(player.steamId === null ? '' : player.steamId);
        const bmIdLink = constants.GET_BATTLEMETRICS_PROFILE_LINK(player.playerId === null ? '' : player.playerId);

        const isNewLine = (player.steamId !== null && player.playerId !== null) ? true : false;
        id += `${player.steamId !== null ? steamIdLink : ''}`;
        id += `${player.steamId !== null && player.playerId !== null ? ' /\n' : ''}`;
        id += `${player.playerId !== null ? bmIdLink : ''}`;
        id += `${player.steamId === null && player.playerId === null ?
            lm.getIntl(language, 'empty') : ''}`;
        id += '\n';

        if (!bmInstance.players.hasOwnProperty(player.playerId) || !successful) {
            status += `${constants.NOT_FOUND_EMOJI}\n`;
        }
        else {
            let time = null;
            if (player.playerId !== null && bmInstance.players[player.playerId]['status']) {
                time = bmInstance.getOnlineTime(player.playerId);
                status += `${constants.ONLINE_EMOJI}`;
            }
            else {
                time = bmInstance.getOfflineTime(player.playerId);
                status += `${constants.OFFLINE_EMOJI}`;
            }
            status += time !== null ? ` [${time[1]}]\n` : '\n';
        }

        if (isNewLine) {
            name += '\n';
            status += '\n';
        }

        if (totalCharacters + (name.length + id.length + status.length) >= constants.EMBED_MAX_TOTAL_CHARACTERS) {
            break;
        }

        if ((playerNameCharacters + name.length) > constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
            (playerIdCharacters + id.length) > constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
            (playerStatusCharacters + status.length) > constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
            fieldIndex += 1;

            playerName.push('');
            playerId.push('');
            playerStatus.push('');

            playerNameCharacters = 0;
            playerIdCharacters = 0;
            playerStatusCharacters = 0;
        }

        playerNameCharacters += name.length;
        playerIdCharacters += id.length;
        playerStatusCharacters += status.length;

        totalCharacters += name.length + id.length + status.length;

        playerName[fieldIndex] += name;
        playerId[fieldIndex] += id;
        playerStatus[fieldIndex] += status;
    }

    const fields = [];
    for (let i = 0; i < (fieldIndex + 1); i++) {
        fields.push({
            name: i === 0 ? `__${lm.getIntl(language, 'name')}__\n\u200B` : '\u200B',
            value: playerName[i] !== '' ? playerName[i] : lm.getIntl(language, 'empty'),
            inline: true
        });
        fields.push({
            name: i === 0 ? `__${lm.getIntl(language, 'steamId')}__ /\n` +
                `__${lm.getIntl(language, 'battlemetricsId')}__` : '\u200B',
            value: playerId[i] !== '' ? playerId[i] : lm.getIntl(language, 'empty'),
            inline: true
        });
        fields.push({
            name: i === 0 ? `__${lm.getIntl(language, 'status')}__\n\u200B` : '\u200B',
            value: playerStatus[i] !== '' ? playerStatus[i] : lm.getIntl(language, 'empty'),
            inline: true
        });
    }

    return getEmbed({
        title: `${tracker.name}`,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: description,
        thumbnail: { url: `${tracker.image}` },
        footer: { text: `${tracker.title}` },
        fields: fields,
        timestamp: new Date()
    });
}

export function getSmartAlarmEmbed(guildId: string, serverId: string, entityId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].alarms[entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';
    let description = `**ID**: \`${entityId}\`\n`;
    description += `**${lm.getIntl(language, 'lastTrigger')}:** `;

    if (entity.lastTrigger !== null) {
        const lastTriggerDate = new Date(entity.lastTrigger * 1000);
        const timeSinceTriggerSeconds = Math.floor(((new Date()).getTime() - lastTriggerDate.getTime()) / 1000);
        const time = secondsToFullScale(timeSinceTriggerSeconds);
        description += `${time}`;
    }

    return getEmbed({
        title: `${entity.name}${grid}`,
        color: colorHexToNumber(entity.active ? constants.COLOR_ACTIVE : constants.COLOR_DEFAULT),
        description: description,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        fields: [{
            name: lm.getIntl(language, 'message'),
            value: `\`${entity.message}\``,
            inline: true
        }, {
            name: lm.getIntl(language, 'customCommand'),
            value: `\`${instance.generalSettings.prefix}${entity.command}\``,
            inline: false
        }],
        timestamp: new Date()
    });
}

export function getStorageMonitorEmbed(guildId: string, serverId: string, entityId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const rustplus = client.rustplusInstances[guildId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    let description = `**ID** \`${entityId}\``;

    if (!rustplus) {
        return getEmbed({
            title: `${entity.name}${grid}`,
            color: colorHexToNumber(constants.COLOR_DEFAULT),
            description: `${description}\n${lm.getIntl(language, 'statusNotConnectedToServer')}`,
            thumbnail: { url: `attachment://${entity.image}` },
            footer: { text: `${entity.server}` },
            timestamp: new Date()
        });
    }

    if (rustplus && rustplus.storageMonitors[entityId].capacity === 0) {
        return getEmbed({
            title: `${entity.name}${grid}`,
            color: colorHexToNumber(constants.COLOR_DEFAULT),
            description: `${description}\n${lm.getIntl(language, 'statusNotElectronicallyConnected')}`,
            thumbnail: { url: `attachment://${entity.image}` },
            footer: { text: `${entity.server}` },
            timestamp: new Date()
        });
    }

    description += `\n**${lm.getIntl(language, 'type')}** ` +
        `\`${entity.type !== null ? lm.getIntl(language, entity.type) :
            lm.getIntl(language, 'unknown')}\``;

    const items = rustplus.storageMonitors[entityId].items;
    const expiry = rustplus.storageMonitors[entityId].expiry;
    const capacity = rustplus.storageMonitors[entityId].capacity;

    description += `\n**${lm.getIntl(language, 'slots')}** `;
    description += `\`(${items.length}/${capacity})\``

    if (entity.type === 'toolCupboard') {
        let seconds = 0;
        if (expiry !== 0) {
            seconds = ((new Date(expiry * 1000)).getTime() - (new Date()).getTime()) / 1000;
        }

        let upkeep = null;
        if (seconds === 0) {
            upkeep = `:warning:\`${lm.getIntl(language, 'decayingCap')}\`:warning:`;
            instance.serverList[serverId].storageMonitors[entityId].upkeep = 0;
        }
        else {
            let upkeepTime = secondsToFullScale(seconds);
            upkeep = `\`${upkeepTime}\``;
            instance.serverList[serverId].storageMonitors[entityId].upkeep = parseInt(`${upkeepTime}`);
        }
        description += `\n**${lm.getIntl(language, 'upkeep')}** ${upkeep}`;
        guildInstance.writeGuildInstanceFile(guildId, instance);
    }

    let itemName = '', itemQuantity = '', storageItems: { [key: string]: number } = {};
    for (const item of items) {
        if (storageItems.hasOwnProperty(item.itemId)) {
            storageItems[item.itemId] += item.quantity;
        }
        else {
            storageItems[item.itemId] = item.quantity;
        }
    }

    for (const [id, quantity] of Object.entries(storageItems)) {
        itemName += `\`${client.items.getName(id)}\`\n`;
        itemQuantity += `\`${quantity}\`\n`;
    }

    if (itemName === '') itemName = lm.getIntl(language, 'empty');
    if (itemQuantity === '') itemQuantity = lm.getIntl(language, 'empty');

    return getEmbed({
        title: `${entity.name}${grid}`,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: description,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        fields: [
            { name: lm.getIntl(language, 'item'), value: itemName, inline: true },
            { name: lm.getIntl(language, 'quantity'), value: itemQuantity, inline: true }
        ],
        timestamp: new Date()
    });
}

export function getSmartSwitchGroupEmbed(guildId: string, serverId: string, groupId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const group = instance.serverList[serverId].switchGroups[groupId];

    let switchName = '', switchId = '', switchActive = '';
    for (const groupSwitchId of group.switches) {
        if (instance.serverList[serverId].switches.hasOwnProperty(groupSwitchId)) {
            const sw = instance.serverList[serverId].switches[groupSwitchId];
            const active = sw.active;
            switchName += `${sw.name}${sw.location !== null ? ` ${sw.location}` : ''}\n`;
            switchId += `${groupSwitchId}\n`;
            if (sw.reachable) {
                switchActive += `${(active) ? constants.ONLINE_EMOJI : constants.OFFLINE_EMOJI}\n`;
            }
            else {
                switchActive += `${constants.NOT_FOUND_EMOJI}\n`;
            }
        }
        else {
            instance.serverList[serverId].switchGroups[groupId].switches =
                instance.serverList[serverId].switchGroups[groupId].switches.filter(e => e !== groupSwitchId);
        }
    }
    guildInstance.writeGuildInstanceFile(guildId, instance);

    if (switchName === '') switchName = lm.getIntl(language, 'none');
    if (switchId === '') switchId = lm.getIntl(language, 'none');
    if (switchActive === '') switchActive = lm.getIntl(language, 'none');

    return getEmbed({
        title: group.name,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: `**ID**: \`${groupId}\``,
        thumbnail: { url: `attachment://${group.image}` },
        footer: { text: `${instance.serverList[serverId].title}` },
        fields: [
            {
                name: lm.getIntl(language, 'customCommand'),
                value: `\`${instance.generalSettings.prefix}${group.command}\``,
                inline: false
            },
            { name: lm.getIntl(language, 'switches'), value: switchName, inline: true },
            { name: 'ID', value: switchId, inline: true },
            { name: lm.getIntl(language, 'status'), value: switchActive, inline: true }
        ],

        timestamp: new Date()
    });
}

export function getNotFoundSmartDeviceEmbed(guildId: string, serverId: string, entityId: string, type: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId][type as 'switches' | 'alarms' | 'storageMonitors'][entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: `${entity.name}${grid}`,
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        description: `**ID**: \`${entityId}\`\n` +
            `${lm.getIntl(language, 'statusNotFound')} ${constants.NOT_FOUND_EMOJI}`,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` }
    });
}

export function getStorageMonitorRecycleEmbed(guildId: string, serverId: string, entityId: string, items: any):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    let itemName = '', itemQuantity = '';
    for (const item of items['recycler']) {
        itemName += `\`${client.items.getName(item.itemId)}\`\n`;
        itemQuantity += `\`${item.quantity}\`\n`;
    }

    const embed = getEmbed({
        title: `${lm.getIntl(language, 'resultRecycling')}:`,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: 'attachment://recycler.png' },
        footer: { text: `${entity.server} | ${lm.getIntl(language, 'messageDeletedIn30')}` },
        description: `**${lm.getIntl(language, 'name')}** ` +
            `\`${entity.name}${grid}\`\n**ID** \`${entityId}\``
    });

    if (itemName === '') itemName = lm.getIntl(language, 'empty');
    if (itemQuantity === '') itemQuantity = lm.getIntl(language, 'empty');

    embed.addFields(
        { name: lm.getIntl(language, 'item'), value: itemName, inline: true },
        { name: lm.getIntl(language, 'quantity'), value: itemQuantity, inline: true }
    );

    return embed;
}

export function getDecayingNotificationEmbed(guildId: string, serverId: string, entityId: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: lm.getIntl(language, 'isDecaying', { device: `${entity.name}${grid}` }),
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        description: `**ID** \`${entityId}\``,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        timestamp: new Date()
    });
}

export function getStorageMonitorDisconnectNotificationEmbed(guildId: string, serverId: string, entityId: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].storageMonitors[entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: lm.getIntl(language, 'isNoLongerConnected', {
            device: `${entity.name}${grid}`
        }),
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        description: `**ID** \`${entityId}\``,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        timestamp: new Date()
    });
}

export async function getStorageMonitorNotFoundEmbed(guildId: string, serverId: string, entityId: string):
    Promise<discordjs.EmbedBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    const entity = server.storageMonitors[entityId];
    const creds = credentials.readCredentialsFile();
    const user = await discordTools.getMember(guildId, creds[server.steamId].discordUserId);
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: lm.getIntl(language, 'smartDeviceNotFound', {
            device: `${entity.name}${grid}`,
            user: user !== undefined ? user.user.username : lm.getIntl(language, 'unknown')
        }),
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        description: `**ID** \`${entityId}\``,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        timestamp: new Date()
    });
}

export async function getSmartSwitchNotFoundEmbed(guildId: string, serverId: string, entityId: string):
    Promise<discordjs.EmbedBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    const entity = instance.serverList[serverId].switches[entityId];
    const creds = credentials.readCredentialsFile();
    const user = await discordTools.getMember(guildId, creds[server.steamId].discordUserId);
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: lm.getIntl(language, 'smartDeviceNotFound', {
            device: `${entity.name}${grid}`,
            user: user !== undefined ? user.user.username : lm.getIntl(language, 'unknown')
        }),
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        description: `**ID** \`${entityId}\``,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        timestamp: new Date()
    });
}

export async function getSmartAlarmNotFoundEmbed(guildId: string, serverId: string, entityId: string):
    Promise<discordjs.EmbedBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    const entity = server.alarms[entityId];
    const creds = credentials.readCredentialsFile();
    const user = await discordTools.getMember(guildId, creds[server.steamId].discordUserId);
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        title: lm.getIntl(language, 'smartDeviceNotFound', {
            device: `${entity.name}${grid}`,
            user: user !== undefined ? user.user.username : lm.getIntl(language, 'unknown')
        }),
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        description: `**ID** \`${entityId}\``,
        thumbnail: { url: `attachment://${entity.image}` },
        footer: { text: `${entity.server}` },
        timestamp: new Date()
    });
}

export function getNewsEmbed(guildId: string, title: string, message: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    return getEmbed({
        title: `${lm.getIntl(language, 'newsCap')}: ${title}`,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: `${message}`,
        thumbnail: { url: constants.DEFAULT_SERVER_IMAGE },
        timestamp: new Date()
    });
}

export function getTeamLoginEmbed(guildId: string, serverName: string, name: string, id: string, png: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_ACTIVE),
        timestamp: new Date(),
        footer: { text: serverName },
        author: {
            name: lm.getIntl(language, 'userJustConnected', { name: name }),
            iconURL: (png !== null) ? png : constants.DEFAULT_SERVER_IMAGE,
            url: `${constants.STEAM_PROFILES_URL}${id}`
        }
    });
}

export function getPlayerDeathEmbed(title: string, name: string, id: string, png: string): discordjs.EmbedBuilder {
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        thumbnail: { url: png },
        title: title,
        timestamp: new Date(),
        footer: { text: name },
        url: id !== '' ? `${constants.STEAM_PROFILES_URL}${id}` : ''
    });
}

export function getAlarmRaidAlarmEmbed(title: string, message: string, name: string, png: string):
    discordjs.EmbedBuilder {
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_ACTIVE),
        timestamp: new Date(),
        footer: { text: name },
        title: title,
        description: message,
        thumbnail: { url: png !== '' ? png : 'attachment://rocket.png' }
    });
}

export function getAlarmEmbed(guildId: string, serverId: string, entityId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const entity = instance.serverList[serverId].alarms[entityId];
    const grid = entity.location !== null ? ` (${entity.location})` : '';

    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: `attachment://${entity.image}` },
        title: `${entity.name}${grid}`,
        footer: { text: entity.server },
        timestamp: new Date(),
        fields: [
            { name: 'ID', value: `\`${entityId}\``, inline: true },
            { name: lm.getIntl(language, 'message'), value: `\`${entity.message}\``, inline: true }]
    });
}

export function getEventEmbed(guildId: string, serverId: string, text: string, image: string,
    color: string = constants.COLOR_DEFAULT): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const server = instance.serverList[serverId];
    return getEmbed({
        color: colorHexToNumber(color),
        thumbnail: { url: `attachment://${image}` },
        title: text,
        footer: { text: server.title, iconURL: server.image },
        timestamp: new Date()
    });
}

export function getActionInfoEmbed(color: number, str: string, footer: string | null = null, ephemeral: boolean = true):
    discordjs.InteractionReplyOptions {
    return {
        embeds: [getEmbed({
            color: colorHexToNumber(color === 0 ? constants.COLOR_DEFAULT : constants.COLOR_INACTIVE),
            description: `\`\`\`diff\n${(color === 0) ? '+' : '-'} ${str}\n\`\`\``,
            footer: footer !== null ? { text: footer } : undefined
        })],
        ephemeral: ephemeral
    };
}

export function getServerChangedStateEmbed(guildId: string, serverId: string, state: number): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    return getEmbed({
        color: colorHexToNumber(state ? constants.COLOR_INACTIVE : constants.COLOR_ACTIVE),
        title: state ?
            lm.getIntl(language, 'serverJustOffline') :
            lm.getIntl(language, 'serverJustOnline'),
        thumbnail: { url: server.image },
        timestamp: new Date(),
        footer: { text: server.title }
    });
}

export function getServerWipeDetectedEmbed(guildId: string, serverId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        title: lm.getIntl(language, 'wipeDetected'),
        image: { url: `attachment://${guildId}_map_full.png` },
        timestamp: new Date(),
        footer: { text: server.title }
    });
}

export function getServerConnectionInvalidEmbed(guildId: string, serverId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[serverId];
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_INACTIVE),
        title: lm.getIntl(language, 'serverInvalid'),
        thumbnail: { url: server.image },
        timestamp: new Date(),
        footer: { text: server.title }
    });
}

export function getActivityNotificationEmbed(guildId: string, serverId: string, color: string, text: string,
    steamId: string | null, png: string, title: string | null = null): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const footerTitle = title !== null ? title : instance.serverList[serverId].title;
    return getEmbed({
        color: colorHexToNumber(color),
        timestamp: new Date(),
        footer: { text: footerTitle },
        author: {
            name: text,
            iconURL: (png !== null) ? png : constants.DEFAULT_SERVER_IMAGE,
            url: `${constants.STEAM_PROFILES_URL}${steamId === null ? '' : steamId}`
        }
    });
}

export function getUpdateServerInformationEmbed(rustplus: typeof RustPlus): discordjs.EmbedBuilder {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const time = rustplus.getCommandTime(true);
    const timeLeftTitle = lm.getIntl(language, 'timeTill', {
        event: rustplus.time.isDay() ? constants.NIGHT_EMOJI : constants.DAY_EMOJI
    });
    const playersFieldName = lm.getIntl(language, 'players');
    const timeFieldName = lm.getIntl(language, 'time');
    const wipeFieldName = lm.getIntl(language, 'wipe');
    const mapSizeFieldName = lm.getIntl(language, 'mapSize');
    const mapSeedFieldName = lm.getIntl(language, 'mapSeed');
    const mapSaltFieldName = lm.getIntl(language, 'mapSalt');
    const mapFieldName = lm.getIntl(language, 'map');

    const embed = getEmbed({
        title: lm.getIntl(language, 'serverInfo'),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: 'attachment://server_info_logo.png' },
        footer: { text: instance.serverList[rustplus.serverId].title },
        fields: [
            { name: playersFieldName, value: `\`${rustplus.getCommandPop(true)}\``, inline: true },
            { name: timeFieldName, value: `\`${time[0]}\``, inline: true },
            { name: wipeFieldName, value: `\`${rustplus.getCommandWipe(true)}\``, inline: true }],
        timestamp: new Date()
    });

    if (time[1] !== null) {
        embed.addFields(
            { name: timeLeftTitle, value: `\`${time[1]}\``, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: '\u200B', value: '\u200B', inline: true });
    }
    else {
        embed.addFields({ name: '\u200B', value: '\u200B', inline: false });
    }

    embed.addFields(
        { name: mapSizeFieldName, value: `\`${rustplus.rpInfo.mapSize}\``, inline: true },
        { name: mapSeedFieldName, value: `\`${rustplus.rpInfo.seed}\``, inline: true },
        { name: mapSaltFieldName, value: `\`${rustplus.rpInfo.salt}\``, inline: true },
        { name: mapFieldName, value: `\`${rustplus.rpInfo.map}\``, inline: true });

    if (instance.serverList[rustplus.serverId].connect !== null) {
        embed.addFields({
            name: lm.getIntl(language, 'connect'),
            value: `\`${instance.serverList[rustplus.serverId].connect}\``,
            inline: false
        });
    }

    return embed;
}

export function getUpdateEventInformationEmbed(rustplus: typeof RustPlus): discordjs.EmbedBuilder {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const cargoshipFieldName = lm.getIntl(language, 'cargoship');
    const patrolHelicopterFieldName = lm.getIntl(language, 'patrolHelicopter');
    const smallOilRigFieldName = lm.getIntl(language, 'smallOilRig');
    const largeOilRigFieldName = lm.getIntl(language, 'largeOilRig');
    const chinook47FieldName = lm.getIntl(language, 'chinook47');

    const cargoShipMessage = rustplus.getCommandCargo(true);
    const patrolHelicopterMessage = rustplus.getCommandHeli(true);
    const smallOilMessage = rustplus.getCommandSmall(true);
    const largeOilMessage = rustplus.getCommandLarge(true);
    const ch47Message = rustplus.getCommandChinook(true);

    return getEmbed({
        title: lm.getIntl(language, 'eventInfo'),
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: 'attachment://event_info_logo.png' },
        description: lm.getIntl(language, 'inGameEventInfo'),
        footer: { text: instance.serverList[rustplus.serverId].title },
        fields: [
            { name: cargoshipFieldName, value: `\`${cargoShipMessage}\``, inline: true },
            { name: patrolHelicopterFieldName, value: `\`${patrolHelicopterMessage}\``, inline: true },
            { name: smallOilRigFieldName, value: `\`${smallOilMessage}\``, inline: true },
            { name: largeOilRigFieldName, value: `\`${largeOilMessage}\``, inline: true },
            { name: chinook47FieldName, value: `\`${ch47Message}\``, inline: true }],
        timestamp: new Date()
    });
}

export function getUpdateTeamInformationEmbed(rustplus: typeof RustPlus): discordjs.EmbedBuilder {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const title = lm.getIntl(language, 'teamMemberInfo');
    const teamMemberFieldName = lm.getIntl(language, 'teamMember');
    const statusFieldName = lm.getIntl(language, 'status');
    const locationFieldName = lm.getIntl(language, 'location');
    const footer = instance.serverList[rustplus.serverId].title;

    let totalCharacters = title.length + teamMemberFieldName.length + statusFieldName.length +
        locationFieldName.length + footer.length;
    let fieldIndex = 0;
    let teammateName = [''], teammateStatus = [''], teammateLocation = [''];
    let teammateNameCharacters = 0, teammateStatusCharacters = 0, teammateLocationCharacters = 0;
    const leaderSteamId = rustplus.teamInfo.leaderSteamId;
    for (const teamMember of rustplus.teamInfo.teamMemberObjects) {
        let name = teamMember.name === '' ? '-' :
            `[${teamMember.name}](${constants.STEAM_PROFILES_URL}${teamMember.steamId})`;
        name += (teamMember.steamId === leaderSteamId) ? `${constants.LEADER_EMOJI}\n` : '\n';
        let status = '';
        let location = (teamMember.isOnline || teamMember.isAlive) ? `${teamMember.position.string}\n` : '-\n';

        if (teamMember.isOnline) {
            const isAfk = teamMember.afkSeconds >= constants.AFK_TIME_SECONDS;
            const afkTime = teamMember.getAfkTime('dhs');

            status += (isAfk) ? constants.AFK_EMOJI : constants.ONLINE_EMOJI;
            status += (teamMember.isAlive) ? ((isAfk) ? constants.SLEEPING_EMOJI : constants.ALIVE_EMOJI) :
                constants.DEAD_EMOJI;
            status += (Object.keys(instance.serverListLite[rustplus.serverId]).includes(teamMember.steamId)) ?
                constants.PAIRED_EMOJI : '';
            status += (isAfk) ? ` ${afkTime}\n` : '\n';
        }
        else {
            const offlineTime = teamMember.getOfflineTime('s');
            status += constants.OFFLINE_EMOJI;
            status += (teamMember.isAlive) ? constants.SLEEPING_EMOJI : constants.DEAD_EMOJI;
            status += (Object.keys(instance.serverListLite[rustplus.serverId]).includes(teamMember.steamId)) ?
                constants.PAIRED_EMOJI : '';
            status += (offlineTime !== null) ? offlineTime : '';
            status += '\n';
        }

        if (totalCharacters + (name.length + status.length + location.length) >=
            constants.EMBED_MAX_TOTAL_CHARACTERS) {
            break;
        }

        if ((teammateNameCharacters + name.length) > constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
            (teammateStatusCharacters + status.length) > constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
            (teammateLocationCharacters + location.length) > constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
            fieldIndex += 1;

            teammateName.push('');
            teammateStatus.push('');
            teammateLocation.push('');

            teammateNameCharacters = 0;
            teammateStatusCharacters = 0;
            teammateLocationCharacters = 0;
        }

        teammateNameCharacters += name.length;
        teammateStatusCharacters += status.length;
        teammateLocationCharacters += location.length;

        totalCharacters += name.length + status.length + location.length;

        teammateName[fieldIndex] += name;
        teammateStatus[fieldIndex] += status;
        teammateLocation[fieldIndex] += location;
    }

    const fields = [];
    for (let i = 0; i < (fieldIndex + 1); i++) {
        fields.push({
            name: i === 0 ? teamMemberFieldName : '\u200B',
            value: teammateName[i] !== '' ? teammateName[i] : lm.getIntl(language, 'empty'),
            inline: true
        });
        fields.push({
            name: i === 0 ? statusFieldName : '\u200B',
            value: teammateStatus[i] !== '' ? teammateStatus[i] : lm.getIntl(language, 'empty'),
            inline: true
        });
        fields.push({
            name: i === 0 ? locationFieldName : '\u200B',
            value: teammateLocation[i] !== '' ? teammateLocation[i] : lm.getIntl(language, 'empty'),
            inline: true
        });
    }

    return getEmbed({
        title: title,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        thumbnail: { url: 'attachment://team_info_logo.png' },
        footer: { text: footer },
        fields: fields,
        timestamp: new Date()
    });
}

export function getUpdateBattlemetricsOnlinePlayersInformationEmbed(rustplus: typeof RustPlus, battlemetricsId: string):
    discordjs.EmbedBuilder {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const bmInstance = client.battlemetricsInstances[battlemetricsId];

    const playerIds = bmInstance.getOnlinePlayerIdsOrderedByTime();

    let totalCharacters = 0;
    let fieldCharacters = 0;

    const title = lm.getIntl(language, 'battlemetricsOnlinePlayers');
    const footer = { text: bmInstance.server_name };

    totalCharacters += title.length;
    totalCharacters += bmInstance.server_name.length;
    totalCharacters += lm.getIntl(language, 'andMorePlayers', { number: 100 }).length;
    totalCharacters += `${lm.getIntl(language, 'players')}`.length;

    const fields = [''];
    let fieldIndex = 0;
    let isEmbedFull = false;
    let playerCounter = 0;
    for (const playerId of playerIds) {
        playerCounter += 1;

        const status = bmInstance.players[playerId]['status'];
        let time = status ? bmInstance.getOnlineTime(playerId) : bmInstance.getOfflineTime(playerId);
        time = time !== null ? time[1] : '';

        let playerStr = status ? constants.ONLINE_EMOJI : constants.OFFLINE_EMOJI;
        playerStr += ` [${time}] `;

        const nameMaxLength = constants.EMBED_FIELD_MAX_WIDTH_LENGTH_3 - (3 + time.length);

        let name = bmInstance.players[playerId]['name'].replace('[', '(').replace(']', ')');
        name = name.length <= nameMaxLength ? name : name.substring(0, nameMaxLength - 2) + '..';

        playerStr += `[${name}](${constants.BATTLEMETRICS_PROFILE_URL + `${playerId}`})\n`;

        if (totalCharacters + playerStr.length >= constants.EMBED_MAX_TOTAL_CHARACTERS) {
            isEmbedFull = true;
            break;
        }

        if (fieldCharacters + playerStr.length >= constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
            fieldCharacters = 0;
            fieldIndex += 1;
            fields.push('');
        }

        fields[fieldIndex] += playerStr;
        totalCharacters += playerStr.length;
        fieldCharacters += playerStr.length;
    }

    const embed = getEmbed({
        title: title,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        footer: footer,
        timestamp: new Date()
    });

    if (isEmbedFull) {
        embed.setDescription(lm.getIntl(language, 'andMorePlayers', {
            number: playerIds.length - playerCounter
        }));
    }

    let fieldCounter = 0;
    for (const field of fields) {
        embed.addFields({
            name: fieldCounter === 0 ? lm.getIntl(language, 'players') : '\u200B',
            value: field === '' ? '\u200B' : field,
            inline: true
        });
        fieldCounter += 1;
    }

    return embed;
}

export function getDiscordCommandResponseEmbed(rustplus: typeof RustPlus, response: string | string[]):
    discordjs.EmbedBuilder {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);

    let string = '';
    if (Array.isArray(response)) {
        for (const str of response) {
            string += `${str}\n`;
        }
    }
    else {
        string = response;
    }

    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        description: `**${string}**`,
        footer: { text: `${instance.serverList[rustplus.serverId].title}` }
    });
}

export async function getCredentialsShowEmbed(guildId: string): Promise<discordjs.EmbedBuilder> {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const creds = credentials.readCredentialsFile();

    let names = '';
    let steamIds = '';
    let hoster = '';

    for (const credential in creds) {
        const user = await discordTools.getMember(guildId, creds[credential].discordUserId);
        names += `${user !== undefined ? user.user.username : lm.getIntl(language, 'unknown')}\n`;
        steamIds += `${credential}\n`;
        hoster += `${credential === instance.hoster ? `${constants.LEADER_EMOJI}\n` : '\u200B\n'}`;
    }

    if (names === '') names = lm.getIntl(language, 'empty');
    if (steamIds === '') steamIds = lm.getIntl(language, 'empty');
    if (hoster === '') hoster = lm.getIntl(language, 'empty');

    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        title: lm.getIntl(language, 'fcmCredentials'),
        fields: [
            { name: lm.getIntl(language, 'name'), value: names, inline: true },
            { name: 'SteamID', value: steamIds, inline: true },
            { name: lm.getIntl(language, 'hoster'), value: hoster, inline: true }]
    });
}

export function getItemAvailableVendingMachineEmbed(guildId: string, serverId: string, str: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const server = instance.serverList[serverId];
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        footer: { text: server.title },
        author: {
            name: str
        }
    });
}

export function getUserSendEmbed(guildId: string, serverId: string, sender: string, str: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const server = instance.serverList[serverId];
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        footer: { text: server.title },
        description: `**${sender}**: ${str}`
    });
}

export function getHelpEmbed(guildId: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const repository = 'https://github.com/alexemanuelol/rustplusplus';
    const credentials = `${repository}/blob/master/docs/credentials.md`;
    const pairServer = `${repository}/blob/master/docs/pair_and_connect_to_server.md`;
    const commands = `${repository}/blob/master/docs/commands.md`;

    const description =
        `→ [${lm.getIntl(language, 'commandsHelpHowToCredentials')}](${credentials})\n` +
        `→ [${lm.getIntl(language, 'commandsHelpHowToPairServer')}](${pairServer})\n` +
        `→ [${lm.getIntl(language, 'commandsHelpCommandList')}](${commands})`;

    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        title: `rustplusplus Help`,
        description: description
    });
}

export function getCctvEmbed(guildId: string, monument: string, cctvCodes: string[], dynamic: boolean):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    let code = '';
    for (const cctvCode of cctvCodes) {
        code += `${cctvCode} \n`;
    }
    if (dynamic) {
        code += lm.getIntl(language, 'asteriskCctvDesc');
    }
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        title: `${monument} CCTV ${lm.getIntl(language, 'codes')}`,
        description: code
    });
}

export function getUptimeEmbed(uptime: string): discordjs.EmbedBuilder {
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        title: uptime
    });
}

export function getVoiceEmbed(state: string): discordjs.EmbedBuilder {
    return getEmbed({
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        title: state
    });
}

export function getCraftEmbed(guildId: string, craftDetails: any, quantity: number): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    let title = '';
    let description = '';

    if (quantity === 1) {
        title = `${craftDetails[1].name}`;
        description += `__**${lm.getIntl(language, 'time')}:**__ ${craftDetails[2].timeString}`;
    }
    else {
        title = `${craftDetails[1].name} x${quantity}`;
        const time = secondsToFullScale(craftDetails[2].time * quantity, '', true);
        description += `__**${lm.getIntl(language, 'time')}:**__ ${time}`;
    }

    let items = '', quantities = '';
    for (const item of craftDetails[2].ingredients) {
        const itemName = client.items.getName(item.id);
        items += `${itemName}\n`;
        quantities += `${item.quantity * quantity}\n`;
    }

    return getEmbed({
        title: title,
        description: description,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        fields: [
            { name: lm.getIntl(language, 'quantity'), value: items, inline: true },
            { name: lm.getIntl(language, 'hoster'), value: quantities, inline: true }]
    });
}

export function getResearchEmbed(guildId: string, researchDetails: any): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    let typeString = '', scrapString = '';
    if (researchDetails[2].researchTable !== null) {
        typeString += `${lm.getIntl(language, 'researchTable')}\n`;
        scrapString += `${researchDetails[2].researchTable}\n`;
    }
    if (researchDetails[2].workbench !== null) {
        typeString += `${client.items.getName(researchDetails[2].workbench.type)}\n`;
        const scrap = researchDetails[2].workbench.scrap;
        const totalScrap = researchDetails[2].workbench.totalScrap;
        scrapString += `${scrap} (${lm.getIntl(language, 'total')} ${totalScrap})`;
    }

    return getEmbed({
        title: `${researchDetails[1].name}`,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        fields: [
            { name: lm.getIntl(language, 'type'), value: typeString, inline: true },
            { name: lm.getIntl(language, 'scrap'), value: scrapString, inline: true }]
    });
}

export function getRecycleEmbed(guildId: string, recycleDetails: any, quantity: number, recyclerType: string):
    discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    let title = quantity === 1 ? `${recycleDetails[1].name}` : `${recycleDetails[1].name} x${quantity}`;
    title += ` (${lm.getIntl(language, recyclerType)})`;

    const recycleData = client.rustlabs.getRecycleDataFromArray([
        { itemId: recycleDetails[0], quantity: quantity, itemIsBlueprint: false }
    ]);

    let items0 = '', quantities0 = '';
    for (const item of recycleDetails[2][recyclerType]['yield']) {
        items0 += `${client.items.getName(item.id)}\n`;
        quantities0 += (item.probability !== 1) ? `${Math.floor(item.probability * 100)}%\n` : `${item.quantity}\n`;
    }

    let items1 = '', quantities1 = '';
    for (const item of recycleData[recyclerType]) {
        items1 += `${client.items.getName(item.itemId)}\n`;
        quantities1 += `${item.quantity}\n`;
    }

    return getEmbed({
        title: title,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        fields: [
            { name: lm.getIntl(language, 'yield'), value: items0, inline: true },
            { name: '\u200B', value: quantities0, inline: true },
            { name: '\u200B', value: '\u200B', inline: false },
            { name: lm.getIntl(language, 'calculated'), value: items1, inline: true },
            { name: '\u200B', value: quantities1, inline: true }]
    });
}

export function getBattlemetricsEventEmbed(guildId: string, battlemetricsId: string, title: string, description: string,
    fields: discordjs.EmbedField[] | null = null): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const bmInstance = client.battlemetricsInstances[battlemetricsId];

    const serverId = `${bmInstance.server_ip}-${bmInstance.server_port}`;

    let thumbnail = '';
    if (instance.serverList.hasOwnProperty(serverId)) {
        thumbnail = instance.serverList[serverId].image;
    }
    const embed = getEmbed({
        title: title,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date(),
        thumbnail: { url: thumbnail },
        footer: { text: bmInstance.server_name }
    });

    if (fields !== null) {
        embed.addFields(fields);
    }

    if (description !== '') {
        embed.setDescription(description);
    }

    return embed;
}

export function getItemEmbed(guildId: string, itemName: string, itemId: string, type: string): discordjs.EmbedBuilder {
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    const title = `${itemName} (${itemId})`;

    const fields = [];
    const embed = getEmbed({
        title: title,
        color: colorHexToNumber(constants.COLOR_DEFAULT),
        timestamp: new Date()
    });

    const decayDetails = type === 'items' ? client.rustlabs.getDecayDetailsById(itemId) :
        client.rustlabs.getDecayDetailsByName(itemId);
    if (decayDetails !== null) {
        const details = decayDetails[3];
        const hp = details.hpString;
        if (hp !== null) {
            fields.push({
                name: lm.getIntl(language, 'hp'),
                value: hp,
                inline: true
            });
        }

        let decayString = '';
        const decay = details.decayString;
        if (decay !== null) {
            decayString += `${decay}\n`;
        }

        const decayOutside = details.decayOutsideString;
        if (decayOutside !== null) {
            decayString += `${lm.getIntl(language, 'outside')}: ${decayOutside}\n`;
        }

        const decayInside = details.decayInsideString;
        if (decayInside !== null) {
            decayString += `${lm.getIntl(language, 'inside')}: ${decayInside}\n`;
        }

        const decayUnderwater = details.decayUnderwaterString;
        if (decayUnderwater !== null) {
            decayString += `${lm.getIntl(language, 'underwater')}: ${decayUnderwater}\n`;
        }

        if (decayString !== '') {
            fields.push({
                name: lm.getIntl(language, 'decay'),
                value: decayString,
                inline: true
            });
        }
    }

    const despawnDetails = type === 'items' ? client.rustlabs.getDespawnDetailsById(itemId) : null;
    if (despawnDetails !== null) {
        const details = despawnDetails[2];
        fields.push({
            name: lm.getIntl(language, 'despawnTime'),
            value: details.timeString,
            inline: true
        });
    }

    const stackDetails = type === 'items' ? client.rustlabs.getStackDetailsById(itemId) : null;
    if (stackDetails !== null) {
        const details = stackDetails[2];
        fields.push({
            name: lm.getIntl(language, 'stackSize'),
            value: details.quantity,
            inline: true
        });
    }


    const upkeepDetails = type === 'items' ? client.rustlabs.getUpkeepDetailsById(itemId) :
        client.rustlabs.getUpkeepDetailsByName(itemId);
    if (upkeepDetails !== null) {
        const details = upkeepDetails[3];

        let upkeepString = '';
        for (const item of details) {
            const name = client.items.getName(item.id);
            const quantity = item.quantity;
            upkeepString += `${quantity} ${name}\n`;
        }

        fields.push({
            name: lm.getIntl(language, 'upkeep'),
            value: upkeepString,
            inline: true
        });
    }

    const craftDetails = type === 'items' ? client.rustlabs.getCraftDetailsById(itemId) : null;
    if (craftDetails !== null) {
        const details = craftDetails[2];
        let workbenchString = '';
        if (details.workbench !== null) {
            const workbenchShortname = client.items.getShortName(details.workbench);
            switch (workbenchShortname) {
                case 'workbench1': {
                    workbenchString = ' (T1)';
                } break;

                case 'workbench2': {
                    workbenchString = ' (T2)';
                } break;

                case 'workbench3': {
                    workbenchString = ' (T3)';
                } break;
            }
        }

        let craftString = '';

        for (const ingredient of details.ingredients) {
            const amount = `${ingredient.quantity}x`;
            const name = client.items.getName(ingredient.id);
            craftString += `${amount} ${name}\n`;
        }

        if (craftString !== '') {
            fields.push({
                name: lm.getIntl(language, 'craft') + workbenchString,
                value: craftString,
                inline: true
            });
        }
    }

    const recycleDetails = type === 'items' ? client.rustlabs.getRecycleDetailsById(itemId) : null;
    if (recycleDetails !== null) {
        const details = recycleDetails[2]['recycler']['yield'];

        let recycleString = '';
        for (const recycleItem of details) {
            const name = client.items.getName(recycleItem.id);
            const quantityProbability = recycleItem.probability !== 1 ?
                `${Math.floor(recycleItem.probability * 100)}%` :
                `${recycleItem.quantity}x`;
            recycleString += `${quantityProbability} ${name}\n`;
        }

        if (recycleString !== '') {
            fields.push({
                name: lm.getIntl(language, 'recycle'),
                value: recycleString,
                inline: true
            });
        }
    }

    const researchDetails = type === 'items' ? client.rustlabs.getResearchDetailsById(itemId) : null;
    if (researchDetails !== null) {
        const details = researchDetails[2];
        let workbenchString = '';
        if (details.workbench !== null) {
            const workbenchShortname = client.items.getShortName(details.workbench.type);
            switch (workbenchShortname) {
                case 'workbench1': {
                    workbenchString = 'T1: ';
                } break;

                case 'workbench2': {
                    workbenchString = 'T2: ';
                } break;

                case 'workbench3': {
                    workbenchString = 'T3: ';
                } break;
            }
            workbenchString += `${details.workbench.scrap} (${details.workbench.totalScrap})\n`;
        }

        let researchTableString = '';
        if (details.researchTable !== null) {
            researchTableString = `${lm.getIntl(language, 'researchTable')}: ${details.researchTable}\n`;
        }

        const researchString = `${workbenchString}${researchTableString}`;

        if (researchString !== '') {
            fields.push({
                name: lm.getIntl(language, 'research'),
                value: researchString,
                inline: true
            });
        }
    }

    if (fields.length !== 0) {
        embed.setFields(...fields);
    }

    return embed;
}