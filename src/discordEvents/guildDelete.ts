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

import {
    log, credentialsManager as cm, fcmListenerManager as flm, guildInstanceManager as gim,
    rustPlusManager as rpm
} from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { Credentials } from '../managers/credentialsManager';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'guildDelete';
export const once = false;

export async function execute(dm: DiscordManager, guild: discordjs.Guild) {
    const fn = `[discordEvent: ${name}]`;
    const logParam = {
        guildId: guild.id
    };

    log.info(`${fn} Client left guild.`, logParam);

    /* Check if credentials have no associated guilds */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);

        /* If no longer associated with any guilds, stop fcm listener and remove credentials */
        if (associatedGuilds.length === 0) {
            flm.stopListener(steamId);
            cm.deleteCredentials(steamId);
            continue;
        }
    }

    /* Remove RustPlus instance */
    const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
    for (const serverId of Object.keys(gInstance.serverInfoMap)) {
        rpm.removeInstance(guild.id, serverId);
    }

    /* Delete guild instance file last */
    gim.deleteGuildInstance(guild.id);
}