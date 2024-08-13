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

import { Guild } from 'discord.js';

import * as guildInstance from '../util/guild-instance';
import * as discordTools from './discord-tools';
import * as discordMessages from './discord-messages';

export async function setupTrackers(guild: Guild) {
    const guildId = guild.id;
    const instance = guildInstance.readGuildInstanceFile(guildId);

    if (instance.channelIds.trackers !== null) {
        await discordTools.clearTextChannel(guildId, instance.channelIds.trackers, 100);
    }

    for (const trackerId in instance.trackers) {
        await discordMessages.sendTrackerMessage(guildId, trackerId);
    }
}