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

export const name = 'connection';

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

    if (args.length === 0) {
        const response = lm.getIntl(language, 'nameArgumentMissing');
        rpInstance.sendPrefixCommandResponse(response, inGame);
        log.info(`${fn} ${response}`, logParam);
        return true;
    }

    const response: string[] = [];
    const memberName = args[0];

    let number = (args[1] !== undefined) ? parseInt(args[1]) : undefined;
    number = (number !== undefined && isNaN(number)) ? undefined : number;

    const member = [...rpInstance.rpTeamInfo.members.values()].find(m =>
        m.appTeamInfoMember.name.toLowerCase().includes(memberName.toLowerCase())
    );

    if (member) {
        if (rpInstance.playerConnections[member.appTeamInfoMember.steamId] === undefined) {
            rpInstance.playerConnections[member.appTeamInfoMember.steamId] = [];
        }

        if (rpInstance.playerConnections[member.appTeamInfoMember.steamId].length === 0) {
            response.push(lm.getIntl(language, 'noConnectionEvents',));
        }
        else {
            let counter = 1;
            for (const event of rpInstance.playerConnections[member.appTeamInfoMember.steamId]) {
                if (counter === 6) break;
                if (number !== undefined && counter !== number) continue;

                const str = `${event.time} - ${event.str}`;

                response.push(str);
                counter++;
            }
        }
    }
    else {
        response.push(lm.getIntl(language, 'noPlayerFoundWithName', { name: memberName }));
    }

    rpInstance.sendPrefixCommandResponse(response, inGame);
    log.info(`${fn} ${response}`, logParam);

    return true;
}