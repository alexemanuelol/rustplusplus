/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';

import { guildInstanceManager as gim } from '../../index';
import * as types from '../utils/types';
import { DiscordManager } from '../managers/discordManager';
import { sendDiscordVoiceMessage } from '../discordUtils/discordVoice';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'messageCreate';
export const once = false;

export async function execute(dm: DiscordManager, message: discordjs.Message) {
    /* Ignore messages from bots */
    if (message.author.bot) return;

    if (message.guild) {
        /* Message in a guild */
        await handleGuildMessage(dm, message);
    }
    else {
        /* Direct message */
        await handleDirectMessage(dm, message);
    }
}

async function handleGuildMessage(dm: DiscordManager, message: discordjs.Message) {
    // TODO! Temporary to test bot voice
    const guildId = message.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    if (message.channelId === gInstance.guildChannelIds.commands && message.cleanContent.startsWith('.voice ')) {
        const text = message.cleanContent.replace(/^\.voice\s*/, '');
        await sendDiscordVoiceMessage(guildId, text);
    }

    // TODO!
    // Check what guild the message is created in
    // Check if the author of the message is part of blacklist
    // Is the channel commands? Then call the command
    // I sthe channel teamchat? Then forward it to teamchat ingame
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function handleDirectMessage(dm: DiscordManager, message: discordjs.Message) {
    /* TBD */
}