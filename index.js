const fs = require('fs');
const Discord = require('discord.js');
const DiscordBot = require('./structures/DiscordBot');

/* If Logs directory does not exist, create it */
if (!fs.existsSync(`${__dirname}/logs`)) {
    fs.mkdirSync(`${__dirname}/logs`);
}

const client = new DiscordBot({ intents: [Discord.Intents.FLAGS.GUILDS] });
client.build();

exports.client = client;