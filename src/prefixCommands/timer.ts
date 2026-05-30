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
import { secondsToFullScale, getSecondsFromStringTime, Timer } from '../utils/timer';

export const name = 'timer';

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
            if (Object.keys(rpInstance.timers).length === 0) {
                response.push(lm.getIntl(language, 'noRegisteredTimers'));
            }
            else {
                for (const [index, timer] of Object.entries(rpInstance.timers)) {
                    const timeLeftSeconds = Math.floor(timer.timer.getTimeLeftMs() / 1000);
                    const timeLeftString = secondsToFullScale(timeLeftSeconds);
                    response.push(lm.getIntl(language, 'timeLeftTimer', {
                        index: index,
                        time: timeLeftString,
                        message: timer.message
                    }));
                }
            }
        } break;

        case lm.getIntl(Languages.ENGLISH, 'subcommandAdd'):
        case lm.getIntl(language, 'subcommandAdd'): {
            if (args.length < 3) {
                response.push(language, 'argumentMissing');
                break;
            }

            const argTime = args[1];
            const argMessage = args.slice(2).join(' ');

            const time = getSecondsFromStringTime(argTime);
            if (!time) {
                response.push(lm.getIntl(language, 'timeArgumentFormatInvalid'));
                break;
            }

            let index = 0;
            while (Object.keys(rpInstance.timers).map(Number).includes(index)) {
                index += 1;
            }

            const timerMessage = lm.getIntl(language, 'timerTriggered', {
                message: argMessage
            });

            rpInstance.timers[index] = {
                index: index,
                message: argMessage,
                timer: new Timer(
                    () => {
                        rpInstance.inGameTeamChatQueueMessage(timerMessage);
                        delete rpInstance.timers[index];
                    },
                    time * 1000
                )
            };
            rpInstance.timers[index].timer.start();

            response.push(lm.getIntl(language, 'timerSet', {
                time: secondsToFullScale(time)
            }));
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

            if (!Object.hasOwn(rpInstance.timers, index)) {
                response.push(lm.getIntl(language, 'timerDoesNotExist', { index: `${index}` }));
                break;
            }

            rpInstance.timers[index].timer.stop();
            delete rpInstance.timers[index];
            gim.updateGuildInstance(guildId);

            response.push(lm.getIntl(language, 'removedTimer'));
        } break;

        default: {
            response.push(lm.getIntl(language, 'invalidSubcommand'));
        } break;
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}