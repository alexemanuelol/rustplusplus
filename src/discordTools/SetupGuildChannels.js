const DiscordTools = require('../discordTools/discordTools.js');

const CATEGORY = 'rustPlusPlus';
const SETTINGS = 'settings';
const EVENTS = 'events';

const LIST_CHANNELS = [SETTINGS, EVENTS];

module.exports = (client, guild) => {
    let category = DiscordTools.getCategoryByName(guild.id, CATEGORY);

    if (!client.guildsAndChannelsIds.hasOwnProperty(guild.id)) {
        client.guildsAndChannelsIds[guild.id] = {};
    }

    /* Add Category/ Channels */
    if (category) {
        LIST_CHANNELS.forEach(value => {
            let channel = DiscordTools.getTextChannelByName(guild.id, value);

            if (!channel || channel.parentId !== category.id) {
                DiscordTools.addTextChannel(guild.id, value).then(channel => {
                    channel.setParent(category.id);
                    client.guildsAndChannelsIds[guild.id][value] = channel.id;
                });
            }
            else {
                client.guildsAndChannelsIds[guild.id][value] = channel.id;
            }
        });
    }
    else {
        DiscordTools.addCategory(guild.id, CATEGORY).then(cat => {
            LIST_CHANNELS.forEach(value => {
                DiscordTools.addTextChannel(guild.id, value).then(channel => {
                    channel.setParent(cat.id);
                    client.guildsAndChannelsIds[guild.id][value] = channel.id;
                });
            });
        });
    }
};