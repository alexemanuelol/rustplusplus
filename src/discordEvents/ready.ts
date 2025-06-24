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

import * as path from 'path';

import {
    guildInstanceManager as gim,
    config,
    log,
    credentialsManager as cm,
    fcmListenerManager as flm,
    rustPlusManager as rpm
} from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { Credentials } from '../managers/credentialsManager';
import * as types from '../utils/types';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'ready';
export const once = true;

export async function execute(dm: DiscordManager) {
    const fName = `[discordEvent: ${name}]`;

    log.info(`${fName} Logged in as '${dm.client.user?.tag ?? 'Unknown User'}'.`);

    /* Check if there are new guilds, if so, create empty guild instance files for them. */
    const activeGuildIds: types.GuildId[] = [];
    for (const guild of dm.client.guilds.cache.values()) {
        if (gim.getGuildInstance(guild.id) === null) {
            gim.addNewGuildInstance(guild.id);
        }
        activeGuildIds.push(guild.id);
    }

    /* Remove guild instances that are no longer active. */
    const guildInstanceIds = gim.getGuildInstanceGuildIds();
    const inactiveGuildIds: types.GuildId[] = guildInstanceIds.filter(guildId => !activeGuildIds.includes(guildId));
    for (const guildId of inactiveGuildIds) {
        gim.deleteGuildInstance(guildId);
    }

    /* Update credentials associated guilds, remove credentials/fcm listeners for users that are no longer part of
       the valid guilds. */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        const discordUserId = credentials.discordUserId;

        credentials.associatedGuilds = credentials.associatedGuilds.filter(guildId =>
            !inactiveGuildIds.includes(guildId));

        const validGuilds: types.GuildId[] = [];
        for (const guildId of credentials.associatedGuilds) {
            const member = await dm.getMember(guildId, discordUserId);
            if (member) {
                validGuilds.push(guildId);
            }
        }
        credentials.associatedGuilds = validGuilds;

        if (credentials.associatedGuilds.length === 0) {
            flm.stopListener(steamId);
            cm.deleteCredentials(steamId);
            continue;
        }

        cm.addExpireTimeout(steamId, dm);
        cm.updateCredentials(steamId);
    }

    try {
        if (config.discord.enforceNameChange) {
            await dm.client.user?.setUsername(config.discord.username);
        }
    }
    catch {
        log.warn(`${fName} Could not set username '${config.discord.username}'.`);
    }

    try {
        if (config.discord.enforceAvatarChange) {
            await dm.client.user?.setAvatar(path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png'));
        }
    }
    catch {
        log.warn(`${fName} Could not set avatar.`);
    }

    await dm.registerGlobalSlashCommands();
    for (const guild of dm.client.guilds.cache.values()) {
        await dm.registerGuildSlashCommands(guild);
        await dm.setupGuild(guild);

        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        for (const [serverId, content] of Object.entries(gInstance.serverInfoMap)) {
            if (content.active) {
                if (rpm.addInstance(guild.id, serverId)) {
                    const rpInstance = rpm.getInstance(guild.id, serverId);
                    if (rpInstance) {
                        await rpInstance.startup();
                    }
                }
            }
        }
    }

    // TODO! global variable uptimeBot set new time.
}