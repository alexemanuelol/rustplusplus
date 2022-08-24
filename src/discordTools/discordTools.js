const Discord = require('discord.js');

const Client = require('../../index.js');
const Constants = require('../util/constants.js');
const Timer = require('../util/timer');

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

            if (channel && channel.type === Discord.ChannelType.GuildText) {
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

            if (channel && channel.type === Discord.ChannelType.GuildText) {
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

            if (category && category.type === Discord.ChannelType.GuildCategory) {
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

            if (category && category.type === Discord.ChannelType.GuildCategory) {
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
                return await guild.channels.create({
                    name: name,
                    type: Discord.ChannelType.GuildCategory,
                    permissionOverwrites: [{
                        id: guild.roles.everyone.id,
                        deny: [Discord.PermissionFlagsBits.SendMessages]
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
                return await guild.channels.create({
                    name: name,
                    type: Discord.ChannelType.GuildText,
                    permissionOverwrites: [{
                        id: guild.roles.everyone.id,
                        deny: [Discord.PermissionFlagsBits.SendMessages]
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

            if (Object.keys(messages).length === 0) {
                return;
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
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${setting}DiscordNotification`)
                    .setLabel('DISCORD')
                    .setStyle((discordActive) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId(`${setting}InGameNotification`)
                    .setLabel('IN-GAME')
                    .setStyle((inGameActive) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger))
    },

    getInGameCommandsEnabledButton: function (enabled) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('allowInGameCommands')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger))
    },

    getInGameTeammateNotificationsButtons: function (instance) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('inGameTeammateConnection')
                    .setLabel('CONNECTIONS')
                    .setStyle((instance.generalSettings.connectionNotify) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId('inGameTeammateAfk')
                    .setLabel('AFK')
                    .setStyle((instance.generalSettings.afkNotify) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId('inGameTeammateDeath')
                    .setLabel('DEATH')
                    .setStyle((instance.generalSettings.deathNotify) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger))
    },

    getFcmAlarmNotificationButtons: function (enabled, everyone) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('fcmAlarmNotification')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId('fcmAlarmNotificationEveryone')
                    .setLabel('@everyone')
                    .setStyle((everyone) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger));
    },

    getSmartAlarmNotifyInGameButton: function (enabled) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('smartAlarmNotifyInGame')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger))
    },

    getLeaderCommandEnabledButton: function (enabled) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('leaderCommandEnabled')
                    .setLabel((enabled) ? 'ENABLED' : 'DISABLED')
                    .setStyle((enabled) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger))
    },

    getTrackerNotifyButtons: function (allOffline, anyOnline) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('trackerNotifyAllOffline')
                    .setLabel('ALL OFFLINE')
                    .setStyle((allOffline) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId('trackerNotifyAnyOnline')
                    .setLabel('ANY ONLINE')
                    .setStyle((anyOnline) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger));
    },

    getPrefixSelectMenu: function (currentPrefix) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.SelectMenuBuilder()
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
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.SelectMenuBuilder()
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

    getCommandDelaySelectMenu: function (currentDelay) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.SelectMenuBuilder()
                    .setCustomId('commandDelay')
                    .setPlaceholder(`Current Command Delay: ${currentDelay} seconds`)
                    .addOptions([
                        {
                            label: 'NO DELAY',
                            description: 'No command delay.',
                            value: '0',
                        },
                        {
                            label: '1 second',
                            description: 'One second command delay.',
                            value: '1',
                        },
                        {
                            label: '2 seconds',
                            description: 'Two seconds command delay.',
                            value: '2',
                        },
                        {
                            label: '3 seconds',
                            description: 'Three seconds command delay.',
                            value: '3',
                        },
                        {
                            label: '4 seconds',
                            description: 'Four seconds command delay.',
                            value: '4',
                        },
                        {
                            label: '5 seconds',
                            description: 'Five seconds command delay.',
                            value: '5',
                        },
                        {
                            label: '6 seconds',
                            description: 'Six seconds command delay.',
                            value: '6',
                        },
                        {
                            label: '7 seconds',
                            description: 'Seven seconds command delay.',
                            value: '7',
                        },
                        {
                            label: '8 seconds',
                            description: 'Eight seconds command delay.',
                            value: '8',
                        }
                    ])
            );
    },

    getServerEmbed: function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);

        let embed = new Discord.EmbedBuilder()
            .setTitle(`${instance.serverList[id].title}`)
            .setColor('#ce412b')
            .setDescription(`${instance.serverList[id].description}`)
            .setThumbnail(`${instance.serverList[id].img}`);

        if (instance.serverList[id].connect !== null) {
            embed.addFields({
                name: 'Connect',
                value: `\`${instance.serverList[id].connect}\``,
                inline: true
            });
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
                style = Discord.ButtonStyle.Primary;
            } break;

            case 1: { /* DISCONNECT */
                customId = `${id}ServerDisconnect`;
                label = 'DISCONNECT';
                style = Discord.ButtonStyle.Danger;
            } break;

            case 2: { /* RECONNECTING */
                customId = `${id}ServerReconnecting`;
                label = 'RECONNECTING...';
                style = Discord.ButtonStyle.Danger;
            } break;

            default: {
            } break;
        }

        let trackerAvailable = (instance.serverList[id].battlemetricsId !== null) ? true : false;

        let connectionButton = new Discord.ButtonBuilder()
            .setCustomId(customId)
            .setLabel(label)
            .setStyle(style);
        let trackerButton = new Discord.ButtonBuilder()
            .setCustomId(`${id}CreateTracker`)
            .setLabel('CREATE TRACKER')
            .setStyle(Discord.ButtonStyle.Primary);
        let linkButton = new Discord.ButtonBuilder()
            .setStyle(Discord.ButtonStyle.Link)
            .setLabel('WEBSITE')
            .setURL(instance.serverList[id].url);
        let deleteButton = new Discord.ButtonBuilder()
            .setCustomId(`${id}ServerDelete`)
            .setEmoji('🗑️')
            .setStyle(Discord.ButtonStyle.Secondary);

        if (trackerAvailable) {
            return new Discord.ActionRowBuilder()
                .addComponents(
                    connectionButton,
                    trackerButton,
                    linkButton,
                    deleteButton);
        }
        else {
            return new Discord.ActionRowBuilder()
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
        const battlemetricsId = instance.trackers[trackerName].battlemetricsId;
        const serverStatus = (instance.trackers[trackerName].status) ?
            Constants.ONLINE_EMOJI : Constants.OFFLINE_EMOJI;

        let playerName = '';
        let playerSteamId = '';
        let playerStatus = '';
        for (let player of instance.trackers[trackerName].players) {
            playerName += `${player.name}\n`;
            if (instance.trackers[trackerName].players.length < 12) {
                playerSteamId += `[${player.steamId}](${Constants.STEAM_PROFILES_URL}${player.steamId})\n`;
            }
            else {
                playerSteamId += `${player.steamId}\n`;
            }
            playerStatus += `${(player.status === true) ?
                `${Constants.ONLINE_EMOJI} [${player.time}]` : `${Constants.OFFLINE_EMOJI}`}\n`;
        }

        if (playerName === '' || playerSteamId === '' || playerStatus === '') {
            playerName = 'Empty';
            playerSteamId = 'Empty';
            playerStatus = 'Empty';
        }

        let embed = new Discord.EmbedBuilder()
            .setTitle(`${trackerName}`)
            .setColor('#ce412b')
            .setDescription(`**Battlemetrics ID:** \`${battlemetricsId}\`\n**Server Status:** ${serverStatus}`)
            .setThumbnail(`${instance.trackers[trackerName].img}`)
            .addFields(
                { name: 'Name', value: playerName, inline: true },
                { name: 'SteamID', value: playerSteamId, inline: true },
                { name: 'Status', value: playerStatus, inline: true }
            )
            .setFooter({ text: `${instance.trackers[trackerName].title}` })

        return embed;
    },

    getTrackerButtons: function (guildId, trackerName) {
        const instance = Client.client.readInstanceFile(guildId);

        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${trackerName}TrackerActive`)
                    .setLabel((instance.trackers[trackerName].active) ? 'ACTIVE' : 'INACTIVE')
                    .setStyle((instance.trackers[trackerName].active) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId(`${trackerName}TrackerEveryone`)
                    .setLabel('@everyone')
                    .setStyle((instance.trackers[trackerName].everyone) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId(`${trackerName}TrackerDelete`)
                    .setEmoji('🗑️')
                    .setStyle(Discord.ButtonStyle.Secondary))
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

        return new Discord.EmbedBuilder()
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

        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.SelectMenuBuilder()
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

        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}${(instance.switches[id].active) ? 'Off' : 'On'}SmartSwitch`)
                    .setLabel((instance.switches[id].active) ? 'TURN OFF' : 'TURN ON')
                    .setStyle((instance.switches[id].active) ? Discord.ButtonStyle.Danger : Discord.ButtonStyle.Success),
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}SmartSwitchDelete`)
                    .setEmoji('🗑️')
                    .setStyle(Discord.ButtonStyle.Secondary)
            )

    },

    sendSmartSwitchMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`);
        let embed = module.exports.getSmartSwitchEmbed(guildId, id);
        let selectMenu = module.exports.getSmartSwitchSelectMenu(guildId, id);
        let buttons = module.exports.getSmartSwitchButtons(guildId, id);

        if (!instance.switches[id].reachable) {
            embed = module.exports.getNotFoundSmartDeviceEmbed(guildId, id, 'switches');
        }

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

        return new Discord.EmbedBuilder()
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

        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}SmartAlarmEveryone`)
                    .setLabel('@everyone')
                    .setStyle((instance.alarms[id].everyone) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}SmartAlarmDelete`)
                    .setEmoji('🗑️')
                    .setStyle(Discord.ButtonStyle.Secondary))
    },

    sendSmartAlarmMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.alarms[id].image}`);
        let embed = module.exports.getSmartAlarmEmbed(guildId, id);
        let buttons = module.exports.getSmartAlarmButtons(guildId, id);

        if (!instance.alarms[id].reachable) {
            embed = module.exports.getNotFoundSmartDeviceEmbed(guildId, id, 'alarms');
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
            return new Discord.EmbedBuilder()
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

        return new Discord.EmbedBuilder()
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

        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}StorageMonitorToolCupboardEveryone`)
                    .setLabel('@everyone')
                    .setStyle((instance.storageMonitors[id].everyone) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}StorageMonitorToolCupboardInGame`)
                    .setLabel('IN-GAME')
                    .setStyle((instance.storageMonitors[id].inGame) ? Discord.ButtonStyle.Success : Discord.ButtonStyle.Danger),
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}StorageMonitorToolCupboardDelete`)
                    .setEmoji('🗑️')
                    .setStyle(Discord.ButtonStyle.Secondary))
    },

    getStorageMonitorContainerButton: function (guildId, id) {
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${id}StorageMonitorContainerDelete`)
                    .setEmoji('🗑️')
                    .setStyle(Discord.ButtonStyle.Secondary))
    },

    sendStorageMonitorMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        let instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);
        let embed = null;

        if (instance.storageMonitors[id].reachable) {
            embed = module.exports.getStorageMonitorEmbed(guildId, id);
            instance = Client.client.readInstanceFile(guildId);
        }
        else {
            embed = module.exports.getNotFoundSmartDeviceEmbed(guildId, id, 'storageMonitors');
        }

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
        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new Discord.EmbedBuilder()
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
        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new Discord.EmbedBuilder()
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
        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new Discord.EmbedBuilder()
                .setTitle(`${instance.storageMonitors[id].name} could not be found!` +
                    ` Either it have been destroyed or Admin have lost tool cupboard access.`)
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
        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new Discord.EmbedBuilder()
                .setTitle(`${instance.switches[id].name} could not be found!` +
                    ` Either it have been destroyed or Admin have lost tool cupboard access.`)
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
        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.alarms[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [new Discord.EmbedBuilder()
                .setTitle(`${instance.alarms[id].name} could not be found!` +
                    ` Either it have been destroyed or Admin have lost tool cupboard access.`)
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

        if (switchName === '' || switchId === '' || switchActive === '') {
            switchName = 'None';
            switchId = 'None';
            switchActive = 'None';
        }

        return new Discord.EmbedBuilder()
            .setTitle(name)
            .setColor('#ce412b')
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
        return new Discord.ActionRowBuilder()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`${name}TurnOnGroup`)
                    .setLabel('TURN ON')
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setCustomId(`${name}TurnOffGroup`)
                    .setLabel('TURN OFF')
                    .setStyle(Discord.ButtonStyle.Primary),
                new Discord.ButtonBuilder()
                    .setCustomId(`${name}DeleteGroup`)
                    .setEmoji('🗑️')
                    .setStyle(Discord.ButtonStyle.Secondary));
    },

    sendSmartSwitchGroupMessage: async function (guildId, name, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder('src/resources/images/electrics/smart_switch.png');
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
            content.embeds = [new Discord.EmbedBuilder()
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
            content.embeds = [new Discord.EmbedBuilder()
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

    getNotFoundSmartDeviceEmbed: function (guildId, id, type) {
        const instance = Client.client.readInstanceFile(guildId);

        return new Discord.EmbedBuilder()
            .setTitle(`${instance[type][id].name}`)
            .setColor('#ff0040')
            .setDescription(`**ID**: \`${id}\`\n**STATUS**: NOT FOUND ${Constants.NOT_FOUND_EMOJI}`)
            .setThumbnail(`attachment://${instance[type][id].image}`)
            .setFooter({ text: `${instance[type][id].server}` })
    },
}