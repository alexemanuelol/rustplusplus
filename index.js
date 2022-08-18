const fs = require('fs');
const Discord = require('discord.js');
const DiscordBot = require('./src/structures/DiscordBot');

/* If Logs directory does not exist, create it */
if (!fs.existsSync(`${__dirname}/logs`)) {
    fs.mkdirSync(`${__dirname}/logs`);
}

const client = new DiscordBot({
    intents: [Discord.GatewayIntentBits.Guilds, Discord.GatewayIntentBits.GuildMessages],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

client.build();

exports.client = client;
