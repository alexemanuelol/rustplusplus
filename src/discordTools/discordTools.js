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
                    const message = await channel.messages.fetch(messageId);
                    if (message instanceof Map) return message.get(messageId);
                    return message;
                }
                catch (e) {
                    Client.client.log('ERROR', `Could not find message: ${messageId}`, 'error');
                }
            }
        }
        return undefined;
    },

    deleteMessageById: async function (guildId, channelId, messageId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = module.exports.getTextChannelById(guildId, channelId);

            if (channel) {
                let message = undefined;
                try {
                    message = await channel.messages.fetch(messageId);
                    if (message instanceof Map) message = message.get(messageId);
                }
                catch (e) {
                    Client.client.log('ERROR', `Could not find message: ${messageId}`, 'error');
                    return undefined;
                }

                try {
                    await message.delete();
                }
                catch (e) {
                    Client.client.log('ERROR', `Could not delete message: ${messageId}`, 'error');
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





    sendDecayingNotification: async function (guildId, id) {
        const instance = Client.client.readInstanceFile(guildId);
        let channel = module.exports.getTextChannelById(guildId, instance.channelId.activity);
        const file = new Discord.AttachmentBuilder(`src/resources/images/electrics/${instance.storageMonitors[id].image}`);

        if (channel) {
            let content = {};
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `${instance.storageMonitors[id].name} is decaying!`,
                color: '#ff0040',
                description: `**ID** \`${id}\``,
                thumbnail: `attachment://${instance.storageMonitors[id].image}`,
                footer: { text: `${instance.storageMonitors[id].server}` },
                timestamp: true
            })];

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
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `${instance.storageMonitors[id].name} is no longer electrically connected!`,
                color: '#ff0040',
                description: `**ID** \`${id}\``,
                thumbnail: `attachment://${instance.storageMonitors[id].image}`,
                footer: { text: `${instance.storageMonitors[id].server}` },
                timestamp: true
            })];

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
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `${instance.storageMonitors[id].name} could not be found!` +
                    ` Either it have been destroyed or Admin have lost tool cupboard access.`,
                color: '#ff0040',
                description: `**ID** \`${id}\``,
                thumbnail: `attachment://${instance.storageMonitors[id].image}`,
                footer: { text: `${instance.storageMonitors[id].server}` },
                timestamp: true
            })];

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
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `${instance.switches[id].name} could not be found!` +
                    ` Either it have been destroyed or Admin have lost tool cupboard access.`,
                color: '#ff0040',
                description: `**ID** \`${id}\``,
                thumbnail: `attachment://${instance.switches[id].image}`,
                footer: { text: `${instance.switches[id].server}` },
                timestamp: true
            })];

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
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `${instance.alarms[id].name} could not be found!` +
                    ` Either it have been destroyed or Admin have lost tool cupboard access.`,
                color: '#ff0040',
                description: `**ID** \`${id}\``,
                thumbnail: `attachment://${instance.alarms[id].image}`,
                footer: { text: `${instance.alarms[id].server}` },
                timestamp: true
            })];

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
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `Everyone from the tracker \`${trackerName}\` just went offline.`,
                color: '#ff0040',
                thumbnail: `${instance.serverList[serverId].img}`,
                footer: { text: `${instance.serverList[serverId].title}` },
                timestamp: true
            })];

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
            content.embeds = [DiscordEmbeds.getEmbed({
                title: `Someone from tracker \`${trackerName}\` just went online.`,
                color: '#00ff40',
                thumbnail: `${instance.serverList[serverId].img}`,
                footer: { text: `${instance.serverList[serverId].title}` },
                timestamp: true
            })];

            if (instance.trackers[trackerName].everyone) {
                content.content = '@everyone';
            }

            await Client.client.messageSend(channel, content);
        }
    },
}