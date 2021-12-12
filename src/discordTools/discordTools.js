const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const Client = require('../../index.js');

module.exports = {
    getTextChannelById: function (guildId, channelId) {
        let guild = Client.client.guilds.cache.get(guildId);

        if (guild) {
            let channel = guild.channels.cache.get(channelId);

            if (channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getTextChannelByName: function (guildId, name) {
        let guild = Client.client.guilds.cache.get(guildId);

        if (guild) {
            let channel = guild.channels.cache.find(c => c.name === name);

            if (channel && channel.type === 'GUILD_TEXT') {
                return channel;
            }
        }
        return undefined;
    },

    getCategoryById: function (guildId, categoryId) {
        let guild = Client.client.guilds.cache.get(guildId);

        if (guild) {
            let category = guild.channels.cache.get(categoryId);

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    getCategoryByName: function (guildId, name) {
        let guild = Client.client.guilds.cache.get(guildId);

        if (guild) {
            let category = guild.channels.cache.find(c => c.name === name);

            if (category && category.type === 'GUILD_CATEGORY') {
                return category;
            }
        }
        return undefined;
    },

    addCategory: function (guildId, name) {
        let guild = Client.client.guilds.cache.get(guildId);

        if (guild) {
            return guild.channels.create(name, { type: 'GUILD_CATEGORY' });
        }
    },

    addTextChannel: function (guildId, name) {
        let guild = Client.client.guilds.cache.get(guildId);

        if (guild) {
            return guild.channels.create(name, { type: 'GUILD_TEXT' });
        }
    },

    clearTextChannel: function (guildId, channelId, numberOfMessages) {
        let channel = module.exports.getTextChannelById(guildId, channelId);

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

    getNotificationButtonsRow: function (discordId, discordActive, inGameId, inGameActive) {
        return new MessageActionRow()
            .addComponents(
                new MessageButton()
                    .setCustomId(discordId)
                    .setLabel('DISCORD')
                    .setStyle((discordActive) ? 'SUCCESS' : 'DANGER'),
                new MessageButton()
                    .setCustomId(inGameId)
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
    }
}