const Discord = require('discord.js');
const Fs = require('fs');

const DiscordBot = require('./src/structures/DiscordBot');

/* If Logs directory does not exist, create it */
if (!Fs.existsSync(`${__dirname}/src/logs`)) {
    Fs.mkdirSync(`${__dirname}/src/logs`);
}

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

client.build();

exports.client = client;
