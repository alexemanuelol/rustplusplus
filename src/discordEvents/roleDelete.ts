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

export const name = 'roleDelete';
export const once = false;

export async function execute(dm: DiscordManager, role: discordjs.Role) {
    const fn = `[discordEvent: ${name}]`;
    const logParam = {
        guildId: role.guild.id
    };

    const guild = role.guild;
    const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;

    let resetPermissions = false;
    if (gInstance.roleIds.includes(role.id)) {
        log.info(`${fn} '${role.id}' was deleted and part of roleIds, permission reset required.`, logParam);
        resetPermissions = true;
    }
    if (gInstance.adminIds.includes(role.id)) {
        log.info(`${fn} '${role.id}' was deleted and part of adminIds, permission reset required.`, logParam);
        resetPermissions = true;
    }

    if (resetPermissions) {
        await dm.setupGuild(guild);
    }
}