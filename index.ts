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
require('dotenv').config();

const Fs = require('fs');
const Path = require('path');

const DiscordBot = require('./src/structures/DiscordBot');

createMissingDirectories();

const client = new DiscordBot({
    intents: [
        Discord.GatewayIntentBits.Guilds,
        Discord.GatewayIntentBits.GuildMessages,
        Discord.GatewayIntentBits.MessageContent,
        Discord.GatewayIntentBits.GuildMembers,
        Discord.GatewayIntentBits.GuildVoiceStates],
    retryLimit: 2,
    restRequestTimeout: 60000,
    disableEveryone: false,
    // Memory optimization options
    makeCache: Discord.Options.cacheWithLimits({
        MessageManager: 50, // Limit message cache to 50 messages per channel
        ChannelManager: 200, // Limit channel cache
        GuildMemberManager: 100, // Limit member cache per guild
        UserManager: 200, // Limit user cache
        PresenceManager: 0, // Disable presence cache (not needed)
        StageInstanceManager: 0, // Disable stage instance cache
        VoiceStateManager: 50, // Limit voice state cache
        ThreadManager: 25, // Limit thread cache
        ReactionManager: 25, // Limit reaction cache
        ReactionUserManager: 0, // Disable reaction user cache
        ApplicationCommandManager: 0, // Disable application command cache
        BaseGuildEmojiManager: 0, // Disable emoji cache
        GuildEmojiManager: 0, // Disable guild emoji cache
        GuildStickerManager: 0, // Disable sticker cache
        GuildScheduledEventManager: 0, // Disable scheduled event cache
        GuildInviteManager: 0, // Disable invite cache
        GuildBanManager: 0, // Disable ban cache
        AutoModerationRuleManager: 0, // Disable auto moderation cache
        ThreadMemberManager: 0 // Disable thread member cache
    }),
    // Sweep options for automatic cache cleanup
    sweepers: {
        messages: {
            interval: 300, // Sweep every 5 minutes
            lifetime: 1800 // Remove messages older than 30 minutes
        },
        users: {
            interval: 600, // Sweep every 10 minutes
            filter: () => (user: any) => user.bot && user.id !== client.user.id // Keep only non-bot users and self
        },
        guildMembers: {
            interval: 900, // Sweep every 15 minutes
            filter: () => (member: any) => member.id !== client.user.id // Keep only self
        },
        threads: {
            interval: 3600, // Sweep every hour
            lifetime: 14400 // Remove threads older than 4 hours
        }
    },
    // Additional memory optimizations
    allowedMentions: {
        parse: ['users', 'roles'], // Only parse user and role mentions
        repliedUser: false // Don't mention replied user by default
    },
    // Reduce WebSocket options for memory efficiency
    ws: {
        compress: true, // Enable compression to reduce bandwidth
        large_threshold: 50 // Reduce large guild threshold
    }
});

client.build();

function createMissingDirectories() {
    if (!Fs.existsSync(Path.join(__dirname, 'logs'))) {
        Fs.mkdirSync(Path.join(__dirname, 'logs'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'instances'))) {
        Fs.mkdirSync(Path.join(__dirname, 'instances'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'credentials'))) {
        Fs.mkdirSync(Path.join(__dirname, 'credentials'));
    }

    if (!Fs.existsSync(Path.join(__dirname, 'maps'))) {
        Fs.mkdirSync(Path.join(__dirname, 'maps'));
    }
}

process.on('unhandledRejection', error => {
    client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'unhandledRejection', {
        error: error
    }), 'error');
    console.log(error);
});

exports.client = client;
