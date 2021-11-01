const CATEGORY = 'rustPlusPlus';
const EVENTS = 'events';
const ALERTS = 'alerts';
const COMMANDS = 'commands';
const SWITCHES = 'switches';

module.exports = (client, guild) => {
    let category = guild.channels.cache.find(cat => cat.name === CATEGORY);

    if (category !== undefined && category.type === 'GUILD_CATEGORY') {
        /* The category 'rustPlusPlus' already exist, does the channels under the category exist too? */
        addTextChannel(EVENTS, category, client, guild);
        addTextChannel(ALERTS, category, client, guild);
        addTextChannel(COMMANDS, category, client, guild);
        addTextChannel(SWITCHES, category, client, guild);
    }
    else {
        /* The category 'rustPlusPlus' does not exist, so create it and the channels too */
        guild.channels.create(CATEGORY, {
            type: 'GUILD_CATEGORY'
        }).then(cat => {
            /* The category 'rustPlusPlus' was created, create the channels under the category too */
            addTextChannel(EVENTS, cat, client, guild);
            addTextChannel(ALERTS, cat, client, guild);
            addTextChannel(COMMANDS, cat, client, guild);
            addTextChannel(SWITCHES, cat, client, guild);
        });
    }
};

function addTextChannel(name, category, client, guild) {
    let channel = guild.channels.cache.find(c => c.name === name);

    if (channel === undefined || channel.parentId !== category.id) {
        guild.channels.create(name, { type: 'GUILD_TEXT' }).then(c => {
            c.setParent(category.id);

            if (client.guildsAndChannels.hasOwnProperty(guild.id)) {
                client.guildsAndChannels[guild.id][name] = c.id;
            }
            else {
                client.guildsAndChannels[guild.id] = {};
                client.guildsAndChannels[guild.id][name] = c.id;
            }
        });
    }
    else {
        if (client.guildsAndChannels.hasOwnProperty(guild.id)) {
            client.guildsAndChannels[guild.id][name] = channel.id;
        }
        else {
            client.guildsAndChannels[guild.id] = {};
            client.guildsAndChannels[guild.id][name] = channel.id;
        }
    }
}