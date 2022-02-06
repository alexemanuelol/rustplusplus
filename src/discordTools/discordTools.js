const { MessageActionRow, MessageButton, MessageSelectMenu, Permissions } = require('discord.js');
const Client = require('../../index.js');

module.exports = {
    getGuild: function (guildId) {
        return Client.client.guilds.cache.get(guildId);
    },

    getTextChannelById: function (guildId, channelId) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = guild.channels.cache.get(channelId);

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getTextChannelByName: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const channel = guild.channels.cache.find(c => c.name === name);

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getCategoryById: function (guildId, categoryId) {
        let guild = module.exports.getGuild(guildId);

        if (guild) {
            let category = guild.channels.cache.get(categoryId);

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    getCategoryByName: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            const category = guild.channels.cache.find(c => c.name === name);

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    addCategory: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            return guild.channels.create(name, {
                type: 'GUILD_CATEGORY',
                permissionOverwrites: [{
                    id: guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.SEND_MESSAGES]
                }]
            });
        }
    },

    addTextChannel: function (guildId, name) {
        const guild = module.exports.getGuild(guildId);

        if (guild) {
            return guild.channels.create(name, {
                type: 'GUILD_TEXT',
                permissionOverwrites: [{
                    id: guild.roles.everyone.id,
                    deny: [Permissions.FLAGS.SEND_MESSAGES]
                }],
            });
        }
    },

    clearTextChannel: function (guildId, channelId, numberOfMessages) {
        const channel = module.exports.getTextChannelById(guildId, channelId);

        if (channel) {
            for (let messagesLeft = numberOfMessages; messagesLeft > 0; messagesLeft -= 100) {
                if (messagesLeft >= 100) {
                    channel.bulkDelete(100, true);
                }
                else {
                    channel.bulkDelete(messagesLeft, true);
                }
            }
        }
    },

    getNotificationButtonsRow: function (setting, discordActive, inGameActive) {
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

    getServerButtonsRow: function (ipPort, state, url) {
        let customId = null;
        let label = null;
        let style = null;

        switch (state) {
            case 0: /* CONNECT */
                customId = `${ipPort}ServerConnect`;
                label = 'CONNECT';
                style = 'PRIMARY';
                break;

            case 1: /* DISCONNECT */
                customId = `${ipPort}ServerDisconnect`;
                label = 'DISCONNECT';
                style = 'DANGER';
                break;

            default:
                break;
        }

        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(customId)
                    .setLabel(label)
                    .setStyle(style),
                new MessageButton()
                    .setStyle('LINK')
                    .setLabel('WEBSITE')
                    .setURL(url),
                new MessageButton()
                    .setCustomId(`${ipPort}ServerDelete`)
                    .setEmoji('🗑️')
                    .setStyle('SECONDARY'))
    },
}