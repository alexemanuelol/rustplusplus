const Discord = require('discord.js');

const Client = require('../../index.js');
const DiscordButtons = require('./discordButtons.js');
const DiscordEmbeds = require('./discordEmbeds.js');
const DiscordSelectMenus = require('./discordSelectMenus.js');

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







    sendServerMessage: async function (guildId, id, state = null, e = true, c = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const embed = DiscordEmbeds.getServerEmbed(guildId, id);
        const buttons = DiscordButtons.getServerButtons(guildId, id, state);

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

    sendTrackerMessage: async function (guildId, trackerName, e = true, c = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const embed = DiscordEmbeds.getTrackerEmbed(guildId, trackerName);
        const buttons = DiscordButtons.getTrackerButtons(guildId, trackerName);

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

    sendSmartSwitchMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.switches[id].image}`);
        let embed = DiscordEmbeds.getSmartSwitchEmbed(guildId, id);
        let selectMenu = DiscordSelectMenus.getSmartSwitchSelectMenu(guildId, id);
        let buttons = DiscordButtons.getSmartSwitchButtons(guildId, id);

        if (!instance.switches[id].reachable) {
            embed = DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'switches');
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

    sendSmartAlarmMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.alarms[id].image}`);
        let embed = DiscordEmbeds.getSmartAlarmEmbed(guildId, id);
        let buttons = DiscordButtons.getSmartAlarmButtons(guildId, id);

        if (!instance.alarms[id].reachable) {
            embed = DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'alarms');
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

    sendStorageMonitorMessage: async function (guildId, id, e = true, c = true, f = true, interaction = null) {
        let instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);
        let embed = null;

        if (instance.storageMonitors[id].reachable) {
            embed = DiscordEmbeds.getStorageMonitorEmbed(guildId, id);
            instance = Client.client.readInstanceFile(guildId);
        }
        else {
            embed = DiscordEmbeds.getNotFoundSmartDeviceEmbed(guildId, id, 'storageMonitors');
        }

        let buttons = null;
        if (instance.storageMonitors[id].type === 'toolcupboard') {
            buttons = DiscordButtons.getStorageMonitorToolCupboardButtons(guildId, id);
        }
        else {
            buttons = DiscordButtons.getStorageMonitorContainerButton(id);
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

    sendSmartSwitchGroupMessage: async function (guildId, name, e = true, c = true, f = true, interaction = null) {
        const instance = Client.client.readInstanceFile(guildId);

        const file = new Discord.AttachmentBuilder('src/resources/images/electrics/smart_switch.png');
        const embed = DiscordEmbeds.getSmartSwitchGroupEmbed(guildId, name);
        const buttons = DiscordButtons.getSmartSwitchGroupButtons(name);

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
}