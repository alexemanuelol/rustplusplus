/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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
import { VoiceState } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';

import * as constants from '../util/constants';
const { DiscordBot } = require('../structures/DiscordBot.js');

export const name = 'voiceStateUpdate';

export async function execute(client: typeof DiscordBot, oldState: VoiceState, newState: VoiceState) {
    const guildId = oldState.guild.id;

    if (!client.voiceLeaveTimeouts.hasOwnProperty(guildId)) client.voiceLeaveTimeouts[guildId] = null;

    /* No channel involved. */
    if (oldState.channel === null && newState.channel === null) return;

    const connection = getVoiceConnection(guildId);
    if (!connection) return; /* Bot is not in any voice channel. */

    const botChannelId = connection.joinConfig.channelId;
    if (!oldState.member) return; /* is member null? */
    const memberId = oldState.member.id;

    /* If user join same channel as bot */
    if (memberId !== client.user.id && newState.channel !== null && newState.channel.id === botChannelId) {
        clearTimeout(client.voiceLeaveTimeouts[guildId]);
        return;
    }

    let condition = false;
    let channel = null;

    /* If user was in same channel as bot, but not anymore */
    if (memberId !== client.user.id && oldState.channel !== null && oldState.channel.id === botChannelId &&
        (newState.channel === null || (newState.channel !== null && newState.channel.id !== botChannelId))) {
        condition = true;
        channel = oldState.channel;
    }

    if (memberId === client.user.id) {
        condition = true;
        channel = newState.channel;
    }

    if (condition && channel && channel.members.size === 1) {
        client.voiceLeaveTimeouts[guildId] = setTimeout(() => {
            const connection = getVoiceConnection(guildId);
            if (connection) {
                connection.destroy();
            }
        }, constants.BOT_LEAVE_VOICE_CHAT_TIMEOUT_MS);
    }
}