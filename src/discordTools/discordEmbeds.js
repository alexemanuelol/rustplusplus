const Discord = require('discord.js');

const Client = require('../../index.js');
const Constants = require('../util/constants.js');
const Timer = require('../util/timer');

function getEmbed(options) {
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
}

module.exports = {
    getSmartSwitchEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        const sw = instance.switches[id];
        return getEmbed({
            title: `${sw.name}`,
            color: sw.active ? '#00ff40' : '#ff0040',
            description: `**ID**: \`${id}\``,
            thumbnail: `attachment://${sw.image}`,
            footer: { text: `${sw.server}` },
            fields: [
                { name: 'Custom Command', value: `\`${instance.generalSettings.prefix}${sw.command}\``, inline: true }]
        });
    },

    getServerEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        const server = instance.serverList[id];
        return getEmbed({
            title: `${server.title}`,
            color: '#ce412b',
            description: `${server.description}`,
            thumbnail: `${server.img}`,
            fields: [{
                name: 'Connect',
                value: `\`${server.connect === null ? 'Unavailable' : server.connect}\``,
                inline: true
            }]
        });
    },

    getTrackerEmbed: function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);
        const tracker = instance.trackers[trackerName];
        const battlemetricsId = tracker.battlemetricsId;
        const serverStatus = tracker.status ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;

        let playerName = '';
        let playerSteamId = '';
        let playerStatus = '';
        for (let player of tracker.players) {
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

        if (playerName === '') playerName = 'Empty';
        if (playerSteamId === '') playerSteamId = 'Empty';
        if (playerStatus === '') playerStatus = 'Empty';

        return getEmbed({
            title: `${trackerName}`,
            color: '#ce412b',
            description: `**Battlemetrics ID:** \`${battlemetricsId}\`\n**Server Status:** ${serverStatus}`,
            thumbnail: `${tracker.img}`,
            fields: [
                { name: 'Name', value: playerName, inline: true },
                { name: 'SteamID', value: playerSteamId, inline: true },
                { name: 'Status', value: playerStatus, inline: true }]
        });
    },

    getSmartAlarmEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        return getEmbed({
            title: `${instance.alarms[id].name}`,
            color: instance.alarms[id].active ? '#00ff40' : '#ce412b',
            description: `**ID**: \`${id}\``,
            thumbnail: `attachment://${instance.alarms[id].image}`,
            footer: { text: `${instance.alarms[id].server}` },
            fields: [
                { name: 'Message', value: `\`${instance.alarms[id].message}\``, inline: true }
            ]
        });
    },

    getStorageMonitorEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let rustplus = Client.client.rustplusInstances[guildId];
        const isTc = (instance.storageMonitors[id].type === 'toolcupboard');
        const items = rustplus.storageMonitors[id].items;
        const expiry = rustplus.storageMonitors[id].expiry;
        const capacity = rustplus.storageMonitors[id].capacity;

        let description = `**ID** \`${id}\``;

        if (capacity === 0) {
            return getEmbed({
                title: `${instance.storageMonitors[id].name}`,
                color: '#ce412b',
                description: `${description}\n**STATUS** \`NOT ELECTRICALLY CONNECTED!\``,
                thumbnail: `attachment://${instance.storageMonitors[id].image}`,
                footer: { text: `${instance.storageMonitors[id].server}` }
            });
        }

        description += `\n**Type** \`${(isTc) ? 'Tool Cupboard' : 'Container'}\``;

        if (isTc) {
            let seconds = 0;
            if (expiry !== 0) {
                seconds = (new Date(expiry * 1000) - new Date()) / 1000;
            }

            let upkeep = null;
            if (seconds === 0) {
                upkeep = ':warning:\`DECAYING\`:warning:';
                instance.storageMonitors[id].upkeep = 'DECAYING';
            }
            else {
                let upkeepTime = Timer.secondsToFullScale(seconds);
                upkeep = `\`${upkeepTime}\``;
                instance.storageMonitors[id].upkeep = `${upkeepTime}`;
            }
            description += `\n**Upkeep** ${upkeep}`;
            Client.client.writeInstanceFile(guildId, instance);
        }

        let itemName = '';
        let itemQuantity = '';
        let storageItems = new Object();
        for (let item of items) {
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

        if (itemName === '') itemName = 'Empty';
        if (itemQuantity === '') itemQuantity = 'Empty';

        return getEmbed({
            title: `${instance.storageMonitors[id].name}`,
            color: '#ce412b',
            description: description,
            thumbnail: `attachment://${instance.storageMonitors[id].image}`,
            footer: { text: `${instance.storageMonitors[id].server}` },
            fields: [
                { name: 'Item', value: itemName, inline: true },
                { name: 'Quantity', value: itemQuantity, inline: true }
            ]
        });
    },

    getSmartSwitchGroupEmbed: function (guildId, name) {
        const instance = Client.client.readInstanceFile(guildId);
        let rustplus = Client.client.rustplusInstances[guildId];
        let group = instance.serverList[rustplus.serverId].switchGroups[name];

        let switchName = '';
        let switchId = '';
        let switchActive = '';
        for (let groupSwitchId of group.switches) {
            if (instance.switches.hasOwnProperty(groupSwitchId)) {
                let active = instance.switches[groupSwitchId].active;
                switchName += `${instance.switches[groupSwitchId].name}\n`;
                switchId += `${groupSwitchId}\n`;
                if (instance.switches[groupSwitchId].reachable) {
                    switchActive += `${(active) ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI}\n`;
                }
                else {
                    switchActive += `${Constants.NOT_FOUND_EMOJI}\n`;
                }
            }
            else {
                instance.serverList[rustplus.serverId].switchGroups[name].switches =
                    instance.serverList[rustplus.serverId].switchGroups[name].switches.filter(e => e !== groupSwitchId);
            }
        }
        Client.client.writeInstanceFile(guildId, instance);

        if (switchName === '') switchName = 'None';
        if (switchId === '') switchId = 'None';
        if (switchActive === '') switchActive = 'None';

        return getEmbed({
            title: name,
            color: '#ce412b',
            thumbnail: 'attachment://smart_switch.png',
            footer: { text: `${instance.serverList[rustplus.serverId].title}` },
            fields: [
                {
                    name: 'Custom Command',
                    value: `\`${instance.generalSettings.prefix}${group.command}\``,
                    inline: false
                },
                { name: 'Switches', value: switchName, inline: true },
                { name: 'ID', value: switchId, inline: true },
                { name: 'Active', value: switchActive, inline: true }
            ]
        });
    },

    getNotFoundSmartDeviceEmbed: function (guildId, id, type) {
        const instance = Client.client.readInstanceFile(guildId);
        return getEmbed({
            title: `${instance[type][id].name}`,
            color: '#ff0040',
            description: `**ID**: \`${id}\`\n**STATUS**: NOT FOUND ${Constants.NOT_FOUND_EMOJI}`,
            thumbnail: `attachment://${instance[type][id].image}`,
            footer: { text: `${instance[type][id].server}` }
        });
    },
}