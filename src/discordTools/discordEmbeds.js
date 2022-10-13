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
            color: entity.active ? '#00ff40' : '#ff0040',
            description: `**ID**: \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: Client.client.intlGet(guildId, 'customCommand'),
                value: `\`${instance.generalSettings.prefix}${entity.command}\``,
                inline: true
            }]
        });
    },

    getServerEmbed: async function (guildId, serverId) {
        const instance = Client.client.getInstance(guildId);
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        const server = instance.serverList[serverId];
        const hoster = await DiscordTools.getUserById(guildId, credentials[server.steamId].discordUserId);

        return module.exports.getEmbed({
            title: `${server.title}`,
            color: '#ce412b',
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
                value: `\`${hoster.user.username} (${server.steamId})\``,
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

        if (playerName === '') playerName = Client.client.intlGet(guildId, 'empty');
        if (playerSteamId === '') playerSteamId = Client.client.intlGet(guildId, 'empty');
        if (playerStatus === '') playerStatus = Client.client.intlGet(guildId, 'empty');

        return module.exports.getEmbed({
            title: `${tracker.name}`,
            color: '#ce412b',
            description: `**Battlemetrics ID:** \`${tracker.battlemetricsId}\`\n` +
                `${Client.client.intlGet(guildId, 'serverStatus', { status: serverStatus })}`,
            thumbnail: `${tracker.img}`,
            fields: [
                { name: Client.client.intlGet(guildId, 'name'), value: playerName, inline: true },
                { name: 'SteamID', value: playerSteamId, inline: true },
                { name: Client.client.intlGet(guildId, 'status'), value: playerStatus, inline: true }]
        });
    },

    getSmartAlarmEmbed: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: entity.active ? '#00ff40' : '#ce412b',
            description: `**ID**: \`${entityId}\``,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [{
                name: Client.client.intlGet(guildId, 'message'),
                value: `\`${entity.message}\``,
                inline: true
            }]
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
                color: '#ce412b',
                description: `${description}\n${Client.client.intlGet(guildId, 'statusNotConnectedToServer')}`,
                thumbnail: `attachment://${entity.image}`,
                footer: { text: `${entity.server}` }
            });
        }

        if (rustplus && rustplus.storageMonitors[entityId].capacity === 0) {
            return module.exports.getEmbed({
                title: `${entity.name}${grid}`,
                color: '#ce412b',
                description:
                    `${description}\n${Client.client.intlGet(guildId, 'statusNotElectronicallyConnected')}`,
                thumbnail: `attachment://${entity.image}`,
                footer: { text: `${entity.server}` }
            });
        }

        description += `\n**${Client.client.intlGet(guildId, 'type')}** \`${(entity.type === 'toolcupboard') ?
            Client.client.intlGet(guildId, 'toolCupboard') :
            Client.client.intlGet(guildId, 'container')}\``;

        const items = rustplus.storageMonitors[entityId].items;
        const expiry = rustplus.storageMonitors[entityId].expiry;

        if (entity.type === 'toolcupboard') {
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
            color: '#ce412b',
            description: description,
            thumbnail: `attachment://${entity.image}`,
            footer: { text: `${entity.server}` },
            fields: [
                { name: Client.client.intlGet(guildId, 'item'), value: itemName, inline: true },
                { name: Client.client.intlGet(guildId, 'quantity'), value: itemQuantity, inline: true }
            ]
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
            color: '#ce412b',
            thumbnail: 'attachment://smart_switch.png',
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
            ]
        });
    },

    getNotFoundSmartDeviceEmbed: function (guildId, serverId, entityId, type) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId][type][entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        return module.exports.getEmbed({
            title: `${entity.name}${grid}`,
            color: '#ff0040',
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
            color: '#ce412b',
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
            color: '#ff0040',
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
            color: '#ff0040',
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
            color: '#ff0040',
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
            color: '#ff0040',
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
            color: '#ff0040',
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
            color: '#ff0040',
            thumbnail: `${instance.serverList[tracker.serverId].img}`,
            footer: { text: `${instance.serverList[tracker.serverId].title}` },
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
            color: '#00ff40',
            thumbnail: `${instance.serverList[tracker.serverId].img}`,
            footer: { text: `${instance.serverList[tracker.serverId].title}` },
            timestamp: true
        });
    },

    getNewsEmbed: function (data) {
        return module.exports.getEmbed({
            title: `${Client.client.intlGet(guildId, 'newsCap')}: ${data.title}`,
            color: '#ce412b',
            description: `${data.message}`,
            thumbnail: Constants.DEFAULT_SERVER_IMG,
            timestamp: true
        });
    },

    getTeamLoginEmbed: function (guildId, body, png) {
        return module.exports.getEmbed({
            color: '#00ff40',
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
            color: '#ff0040',
            thumbnail: png,
            title: data.title,
            timestamp: true,
            footer: { text: body.name },
            url: body.targetId !== '' ? `${Constants.STEAM_PROFILES_URL}${body.targetId}` : ''
        });
    },

    getAlarmRaidAlarmEmbed: function (data, body) {
        return module.exports.getEmbed({
            color: '#00ff40',
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
            color: '#ce412b',
            thumbnail: `attachment://${entity.image}`,
            title: `${entity.name}${grid}`,
            footer: { text: entity.server },
            timestamp: true,
            fields: [
                { name: 'ID', value: `\`${entityId}\``, inline: true },
                { name: Client.client.intlGet(guildId, 'message'), value: `\`${entity.message}\``, inline: true }]
        });

    },

    getEventEmbed: function (guildId, serverId, text, image) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
        return module.exports.getEmbed({
            color: '#ce412b',
            thumbnail: `attachment://${image}`,
            title: text,
            footer: { text: server.title },
            timestamp: true
        });
    },

    getActionInfoEmbed: function (color, str, footer = null, ephemeral = true) {
        return {
            embeds: [module.exports.getEmbed({
                color: color === 0 ? '#ce412b' : '#ff0040',
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
            color: state ? '#ff0040' : '#00ff40',
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
            color: '#ce412b',
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
            color: '#ff0040',
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
            color: '#ce412b',
            thumbnail: 'attachment://server_info_logo.png',
            description: rustplus.info.name,
            fields: [
                { name: playersFieldName, value: `\`${rustplus.getCommandPop(true)}\``, inline: true },
                { name: timeFieldName, value: `\`${time[0]}\``, inline: true },
                { name: wipeFieldName, value: `\`${rustplus.getCommandWipe(true)}\``, inline: true }]
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
        const bradleyAPCFieldName = Client.client.intlGet(guildId, 'bradleyApc');
        const smallOilRigFieldName = Client.client.intlGet(guildId, 'smallOilRig');
        const largeOilRigFieldName = Client.client.intlGet(guildId, 'largeOilRig');
        const chinook47FieldName = Client.client.intlGet(guildId, 'chinook47');
        const crateFieldName = Client.client.intlGet(guildId, 'crate');

        const cargoShipMessage = rustplus.getCommandCargo(true);
        const patrolHelicopterMessage = rustplus.getCommandHeli(true);
        const bradleyAPCMessage = rustplus.getCommandBradley(true);
        const smallOilMessage = rustplus.getCommandSmall(true);
        const largeOilMessage = rustplus.getCommandLarge(true);
        const ch47Message = rustplus.getCommandChinook(true);
        const crateMessage = rustplus.getCommandCrate(true);

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'eventInfo'),
            color: '#ce412b',
            thumbnail: 'attachment://event_info_logo.png',
            description: Client.client.intlGet(guildId, 'inGameEventInfo'),
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: cargoshipFieldName, value: `\`${cargoShipMessage}\``, inline: true },
                { name: patrolHelicopterFieldName, value: `\`${patrolHelicopterMessage}\``, inline: true },
                { name: bradleyAPCFieldName, value: `\`${bradleyAPCMessage}\``, inline: true },
                { name: smallOilRigFieldName, value: `\`${smallOilMessage}\``, inline: true },
                { name: largeOilRigFieldName, value: `\`${largeOilMessage}\``, inline: true },
                { name: chinook47FieldName, value: `\`${ch47Message}\``, inline: true },
                { name: crateFieldName, value: `\`${crateMessage}\``, inline: true }]
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
            if (rustplus.team.teamSize < 12) {
                names += `[${player.name}](${Constants.STEAM_PROFILES_URL}${player.steamId})`;
            }
            else {
                names += `${player.name}`;
            }

            names += (player.teamLeader) ? `${Constants.LEADER_EMOJI}\n` : '\n';
            locations += (player.isOnline || player.isAlive) ? `${player.pos.string}\n` : '-\n';

            if (player.isOnline) {
                status += (player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS) ?
                    `${Constants.AFK_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI} ${player.getAfkTime('dhs')}\n` :
                    `${Constants.ONLINE_EMOJI}${(player.isAlive) ? Constants.ALIVE_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
            else {
                status += `${Constants.OFFLINE_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
        }

        return module.exports.getEmbed({
            title: Client.client.intlGet(guildId, 'teamMemberInfo'),
            color: '#ce412b',
            thumbnail: 'attachment://team_info_logo.png',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: teamMemberFieldName, value: names, inline: true },
                { name: statusFieldName, value: status, inline: true },
                { name: locationFieldName, value: locations, inline: true }]
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
            color: '#ce412b',
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
            color: '#ce412b',
            title: Client.client.intlGet(guildId, 'fcmCredentials'),
            fields: [
                { name: Client.client.intlGet(guildId, 'name'), value: names, inline: true },
                { name: 'SteamID', value: steamIds, inline: true },
                { name: Client.client.intlGet(guildId, 'hoster'), value: hoster, inline: true }]
        });
    },
}