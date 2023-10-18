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

module.exports = {
    getGuild: function (guildId) {
        try {
            return Client.client.guilds.cache.get(guildId);
        }
        catch (e) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'couldNotFindGuild', { guildId: guildId }), 'error');
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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotFindRole', { roleId: roleId }), 'error');
            }
        }
        return undefined;
    },

    getUserById: async function (guildId, userId) {
        let guild = module.exports.getGuild(guildId);

        if (guild) {
            try {
                const user = await guild.members.fetch(userId);
                if (user instanceof Map) return await user.get(userId);
                return user;
            }
            catch (e) {
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotFindUser', { userId: userId }), 'error');
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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotFindChannel', { channel: channelId }), 'error');
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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotFindChannel', { channel: name }), 'error');
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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotFindCategory', { category: categoryId }), 'error');
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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotFindCategory', { category: name }), 'error');
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
                    if (message instanceof Map) return await message.get(messageId);
                    return message;
                }
                catch (e) {
                    Client.client.log(Client.client.intlGet(null, 'errorCap'),
                        Client.client.intlGet(null, 'couldNotFindMessage', { message: messageId }), 'error');
                }
            }
        }
        return undefined;
    },

    deleteMessageById: async function (guildId, channelId, messageId) {
        const message = await module.exports.getMessageById(guildId, channelId, messageId);

        try {
            await message.delete();
        }
        catch (e) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'couldNotDeleteMessage', { message: messageId }), 'error');

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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotCreateCategory', { name: name }), 'error');
            }
        }
        return undefined;
    },

    removeCategory: async function (guildId, categoryId) {
        const category = module.exports.getCategoryById(guildId, categoryId);

        try {
            await category.delete();
        }
        catch (e) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'couldNotDeleteCategory', { categoryId: categoryId }), 'error');
            return false;
        }
        return true;
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
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotCreateTextChannel', { name: name }), 'error');
            }
        }
        return undefined;
    },

    removeTextChannel: async function (guildId, channelId) {
        const channel = module.exports.getTextChannelById(guildId, channelId);

        try {
            await channel.delete();
        }
        catch (e) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'couldNotDeleteChannel', { channelId: channelId }), 'error');
            return false;
        }
        return true;
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
                    Client.client.log(Client.client.intlGet(null, 'errorCap'),
                        Client.client.intlGet(null, 'couldNotPerformBulkDelete', { channel: channelId }), 'error');
                }
            }

            /* Fix for messages older than 14 days */
            let messages = [];
            try {
                messages = await channel.messages.fetch({ limit: 100 });
            }
            catch (e) {
                Client.client.log(Client.client.intlGet(null, 'errorCap'),
                    Client.client.intlGet(null, 'couldNotPerformMessagesFetch', { channel: channelId }), 'error');
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
                    Client.client.log(Client.client.intlGet(null, 'errorCap'),
                        Client.client.intlGet(null, 'couldNotPerformMessageDelete'), 'error');
                }
            }
        }
    },

    getDiscordFormattedDate: function (unixtime) {
        return `<t:${unixtime}:d>`;
    },
}