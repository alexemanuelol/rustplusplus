const fs = require('fs');
const Discord = require('discord.js');
const DiscordBot = require('./src/structures/DiscordBot');

/* If Logs directory does not exist, create it */
if (!fs.existsSync(`${__dirname}/src/logs`)) {
    fs.mkdirSync(`${__dirname}/src/logs`);
}

const client = new DiscordBot({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

client.build();

exports.client = client;
