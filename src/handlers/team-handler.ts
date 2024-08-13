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

import { localeManager as lm } from '../../index';
import { TeamInfoResponseData } from '../structures/TeamInfo';
import * as guildInstance from '../util/guild-instance';
import * as discordMessages from '../discordTools/discord-messages';
import * as constants from '../util/constants';
const { RustPlus } = require('../structures/RustPlus');

export async function teamHandler(rustplus: typeof RustPlus, teamInfo: TeamInfoResponseData) {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const serverId = rustplus.serverId;
    const server = instance.serverList[serverId];

    if (rustplus.teamInfo.isLeaderSteamIdChanged(teamInfo)) return;

    const newTeamMembers = rustplus.teamInfo.getNewTeamMembers(teamInfo);
    const leftTeamMembers = rustplus.teamInfo.getLeftTeamMembers(teamInfo);

    for (const steamId of leftTeamMembers) {
        const teamMember = rustplus.teamInfo.getTeamMember(steamId);
        const str = lm.getIntl(language, 'playerLeftTheTeam', { name: teamMember.name });
        await discordMessages.sendActivityNotificationMessage(
            guildId, serverId, constants.COLOR_GREY, str, steamId);
        if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
        rustplus.info(str);
        rustplus.updateConnections(steamId, str);
    }

    for (const steamId of newTeamMembers) {
        for (const member of teamInfo.members) {
            if (member.steamId.toString() === steamId) {
                const str = lm.getIntl(language, 'playerJoinedTheTeam', { name: member.name });
                await discordMessages.sendActivityNotificationMessage(
                    guildId, serverId, constants.COLOR_ACTIVE, str, steamId);
                if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                rustplus.info(str);
                rustplus.updateConnections(steamId, str);
            }
        }
    }

    for (const teamMember of rustplus.teamInfo.teamMemberObjects) {
        if (leftTeamMembers.includes(teamMember.steamId)) continue;
        for (const teamMemberUpdated of teamInfo.members) {
            if (teamMember.steamId === teamMemberUpdated.steamId.toString()) {
                if (teamMember.isGoneDead(teamMemberUpdated)) {
                    const location = teamMember.position === null ? 'spawn' : teamMember.position.string;
                    const str = lm.getIntl(language, 'playerJustDied', {
                        name: teamMember.name,
                        location: location
                    });
                    await discordMessages.sendActivityNotificationMessage(
                        guildId, serverId, constants.COLOR_INACTIVE, str, teamMember.steamId);
                    if (instance.generalSettings.deathNotify) rustplus.sendInGameMessage(str);
                    rustplus.info(str);
                    rustplus.updateDeaths(teamMember.steamId, {
                        name: teamMember.name,
                        location: teamMember.position
                    });
                }

                if (teamMember.isGoneAfk(teamMemberUpdated)) {
                    if (instance.generalSettings.afkNotify) {
                        const str = lm.getIntl(language, 'playerJustWentAfk', { name: teamMember.name });
                        rustplus.sendInGameMessage(str);
                        rustplus.info(str);
                    }
                }

                if (teamMember.isAfk() && teamMember.isMoved(teamMemberUpdated)) {
                    if (instance.generalSettings.afkNotify) {
                        const afkTime = teamMember.getAfkTime('dhs');
                        const str = lm.getIntl(language, 'playerJustReturned', {
                            name: teamMember.name,
                            time: afkTime
                        });
                        rustplus.sendInGameMessage(str);
                        rustplus.info(str);
                    }
                }

                if (teamMember.isGoneOnline(teamMemberUpdated)) {
                    const str = lm.getIntl(language, 'playerJustConnected', { name: teamMember.name });
                    await discordMessages.sendActivityNotificationMessage(
                        guildId, serverId, constants.COLOR_ACTIVE, str, teamMember.steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                    rustplus.info(lm.getIntl(language, 'playerJustConnectedTo', {
                        name: teamMember.name,
                        server: server.title
                    }));
                    rustplus.updateConnections(teamMember.steamId, str);
                }

                if (teamMember.isGoneOffline(teamMemberUpdated)) {
                    const str = lm.getIntl(language, 'playerJustDisconnected', { name: teamMember.name });
                    await discordMessages.sendActivityNotificationMessage(
                        guildId, serverId, constants.COLOR_INACTIVE, str, teamMember.steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                    rustplus.info(lm.getIntl(language, 'playerJustDisconnectedFrom', {
                        name: teamMember.name,
                        server: server.title
                    }));
                    rustplus.updateConnections(teamMember.steamId, str);
                }
                break;
            }
        }
    }
}