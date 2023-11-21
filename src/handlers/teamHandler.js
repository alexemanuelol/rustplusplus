/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

const Constants = require('../util/constants.js');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client, teamInfo) {
        /* Handle team changes */
        await module.exports.checkChanges(rustplus, client, teamInfo);
    },

    checkChanges: async function (rustplus, client, teamInfo) {
        let instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const server = instance.serverList[serverId];

        if (rustplus.team.isLeaderSteamIdChanged(teamInfo)) return;

        const newPlayers = rustplus.team.getNewPlayers(teamInfo);
        const leftPlayers = rustplus.team.getLeftPlayers(teamInfo);

        for (const steamId of leftPlayers) {
            const player = rustplus.team.getPlayer(steamId);
            const str = client.intlGet(guildId, 'playerLeftTheTeam', { name: player.name });
            await DiscordMessages.sendActivityNotificationMessage(
                guildId, serverId, Constants.COLOR_GREY, str, steamId);
            if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
            rustplus.log(client.intlGet(null, 'infoCap'), str);
            rustplus.updateConnections(steamId, str);
        }

        for (const steamId of newPlayers) {
            for (const player of teamInfo.members) {
                if (player.steamId.toString() === steamId) {
                    const str = client.intlGet(guildId, 'playerJoinedTheTeam', { name: player.name });
                    await DiscordMessages.sendActivityNotificationMessage(
                        guildId, serverId, Constants.COLOR_ACTIVE, str, steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                    rustplus.log(client.intlGet(null, 'infoCap'), str);
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
                        let offset = '';
                        let number = '';
                        if(player.pos){
                            const base = 146;
                            let x = (player.pos.x/base).toString();
                            let y = (player.pos.y/base).toString();
                            let xn = (x.split(".")[1] || '0').substring(0,3);
                            let yn = (y.split(".")[1] || '0').substring(0,3);
                            let xi = xn > 333 ? (xn > 666 ? 2 : 1) : 0;
                            let yi = yn > 333 ? (yn > 666 ? 0 : 1) : 2;
                            number = [[1,2,3],[4,5,6],[7,8,9]][yi][xi];
                            xn = xn - (333*xi);
                            yn = yn - (333*yi);
                            let xOffset = xn > 222 ? ['右','E'] :( xn < 111 ? ['左','W']: ['','']);
                            let yOffset =  yn > 222 ? ['上','N'] : ( yn < 111 ? ['下','S']: ['','']);
                            
                            offset = !xOffset[0] && !xOffset[0] ? '' : `偏${xOffset[0]}${yOffset[0]}(${yOffset[1]},${xOffset[1]})`;
                        }
                       
                        const str = client.intlGet(guildId, 'playerJustDied', {
                            name: player.name,
                            number: number,
                            offset: offset,
                            location: location
                        });
                        await DiscordMessages.sendActivityNotificationMessage(
                            guildId, serverId, Constants.COLOR_INACTIVE, str, player.steamId);
                        if (instance.generalSettings.deathNotify) rustplus.sendInGameMessage(str);
                        rustplus.log(client.intlGet(null, 'infoCap'), str);
                        rustplus.updateDeaths(player.steamId, {
                            name: player.name,
                            location: player.pos
                        });
                    }

                    if (player.isGoneAfk(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            const str = client.intlGet(guildId, 'playerJustWentAfk', { name: player.name });
                            rustplus.sendInGameMessage(str);
                            rustplus.log(client.intlGet(null, 'infoCap'), str);
                        }
                    }

                    if (player.isAfk() && player.isMoved(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            const afkTime = player.getAfkTime('dhs');
                            const str = client.intlGet(guildId, 'playerJustReturned', {
                                name: player.name,
                                time: afkTime
                            });
                            rustplus.sendInGameMessage(str);
                            rustplus.log(client.intlGet(null, 'infoCap'), str);
                        }
                    }

                    if (player.isGoneOnline(playerUpdated)) {
                        const str = client.intlGet(guildId, 'playerJustConnected', { name: player.name });
                        await DiscordMessages.sendActivityNotificationMessage(
                            guildId, serverId, Constants.COLOR_ACTIVE, str, player.steamId);
                        if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                        rustplus.log(client.intlGet(null, 'infoCap'),
                            client.intlGet(null, 'playerJustConnectedTo', {
                                name: player.name,
                                server: server.title
                            }));
                        rustplus.updateConnections(player.steamId, str);
                    }

                    if (player.isGoneOffline(playerUpdated)) {
                        const str = client.intlGet(guildId, 'playerJustDisconnected', { name: player.name });
                        await DiscordMessages.sendActivityNotificationMessage(
                            guildId, serverId, Constants.COLOR_INACTIVE, str, player.steamId);
                        if (instance.generalSettings.connectionNotify) await rustplus.sendInGameMessage(str);
                        rustplus.log(client.intlGet(null, 'infoCap'),
                            client.intlGet(null, 'playerJustDisconnectedFrom', {
                                name: player.name,
                                server: server.title
                            }));
                        rustplus.updateConnections(player.steamId, str);
                    }
                    break;
                }
            }
        }
    },
}