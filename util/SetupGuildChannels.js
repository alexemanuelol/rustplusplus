const CATEGORY = 'rustPlusPlus';
const EVENTS = 'events';
const ALERTS = 'alerts';
const COMMANDS = 'commands';
const SWITCHES = 'switches';

module.exports = (client, guild) => {
    let category = guild.channels.cache.find(cat => cat.name === CATEGORY);

    if (category !== undefined && category.type === 'GUILD_CATEGORY') {
        /* The category already exist, does the channels under the category exist too? */
        addTextChannel(EVENTS, category, client, guild);
        addTextChannel(ALERTS, category, client, guild);
        addTextChannel(COMMANDS, category, client, guild);
        addTextChannel(SWITCHES, category, client, guild);
    }
    else {
        /* The category did not exist, so create it and the channels too */
        guild.channels.create(CATEGORY, { type: 'GUILD_CATEGORY' }).then(c => {
            /* The category was created, create the channels under the category too */
            addTextChannel(EVENTS, c, client, guild);
            addTextChannel(ALERTS, c, client, guild);
            addTextChannel(COMMANDS, c, client, guild);
            addTextChannel(SWITCHES, c, client, guild);
        });
    }
};

function addTextChannel(name, category, client, guild) {
    /* Find the channel by name (if it exist) */
    let channel = guild.channels.cache.find(c => c.name === name);

    if (channel === undefined || channel.parentId !== category.id) {
        /* Channel did not exist, so create one */
        guild.channels.create(name, { type: 'GUILD_TEXT' }).then(c => {
            c.setParent(category.id);

            if (client.guildsAndChannelsIds.hasOwnProperty(guild.id)) {
                client.guildsAndChannelsIds[guild.id][name] = c.id;
            }
            else {
                client.guildsAndChannelsIds[guild.id] = {};
                client.guildsAndChannelsIds[guild.id][name] = c.id;
            }
        });
    }
    else {
        /* The channel already exists, so save channel id */
        if (client.guildsAndChannelsIds.hasOwnProperty(guild.id)) {
            client.guildsAndChannelsIds[guild.id][name] = channel.id;
        }
        else {
            client.guildsAndChannelsIds[guild.id] = {};
            client.guildsAndChannelsIds[guild.id][name] = channel.id;
        }
    }
}