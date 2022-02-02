const fs = require('fs');
const Discord = require('discord.js');
const DiscordBot = require('./src/structures/DiscordBot');

/* If Logs directory does not exist, create it */
if (!fs.existsSync(`${__dirname}/src/logs`)) {
    fs.mkdirSync(`${__dirname}/src/logs`);
}

const client = new DiscordBot({ intents: [Discord.Intents.FLAGS.GUILDS], retryLimit: 2 });
client.build();

exports.client = client;
