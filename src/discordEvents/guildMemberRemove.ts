/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import { GuildMember } from 'discord.js';

import * as credentials from '../util/credentials';
const { DiscordBot } = require('../structures/DiscordBot.js');

export const name = 'guildMemberRemove';

export async function execute(client: typeof DiscordBot, member: GuildMember) {
    const guildId = member.guild.id;
    const userId = member.user.id;

    const instance = client.getInstance(guildId); //! TODO Replace with guild-instance
    const creds = credentials.readCredentialsFile();

    const steamId = Object.keys(creds).find(e => creds[e] && creds[e].discordUserId === userId);
    if (steamId === undefined || !(steamId in creds)) return;

    if (steamId === instance.hoster) {
        if (client.fcmListeners[guildId]) {
            client.fcmListeners[guildId].destroy();
        }
        delete client.fcmListeners[guildId];
        instance.hoster = null;
    }
    else {
        if (client.fcmListenersLite[guildId][steamId]) {
            client.fcmListenersLite[guildId][steamId].destroy();
        }
        delete client.fcmListenersLite[guildId][steamId];
    }

    delete creds[steamId];
    credentials.writeCredentialsFile(creds);
    client.setInstance(guildId, instance);
}