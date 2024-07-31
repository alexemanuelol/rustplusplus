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

import { client } from '../../index';
import * as discordTools from './discord-tools';

export async function removeGuildChannels(guild: Guild) {
    const guildId = guild.id;
    const instance = client.getInstance(guildId);

    let categoryId = null;
    for (const [channelName, channelId] of Object.entries(instance.channelIds)) {
        if (channelName === 'category') {
            categoryId = channelId;
            continue;
        }

        await discordTools.deleteChannel(guildId, channelId as string);
        instance.channelIds[channelName] = null;
    }

    await discordTools.deleteChannel(guildId, categoryId as string);

    instance.channelIds['category'] = null;
    client.setInstance(guildId, instance);
}