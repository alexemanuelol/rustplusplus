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

import { log, guildInstanceManager as gim, localeManager as lm, credentialsManager as cm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { Languages } from '../managers/LocaleManager';
import { RustPlusTeamInfo } from '../structures/rustPlusTeamInfo';
import { getAngleBetweenPoints, getDistance, getPos, getPosString } from '../utils/map';

export const name = 'marker';

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

    if (rpInstance.rpInfo === null) return false;
    if (rpInstance.rpTeamInfo === null) return false;
    if (args.length === 0) {
        const str = lm.getIntl(language, 'argumentMissing');
        rpInstance.sendPrefixCommandResponse(str, inGame);
        log.info(`${fn} ${str}`, logParam);
        return true;
    }

    let callerSteamId = inGame ? (message as rp.AppTeamMessage).steamId : null;
    if (callerSteamId === null) {
        const steamIds = cm.getCredentialSteamIdsFromDiscordUserId((message as discordjs.Message).author.id);

        callerSteamId = steamIds.find(id => [...(rpInstance.rpTeamInfo as RustPlusTeamInfo).members.values()]
            .some(m => m.appTeamInfoMember.steamId === id)) ?? null;
    }

    if (callerSteamId === null) {
        const str = lm.getIntl(language, 'unknownCaller');
        rpInstance.sendPrefixCommandResponse(str, inGame);
        log.info(`${fn} ${str}`, logParam);
        return true;
    }

    const response: string[] = [];
    const subcommand = args[0];
    switch (subcommand) {
        case lm.getIntl(Languages.ENGLISH, 'subcommandList'):
        case lm.getIntl(language, 'subcommandList'): {
            if (Object.keys(serverInfo.markerMap).length === 0) {
                response.push(lm.getIntl(language, 'noRegisteredMarkers'));
            }
            else {
                for (const [name, coordinates] of Object.entries(serverInfo.markerMap)) {
                    const pos = getPos(coordinates.x, coordinates.y, rpInstance);
                    const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                        lm.getIntl(language, 'unknown');
                    response.push(`${name} [${posString}]`);
                }
            }
        } break;

        case lm.getIntl(Languages.ENGLISH, 'subcommandAdd'):
        case lm.getIntl(language, 'subcommandAdd'): {
            if (args.length < 2) {
                response.push(language, 'missingNameArgument');
                break;
            }

            if (Object.hasOwn(serverInfo.markerMap, args[1])) {
                response.push(lm.getIntl(language, 'markerAlreadyExist', { name: args[1] }));
                break;
            }

            const member = [...rpInstance.rpTeamInfo.members.values()]
                .find(member => member.appTeamInfoMember.steamId === callerSteamId)
                ?.appTeamInfoMember ?? null;

            if (!member) {
                response.push(lm.getIntl(language, 'unknownCaller'));
                break;
            }

            serverInfo.markerMap[args[1]] = { x: member.x, y: member.y };
            gim.updateGuildInstance(guildId);

            const pos = getPos(member.x, member.y, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                lm.getIntl(language, 'unknown');

            response.push(lm.getIntl(language, 'addedMarkerAt', {
                name: args[1],
                pos: posString
            }));
        } break;

        case lm.getIntl(Languages.ENGLISH, 'subcommandRemove'):
        case lm.getIntl(language, 'subcommandRemove'): {
            if (args.length < 2) {
                response.push(language, 'missingNameArgument');
                break;
            }

            if (!Object.hasOwn(serverInfo.markerMap, args[1])) {
                response.push(lm.getIntl(language, 'markerDoesNotExist', { name: args[1] }));
                break;
            }

            delete serverInfo.markerMap[args[1]];
            gim.updateGuildInstance(guildId);

            response.push(lm.getIntl(language, 'removedMarker', {
                name: args[1]
            }));
        } break;

        default: {
            if (!Object.hasOwn(serverInfo.markerMap, args[0])) {
                response.push(lm.getIntl(language, 'markerDoesNotExist', { name: args[0] }));
                break;
            }

            const member = [...rpInstance.rpTeamInfo.members.values()]
                .find(member => member.appTeamInfoMember.steamId === callerSteamId)
                ?.appTeamInfoMember ?? null;

            if (!member) {
                response.push(lm.getIntl(language, 'unknownCaller'));
                break;
            }

            const x1 = member.x;
            const y1 = member.y;
            const x2 = serverInfo.markerMap[args[0]].x;
            const y2 = serverInfo.markerMap[args[0]].y;

            const direction = getAngleBetweenPoints(x1, y1, x2, y2);
            const distance = Math.floor(getDistance(x1, y1, x2, y2));

            const pos = getPos(x2, y2, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                lm.getIntl(language, 'unknown');

            response.push(lm.getIntl(language, 'markerLocation', {
                name: args[0],
                pos: posString,
                distance: `${distance}`,
                player: member.name,
                direction: `${direction}`
            }));
        } break;
    }

    rpInstance.sendPrefixCommandResponse(response.join(', '), inGame);
    log.info(`${fn} ${response.join(', ')}`, logParam);

    return true;
}