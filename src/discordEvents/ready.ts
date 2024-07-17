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

import { ActivityType } from 'discord.js';
import * as path from 'path';

import { log } from '../../index';
import * as guildInstance from '../util/guild-instance';
import * as credentials from '../util/credentials';
const Config = require('../../config');
const { DiscordBot } = require('../structures/DiscordBot.js');
const BattlemetricsHandler = require('../handlers/battlemetricsHandler.js');

export const name = 'ready';
export const once = true;

export async function execute(client: typeof DiscordBot) {
    for (const guild of client.guilds.cache) {
        const guildId = guild[0];
        guildInstance.createGuildInstanceFile(guildId);
        const gInstance = guildInstance.readGuildInstanceFile(guildId);
        client.setInstance(guildId, gInstance); // TODO! TEMP

        client.fcmListenersLite[guildId] = new Object();
    }

    credentials.createCredentialsFile();

    client.loadGuildsIntl();
    log.info(client.intlGet(null, 'loggedInAs', { name: client.user.tag }));

    try {
        await client.user.setUsername(Config.discord.username);
    }
    catch (e) {
        log.warn(client.intlGet(null, 'ignoreSetUsername'));
    }

    try {
        await client.user.setAvatar(path.join(__dirname, '..', 'resources/images/rustplusplus_logo.png'));
    }
    catch (e) {
        log.warn(client.intlGet(null, 'ignoreSetAvatar'));
    }

    client.user.setPresence({
        activities: [{ name: '/help', type: ActivityType.Listening }],
        status: 'online'
    });

    client.uptimeBot = new Date();

    for (const guildArray of client.guilds.cache) {
        const guild = guildArray[1];

        try {
            await guild.members.me.setNickname(Config.discord.username);
        }
        catch (e) {
            log.warn(client.intlGet(null, 'ignoreSetNickname'));
        }
        await client.syncCredentialsWithUsers(guild);
        await client.setupGuild(guild);
    }

    await client.updateBattlemetricsInstances();
    BattlemetricsHandler.handler(client, true);
    client.battlemetricsIntervalId = setInterval(BattlemetricsHandler.handler, 60000, client, false);

    client.createRustplusInstancesFromConfig();
}