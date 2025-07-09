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

    /* Update credentials associated guilds, remove credentials/fcm listeners for the user if no longer part of
       any guilds. */
    const credentialSteamIds = cm.getCredentialSteamIds();
    for (const steamId of credentialSteamIds) {
        const credentials = cm.getCredentials(steamId) as Credentials;
        if (credentials.discordUserId !== member.id) continue;

        associatedSteamIds.push(steamId);
        credentials.associatedGuilds = credentials.associatedGuilds.filter(guildId => guildId !== member.guild.id);

        if (credentials.associatedGuilds.length === 0) {
            flm.stopListener(steamId);
            cm.deleteCredentials(steamId);
            continue;
        }

        cm.updateCredentials(steamId);
    }

    const gInstance = gim.getGuildInstance(member.guild.id) as GuildInstance;
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

    for (const content of Object.values(gInstance.serverInfoMap)) {
        if (content.requesterSteamId === null) continue;

        if (associatedSteamIds.includes(content.requesterSteamId)) {
            content.requesterSteamId = null;
            // TODO! Turn off rustplus instance if no requesterSteamId is set.
            // Update server embed because requesterSteamId is removed.
        }
    }

    gim.updateGuildInstance(member.guild.id);
}