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

import { log } from '../../index';
import { DiscordManager } from '../managers/discordManager';

export const name = 'guildUnavailable';
export const once = false;

export async function execute(dm: DiscordManager, guild: discordjs.Guild) {
    const fName = `[discordEvent: ${name}]`;
    const logParam = { guildId: guild.id };

    log.warn(`${fName} '${guild.name}' is now unavailable.`, logParam);
}