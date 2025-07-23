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
    credentialsManager as cm,
    fcmListenerManager as flm,
    guildInstanceManager as gim,
    rustPlusManager as rpm
} from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { ConnectionStatus } from '../managers/rustPlusManager';
import { DiscordManager } from '../managers/discordManager';
import { Credentials } from '../managers/credentialsManager';
import * as types from '../utils/types';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'guildMemberRemove';
export const once = false;

export async function execute(dm: DiscordManager, member: discordjs.GuildMember) {
    const associatedSteamIds: types.SteamId[] = [];

    /* Check if credentials have no associated guilds */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        if (credentials.discordUserId !== member.id) continue;

        associatedSteamIds.push(steamId);
        const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);

        /* If no longer associated with any guilds, stop fcm listener and remove credentials */
        if (associatedGuilds.length === 0) {
            flm.stopListener(steamId);
            cm.deleteCredentials(steamId);
            continue;
        }
    }

    /* Remove pairingData associated with the removed member */
    const gInstance = gim.getGuildInstance(member.guild.id) as GuildInstance;
    for (const [serverId, steamIds] of Object.entries(gInstance.pairingDataMap)) {
        for (const steamId of Object.keys(steamIds)) {
            if (associatedSteamIds.includes(steamId)) {
                delete steamIds[steamId];
            }
        }

        if (Object.keys(steamIds).length === 0) {
            delete gInstance.pairingDataMap[serverId];
        }
    }

    /* If the member was a requester for any server, clear it */
    for (const [serverId, serverInfo] of Object.entries(gInstance.serverInfoMap)) {
        if (serverInfo.requesterSteamId === null) continue;

        if (associatedSteamIds.includes(serverInfo.requesterSteamId)) {
            serverInfo.requesterSteamId = null;

            let connectionStatus = ConnectionStatus.Disconnected;
            const rpInstance = rpm.getInstance(member.guild.id, serverId);
            if (rpInstance) {
                connectionStatus = rpInstance.connectionStatus;
            }

            await discordMessages.sendServerMessage(dm, member.guild.id, serverId, connectionStatus);
        }
    }

    gim.updateGuildInstance(member.guild.id);
}