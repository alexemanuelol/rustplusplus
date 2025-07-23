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

export const name = 'guildCreate';
export const once = false;

export async function execute(dm: DiscordManager, guild: discordjs.Guild) {
    const fn = `[discordEvent: ${name}]`;
    const logParam = {
        guildId: guild.id
    };

    log.info(`${fn} Client joined guild.`, logParam);

    if (gim.getGuildInstance(guild.id) === null) {
        gim.addNewGuildInstance(guild.id);
    }

    await dm.registerGuildSlashCommands(guild);
    await dm.setupGuild(guild);
}