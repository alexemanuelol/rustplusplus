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

import { guildInstanceManager as gim, rustPlusManager as rpm } from '../../index';
import * as types from '../utils/types';
import { DiscordManager } from '../managers/discordManager';
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
    const guildId = message.guildId as types.GuildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

    if (message.author.bot) return;
    if (gInstance.serverToView === null) return;
    if (gInstance.blacklist.userIds.includes((message.member as discordjs.GuildMember).id)) return;

    const rpInstance = rpm.getInstance(guildId, gInstance.serverToView);
    if (!rpInstance) return;

    if (message.channelId === gInstance.guildChannelIds.commands) {
        rpInstance.prefixCommandHandler(message);
    }
    else if (message.channelId === gInstance.guildChannelIds.teamchat) {
        rpInstance.inGameTeamChatQueueMessage(`${message.author.username}: ${message.cleanContent}`);
    }
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function handleDirectMessage(dm: DiscordManager, message: discordjs.Message) {
    /* TBD */
}