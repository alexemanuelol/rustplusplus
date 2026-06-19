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
import Fuse from 'fuse.js';

import {
    log, guildInstanceManager as gim, localeManager as lm, credentialsManager as cm, discordManager as dm
} from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import * as discordMessages from '../discordUtils/discordMessages';

export const name = 'send';

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

    if (rpInstance.rpTeamInfo === null) return false;

    const callerName = inGame ? (message as rp.AppTeamMessage).name : (message as discordjs.Message).author.username;

    if (args.length < 2) {
        const str = lm.getIntl(language, 'argumentIsMissing');
        rpInstance.sendPrefixCommandResponse(str, inGame);
        log.info(`${fn} ${str}`, logParam);
        return true;
    }

    const argName = args[0];
    const argMessage = args.slice(1).join(' ');

    const fuse = new Fuse([...rpInstance.rpTeamInfo.members.values()], {
        keys: ['appTeamInfoMember.name'],
        threshold: 0.3
    });
    const member = fuse.search(argName)[0]?.item ?? null;

    if (!member) {
        const str = lm.getIntl(language, 'noMemberFoundWithName', { name: argName });
        rpInstance.sendPrefixCommandResponse(str, inGame);
        log.info(`${fn} ${str}`, logParam);
        return true;
    }

    const credentials = cm.getCredentials(member.appTeamInfoMember.steamId);
    if (!credentials) {
        const str = lm.getIntl(language, 'couldNotFindMembersDiscordUserId', { name: argName });
        rpInstance.sendPrefixCommandResponse(str, inGame);
        log.info(`${fn} ${str}`, logParam);
        return true;
    }

    const messageToSend = `${callerName}: ${argMessage}`;
    let response: string;
    if (await discordMessages.sendPrivateMessage(dm, credentials.discordUserId, messageToSend)) {
        response = lm.getIntl(language, 'messageHasBeenSent');
    }
    else {
        response = lm.getIntl(language, 'messageCouldNotBeSent');
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}