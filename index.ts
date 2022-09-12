const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const DiscordBot = require('./src/structures/DiscordBot');

createMissingDirectories();

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false
});

client.build();

function createMissingDirectories() {
    if (!Fs.existsSync(Path.join(__dirname, 'src/logs'))) {
        Fs.mkdirSync(Path.join(__dirname, 'src/logs'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'src/instances'))) {
        Fs.mkdirSync(Path.join(__dirname, 'src/instances'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'src/credentials'))) {
        Fs.mkdirSync(Path.join(__dirname, 'src/credentials'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'src/resources/images/maps'))) {
        Fs.mkdirSync(Path.join(__dirname, 'src/resources/images/maps'));
    }
}

process.on('unhandledRejection', error => {
    client.log(`Unhandled Rejection: ${error}`);
});

exports.client = client;
