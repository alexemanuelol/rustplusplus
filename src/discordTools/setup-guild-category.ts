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

import { Guild, CategoryChannel, ChannelType } from 'discord.js';

import { client } from '../../index';
import * as discordTools from './discord-tools';
const PermissionHandler = require('../handlers/permissionHandler.js');

export async function setupGuildCategory(guild: Guild):
    Promise<CategoryChannel | undefined> {
    const guildId = guild.id;
    const instance = client.getInstance(guildId);

    let category = undefined;
    if (instance.channelIds.category !== null) {
        category = await discordTools.getCategory(guildId, instance.channelIds.category);
    }
    if (category === undefined) {
        category = await discordTools.createChannel(guildId, 'rustplusplus',
            ChannelType.GuildCategory) as CategoryChannel;
        if (!category) return undefined;
        instance.channelIds.category = category.id;
        client.setInstance(guildId, instance);
    }

    const perms = PermissionHandler.getPermissionsReset(client, guild, false);

    try {
        await category.permissionOverwrites.set(perms);
    }
    catch (e) {
        /* Ignore */
    }

    return category;
}