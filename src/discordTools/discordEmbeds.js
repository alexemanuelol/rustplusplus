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

const Client = require('../../index.ts');
const Constants = require('../util/constants.js');
const DiscordTools = require('./discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Timer = require('../util/timer');

module.exports = {
    getEmbed: function (options = {}) {
        const embed = new Discord.EmbedBuilder();

        if (options.hasOwnProperty('title')) embed.setTitle(options.title);
        if (options.hasOwnProperty('color')) embed.setColor(options.color);
        if (options.hasOwnProperty('description')) embed.setDescription(options.description);
        if (options.hasOwnProperty('thumbnail') && options.thumbnail !== '') embed.setThumbnail(options.thumbnail);
        if (options.hasOwnProperty('image')) embed.setImage(options.image);
        if (options.hasOwnProperty('url') && options.url !== '') embed.setURL(options.url);
        if (options.hasOwnProperty('author')) embed.setAuthor(options.author);
        if (options.hasOwnProperty('footer')) embed.setFooter(options.footer);
        if (options.hasOwnProperty('timestamp')) embed.setTimestamp();
        if (options.hasOwnProperty('fields')) embed.setFields(...options.fields);

        return embed;
    },

    getSmartSwitchEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].switches[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: entity.active ? Constants.COLOR_ACTIVE : Constants.COLOR_INACTIVE,
            description: `**ID**: \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: Client.client.intlGet(guildId, 'customCommand'),
                value: `\`${instance.generalSettings.prefix}${entity.command}\``,
                inline: true
            }],
            timestamp: true
        });
    },

    getServerEmbed: async function (guildId, serverId) {
        const instance = Client.client.getInstance(guildId);
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        const server = instance.serverList[serverId];
        let hoster = Client.client.intlGet(guildId, 'unknown');
        if (credentials.hasOwnProperty(server.steamId)) {
            hoster = await DiscordTools.getUserById(guildId, credentials[server.steamId].discord_user_id);
            hoster = hoster.user.username;
        }

        let description = '';
        if (server.battlemetricsId !== null) {
            const bmId = server.battlemetricsId;
            const bmIdLink = `[${bmId}](${Constants.BATTLEMETRICS_SERVER_URL}${bmId})`;
            description += `__**${Client.client.intlGet(guildId, 'battlemetricsId')}:**__ ${bmIdLink}\n`;

            const bmInstance = Client.client.battlemetricsInstances[bmId];
            if (bmInstance) {
                description += `__**${Client.client.intlGet(guildId, 'streamerMode')}:**__ `;
                description += (bmInstance.streamerMode ? Client.client.intlGet(guildId, 'onCap') :
                    Client.client.intlGet(guildId, 'offCap')) + '\n';
            }
        }
        description += `\n${server.description}`;

        return module.exports.getEmbed({
            title: `${server.title}`,
            color: Constants.COLOR_DEFAULT,
            description: description,
            thumbnail: `${server.img}`,
            fields: [{
                name: Client.client.intlGet(guildId, 'connect'),
                value: `\`${server.connect === null ?
                    Client.client.intlGet(guildId, 'unavailable') : server.connect}\``,
                inline: true
            },
            {
                name: Client.client.intlGet(guildId, 'hoster'),
                value: `\`${hoster} (${server.steamId})\``,
                inline: false
            }]
        });
    },

    getTrackerEmbed: function (guildId, trackerId) {
        const instance = Client.client.getInstance(guildId);
        const tracker = instance.trackers[trackerId];
        const battlemetricsId = tracker.battlemetricsId;
        const bmInstance = Client.client.battlemetricsInstances[battlemetricsId];

        const successful = bmInstance && bmInstance.lastUpdateSuccessful ? true : false;

        const battlemetricsLink = `[${battlemetricsId}](${Constants.BATTLEMETRICS_SERVER_URL}${battlemetricsId})`;
        const serverStatus = !successful ? Constants.NOT_FOUND_EMOJI :
            (bmInstance.server_status ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI);

        let description = `__**Battlemetrics ID:**__ ${battlemetricsLink}\n`;
        description += `__**${Client.client.intlGet(guildId, 'serverId')}:**__ ${tracker.serverId}\n`;
        description += `__**${Client.client.intlGet(guildId, 'serverStatus')}:**__ ${serverStatus}\n`;
        description += `__**${Client.client.intlGet(guildId, 'streamerMode')}:**__ `;
        description += (!bmInstance ? Constants.NOT_FOUND_EMOJI : (bmInstance.streamerMode ?
            Client.client.intlGet(guildId, 'onCap') : Client.client.intlGet(guildId, 'offCap'))) + '\n';
        description += `__**${Client.client.intlGet(guildId, 'clanTag')}:**__ `;
        description += tracker.clanTag !== '' ? `\`${tracker.clanTag}\`` : '';

        let totalCharacters = description.length;
        let fieldIndex = 0
        let playerName = [''], playerId = [''], playerStatus = [''];
        let playerNameCharacters = 0, playerIdCharacters = 0, playerStatusCharacters = 0;
        for (const player of tracker.players) {
            let name = `${player.name}`;

            const nameMaxLength = Constants.EMBED_FIELD_MAX_WIDTH_LENGTH_3;
            name = name.length <= nameMaxLength ? name : name.substring(0, nameMaxLength - 2) + '..';
            name += '\n';

            let id = '';
            let status = '';

            const steamIdLink = Constants.GET_STEAM_PROFILE_LINK(player.steamId);
            const bmIdLink = Constants.GET_BATTLEMETRICS_PROFILE_LINK(player.playerId);

            const isNewLine = (player.steamId !== null && player.playerId !== null) ? true : false;
            id += `${player.steamId !== null ? steamIdLink : ''}`;
            id += `${player.steamId !== null && player.playerId !== null ? ' /\n' : ''}`;
            id += `${player.playerId !== null ? bmIdLink : ''}`;
            id += `${player.steamId === null && player.playerId === null ?
                Client.client.intlGet(guildId, 'empty') : ''}`;
            id += '\n';

            if (!bmInstance.players.hasOwnProperty(player.playerId) || !successful) {
                status += `${Constants.NOT_FOUND_EMOJI}\n`;
            }
            else {
                let time = null;
                if (bmInstance.players[player.playerId]['status']) {
                    time = bmInstance.getOnlineTime(player.playerId);
                    status += `${Constants.ONLINE_EMOJI}`;
                }
                else {
                    time = bmInstance.getOfflineTime(player.playerId);
                    status += `${Constants.OFFLINE_EMOJI}`;
                }
                status += time !== null ? ` [${time[1]}]\n` : '\n';
            }

            if (isNewLine) {
                name += '\n';
                status += '\n';
            }

            if (totalCharacters + (name.length + id.length + status.length) >= Constants.EMBED_MAX_TOTAL_CHARACTERS) {
                break;
            }

            if ((playerNameCharacters + name.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
                (playerIdCharacters + id.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
                (playerStatusCharacters + status.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
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
                name: i === 0 ? `__${Client.client.intlGet(guildId, 'name')}__\n\u200B` : '\u200B',
                value: playerName[i] !== '' ? playerName[i] : Client.client.intlGet(guildId, 'empty'),
                inline: true
            });
            fields.push({
                name: i === 0 ? `__${Client.client.intlGet(guildId, 'steamId')}__ /\n` +
                    `__${Client.client.intlGet(guildId, 'battlemetricsId')}__` : '\u200B',
                value: playerId[i] !== '' ? playerId[i] : Client.client.intlGet(guildId, 'empty'),
                inline: true
            });
            fields.push({
                name: i === 0 ? `__${Client.client.intlGet(guildId, 'status')}__\n\u200B` : '\u200B',
                value: playerStatus[i] !== '' ? playerStatus[i] : Client.client.intlGet(guildId, 'empty'),
                inline: true
            });
        }

        return module.exports.getEmbed({
            title: `${tracker.name}`,
            color: Constants.COLOR_DEFAULT,
            description: description,
            thumbnail: `${tracker.img}`,
            footer: { text: `${tracker.title}` },
            fields: fields,
            timestamp: true
        });
    },

    getSmartAlarmEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';
        let description = `**ID**: \`${entityId}\`\n`;
        description += `**${Client.client.intlGet(guildId, 'lastTrigger')}:** `;

        if (entity.lastTrigger !== null) {
            const lastTriggerDate = new Date(entity.lastTrigger * 1000);
            const timeSinceTriggerSeconds = Math.floor((new Date() - lastTriggerDate) / 1000);
            const time = Timer.secondsToFullScale(timeSinceTriggerSeconds);
            description += `${time}`;
        }

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: entity.active ? Constants.COLOR_ACTIVE : Constants.COLOR_DEFAULT,
            description: description,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: Client.client.intlGet(guildId, 'message'),
                value: `\`${entity.message}\``,
                inline: true
            }, {
                name: Client.client.intlGet(guildId, 'customCommand'),
                value: `\`${instance.generalSettings.prefix}${entity.command}\``,
                inline: false
            }],
            timestamp: true
        });
    },

    getStorageMonitorEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const rustplus = Client.client.rustplusInstances[guildId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        let description = `**ID** \`${entityId}\``;

        if (!rustplus) {
            return module.exports.getEmbed({
                title: `${entity.name}${grid}`,
                color: Constants.COLOR_DEFAULT,
                description: `${description}\n${Client.client.intlGet(guildId, 'statusNotConnectedToServer')}`,
                thumbnail: `attachment://${entity.image}`,
                footer: { text: `${entity.server}` },
                timestamp: true
            });
        }

        if (rustplus && rustplus.storageMonitors[entityId].capacity === 0) {
            return module.exports.getEmbed({
                title: `${entity.name}${grid}`,
                color: Constants.COLOR_DEFAULT,
                description:
                    `${description}\n${Client.client.intlGet(guildId, 'statusNotElectronicallyConnected')}`,
                thumbnail: `attachment://${entity.image}`,
                footer: { text: `${entity.server}` },
                timestamp: true
            });
        }

        description += `\n**${Client.client.intlGet(guildId, 'type')}** ` +
            `\`${entity.type !== null ? Client.client.intlGet(guildId, entity.type) :
                Client.client.intlGet(guildId, 'unknown')}\``;

        const items = rustplus.storageMonitors[entityId].items;
        const expiry = rustplus.storageMonitors[entityId].expiry;
        const capacity = rustplus.storageMonitors[entityId].capacity;

        description += `\n**${Client.client.intlGet(guildId, 'slots')}** `;
        description += `\`(${items.length}/${capacity})\``

        if (entity.type === 'toolCupboard') {
            let seconds = 0;
            if (expiry !== 0) {
                seconds = (new Date(expiry * 1000) - new Date()) / 1000;
            }

            let upkeep = null;
            if (seconds === 0) {
                upkeep = `:warning:\`${Client.client.intlGet(guildId, 'decayingCap')}\`:warning:`;
                instance.serverList[serverId].storageMonitors[entityId].upkeep =
                    Client.client.intlGet(guildId, 'decayingCap');
            }
            else {
                let upkeepTime = Timer.secondsToFullScale(seconds);
                upkeep = `\`${upkeepTime}\``;
                instance.serverList[serverId].storageMonitors[entityId].upkeep = `${upkeepTime}`;
            }
            description += `\n**${Client.client.intlGet(guildId, 'upkeep')}** ${upkeep}`;
            Client.client.setInstance(guildId, instance);
        }

        let itemName = '', itemQuantity = '', storageItems = new Object();
        for (const item of items) {
            if (storageItems.hasOwnProperty(item.itemId)) {
                storageItems[item.itemId] += item.quantity;
            }
            else {
                storageItems[item.itemId] = item.quantity;
            }
        }

        for (const [id, quantity] of Object.entries(storageItems)) {
            itemName += `\`${Client.client.items.getName(id)}\`\n`;
            itemQuantity += `\`${quantity}\`\n`;
        }

        if (itemName === '') itemName = Client.client.intlGet(guildId, 'empty');
        if (itemQuantity === '') itemQuantity = Client.client.intlGet(guildId, 'empty');

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: Constants.COLOR_DEFAULT,
            description: description,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [
                { name: Client.client.intlGet(guildId, 'item'), value: itemName, inline: true },
                { name: Client.client.intlGet(guildId, 'quantity'), value: itemQuantity, inline: true }
            ],
            timestamp: true
        });
    },

    getSmartSwitchGroupEmbed: function (guildId, serverId, groupId) {
        const instance = Client.client.getInstance(guildId);
        const group = instance.serverList[serverId].switchGroups[groupId];

        let switchName = '', switchId = '', switchActive = '';
        for (const groupSwitchId of group.switches) {
            if (instance.serverList[serverId].switches.hasOwnProperty(groupSwitchId)) {
                const sw = instance.serverList[serverId].switches[groupSwitchId];
                const active = sw.active;
                switchName += `${sw.name}${sw.location !== null ? ` ${sw.location}` : ''}\n`;
                switchId += `${groupSwitchId}\n`;
                if (sw.reachable) {
                    switchActive += `${(active) ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI}\n`;
                }
                else {
                    switchActive += `${Constants.NOT_FOUND_EMOJI}\n`;
                }
            }
            else {
                instance.serverList[serverId].switchGroups[groupId].switches =
                    instance.serverList[serverId].switchGroups[groupId].switches.filter(e => e !== groupSwitchId);
            }
        }
        Client.client.setInstance(guildId, instance);

        if (switchName === '') switchName = Client.client.intlGet(guildId, 'none');
        if (switchId === '') switchId = Client.client.intlGet(guildId, 'none');
        if (switchActive === '') switchActive = Client.client.intlGet(guildId, 'none');

        return module.exports.getEmbed({
            title: group.name,
            color: Constants.COLOR_DEFAULT,
            description: `**ID**: \`${groupId}\``,
            thumbnail: `attachment://${group.image}`,
            footer: { text: `${instance.serverList[serverId].title}` },
            fields: [
                {
                    name: Client.client.intlGet(guildId, 'customCommand'),
                    value: `\`${instance.generalSettings.prefix}${group.command}\``,
                    inline: false
                },
                { name: Client.client.intlGet(guildId, 'switches'), value: switchName, inline: true },
                { name: 'ID', value: switchId, inline: true },
                { name: Client.client.intlGet(guildId, 'status'), value: switchActive, inline: true }
            ],

            timestamp: true
        });
    },

    getNotFoundSmartDeviceEmbed: function (guildId, serverId, entityId, type) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId][type][entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: Constants.COLOR_INACTIVE,
            description: `**ID**: \`${entityId}\`\n` +
                `${Client.client.intlGet(guildId, 'statusNotFound')} ${Constants.NOT_FOUND_EMOJI}`,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` }
        });
    },

    getStorageMonitorRecycleEmbed: function (guildId, serverId, entityId, items) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        let itemName = '', itemQuantity = '';
        for (const item of items['recycler']) {
            itemName += `\`${Client.client.items.getName(item.itemId)}\`\n`;
            itemQuantity += `\`${item.quantity}\`\n`;
        }

        const embed = module.exports.getEmbed({
            title: `${Client.client.intlGet(guildId, 'resultRecycling')}:`,
            color: Constants.COLOR_DEFAULT,
            thumbnail: 'attachment://recycler.png',
            footer: { text: `${entity.server} | ${Client.client.intlGet(guildId, 'messageDeletedIn30')}` },
            description: `**${Client.client.intlGet(guildId, 'name')}** ` +
                `\`${entity.name}${grid}\`\n**ID** \`${entityId}\``
        });

        if (itemName === '') itemName = Client.client.intlGet(guildId, 'empty');
        if (itemQuantity === '') itemQuantity = Client.client.intlGet(guildId, 'empty');

        embed.addFields(
            { name: Client.client.intlGet(guildId, 'item'), value: itemName, inline: true },
            { name: Client.client.intlGet(guildId, 'quantity'), value: itemQuantity, inline: true }
        );

        return embed;
    },

    getDecayingNotificationEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'isDecaying', {
                device: `${entity.name}${grid}`
            }),
            color: Constants.COLOR_INACTIVE,
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getStorageMonitorDisconnectNotificationEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'isNoLongerConnected', {
                device: `${entity.name}${grid}`
            }),
            color: Constants.COLOR_INACTIVE,
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getStorageMonitorNotFoundEmbed: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        const entity = server.storageMonitors[entityId];
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discord_user_id);
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'smartDeviceNotFound', {
                device: `${entity.name}${grid}`,
                user: user.user.username
            }),
            color: Constants.COLOR_INACTIVE,
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getSmartSwitchNotFoundEmbed: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        const entity = instance.serverList[serverId].switches[entityId];
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discord_user_id);
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'smartDeviceNotFound', {
                device: `${entity.name}${grid}`,
                user: user.user.username
            }),
            color: Constants.COLOR_INACTIVE,
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getSmartAlarmNotFoundEmbed: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        const entity = server.alarms[entityId];
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discord_user_id);
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'smartDeviceNotFound', {
                device: `${entity.name}${grid}`,
                user: user.user.username
            }),
            color: Constants.COLOR_INACTIVE,
            description: `**ID** \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            timestamp: true
        });
    },

    getNewsEmbed: function (guildId, data) {
        return module.exports.getEmbed({
            title: `${Client.client.intlGet(guildId, 'newsCap')}: ${data.title}`,
            color: Constants.COLOR_DEFAULT,
            description: `${data.message}`,
            thumbnail: Constants.DEFAULT_SERVER_IMG,
            timestamp: true
        });
    },

    getTeamLoginEmbed: function (guildId, body, png) {
        return module.exports.getEmbed({
            color: Constants.COLOR_ACTIVE,
            timestamp: true,
            footer: { text: body.name },
            author: {
                name: Client.client.intlGet(guildId, 'userJustConnected', { name: body.targetName }),
                iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                url: `${Constants.STEAM_PROFILES_URL}${body.targetId}`
            }
        });
    },

    getPlayerDeathEmbed: function (data, body, png) {
        return module.exports.getEmbed({
            color: Constants.COLOR_INACTIVE,
            thumbnail: png,
            title: data.title,
            timestamp: true,
            footer: { text: body.name },
            url: body.targetId !== '' ? `${Constants.STEAM_PROFILES_URL}${body.targetId}` : ''
        });
    },

    getAlarmRaidAlarmEmbed: function (data, body) {
        return module.exports.getEmbed({
            color: Constants.COLOR_ACTIVE,
            timestamp: true,
            footer: { text: body.name },
            title: data.title,
            description: data.message,
            thumbnail: body.img !== '' ? body.img : 'attachment://rocket.png'
        });
    },

    getAlarmEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            thumbnail: `attachment://${entity.image}`,
            title: `${entity.name}${grid}`,
            footer: { text: entity.server },
            timestamp: true,
            fields: [
                { name: 'ID', value: `\`${entityId}\``, inline: true },
                { name: Client.client.intlGet(guildId, 'message'), value: `\`${entity.message}\``, inline: true }]
        });

    },

    getEventEmbed: function (guildId, serverId, text, image, color = Constants.COLOR_DEFAULT) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: color,
            thumbnail: `attachment://${image}`,
            title: text,
            footer: { text: server.title, iconURL: server.img },
            timestamp: true
        });
    },

    getActionInfoEmbed: function (color, str, footer = null, ephemeral = true) {
        return {
            embeds: [module.exports.getEmbed({
                color: color === 0 ? Constants.COLOR_DEFAULT : Constants.COLOR_INACTIVE,
                description: `\`\`\`diff\n${(color === 0) ? '+' : '-'} ${str}\n\`\`\``,
                footer: footer !== null ? { text: footer } : null
            })],
            ephemeral: ephemeral
        };
    },

    getServerChangedStateEmbed: function (guildId, serverId, state) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: state ? Constants.COLOR_INACTIVE : Constants.COLOR_ACTIVE,
            title: state ?
                Client.client.intlGet(guildId, 'serverJustOffline') :
                Client.client.intlGet(guildId, 'serverJustOnline'),
            thumbnail: server.img,
            timestamp: true,
            footer: { text: server.title }
        });
    },

    getServerWipeDetectedEmbed: function (guildId, serverId) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            title: Client.client.intlGet(guildId, 'wipeDetected'),
            image: `attachment://${guildId}_map_full.png`,
            timestamp: true,
            footer: { text: server.title }
        });
    },

    getServerConnectionInvalidEmbed: function (guildId, serverId) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: Constants.COLOR_INACTIVE,
            title: Client.client.intlGet(guildId, 'serverInvalid'),
            thumbnail: server.img,
            timestamp: true,
            footer: { text: server.title }
        });
    },

    getActivityNotificationEmbed: function (guildId, serverId, color, text, steamId, png, title = null) {
        const instance = Client.client.getInstance(guildId);
        const footerTitle = title !== null ? title : instance.serverList[serverId].title;
        return module.exports.getEmbed({
            color: color,
            timestamp: true,
            footer: { text: footerTitle },
            author: {
                name: text,
                iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                url: `${Constants.STEAM_PROFILES_URL}${steamId}`
            }
        });
    },

    getUpdateServerInformationEmbed: function (rustplus) {
        const guildId = rustplus.guildId;
        const instance = Client.client.getInstance(guildId);

        const time = rustplus.getCommandTime(true);
        const timeLeftTitle = Client.client.intlGet(rustplus.guildId, 'timeTill', {
            event: rustplus.time.isDay() ? Constants.NIGHT_EMOJI : Constants.DAY_EMOJI
        });
        const playersFieldName = Client.client.intlGet(guildId, 'players');
        const timeFieldName = Client.client.intlGet(guildId, 'time');
        const wipeFieldName = Client.client.intlGet(guildId, 'wipe');
        const mapSizeFieldName = Client.client.intlGet(guildId, 'mapSize');
        const mapSeedFieldName = Client.client.intlGet(guildId, 'mapSeed');
        const mapSaltFieldName = Client.client.intlGet(guildId, 'mapSalt');
        const mapFieldName = Client.client.intlGet(guildId, 'map');

        const embed = module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'serverInfo'),
            color: Constants.COLOR_DEFAULT,
            thumbnail: 'attachment://server_info_logo.png',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: playersFieldName, value: `\`${rustplus.getCommandPop(true)}\``, inline: true },
                { name: timeFieldName, value: `\`${time[0]}\``, inline: true },
                { name: wipeFieldName, value: `\`${rustplus.getCommandWipe(true)}\``, inline: true }],
            timestamp: true
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
            { name: mapSizeFieldName, value: `\`${rustplus.info.mapSize}\``, inline: true },
            { name: mapSeedFieldName, value: `\`${rustplus.info.seed}\``, inline: true },
            { name: mapSaltFieldName, value: `\`${rustplus.info.salt}\``, inline: true },
            { name: mapFieldName, value: `\`${rustplus.info.map}\``, inline: true });

        if (instance.serverList[rustplus.serverId].connect !== null) {
            embed.addFields({
                name: Client.client.intlGet(guildId, 'connect'),
                value: `\`${instance.serverList[rustplus.serverId].connect}\``,
                inline: false
            });
        }

        return embed;
    },

    getUpdateEventInformationEmbed: function (rustplus) {
        const guildId = rustplus.guildId;
        const instance = Client.client.getInstance(guildId);

        const cargoshipFieldName = Client.client.intlGet(guildId, 'cargoship');
        const patrolHelicopterFieldName = Client.client.intlGet(guildId, 'patrolHelicopter');
        const smallOilRigFieldName = Client.client.intlGet(guildId, 'smallOilRig');
        const largeOilRigFieldName = Client.client.intlGet(guildId, 'largeOilRig');
        const chinook47FieldName = Client.client.intlGet(guildId, 'chinook47');
        const travelingVendorFieldName = Client.client.intlGet(guildId, 'travelingVendor');

        const cargoShipMessage = rustplus.getCommandCargo(true);
        const patrolHelicopterMessage = rustplus.getCommandHeli(true);
        const smallOilMessage = rustplus.getCommandSmall(true);
        const largeOilMessage = rustplus.getCommandLarge(true);
        const ch47Message = rustplus.getCommandChinook(true);
        const travelingVendorMessage = rustplus.getCommandTravelingVendor(true);

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'eventInfo'),
            color: Constants.COLOR_DEFAULT,
            thumbnail: 'attachment://event_info_logo.png',
            description: Client.client.intlGet(guildId, 'inGameEventInfo'),
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: cargoshipFieldName, value: `\`${cargoShipMessage}\``, inline: true },
                { name: patrolHelicopterFieldName, value: `\`${patrolHelicopterMessage}\``, inline: true },
                { name: smallOilRigFieldName, value: `\`${smallOilMessage}\``, inline: true },
                { name: largeOilRigFieldName, value: `\`${largeOilMessage}\``, inline: true },
                { name: chinook47FieldName, value: `\`${ch47Message}\``, inline: true },
                { name: travelingVendorFieldName, value: `\`${travelingVendorMessage}\``, inline: true }],
            timestamp: true
        });
    },

    getUpdateTeamInformationEmbed: function (rustplus) {
        const guildId = rustplus.guildId;
        const instance = Client.client.getInstance(guildId);

        const title = Client.client.intlGet(guildId, 'teamMemberInfo');
        const teamMemberFieldName = Client.client.intlGet(guildId, 'teamMember');
        const statusFieldName = Client.client.intlGet(guildId, 'status');
        const locationFieldName = Client.client.intlGet(guildId, 'location');
        const footer = instance.serverList[rustplus.serverId].title;

        let totalCharacters = title.length + teamMemberFieldName.length + statusFieldName.length + locationFieldName.length + footer.length;
        let fieldIndex = 0;
        let teammateName = [''], teammateStatus = [''], teammateLocation = [''];
        let teammateNameCharacters = 0, teammateStatusCharacters = 0, teammateLocationCharacters = 0;
        for (const player of rustplus.team.players) {
            let name = player.name === '' ? '-' : `[${player.name}](${Constants.STEAM_PROFILES_URL}${player.steamId})`;
            name += (player.teamLeader) ? `${Constants.LEADER_EMOJI}\n` : '\n';
            let status = '';
            let location = (player.isOnline || player.isAlive) ? `${player.pos.string}\n` : '-\n';

            if (player.isOnline) {
                const isAfk = player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS;
                const afkTime = player.getAfkTime('dhs');

                status += (isAfk) ? Constants.AFK_EMOJI : Constants.ONLINE_EMOJI;
                status += (player.isAlive) ? ((isAfk) ? Constants.SLEEPING_EMOJI : Constants.ALIVE_EMOJI) :
                    Constants.DEAD_EMOJI;
                status += (Object.keys(instance.serverListLite[rustplus.serverId]).includes(player.steamId)) ?
                    Constants.PAIRED_EMOJI : '';
                status += (isAfk) ? ` ${afkTime}\n` : '\n';
            }
            else {
                const offlineTime = player.getOfflineTime('s');
                status += Constants.OFFLINE_EMOJI;
                status += (player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI;
                status += (Object.keys(instance.serverListLite[rustplus.serverId]).includes(player.steamId)) ?
                    Constants.PAIRED_EMOJI : '';
                status += (offlineTime !== null) ? offlineTime : '';
                status += '\n';
            }

            if (totalCharacters + (name.length + status.length + location.length) >=
                Constants.EMBED_MAX_TOTAL_CHARACTERS) {
                break;
            }

            if ((teammateNameCharacters + name.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
                (teammateStatusCharacters + status.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS ||
                (teammateLocationCharacters + location.length) > Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
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
                value: teammateName[i] !== '' ? teammateName[i] : Client.client.intlGet(guildId, 'empty'),
                inline: true
            });
            fields.push({
                name: i === 0 ? statusFieldName : '\u200B',
                value: teammateStatus[i] !== '' ? teammateStatus[i] : Client.client.intlGet(guildId, 'empty'),
                inline: true
            });
            fields.push({
                name: i === 0 ? locationFieldName : '\u200B',
                value: teammateLocation[i] !== '' ? teammateLocation[i] : Client.client.intlGet(guildId, 'empty'),
                inline: true
            });
        }

        return module.exports.getEmbed({
            title: title,
            color: Constants.COLOR_DEFAULT,
            thumbnail: 'attachment://team_info_logo.png',
            footer: { text: footer },
            fields: fields,
            timestamp: true
        });
    },

    getUpdateBattlemetricsOnlinePlayersInformationEmbed: function (rustplus, battlemetricsId) {
        const bmInstance = Client.client.battlemetricsInstances[battlemetricsId];
        const guildId = rustplus.guildId;

        const playerIds = bmInstance.getOnlinePlayerIdsOrderedByTime();

        let totalCharacters = 0;
        let fieldCharacters = 0;

        const title = Client.client.intlGet(guildId, 'battlemetricsOnlinePlayers');
        const footer = { text: bmInstance.server_name };

        totalCharacters += title.length;
        totalCharacters += bmInstance.server_name.length;
        totalCharacters += Client.client.intlGet(guildId, 'andMorePlayers', { number: 100 }).length;
        totalCharacters += `${Client.client.intlGet(guildId, 'players')}`.length;

        const fields = [''];
        let fieldIndex = 0;
        let isEmbedFull = false;
        let playerCounter = 0;
        for (const playerId of playerIds) {
            playerCounter += 1;

            const status = bmInstance.players[playerId]['status'];
            let time = status ? bmInstance.getOnlineTime(playerId) : bmInstance.getOfflineTime(playerId);
            time = time !== null ? time[1] : '';

            let playerStr = status ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;
            playerStr += ` [${time}] `;

            const nameMaxLength = Constants.EMBED_FIELD_MAX_WIDTH_LENGTH_3 - (3 + time.length);

            let name = bmInstance.players[playerId]['name'].replace('[', '(').replace(']', ')');
            name = name.length <= nameMaxLength ? name : name.substring(0, nameMaxLength - 2) + '..';

            playerStr += `[${name}](${Constants.BATTLEMETRICS_PROFILE_URL + `${playerId}`})\n`;

            if (totalCharacters + playerStr.length >= Constants.EMBED_MAX_TOTAL_CHARACTERS) {
                isEmbedFull = true;
                break;
            }

            if (fieldCharacters + playerStr.length >= Constants.EMBED_MAX_FIELD_VALUE_CHARACTERS) {
                fieldCharacters = 0;
                fieldIndex += 1;
                fields.push('');
            }

            fields[fieldIndex] += playerStr;
            totalCharacters += playerStr.length;
            fieldCharacters += playerStr.length;
        }

        const embed = module.exports.getEmbed({
            title: title,
            color: Constants.COLOR_DEFAULT,
            footer: footer,
            timestamp: true
        });

        if (isEmbedFull) {
            embed.setDescription(Client.client.intlGet(guildId, 'andMorePlayers', {
                number: playerIds.length - playerCounter
            }));
        }

        let fieldCounter = 0;
        for (const field of fields) {
            embed.addFields({
                name: fieldCounter === 0 ? Client.client.intlGet(guildId, 'players') : '\u200B',
                value: field === '' ? '\u200B' : field,
                inline: true
            });
            fieldCounter += 1;
        }

        return embed;
    },

    getDiscordCommandResponseEmbed: function (rustplus, response) {
        const instance = Client.client.getInstance(rustplus.guildId);

        let string = '';
        if (Array.isArray(response)) {
            for (const str of response) {
                string += `${str}\n`;
            }
        }
        else {
            string = response;
        }

        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            description: `**${string}**`,
            footer: { text: `${instance.serverList[rustplus.serverId].title}` }
        });
    },

    getCredentialsShowEmbed: async function (guildId) {
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        let names = '';
        let steamIds = '';
        let hoster = '';

        for (const credential in credentials) {
            if (credential === 'hoster') continue;

            const user = await DiscordTools.getUserById(guildId, credentials[credential].discord_user_id);
            names += `${user.user.username}\n`;
            steamIds += `${credential}\n`;
            hoster += `${credential === credentials.hoster ? `${Constants.LEADER_EMOJI}\n` : '\u200B\n'}`;
        }

        if (names === '') names = Client.client.intlGet(guildId, 'empty');
        if (steamIds === '') steamIds = Client.client.intlGet(guildId, 'empty');
        if (hoster === '') hoster = Client.client.intlGet(guildId, 'empty');

        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            title: Client.client.intlGet(guildId, 'fcmCredentials'),
            fields: [
                { name: Client.client.intlGet(guildId, 'name'), value: names, inline: true },
                { name: 'SteamID', value: steamIds, inline: true },
                { name: Client.client.intlGet(guildId, 'hoster'), value: hoster, inline: true }]
        });
    },

    getItemAvailableVendingMachineEmbed: function (guildId, serverId, str) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            footer: { text: server.title },
            author: {
                name: str
            }
        });
    },

    getUserSendEmbed: function (guildId, serverId, sender, str) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            footer: { text: server.title },
            description: `**${sender}**: ${str}`
        });
    },

    getHelpEmbed: function (guildId) {
        const repository = 'https://github.com/alexemanuelol/rustplusplus';
        const credentials = `${repository}/blob/master/docs/credentials.md`;
        const pairServer = `${repository}/blob/master/docs/pair_and_connect_to_server.md`;
        const commands = `${repository}/blob/master/docs/commands.md`;

        const description =
            `→ [${Client.client.intlGet(guildId, 'commandsHelpHowToCredentials')}](${credentials})\n` +
            `→ [${Client.client.intlGet(guildId, 'commandsHelpHowToPairServer')}](${pairServer})\n` +
            `→ [${Client.client.intlGet(guildId, 'commandsHelpCommandList')}](${commands})`;

        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            title: `rustplusplus Help`,
            description: description
        });
    },

    getCctvEmbed: function (guildId, monument, cctvCodes, dynamic) {
        let code = '';
        for (const cctvCode of cctvCodes) {
            code += `${cctvCode} \n`;
        }
        if (dynamic) {
            code += Client.client.intlGet(guildId, 'asteriskCctvDesc');
        }
        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            title: `${monument} CCTV ${Client.client.intlGet(guildId, 'codes')}`,
            description: code
        });
    },

    getUptimeEmbed: function (guildId, uptime) {
        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            title: uptime
        });
    },

    getVoiceEmbed: function (guildId, state) {
        return module.exports.getEmbed({
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            title: state
        });
    },

    getCraftEmbed: function (guildId, craftDetails, quantity) {
        let title = '';
        let description = '';

        if (quantity === 1) {
            title = `${craftDetails[1].name}`;
            description += `__**${Client.client.intlGet(guildId, 'time')}:**__ ${craftDetails[2].timeString}`;
        }
        else {
            title = `${craftDetails[1].name} x${quantity}`;
            const time = Timer.secondsToFullScale(craftDetails[2].time * quantity, '', true);
            description += `__**${Client.client.intlGet(guildId, 'time')}:**__ ${time}`;
        }

        let items = '', quantities = '';
        for (const item of craftDetails[2].ingredients) {
            const itemName = Client.client.items.getName(item.id);
            items += `${itemName}\n`;
            quantities += `${item.quantity * quantity}\n`;
        }

        return module.exports.getEmbed({
            title: title,
            description: description,
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            fields: [
                { name: Client.client.intlGet(guildId, 'quantity'), value: items, inline: true },
                { name: Client.client.intlGet(guildId, 'hoster'), value: quantities, inline: true }]
        });
    },

    getResearchEmbed: function (guildId, researchDetails) {
        let typeString = '', scrapString = '';
        if (researchDetails[2].researchTable !== null) {
            typeString += `${Client.client.intlGet(guildId, 'researchTable')}\n`;
            scrapString += `${researchDetails[2].researchTable}\n`;
        }
        if (researchDetails[2].workbench !== null) {
            typeString += `${Client.client.items.getName(researchDetails[2].workbench.type)}\n`;
            const scrap = researchDetails[2].workbench.scrap;
            const totalScrap = researchDetails[2].workbench.totalScrap;
            scrapString += `${scrap} (${Client.client.intlGet(guildId, 'total')} ${totalScrap})`;
        }

        return module.exports.getEmbed({
            title: `${researchDetails[1].name}`,
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            fields: [
                { name: Client.client.intlGet(guildId, 'type'), value: typeString, inline: true },
                { name: Client.client.intlGet(guildId, 'scrap'), value: scrapString, inline: true }]
        });
    },

    getRecycleEmbed: function (guildId, recycleDetails, quantity, recyclerType) {
        let title = quantity === 1 ? `${recycleDetails[1].name}` : `${recycleDetails[1].name} x${quantity}`;
        title += ` (${Client.client.intlGet(guildId, recyclerType)})`;

        const recycleData = Client.client.rustlabs.getRecycleDataFromArray([
            { itemId: recycleDetails[0], quantity: quantity, itemIsBlueprint: false }
        ]);

        let items0 = '', quantities0 = '';
        for (const item of recycleDetails[2][recyclerType]['yield']) {
            items0 += `${Client.client.items.getName(item.id)}\n`;
            quantities0 += (item.probability !== 1) ? `${parseInt(item.probability * 100)}%\n` : `${item.quantity}\n`;
        }

        let items1 = '', quantities1 = '';
        for (const item of recycleData[recyclerType]) {
            items1 += `${Client.client.items.getName(item.itemId)}\n`;
            quantities1 += `${item.quantity}\n`;
        }

        return module.exports.getEmbed({
            title: title,
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            fields: [
                { name: Client.client.intlGet(guildId, 'yield'), value: items0, inline: true },
                { name: '\u200B', value: quantities0, inline: true },
                { name: '\u200B', value: '\u200B', inline: false },
                { name: Client.client.intlGet(guildId, 'calculated'), value: items1, inline: true },
                { name: '\u200B', value: quantities1, inline: true }]
        });
    },

    getBattlemetricsEventEmbed: function (guildId, battlemetricsId, title, description, fields = null) {
        const instance = Client.client.getInstance(guildId);
        const bmInstance = Client.client.battlemetricsInstances[battlemetricsId];

        const serverId = `${bmInstance.server_ip}-${bmInstance.server_port}`;

        let thumbnail = '';
        if (instance.serverList.hasOwnProperty(serverId)) {
            thumbnail = instance.serverList[serverId].img
        }
        const embed = module.exports.getEmbed({
            title: title,
            color: Constants.COLOR_DEFAULT,
            timestamp: true,
            thumbnail: thumbnail,
            footer: { text: bmInstance.server_name }
        });

        if (fields !== null) {
            embed.addFields(fields);
        }

        if (description !== '') {
            embed.setDescription(description);
        }

        return embed;
    },

    getItemEmbed: function (guildId, itemName, itemId, type) {
        const title = `${itemName} (${itemId})`;

        const fields = [];
        const embed = module.exports.getEmbed({
            title: title,
            color: Constants.COLOR_DEFAULT,
            timestamp: true
        });

        const decayDetails = type === 'items' ? Client.client.rustlabs.getDecayDetailsById(itemId) :
            Client.client.rustlabs.getDecayDetailsByName(itemId);
        if (decayDetails !== null) {
            const details = decayDetails[3];
            const hp = details.hpString;
            if (hp !== null) {
                fields.push({
                    name: Client.client.intlGet(guildId, 'hp'),
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
                decayString += `${Client.client.intlGet(guildId, 'outside')}: ${decayOutside}\n`;
            }

            const decayInside = details.decayInsideString;
            if (decayInside !== null) {
                decayString += `${Client.client.intlGet(guildId, 'inside')}: ${decayInside}\n`;
            }

            const decayUnderwater = details.decayUnderwaterString;
            if (decayUnderwater !== null) {
                decayString += `${Client.client.intlGet(guildId, 'underwater')}: ${decayUnderwater}\n`;
            }

            if (decayString !== '') {
                fields.push({
                    name: Client.client.intlGet(guildId, 'decay'),
                    value: decayString,
                    inline: true
                });
            }
        }

        const despawnDetails = type === 'items' ? Client.client.rustlabs.getDespawnDetailsById(itemId) : null;
        if (despawnDetails !== null) {
            const details = despawnDetails[2];
            fields.push({
                name: Client.client.intlGet(guildId, 'despawnTime'),
                value: details.timeString,
                inline: true
            });
        }

        const stackDetails = type === 'items' ? Client.client.rustlabs.getStackDetailsById(itemId) : null;
        if (stackDetails !== null) {
            const details = stackDetails[2];
            fields.push({
                name: Client.client.intlGet(guildId, 'stackSize'),
                value: details.quantity,
                inline: true
            });
        }


        const upkeepDetails = type === 'items' ? Client.client.rustlabs.getUpkeepDetailsById(itemId) :
            Client.client.rustlabs.getUpkeepDetailsByName(itemId);
        if (upkeepDetails !== null) {
            const details = upkeepDetails[3];

            let upkeepString = '';
            for (const item of details) {
                const name = Client.client.items.getName(item.id);
                const quantity = item.quantity;
                upkeepString += `${quantity} ${name}\n`;
            }

            fields.push({
                name: Client.client.intlGet(guildId, 'upkeep'),
                value: upkeepString,
                inline: true
            });
        }

        const craftDetails = type === 'items' ? Client.client.rustlabs.getCraftDetailsById(itemId) : null;
        if (craftDetails !== null) {
            const details = craftDetails[2];
            let workbenchString = '';
            if (details.workbench !== null) {
                const workbenchShortname = Client.client.items.getShortName(details.workbench);
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
                const name = Client.client.items.getName(ingredient.id);
                craftString += `${amount} ${name}\n`;
            }

            if (craftString !== '') {
                fields.push({
                    name: Client.client.intlGet(guildId, 'craft') + workbenchString,
                    value: craftString,
                    inline: true
                });
            }
        }

        const recycleDetails = type === 'items' ? Client.client.rustlabs.getRecycleDetailsById(itemId) : null;
        if (recycleDetails !== null) {
            const details = recycleDetails[2]['recycler']['yield'];

            let recycleString = '';
            for (const recycleItem of details) {
                const name = Client.client.items.getName(recycleItem.id);
                const quantityProbability = recycleItem.probability !== 1 ?
                    `${parseInt(recycleItem.probability * 100)}%` :
                    `${recycleItem.quantity}x`;
                recycleString += `${quantityProbability} ${name}\n`;
            }

            if (recycleString !== '') {
                fields.push({
                    name: Client.client.intlGet(guildId, 'recycle'),
                    value: recycleString,
                    inline: true
                });
            }
        }

        const researchDetails = type === 'items' ? Client.client.rustlabs.getResearchDetailsById(itemId) : null;
        if (researchDetails !== null) {
            const details = researchDetails[2];
            let workbenchString = '';
            if (details.workbench !== null) {
                const workbenchShortname = Client.client.items.getShortName(details.workbench.type);
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
                researchTableString = `${Client.client.intlGet(guildId, 'researchTable')}: ${details.researchTable}\n`;
            }

            const researchString = `${workbenchString}${researchTableString}`;

            if (researchString !== '') {
                fields.push({
                    name: Client.client.intlGet(guildId, 'research'),
                    value: researchString,
                    inline: true
                });
            }
        }

        if (fields.length !== 0) {
            embed.setFields(...fields);
        }

        return embed;
    },
}