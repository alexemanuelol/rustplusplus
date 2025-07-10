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

import { guildInstanceManager as gim, credentialsManager as cm, fcmListenerManager as flm } from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { Credentials } from '../managers/credentialsManager';
import * as types from '../utils/types';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'guildMemberRemove';
export const once = false;

export async function execute(dm: DiscordManager, member: discordjs.GuildMember) {
    const associatedSteamIds: types.SteamId[] = [];

    /* Update credentials associated guilds */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        if (credentials.discordUserId !== member.id) continue;
        if (!credentials.associatedGuilds.includes(member.guild.id)) continue;

        associatedSteamIds.push(steamId);
        credentials.associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);

        /* If no longer part of any guild, stop fcm listener and remove credentials */
        if (credentials.associatedGuilds.length === 0) {
            flm.stopListener(steamId);
            cm.deleteCredentials(steamId);
            continue;
        }

        cm.updateCredentials(steamId);
    }

    /* Remove pairingData associated with the removed member */
    const gInstance = gim.getGuildInstance(member.guild.id) as GuildInstance;
    for (const serverId of Object.keys(gInstance.pairingDataMap)) {
        for (const steamId of Object.keys(gInstance.pairingDataMap[serverId])) {
            if (associatedSteamIds.includes(steamId)) {
                delete gInstance.pairingDataMap[serverId][steamId];
            }
        }

        if (Object.keys(gInstance.pairingDataMap[serverId]).length === 0) {
            delete gInstance.pairingDataMap[serverId];
        }
    }

    /* If the member was a requester for any server, clear it */
    for (const server of Object.values(gInstance.serverInfoMap)) {
        if (server.requesterSteamId === null) continue;

        if (associatedSteamIds.includes(server.requesterSteamId)) {
            server.requesterSteamId = null;
            // TODO! Turn off rustplus instance if no requesterSteamId is set.
            // Update server embed because requesterSteamId is removed.
        }
    }

    gim.updateGuildInstance(member.guild.id);
}