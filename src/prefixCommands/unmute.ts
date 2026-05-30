/*
    Copyright (C) 2026 Alexander Emanuelsson (alexemanuelol)

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
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import * as discordMessages from '../discordUtils/discordMessages';

export const name = 'unmute';

export async function execute(rpInstance: RustPlusInstance, args: string[],
    message: rp.AppTeamMessage | discordjs.Message):
    Promise<boolean> {
    const fn = `[prefixCommand: ${name}]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    const inGame = Object.hasOwn(message, 'steamId') ? true : false;
    const guildId = rpInstance.guildId;
    const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;

    const valueChanged = (!gInstance.generalSettings.inGameChatBotUnmuted) ? true : false;
    gInstance.generalSettings.inGameChatBotUnmuted = true;
    gim.updateGuildInstance(guildId);

    const response: string[] = [];

    /* If value changed, update the setting in the settings channel in discord. */
    if (valueChanged) {
        await discordMessages.sendSettingInGameChatBotUnmutedMessage(dm, guildId, true, false);

        response.push(lm.getIntl(language, 'inGameBotMessagesUnmuted'));
    }
    else {
        response.push(lm.getIntl(language, 'inGameBotMessagesAlreadyUnmuted'));
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}