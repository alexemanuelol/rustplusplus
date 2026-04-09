/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const DiscordBot = require('./src/structures/DiscordBot');

createMissingDirectories();

// FIXED: Discord.js v14 compatible options
// Removed: disableEveryone (removed in v14)
// Changed: restRequestTimeout -> rest.timeout
// Changed: retryLimit -> rest.retries
const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates
    ],
    rest: {
        timeout: 60000,
        retries: 2
    }
    // NOTE: disableEveryone was removed in discord.js v14
});

client.build();

function createMissingDirectories() {
    const directories = ['logs', 'instances', 'credentials', 'maps'];
    
    for (const dir of directories) {
        const dirPath = Path.join(__dirname, dir);
        if (!Fs.existsSync(dirPath)) {
            Fs.mkdirSync(dirPath, { recursive: true });
        }
    }
}

process.on('unhandledRejection', error => {
    client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'unhandledRejection', {
        error: error
    }), 'error');
    console.log(error);
});

process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
    setTimeout(() => {
        process.exit(1);
    }, 1000);
});

exports.client = client;
