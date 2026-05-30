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

import { log, guildInstanceManager as gim, localeManager as lm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { Languages } from '../managers/LocaleManager';

export const name = 'note';

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
    const serverInfo = gInstance.serverInfoMap[rpInstance.serverId];
    const language = gInstance.generalSettings.language;

    if (args.length === 0) {
        const str = lm.getIntl(language, 'argumentMissing');
        rpInstance.sendPrefixCommandResponse(str, inGame);
        log.info(`${fn} ${str}`, logParam);
        return true;
    }

    const response: string[] = [];
    const subcommand = args[0];
    switch (subcommand) {
        case lm.getIntl(Languages.ENGLISH, 'subcommandList'):
        case lm.getIntl(language, 'subcommandList'): {
            if (Object.keys(serverInfo.noteMap).length === 0) {
                response.push(lm.getIntl(language, 'noRegisteredNotes'));
            }
            else {
                for (const [index, note] of Object.entries(serverInfo.noteMap)) {
                    response.push(`${index}: ${note}`);
                }
            }
        } break;

        case lm.getIntl(Languages.ENGLISH, 'subcommandAdd'):
        case lm.getIntl(language, 'subcommandAdd'): {
            if (args.length < 2) {
                response.push(language, 'missingNoteArgument');
                break;
            }

            const note = args.slice(1).join(' ');
            let index = 0;
            while (Object.keys(serverInfo.noteMap).map(Number).includes(index)) {
                index += 1;
            }

            serverInfo.noteMap[index] = note;
            gim.updateGuildInstance(guildId);

            response.push(lm.getIntl(language, 'noteAdded'));
        } break;

        case lm.getIntl(Languages.ENGLISH, 'subcommandRemove'):
        case lm.getIntl(language, 'subcommandRemove'): {
            if (args.length < 2) {
                response.push(language, 'missingIndexArgument');
                break;
            }

            const index = parseInt(args[1]);
            if (isNaN(index)) {
                response.push(lm.getIntl(language, 'indexInvalid'));
                break;
            }

            if (!Object.hasOwn(serverInfo.noteMap, index)) {
                response.push(lm.getIntl(language, 'noteDoesNotExist', { index: `${index}` }));
                break;
            }

            delete serverInfo.noteMap[index];
            gim.updateGuildInstance(guildId);

            response.push(lm.getIntl(language, 'noteRemoved'));
        } break;

        default: {
            response.push(lm.getIntl(language, 'invalidSubcommand'));
        } break;
    }

    //if (response.length === 0) {
    //    response.
    //}

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}