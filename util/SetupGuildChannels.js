const Guilds = require('./guilds.js');

const CATEGORY = 'rustPlusPlus';
const EVENTS = 'events';
const ALERTS = 'alerts';
const COMMANDS = 'commands';
const SWITCHES = 'switches';

module.exports = (guild) => {
    let category = guild.channels.cache.find(cat => cat.name === CATEGORY);

    if (category !== undefined && category.type === 'GUILD_CATEGORY') {
        /* The category 'rustPlusPlus' already exist, does the channels under the category exist too? */
        addTextChannel(EVENTS, category, guild);
        addTextChannel(ALERTS, category, guild);
        addTextChannel(COMMANDS, category, guild);
        addTextChannel(SWITCHES, category, guild);
    }
    else {
        /* The category 'rustPlusPlus' does not exist, so create it and the channels too */
        guild.channels.create(CATEGORY, {
            type: 'GUILD_CATEGORY'
        }).then(cat => {
            /* The category 'rustPlusPlus' was created, create the channels under the category too */
            addTextChannel(EVENTS, cat, guild);
            addTextChannel(ALERTS, cat, guild);
            addTextChannel(COMMANDS, cat, guild);
            addTextChannel(SWITCHES, cat, guild);
        });
    }
};

function addTextChannel(name, category, guild) {
    let channel = guild.channels.cache.find(c => c.name === name);

    if (channel === undefined || channel.parentId !== category.id) {
        guild.channels.create(name, { type: 'GUILD_TEXT' }).then(c => {
            c.setParent(category.id);

            if (Guilds.guilds.hasOwnProperty(guild.id)) {
                Guilds.guilds[guild.id][name] = c.id;
            }
            else {
                Guilds.guilds[guild.id] = {};
                Guilds.guilds[guild.id][name] = c.id;
            }
        });
    }
    else {
        if (Guilds.guilds.hasOwnProperty(guild.id)) {
            Guilds.guilds[guild.id][name] = channel.id;
        }
        else {
            Guilds.guilds[guild.id] = {};
            Guilds.guilds[guild.id][name] = channel.id;
        }
    }
}