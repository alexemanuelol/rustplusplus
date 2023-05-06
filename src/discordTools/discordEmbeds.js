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

        if (options.title) embed.setTitle(options.title);
        if (options.color) embed.setColor(options.color);
        if (options.description) embed.setDescription(options.description);
        if (options.thumbnail) embed.setThumbnail(options.thumbnail);
        if (options.image) embed.setImage(options.image);
        if (options.url) embed.setURL(options.url);
        if (options.author) embed.setAuthor(options.author);
        if (options.footer) embed.setFooter(options.footer);
        if (options.timestamp) embed.setTimestamp();
        if (options.fields) embed.setFields(...options.fields);

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
            hoster = await DiscordTools.getUserById(guildId, credentials[server.steamId].discordUserId);
            hoster = hoster.user.username;
        }

        return module.exports.getEmbed({
            title: `${server.title}`,
            color: Constants.COLOR_DEFAULT,
            description: `${server.description}`,
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
        const serverStatus = tracker.status ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;

        let playerName = '', playerSteamId = '', playerStatus = '';
        for (const player of tracker.players) {
            playerName += `${player.name}\n`;
            if (tracker.players.length < 12) {
                playerSteamId += `[${player.steamId}](${Constants.STEAM_PROFILES_URL}${player.steamId})\n`;
            }
            else {
                playerSteamId += `${player.steamId}\n`;
            }
            playerStatus += `${(player.status === true) ?
                `${Constants.ONLINE_EMOJI} [${player.time}]` : `${Constants.OFFLINE_EMOJI}`}\n`;
        }

        let nameChangeHistory = Client.client.intlGet(guildId, 'empty');
        if (tracker.nameChangeHistory.length !== 0) {
            nameChangeHistory = tracker.nameChangeHistory.join('\n');
        }

        if (playerName === '') playerName = Client.client.intlGet(guildId, 'empty');
        if (playerSteamId === '') playerSteamId = Client.client.intlGet(guildId, 'empty');
        if (playerStatus === '') playerStatus = Client.client.intlGet(guildId, 'empty');

        return module.exports.getEmbed({
            title: `${tracker.name}`,
            color: Constants.COLOR_DEFAULT,
            description: `**Battlemetrics ID:** \`${tracker.battlemetricsId}\`\n` +
                `${Client.client.intlGet(guildId, 'serverStatus', { status: serverStatus })}`,
            thumbnail: `${tracker.img}`,
            fields: [
                { name: Client.client.intlGet(guildId, 'name'), value: playerName, inline: true },
                { name: 'SteamID', value: playerSteamId, inline: true },
                { name: Client.client.intlGet(guildId, 'status'), value: playerStatus, inline: true },
                { name: Client.client.intlGet(guildId, 'nameChangeHistory'), value: nameChangeHistory }],
            timestamp: true
        });
    },

    getSmartAlarmEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: entity.active ? Constants.COLOR_ACTIVE : Constants.COLOR_DEFAULT,
            description: `**ID**: \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: Client.client.intlGet(guildId, 'message'),
                value: `\`${entity.message}\``,
                inline: true
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
                { name: Client.client.intlGet(guildId, 'active'), value: switchActive, inline: true }
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
        for (const item of items) {
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
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discordUserId);
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
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discordUserId);
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
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discordUserId);
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

    getTrackerAllOfflineEmbed: function (guildId, trackerId) {
        const instance = Client.client.getInstance(guildId);
        const tracker = instance.trackers[trackerId];

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'allJustOfflineTracker', {
                tracker: tracker.name
            }),
            color: Constants.COLOR_INACTIVE,
            thumbnail: `${instance.trackers[trackerId].img}`,
            footer: { text: `${instance.trackers[trackerId].title}` },
            timestamp: true
        });
    },

    getTrackerAnyOnlineEmbed: function (guildId, trackerId) {
        const instance = Client.client.getInstance(guildId);
        const tracker = instance.trackers[trackerId];

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'anyJustOnlineTracker', {
                tracker: tracker.name
            }),
            color: Constants.COLOR_ACTIVE,
            thumbnail: `${instance.trackers[trackerId].img}`,
            footer: { text: `${instance.trackers[trackerId].title}` },
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
            thumbnail: body.img
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

    getActivityNotificationEmbed: function (guildId, serverId, color, text, steamId, png) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: color,
            timestamp: true,
            footer: { text: server.title },
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
            description: rustplus.info.name,
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

        const cargoShipMessage = rustplus.getCommandCargo(true);
        const patrolHelicopterMessage = rustplus.getCommandHeli(true);
        const smallOilMessage = rustplus.getCommandSmall(true);
        const largeOilMessage = rustplus.getCommandLarge(true);
        const ch47Message = rustplus.getCommandChinook(true);

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
                { name: chinook47FieldName, value: `\`${ch47Message}\``, inline: true }],
            timestamp: true
        });
    },

    getUpdateTeamInformationEmbed: function (rustplus) {
        const guildId = rustplus.guildId;
        const instance = Client.client.getInstance(guildId);

        const teamMemberFieldName = Client.client.intlGet(guildId, 'teamMember');
        const statusFieldName = Client.client.intlGet(guildId, 'status');
        const locationFieldName = Client.client.intlGet(guildId, 'location');

        let names = '';
        let status = '';
        let locations = '';
        for (const player of rustplus.team.players) {
            names += (rustplus.team.teamSize < 12) ?
                `[${player.name}](${Constants.STEAM_PROFILES_URL}${player.steamId})` : player.name;

            names += (player.teamLeader) ? `${Constants.LEADER_EMOJI}\n` : '\n';
            locations += (player.isOnline || player.isAlive) ? `${player.pos.string}\n` : '-\n';

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
                status += Constants.OFFLINE_EMOJI;
                status += (player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI;
                status += (Object.keys(instance.serverListLite[rustplus.serverId]).includes(player.steamId)) ?
                    Constants.PAIRED_EMOJI : '';
                status += '\n';
            }
        }

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'teamMemberInfo'),
            color: Constants.COLOR_DEFAULT,
            thumbnail: 'attachment://team_info_logo.png',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: teamMemberFieldName, value: names, inline: true },
                { name: statusFieldName, value: status, inline: true },
                { name: locationFieldName, value: locations, inline: true }],
            timestamp: true
        });
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

            const user = await DiscordTools.getUserById(guildId, credentials[credential].discordUserId);
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
}