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

import { guildInstanceManager as gim, credentialsManager as cm } from '../../index';
import { DiscordManager } from '../managers/discordManager';
import { Credentials } from '../managers/credentialsManager';
import * as types from '../utils/types';

export const name = 'guildMemberRemove';
export const once = false;

export async function execute(dm: DiscordManager, member: discordjs.GuildMember) {
    const associatedSteamIds: types.SteamId[] = [];

    /* Update credentials associated guilds, remove credentials/fcm listeners for the user if no longer part of
       any guilds. */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        if (credentials.discordUserId !== member.id) continue;

        associatedSteamIds.push(steamId);
        credentials.associatedGuilds = credentials.associatedGuilds.filter(guildId => guildId !== member.guild.id);

        if (credentials.associatedGuilds.length === 0) {
            // TODO! Remove from fcm listener

            cm.deleteCredentials(steamId);
            continue;
        }

        cm.updateCredentials(steamId);
    }

    const gInstance = gim.getGuildInstance(member.guild.id);
    if (gInstance !== null) {
        Object.keys(gInstance.pairingDataMap).forEach(serverId => {
            Object.keys(gInstance.pairingDataMap[serverId]).forEach(steamId => {
                if (associatedSteamIds.includes(steamId as types.SteamId)) {
                    delete gInstance.pairingDataMap[serverId][steamId];
                }
            });

            if (Object.keys(gInstance.pairingDataMap[serverId]).length === 0) {
                delete gInstance.pairingDataMap[serverId];
            }
        });

        gim.updateGuildInstance(member.guild.id);
    }
}