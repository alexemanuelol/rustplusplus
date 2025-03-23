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

import { guildInstanceManager as gim, log, credentialsManager as cm } from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { Credentials } from '../managers/credentialsManager';

export const name = 'guildDelete';
export const once = false;

export async function execute(dm: DiscordManager, guild: discordjs.Guild) {
    const funcName = `[discordEvent: ${name}]`;
    const logParam = { guildId: guild.id };

    log.info(`${funcName} Client left guild.`, logParam);

    /* Update credentials associated guilds, remove credentials/fcm listeners for users that are no longer part of
       the guild. */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;

        credentials.associatedGuilds = credentials.associatedGuilds.filter(guildId => guildId !== guild.id);

        if (credentials.associatedGuilds.length === 0) {
            // TODO! Remove from fcm listener

            cm.deleteCredentials(steamId);
            continue;
        }

        cm.updateCredentials(steamId);
    }

    // TODO! turn off and remove rustplus instance from manager for guild

    /* Delete guild instance file last. */
    gim.deleteGuildInstance(guild.id);
}