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

import * as rp from 'rustplus-ts';
import * as discordjs from 'discord.js';

import { log, guildInstanceManager as gim, localeManager as lm, discordManager as dm } from '../../index';
import * as discordMessages from '../discordUtils/discordMessages';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'pop';

export async function execute(rpInstance: RustPlusInstance, args: string[],
    message: rp.AppTeamMessage | discordjs.Message):
    Promise<boolean> {
    const fn = `[prefixCommand: ${name}]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    const isInGame = Object.hasOwn(message, 'steamId') ? true : false;
    const guildId = rpInstance.guildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    if (rpInstance.rpInfo === null) return false;

    const population = lm.getIntl(language, 'populationPlayers', {
        current: `${rpInstance.rpInfo.appInfo.players}`,
        max: `${rpInstance.rpInfo.appInfo.maxPlayers}`
    });
    const queue = rpInstance.rpInfo.isQueue() ? lm.getIntl(language, 'populationQueue', {
        number: `${rpInstance.rpInfo.appInfo.queuedPlayers}`
    }) : '';

    const response = `${population}${queue}`;

    if (isInGame) {
        rpInstance.inGameTeamChatQueueMessage([response]);
    }
    else {
        discordMessages.sendPrefixCommandResponseMessage(dm, guildId, response);
    }
    log.info(`${fn} ${response}`, logParam);

    return true;
}