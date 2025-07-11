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

    const activeGuildIds = await dm.getGuildIds();

    /* Create empty guild instance files for new guilds */
    for (const guildId of activeGuildIds) {
        if (gim.getGuildInstance(guildId) === null) {
            gim.addNewGuildInstance(guildId);
        }
    }

    /* Remove guild instance files that are no longer active */
    const guildInstanceIds = gim.getGuildInstanceGuildIds();
    const inactiveGuildIds: types.GuildId[] = guildInstanceIds.filter(guildId => !activeGuildIds.includes(guildId));
    for (const guildId of inactiveGuildIds) {
        gim.deleteGuildInstance(guildId);
    }

    /* Check if credentials have no associated guilds */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;

        const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
        const notAssociatedGuilds = activeGuildIds.filter(guildId =>
            !associatedGuilds.includes(guildId));

        /* Remove pairingData associated with the steamId of the removed member */
        for (const guildId of notAssociatedGuilds) {
            const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

            let changed = false;
            for (const [serverId, steamIds] of Object.entries(gInstance.pairingDataMap)) {
                if (steamIds[steamId]) {
                    delete steamIds[steamId];
                    changed = true;
                }

                if (Object.keys(steamIds).length === 0) {
                    delete gInstance.pairingDataMap[serverId];
                    changed = true;
                }
            }

            if (changed) gim.updateGuildInstance(guildId);
        }

        /* If no longer associated with any guilds, stop fcm listener and remove credentials */
        if (associatedGuilds.length === 0) {
            flm.stopListener(steamId);
            cm.deleteCredentials(steamId);
            continue;
        }

        cm.addExpireTimeout(steamId, dm);
    }

    /* Update requesterSteamId */
    for (const guildId of activeGuildIds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
        for (const [serverId, serverInfo] of Object.entries(gInstance.serverInfoMap)) {
            if (serverInfo.requesterSteamId === null) continue;

            if (!(gInstance.pairingDataMap[serverId]?.[serverInfo.requesterSteamId])) {
                serverInfo.requesterSteamId = null;
            }
        }
        gim.updateGuildInstance(guildId);
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
        for (const [serverId, serverInfo] of Object.entries(gInstance.serverInfoMap)) {
            if (serverInfo.active) {
                if (gim.isPairingDataValid(gInstance, serverInfo)) {
                    if (rpm.addInstance(guild.id, serverId)) {
                        const rpInstance = rpm.getInstance(guild.id, serverId);
                        if (rpInstance) {
                            await rpInstance.startup();
                        }
                    }
                }
                else {
                    // TODO! Update server embed and disable connect/disconnect button till requesterSteamId is valid
                }
            }
        }
    }

    // TODO! global variable uptimeBot set new time.
}