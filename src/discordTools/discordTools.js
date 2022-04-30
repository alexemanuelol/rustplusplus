const { MessageActionRow, MessageButton, MessageSelectMenu, Permissions, MessageEmbed, MessageAttachment } = require('discord.js');
const Client = require('../../index.js');
const Timer = require('../util/timer');
const Constants = require('../util/constants.js');

module.exports = {
    getGuild: function (guildId) {
        try {
            return Client.client.guilds.cache.get(guildId);
        }
        catch (e) {
            Client.client.log('ERROR', `Could not find guild: ${guildId}`, 'error');
        }
        return undefined;
    },

    getRole: function (guildId, roleId) {
        let guild = module.exports.getGuild(guildId);

        if (guild) {
            try {
                return guild.roles.cache.get(roleId);
            }
            catch (e) {
                Client.client.log('ERROR', `Could not find role: ${roleId}`, 'error');
            }
        }
        return undefined;
    },

    getTextChannelById: function (guildId, channelId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            let channel = undefined;
            try {
                channel = guild.channels.cache.get(channelId);
            }
            catch (e) {
                Client.client.log('ERROR', `Could not find channel: ${channelId}`, 'error');
            }

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getTextChannelByName: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            let channel = undefined;
            try {
                channel = guild.channels.cache.find(c => c.name === name);
            }
            catch (e) {
                Client.client.log('ERROR', `Could not find channel: ${name}`, 'error');
            }

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getCategoryById: function (guildId, categoryId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            let category = undefined;
            try {
                category = guild.channels.cache.get(categoryId);
            }
            catch (e) {
                Client.client.log('ERROR', `Could not find category: ${categoryId}`, 'error');
            }

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    getCategoryByName: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            let category = undefined;
            try {
                category = guild.channels.cache.find(c => c.name === name);
            }
            catch (e) {
                Client.client.log('ERROR', `Could not find category: ${name}`, 'error');
            }

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    getMessageById: async function (guildId, channelId, messageId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = module.exports.getTextChannelById(guildId, channelId);

            if (channel) {
                try {
                    return await channel.messages.fetch(messageId);
                }
                catch (e) {
                    Client.client.log('ERROR', `Could not find message: ${messageId}`, 'error');
                }
            }
        }
        return undefined;
    },

    getMemberById: async function (guildId, memberId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            let member = undefined;
            try {
                member = await Client.client.users.fetch(memberId);
            }
            catch (e) {
                Client.client.log('ERROR', `Could not find member: ${memberId}`, 'error');
            }

            if (member) {
                return member;
            }
        }
        return undefined;
    },

    addCategory: async function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            try {
                return await guild.channels.create(name, {
                    type: 'GUILD_CATEGORY',
                    permissionOverwrites: [{
                        id: guild.roles.everyone.id,
                        deny: [Permissions.FLAGS.SEND_MESSAGES]
                    }]
                });
            }
            catch (e) {
                Client.client.log('ERROR', `Could not create category: ${name}`, 'error');
            }
        }
        return undefined;
    },

    addTextChannel: async function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            try {
                return await guild.channels.create(name, {
                    type: 'GUILD_TEXT',
                    permissionOverwrites: [{
                        id: guild.roles.everyone.id,
                        deny: [Permissions.FLAGS.SEND_MESSAGES]
                    }],
                });
            }
            catch (e) {
                Client.client.log('ERROR', `Could not create text channel: ${name}`, 'error');
            }
        }
        return undefined;
    },

    clearTextChannel: async function (guildId, channelId, numberOfMessages) {
        const channel = module.exports.getTextChannelById(guildId, channelId);

        if (channel) {
            for (let messagesLeft = numberOfMessages; messagesLeft > 0; messagesLeft -= 100) {
                try {
                    if (messagesLeft >= 100) {
                        await channel.bulkDelete(100, true);
                    }
                    else {
                        await channel.bulkDelete(messagesLeft, true);
                    }
                }
                catch (e) {
                    Client.client.log('ERROR', `Could not perform bulkDelete on channel: ${channelId}`, 'error');
                }
            }

            /* Fix for messages older than 14 days */
            let messages = [];
            try {
                messages = await channel.messages.fetch({ limit: 100 });
            }
            catch (e) {
                Client.client.log('ERROR', `Could not perform messages fetch on channel: ${channelId}`, 'error');
            }

            for (let message of messages) {
                message = message[1];
                if (!message.author.bot) {
                    break;
                }

                try {
                    await message.delete();
                }
                catch (e) {
                    Client.client.log('ERROR', 'Could not perform message delete', 'error');
                }
            }
        }
    },

    getNotificationButtons: function (setting, discordActive, inGameActive) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${setting}DiscordNotification`)
                    .setLabel('DISCORD')
                    .setStyle((discordActive) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${setting}InGameNotification`)
                    .setLabel('IN-GAME')
                    .setStyle((inGameActive) ? 'SUCCESS' : 'DANGER'))
    },

    getInGameCommandsEnabledButton: function (enabled) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('allowInGameCommands')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? 'SUCCESS' : 'DANGER'))
    },

    getFcmAlarmNotificationButtons: function (enabled, everyone) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('fcmAlarmNotification')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId('fcmAlarmNotificationEveryone')
                    .setLabel('@everyone')
                    .setStyle((everyone) ? 'SUCCESS' : 'DANGER'));
    },

    getSmartAlarmNotifyInGameButton: function (enabled) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('smartAlarmNotifyInGame')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? 'SUCCESS' : 'DANGER'))
    },

    getLeaderCommandEnabledButton: function (enabled) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('leaderCommandEnabled')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? 'SUCCESS' : 'DANGER'))
    },

    getTrackerNotifyButtons: function (allOffline, anyOnline) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId('trackerNotifyAllOffline')
                    .setLabel('ALL OFFLINE')
                    .setStyle((allOffline) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId('trackerNotifyAnyOnline')
                    .setLabel('ANY ONLINE')
                    .setStyle((anyOnline) ? 'SUCCESS' : 'DANGER'));
    },

    getPrefixSelectMenu: function (currentPrefix) {
        return new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('prefix')
                    .setPlaceholder(`Current Prefix: ${currentPrefix}`)
                    .addOptions([
                        {
                            label: '!',
                            description: 'Exclamation Mark',
                            value: '!',
                        },
                        {
                            label: '/',
                            description: 'Slash',
                            value: '/',
                        },
                        {
                            label: '.',
                            description: 'Dot',
                            value: '.',
                        },
                    ])
            );
    },

    getTrademarkSelectMenu: function (currentTrademark) {
        return new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('trademark')
                    .setPlaceholder(`${currentTrademark}`)
                    .addOptions([
                        {
                            label: 'rustPlusPlus',
                            description: 'rustPlusPlus will be shown before messages.',
                            value: 'rustPlusPlus',
                        },
                        {
                            label: 'Rust++',
                            description: 'Rust++ will be shown before messages.',
                            value: 'Rust++',
                        },
                        {
                            label: 'NOT SHOWING',
                            description: 'Not showing any trademark before messages.',
                            value: 'NOT SHOWING',
                        },
                    ])
            );
    },

    getServerEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        let embed = new MessageEmbed()
            .setTitle(`${instance.serverList[id].title}`)
            .setColor('#ce412b')
            .setDescription(`${instance.serverList[id].description}`)
            .setThumbnail(`${instance.serverList[id].img}`);

        if (instance.serverList[id].connect !== null) {
            embed.addField('Connect', `\`${instance.serverList[id].connect}\``, true);
        }

        return embed;
    },

    getServerButtons: function (guildId, id, state = null) {
        const instance = Client.client.readInstanceFile(guildId);

        if (state === null) {
            state = (instance.serverList[id].active) ? 1 : 0;
        }

        let customId = null;
        let label = null;
        let style = null;

        switch (state) {
            case 0: { /* CONNECT */
                customId = `${id}ServerConnect`;
                label = 'CONNECT';
                style = 'PRIMARY';
            } break;

            case 1: { /* DISCONNECT */
                customId = `${id}ServerDisconnect`;
                label = 'DISCONNECT';
                style = 'DANGER';
            } break;

            case 2: { /* RECONNECTING */
                customId = `${id}ServerReconnecting`;
                label = 'RECONNECTING...';
                style = 'DANGER';
            } break;

            default: {
            } break;
        }

        let trackerAvailable = (instance.serverList[id].battlemetricsId !== null) ? true : false;

        let connectionButton = new MessageButton()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(style);
        let trackerButton = new MessageButton()
            .setCustomId(`${id}CreateTracker`)
            .setLabel('CREATE TRACKER')
            .setStyle('PRIMARY');
        let linkButton = new MessageButton()
            .setStyle('LINK')
            .setLabel('WEBSITE')
            .setURL(instance.serverList[id].url);
        let deleteButton = new MessageButton()
            .setCustomId(`${id}ServerDelete`)
            .setEmoji('🗑️')
            .setStyle('SECONDARY');

        if (trackerAvailable) {
            return new MessageActionRow()
                .addComponents(
                    connectionButton,
                    trackerButton,
                    linkButton,
                    deleteButton);
        }
        else {
            return new MessageActionRow()
                .addComponents(
                    connectionButton,
                    linkButton,
                    deleteButton);
        }
    },

    sendServerMessage: async function (guildId, id, state = null, e = true, c = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const embed = module.exports.getServerEmbed(guildId, id);
        const buttons = module.exports.getServerButtons(guildId, id, state);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [buttons];
        }

        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        let messageId = instance.serverList[id].messageId;
        let message = undefined;
        if (messageId !== null) {
            message = await module.exports.getMessageById(guildId, instance.channelId.servers, messageId);
        }

        if (message !== undefined) {
            if (await Client.client.messageEdit(message, content) === undefined) return;
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.servers);

            if (!channel) {
                Client.client.log('ERROR', 'sendServerMessage: Invalid guild or channel.', 'error');
                return;
            }

            message = await Client.client.messageSend(channel, content);
            instance.serverList[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    getTrackerEmbed: function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);
        const serverId = instance.trackers[trackerName].serverId;
        const battlemetricsId = instance.trackers[trackerName].battlemetricsId;
        const serverStatus = (instance.trackers[trackerName].status) ?
            Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;

        let playerName = '';
        let playerSteamId = '';
        let playerStatus = '';
        for (let player of instance.trackers[trackerName].players) {
            playerName += `${player.name}\n`;
            playerSteamId += `${player.steamId}\n`;
            playerStatus += `${(player.status === true) ?
                `${Constants.ONLINE_EMOJI} [${player.time}]` : `${Constants.OFFLINE_EMOJI}`}\n`;
        }

        if (playerName === '' || playerSteamId === '' || playerStatus === '') {
            playerName = 'Empty';
            playerSteamId = 'Empty';
            playerStatus = 'Empty';
        }

        let embed = new MessageEmbed()
            .setTitle(`${trackerName}`)
            .setColor('#ce412b')
            .setDescription(`**Battlemetrics ID:** \`${battlemetricsId}\`\n**Server Status:** ${serverStatus}`)
            .setThumbnail(`${instance.serverList[serverId].img}`)
            .addFields(
                { name: 'Name', value: playerName, inline: true },
                { name: 'SteamID', value: playerSteamId, inline: true },
                { name: 'Status', value: playerStatus, inline: true }
            )
            .setFooter({ text: `${instance.serverList[serverId].title}` })

        return embed;
    },

    getTrackerButtons: function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${trackerName}TrackerActive`)
                    .setLabel((instance.trackers[trackerName].active) ? 'ACTIVE' : 'INACTIVE')
                    .setStyle((instance.trackers[trackerName].active) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${trackerName}TrackerEveryone`)
                    .setLabel('@everyone')
                    .setStyle((instance.trackers[trackerName].everyone) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${trackerName}TrackerDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'))
    },

    sendTrackerMessage: async function (guildId, trackerName, e = true, c = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const embed = module.exports.getTrackerEmbed(guildId, trackerName);
        const buttons = module.exports.getTrackerButtons(guildId, trackerName);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [buttons];
        }

        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        let messageId = instance.trackers[trackerName].messageId;
        let message = undefined;
        if (messageId !== null) {
            message = await module.exports.getMessageById(guildId, instance.channelId.trackers, messageId);
        }

        if (message !== undefined) {
            if (await Client.client.messageEdit(message, content) === undefined) return;
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.trackers);

            if (!channel) {
                Client.client.log('ERROR', 'sendTrackerMessage: Invalid guild or channel.', 'error');
                return;
            }

            message = await Client.client.messageSend(channel, content);
            instance.trackers[trackerName].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
    },

    getSmartSwitchEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageEmbed()
            .setTitle(`${instance.switches[id].name}`)
            .setColor((instance.switches[id].active) ? '#00ff40' : '#ff0040')
            .setDescription(`**ID**: \`${id}\``)
            .setThumbnail(`attachment://${instance.switches[id].image}`)
            .addFields(
                {
                    name: 'Custom Command',
                    value: `\`${instance.generalSettings.prefix}${instance.switches[id].command}\``,
                    inline: true
                }
            )
            .setFooter({ text: `${instance.switches[id].server}` })
    },

    getSmartSwitchSelectMenu: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        let autoDayNightString = 'AUTO SETTING: ';
        switch (instance.switches[id].autoDayNight) {
            case 0: {
                autoDayNightString += 'OFF';
            } break;

            case 1: {
                autoDayNightString += 'AUTO-DAY';
            } break;

            case 2: {
                autoDayNightString += 'AUTO-NIGHT';
            } break;

            default: {
            } break;
        }

        return new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId(`${id}AutoDayNight`)
                    .setPlaceholder(`${autoDayNightString}`)
                    .addOptions([
                        {
                            label: 'OFF',
                            description: 'Smart Switch work as normal.',
                            value: '0',
                        },
                        {
                            label: 'AUTO-DAY',
                            description: 'Smart Switch will be active only during the day.',
                            value: '1',
                        },
                        {
                            label: 'AUTO-NIGHT',
                            description: 'Smart Switch will be active only during the night.',
                            value: '2',
                        },
                    ]),
            );
    },

    getSmartSwitchButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${id}${(instance.switches[id].active) ? 'Off' : 'On'}SmartSwitch`)
                    .setLabel((instance.switches[id].active) ? 'TURN OFF' : 'TURN ON')
                    .setStyle((instance.switches[id].active) ? 'DANGER' : 'SUCCESS'),
                new MessageButton()
                    .setCustomId(`${id}SmartSwitchDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY')
            )

    },

    sendSmartSwitchMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new MessageAttachment(`src/resources/images/electrics/${instance.switches[id].image}`);
        const embed = module.exports.getSmartSwitchEmbed(guildId, id);
        const selectMenu = module.exports.getSmartSwitchSelectMenu(guildId, id);
        const buttons = module.exports.getSmartSwitchButtons(guildId, id);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [selectMenu, buttons];
        }
        if (f) {
            content.files = [file];
        }

        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        if (Client.client.switchesMessages[guildId][id]) {
            let message = Client.client.switchesMessages[guildId][id];
            if (await Client.client.messageEdit(message, content) === undefined) return;
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.switches);

            if (!channel) {
                Client.client.log('ERROR', 'sendSmartSwitchMessage: Invalid guild or channel.', 'error');
                return;
            }
            Client.client.switchesMessages[guildId][id] = await Client.client.messageSend(channel, content);
        }
    },

    getSmartAlarmEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageEmbed()
            .setTitle(`${instance.alarms[id].name}`)
            .setColor((instance.alarms[id].active) ? '#00ff40' : '#ce412b')
            .setDescription(`**ID**: \`${id}\``)
            .addFields(
                { name: 'Message', value: `\`${instance.alarms[id].message}\``, inline: true }
            )
            .setThumbnail(`attachment://${instance.alarms[id].image}`)
            .setFooter({ text: `${instance.alarms[id].server}` })
    },

    getSmartAlarmButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${id}SmartAlarmEveryone`)
                    .setLabel('@everyone')
                    .setStyle((instance.alarms[id].everyone) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${id}SmartAlarmDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'))
    },

    sendSmartAlarmMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new MessageAttachment(`src/resources/images/electrics/${instance.alarms[id].image}`);
        const embed = module.exports.getSmartAlarmEmbed(guildId, id);
        const buttons = module.exports.getSmartAlarmButtons(guildId, id);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [buttons];
        }
        if (f) {
            content.files = [file];
        }

        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        let messageId = instance.alarms[id].messageId;
        let message = undefined;
        if (messageId !== null) {
            message = await module.exports.getMessageById(guildId, instance.channelId.alarms, messageId);
        }

        if (message !== undefined) {
            if (await Client.client.messageEdit(message, content) === undefined) return;
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.alarms);

            if (!channel) {
                Client.client.log('ERROR', 'sendSmartAlarmMessage: Invalid guild or channel.', 'error');
                return;
            }

            message = await Client.client.messageSend(channel, content);
            instance.alarms[id].messageId = message.id;
            Client.client.writeInstanceFile(guildId, instance);
        }
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
            return new MessageEmbed()
                .setTitle(`${instance.storageMonitors[id].name}`)
                .setColor('#ce412b')
                .setDescription(`${description}\n**STATUS** \`NOT ELECTRICALLY CONNECTED!\``)
                .setThumbnail(`attachment://${instance.storageMonitors[id].image}`)
                .setFooter({ text: `${instance.storageMonitors[id].server}` });
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

        if (itemName === '' || itemQuantity === '') {
            itemName = 'Empty';
            itemQuantity = 'Empty';
        }

        return new MessageEmbed()
            .setTitle(`${instance.storageMonitors[id].name}`)
            .setColor('#ce412b')
            .setDescription(description)
            .addFields(
                { name: 'Item', value: itemName, inline: true },
                { name: 'Quantity', value: itemQuantity, inline: true }
            )
            .setThumbnail(`attachment://${instance.storageMonitors[id].image}`)
            .setFooter({ text: `${instance.storageMonitors[id].server}` });
    },

    getStorageMonitorToolCupboardButtons: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${id}StorageMonitorToolCupboardEveryone`)
                    .setLabel('@everyone')
                    .setStyle((instance.storageMonitors[id].everyone) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${id}StorageMonitorToolCupboardInGame`)
                    .setLabel('IN-GAME')
                    .setStyle((instance.storageMonitors[id].inGame) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(`${id}StorageMonitorToolCupboardDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'))
    },

    getStorageMonitorContainerButton: function (guildId, id) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${id}StorageMonitorContainerDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'))
    },

    sendStorageMonitorMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        let instance = Client.client.readInstanceFile(guildId);

        const file = new MessageAttachment(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);
        const embed = module.exports.getStorageMonitorEmbed(guildId, id);
        instance = Client.client.readInstanceFile(guildId);

        let buttons = null;
        if (instance.storageMonitors[id].type === 'toolcupboard') {
            buttons = module.exports.getStorageMonitorToolCupboardButtons(guildId, id);
        }
        else {
            buttons = module.exports.getStorageMonitorContainerButton(guildId, id);
        }

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [buttons];
        }
        if (f) {
            content.files = [file];
        }

        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        if (Client.client.storageMonitorsMessages[guildId][id]) {
            let message = Client.client.storageMonitorsMessages[guildId][id];
            if (await Client.client.messageEdit(message, content) === undefined) return;
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.storageMonitors);

            if (!channel) {
                Client.client.log('ERROR', 'sendStorageMonitorMessage: Invalid guild or channel.', 'error');
                return;
            }
            Client.client.storageMonitorsMessages[guildId][id] = await Client.client.messageSend(channel, content);
        }
    },

    sendDecayingNotification: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);
        const file = new MessageAttachment(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`${instance.storageMonitors[id].name} is decaying!`)
                .setColor('#ff0040')
                .setDescription(`**ID** \`${id}\``)
                .setThumbnail(`attachment://${instance.storageMonitors[id].image}`)
                .setFooter({ text: `${instance.storageMonitors[id].server}` })
                .setTimestamp()];

            content.files = [file];

            if (instance.storageMonitors[id].everyone) {
                content.content = '@everyone';
            }

            await Client.client.messageSend(channel, content);
        }
    },

    sendStorageMonitorDisconnectNotification: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);
        const file = new MessageAttachment(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`${instance.storageMonitors[id].name} is no longer electrically connected!`)
                .setColor('#ff0040')
                .setDescription(`**ID** \`${id}\``)
                .setThumbnail(`attachment://${instance.storageMonitors[id].image}`)
                .setFooter({ text: `${instance.storageMonitors[id].server}` })
                .setTimestamp()];

            content.files = [file];

            if (instance.storageMonitors[id].everyone) {
                content.content = '@everyone';
            }

            await Client.client.messageSend(channel, content);
        }
    },

    sendStorageMonitorNotFound: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);
        const file = new MessageAttachment(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`${instance.storageMonitors[id].name} could not be found! Might have been destroyed.`)
                .setColor('#ff0040')
                .setDescription(`**ID** \`${id}\``)
                .setThumbnail(`attachment://${instance.storageMonitors[id].image}`)
                .setFooter({ text: `${instance.storageMonitors[id].server}` })
                .setTimestamp()];

            content.files = [file];

            if (instance.storageMonitors[id].everyone) {
                content.content = '@everyone';
            }

            await Client.client.messageSend(channel, content);
        }
    },

    sendSmartSwitchNotFound: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);
        const file = new MessageAttachment(`src/resources/images/electrics/${instance.switches[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`${instance.switches[id].name} could not be found! Might have been destroyed.`)
                .setColor('#ff0040')
                .setDescription(`**ID** \`${id}\``)
                .setThumbnail(`attachment://${instance.switches[id].image}`)
                .setFooter({ text: `${instance.switches[id].server}` })
                .setTimestamp()];

            content.files = [file];

            await Client.client.messageSend(channel, content);
        }
    },

    sendSmartAlarmNotFound: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);
        const file = new MessageAttachment(`src/resources/images/electrics/${instance.alarms[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`${instance.alarms[id].name} could not be found! Might have been destroyed.`)
                .setColor('#ff0040')
                .setDescription(`**ID** \`${id}\``)
                .setThumbnail(`attachment://${instance.alarms[id].image}`)
                .setFooter({ text: `${instance.alarms[id].server}` })
                .setTimestamp()];

            content.files = [file];

            await Client.client.messageSend(channel, content);
        }
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
                switchActive += `${(active) ? Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI}\n`;
            }
            else {
                instance.serverList[rustplus.serverId].switchGroups[name].switches =
                    instance.serverList[rustplus.serverId].switchGroups[name].switches.filter(e => e !== groupSwitchId);
            }
        }
        Client.client.writeInstanceFile(guildId, instance);

        if (switchName === '' || switchId === '' || switchActive === '') {
            switchName = 'None';
            switchId = 'None';
            switchActive = 'None';
        }

        return new MessageEmbed()
            .setTitle(name)
            .setColor('#ce412b')
            .setDescription(``)
            .setThumbnail('attachment://smart_switch.png')
            .addFields(
                {
                    name: 'Custom Command',
                    value: `\`${instance.generalSettings.prefix}${group.command}\``,
                    inline: false
                },
                { name: 'Switches', value: switchName, inline: true },
                { name: 'ID', value: switchId, inline: true },
                { name: 'Active', value: switchActive, inline: true }
            )
            .setFooter({ text: `${instance.serverList[rustplus.serverId].title}` })
    },

    getSmartSwitchGroupButtons: function (name) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(`${name}TurnOnGroup`)
                    .setLabel('TURN ON')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(`${name}TurnOffGroup`)
                    .setLabel('TURN OFF')
                    .setStyle('PRIMARY'),
                new MessageButton()
                    .setCustomId(`${name}DeleteGroup`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'));
    },

    sendSmartSwitchGroupMessage: async function (guildId, name, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new MessageAttachment('src/resources/images/electrics/smart_switch.png');
        const embed = module.exports.getSmartSwitchGroupEmbed(guildId, name);
        const buttons = module.exports.getSmartSwitchGroupButtons(name);

        let content = new Object();
        if (e) {
            content.embeds = [embed];
        }
        if (c) {
            content.components = [buttons];
        }
        if (f) {
            content.files = [file];
        }

        if (interaction) {
            await Client.client.interactionUpdate(interaction, content);
            return;
        }

        if (Client.client.switchesMessages[guildId][name]) {
            let message = Client.client.switchesMessages[guildId][name];
            if (await Client.client.messageEdit(message, content) === undefined) return;
        }
        else {
            const channel = module.exports.getTextChannelById(guildId, instance.channelId.switches);

            if (!channel) {
                Client.client.log('ERROR', 'sendSmartSwitchGroupMessage: Invalid guild or channel.', 'error');
                return;
            }
            Client.client.switchesMessages[guildId][name] = await Client.client.messageSend(channel, content);
        }
    },

    sendTrackerAllOffline: async function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);
        const serverId = instance.trackers[trackerName].serverId;
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`Everyone from the tracker \`${trackerName}\` just went offline.`)
                .setColor('#ff0040')
                .setThumbnail(`${instance.serverList[serverId].img}`)
                .setFooter({ text: `${instance.serverList[serverId].title}` })
                .setTimestamp()];

            if (instance.trackers[trackerName].everyone) {
                content.content = '@everyone';
            }

            await Client.client.messageSend(channel, content);
        }
    },

    sendTrackerAnyOnline: async function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);
        const serverId = instance.trackers[trackerName].serverId;
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);

        if (channel) {
            let content = {};
            content.embeds = [new MessageEmbed()
                .setTitle(`Someone from tracker \`${trackerName}\` just went online.`)
                .setColor('#00ff40')
                .setThumbnail(`${instance.serverList[serverId].img}`)
                .setFooter({ text: `${instance.serverList[serverId].title}` })
                .setTimestamp()];

            if (instance.trackers[trackerName].everyone) {
                content.content = '@everyone';
            }

            await Client.client.messageSend(channel, content);
        }
    },
}