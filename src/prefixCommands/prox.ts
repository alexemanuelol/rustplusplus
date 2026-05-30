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

import { log, guildInstanceManager as gim, localeManager as lm, credentialsManager as cm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import { RustPlusTeamInfo } from '../structures/rustPlusTeamInfo';
import { getAngleBetweenPoints, getDistance, getPos, getPosString } from '../utils/map';

export const name = 'prox';

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

    if (rpInstance.rpInfo === null) return false;
    if (rpInstance.rpTeamInfo === null) return false;

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
    if (args.length !== 0) {
        const name = args.join(' ');

        const fuse = new Fuse([...rpInstance.rpTeamInfo.members.values()], {
            keys: ['appTeamInfoMember.name'],
            threshold: 0.3
        });
        const member = fuse.search(name)[0]?.item ?? null;

        if (!member || (member && (member.appTeamInfoMember.steamId === callerSteamId))) {
            response.push(lm.getIntl(language, 'noPlayerFoundWithName', { name }));
        }
        else {
            const caller = [...rpInstance.rpTeamInfo.members.values()]
                .find(member => member.appTeamInfoMember.steamId === callerSteamId)
                ?.appTeamInfoMember ?? null;

            if (!caller) {
                const str = lm.getIntl(language, 'unknownCaller');
                rpInstance.sendPrefixCommandResponse(str, inGame);
                log.info(`${fn} ${str}`, logParam);
                return true;
            }

            const x1 = caller.x;
            const y1 = caller.y;
            const x2 = member.appTeamInfoMember.x;
            const y2 = member.appTeamInfoMember.y;

            const direction = getAngleBetweenPoints(x1, y1, x2, y2);
            const distance = Math.floor(getDistance(x1, y1, x2, y2));

            const pos = getPos(x2, y2, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                lm.getIntl(language, 'unknown');

            response.push(lm.getIntl(language, 'proxLocation', {
                name: member.appTeamInfoMember.name,
                distance: `${distance}`,
                caller: caller.name,
                direction: `${direction}`,
                pos: posString
            }));
        }
    }
    else {
        const caller = [...rpInstance.rpTeamInfo.members.values()]
            .find(member => member.appTeamInfoMember.steamId === callerSteamId)
            ?.appTeamInfoMember ?? null;

        if (!caller) {
            const str = lm.getIntl(language, 'unknownCaller');
            rpInstance.sendPrefixCommandResponse(str, inGame);
            log.info(`${fn} ${str}`, logParam);
            return true;
        }

        const closestMembers = [];
        let members = [...rpInstance.rpTeamInfo.members.values()].filter(m =>
            m.appTeamInfoMember.steamId !== callerSteamId && m.appTeamInfoMember.isAlive
        );

        if (members.length === 0) {
            const str = lm.getIntl(language, 'onlyOneInTeam');
            rpInstance.sendPrefixCommandResponse(str, inGame);
            log.info(`${fn} ${str}`, logParam);
            return true;
        }

        for (let i = 0; i < 3; i++) {
            if (members.length > 0) {
                const member = members.reduce(function (prev, curr) {
                    if (getDistance(prev.appTeamInfoMember.x, prev.appTeamInfoMember.y, caller.x, caller.y) <
                        getDistance(curr.appTeamInfoMember.x, curr.appTeamInfoMember.y, caller.x, caller.y)) {
                        return prev;
                    }
                    else {
                        return curr;
                    }
                });
                closestMembers.push(member);
                members = members.filter(e => e.appTeamInfoMember.steamId !== member.appTeamInfoMember.steamId);
            }
        }

        const strings: string[] = [];
        for (const member of closestMembers) {
            const pos = getPos(member.appTeamInfoMember.x, member.appTeamInfoMember.y, rpInstance);
            const posString = (pos !== null) ? getPosString(pos, rpInstance, false, false) :
                lm.getIntl(language, 'unknown');
            const distance = Math.floor(getDistance(member.appTeamInfoMember.x, member.appTeamInfoMember.y,
                caller.x, caller.y));
            strings.push(`${member.appTeamInfoMember.name} (${distance}m [${posString}])`);
        }
        response.push(strings.join(', '));
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}