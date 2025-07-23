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
import { getVoiceConnection } from '@discordjs/voice';

import { log } from '../../index';
import { DiscordManager } from '../managers/discordManager';
import * as constants from '../utils/constants';
import * as types from '../utils/types';

export const name = 'voiceStateUpdate';
export const once = false;

export async function execute(dm: DiscordManager, oldState: discordjs.VoiceState, newState: discordjs.VoiceState) {
    const fn = `[discordEvent: ${name}]`;
    const logParam = {
        guildId: oldState.guild.id
    };

    const guildId = oldState.guild.id;
    const connection = getVoiceConnection(guildId);

    /* Bot is not in any voice channel */
    if (!connection) return;

    const botChannelId = connection.joinConfig.channelId;
    const memberId = oldState.member?.id;
    const isBot = memberId === dm.client.user?.id;

    if (Object.hasOwn(dm.voiceLeaveTimeouts, guildId)) {
        clearTimeout(dm.voiceLeaveTimeouts[guildId] as NodeJS.Timeout);
        delete dm.voiceLeaveTimeouts[guildId];
    }

    /* If nothing changed */
    if (!oldState.channel && !newState.channel) return;

    /* If a user joins the bot's channel */
    if (!isBot && newState.channel?.id === botChannelId) return;

    /* Determine if we should start a timeout */
    const leftBotChannel = !isBot && oldState.channel?.id === botChannelId &&
        (!newState.channel || newState.channel.id !== botChannelId);
    const botMoved = isBot && oldState.channel?.id !== newState.channel?.id;
    const targetChannel = leftBotChannel ? oldState.channel : (botMoved ? newState.channel : null);

    if (targetChannel && targetChannel.members.size === 1) {
        log.info(`${fn} Started voice leave timer, leaves in ` +
            `${constants.BOT_LEAVE_VOICE_CHAT_TIMEOUT_MS} milliseconds.`, logParam);

        dm.voiceLeaveTimeouts[guildId] = setTimeout(botLeaveVoiceTimeout.bind(null, guildId),
            constants.BOT_LEAVE_VOICE_CHAT_TIMEOUT_MS);
    }
}

function botLeaveVoiceTimeout(guildId: types.GuildId) {
    const connection = getVoiceConnection(guildId);
    if (connection) {
        connection.destroy();
    }
}