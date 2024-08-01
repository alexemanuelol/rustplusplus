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
import * as guildInstance from '../util/guild-instance';
import * as discordMessages from '../discordTools/discord-messages';
import * as constants from '../util/constants';
const { RustPlus } = require('../structures/RustPlus');

export async function teamHandler(rustplus: typeof RustPlus, teamInfo: any) {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const serverId = rustplus.serverId;
    const server = instance.serverList[serverId];

    if (rustplus.team.isLeaderSteamIdChanged(teamInfo)) return;

    const newPlayers = rustplus.team.getNewPlayers(teamInfo);
    const leftPlayers = rustplus.team.getLeftPlayers(teamInfo);

    for (const steamId of leftPlayers) {
        const player = rustplus.team.getPlayer(steamId);
        const str = lm.getIntl(language, 'playerLeftTheTeam', { name: player.name });
        await discordMessages.sendActivityNotificationMessage(
            guildId, serverId, constants.COLOR_GREY, str, steamId);
        if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
        rustplus.info(str);
        rustplus.updateConnections(steamId, str);
    }

    for (const steamId of newPlayers) {
        for (const player of teamInfo.members) {
            if (player.steamId.toString() === steamId) {
                const str = lm.getIntl(language, 'playerJoinedTheTeam', { name: player.name });
                await discordMessages.sendActivityNotificationMessage(
                    guildId, serverId, constants.COLOR_ACTIVE, str, steamId);
                if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                rustplus.info(str);
                rustplus.updateConnections(steamId, str);
            }
        }
    }

    for (const player of rustplus.team.players) {
        if (leftPlayers.includes(player.steamId)) continue;
        for (const playerUpdated of teamInfo.members) {
            if (player.steamId === playerUpdated.steamId.toString()) {
                if (player.isGoneDead(playerUpdated)) {
                    const location = player.pos === null ? 'spawn' : player.pos.string;
                    const str = lm.getIntl(language, 'playerJustDied', {
                        name: player.name,
                        location: location
                    });
                    await discordMessages.sendActivityNotificationMessage(
                        guildId, serverId, constants.COLOR_INACTIVE, str, player.steamId);
                    if (instance.generalSettings.deathNotify) rustplus.sendInGameMessage(str);
                    rustplus.info(str);
                    rustplus.updateDeaths(player.steamId, {
                        name: player.name,
                        location: player.pos
                    });
                }

                if (player.isGoneAfk(playerUpdated)) {
                    if (instance.generalSettings.afkNotify) {
                        const str = lm.getIntl(language, 'playerJustWentAfk', { name: player.name });
                        rustplus.sendInGameMessage(str);
                        rustplus.info(str);
                    }
                }

                if (player.isAfk() && player.isMoved(playerUpdated)) {
                    if (instance.generalSettings.afkNotify) {
                        const afkTime = player.getAfkTime('dhs');
                        const str = lm.getIntl(language, 'playerJustReturned', {
                            name: player.name,
                            time: afkTime
                        });
                        rustplus.sendInGameMessage(str);
                        rustplus.info(str);
                    }
                }

                if (player.isGoneOnline(playerUpdated)) {
                    const str = lm.getIntl(language, 'playerJustConnected', { name: player.name });
                    await discordMessages.sendActivityNotificationMessage(
                        guildId, serverId, constants.COLOR_ACTIVE, str, player.steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                    rustplus.info(lm.getIntl(language, 'playerJustConnectedTo', {
                        name: player.name,
                        server: server.title
                    }));
                    rustplus.updateConnections(player.steamId, str);
                }

                if (player.isGoneOffline(playerUpdated)) {
                    const str = lm.getIntl(language, 'playerJustDisconnected', { name: player.name });
                    await discordMessages.sendActivityNotificationMessage(
                        guildId, serverId, constants.COLOR_INACTIVE, str, player.steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                    rustplus.info(lm.getIntl(language, 'playerJustDisconnectedFrom', {
                        name: player.name,
                        server: server.title
                    }));
                    rustplus.updateConnections(player.steamId, str);
                }
                break;
            }
        }
    }
}