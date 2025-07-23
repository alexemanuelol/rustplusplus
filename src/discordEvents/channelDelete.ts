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

import { log, guildInstanceManager as gim } from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'channelDelete';
export const once = false;

export async function execute(dm: DiscordManager, channel: discordjs.DMChannel | discordjs.GuildChannel) {
    if (channel.isDMBased()) return;

    const fn = `[discordEvent: ${name}]`;
    const logParam = {
        guildId: channel.guild.id
    };

    const gInstance = gim.getGuildInstance(channel.guild.id) as GuildInstance;

    let changed = false;
    for (const [channelName, channelId] of Object.entries(gInstance.guildChannelIds)) {
        if (channelId === channel.id) {
            gInstance.guildChannelIds[channelName as keyof typeof gInstance.guildChannelIds] = null;
            log.warn(`${fn} '${channelName}' (${channelId}) was deleted.`, logParam);
            changed = true;

            // TODO! Send a direct message to the person removing the channel saying how to restore.
        }
    }

    if (changed) gim.updateGuildInstance(channel.guild.id);
}