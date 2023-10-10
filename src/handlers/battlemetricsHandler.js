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
const Scrape = require('../util/scrape.js');

module.exports = {
    handler: async function (client, firstTime = false) {
        const searchSteamProfiles = (client.battlemetricsIntervalCounter === 0) ? true : false;
        const calledSteamProfiles = new Object();

        if (!firstTime) await client.updateBattlemetricsInstances();

        for (const guildItem of client.guilds.cache) {
            const guildId = guildItem[0];
            const instance = client.getInstance(guildId);

            // TODO! Notifications for activeServer battlemetrics instance? Changes etc?

            for (const [trackerId, content] of Object.entries(instance.trackers)) {
                const battlemetricsId = content.battlemetricsId;
                const bmInstance = client.battlemetricsInstances[battlemetricsId];

                if (!bmInstance || !bmInstance.lastUpdateSuccessful) continue;

                if (firstTime || searchSteamProfiles) {
                    for (const player of content.players) {
                        if (player.steamId === null) continue;

                        let name = null;
                        if (calledSteamProfiles.hasOwnProperty(player.steamId)) {
                            name = calledSteamProfiles[player.steamId];
                        }
                        else {
                            name = await Scrape.scrapeSteamProfileName(client, player.steamId);
                            calledSteamProfiles[player.steamId] = name;
                        }
                        if (name === null) continue;

                        name = (content.clanTag !== '' ? `${content.clanTag} ` : '') + `${name}`;

                        if (player.name !== name) {
                            const newPlayerId = Object.keys(bmInstance.players)
                                .find(e => bmInstance.players[e]['name'] === name);
                            player.playerId = newPlayerId ? newPlayerId : null;
                            player.name = name;
                        }
                    }

                    client.setInstance(guildId, instance);

                    if (firstTime) {
                        await DiscordMessages.sendTrackerMessage(guildId, trackerId);
                        continue;
                    }
                }

                const trackerPlayerIds = content.players.map(e => e.playerId);
                const rustplus = client.rustplusInstances[guildId];

                /* Check if Player just came online */
                for (const playerId of trackerPlayerIds.filter(e => bmInstance.newPlayers.includes(e))) {
                    for (const player of content.players) {
                        if (player.playerId !== playerId) continue;

                        const str = client.intlGet(guildId, 'playerJustConnectedTracker', {
                            name: player.name,
                            tracker: content.name
                        });
                        await DiscordMessages.sendActivityNotificationMessage(
                            guildId, content.serverId, Constants.COLOR_ACTIVE, str, null, content.title);
                        if (rustplus && (rustplus.serverId === content.serverId) && content.inGame) {
                            rustplus.sendTeamMessageAsync(str);
                        }
                    }
                }


                for (const playerId of trackerPlayerIds.filter(e => bmInstance.loginPlayers.includes(e))) {
                    for (const player of content.players) {
                        if (player.playerId !== playerId) continue;

                        const str = client.intlGet(guildId, 'playerJustConnectedTracker', {
                            name: player.name,
                            tracker: content.name
                        });
                        await DiscordMessages.sendActivityNotificationMessage(
                            guildId, content.serverId, Constants.COLOR_ACTIVE, str, null, content.title);
                        if (rustplus && (rustplus.serverId === content.serverId) && content.inGame) {
                            rustplus.sendTeamMessageAsync(str);
                        }
                    }
                }

                for (const playerId of trackerPlayerIds.filter(e => bmInstance.logoutPlayers.includes(e))) {
                    for (const player of content.players) {
                        if (player.playerId !== playerId) continue;

                        const str = client.intlGet(guildId, 'playerJustDisconnectedTracker', {
                            name: player.name,
                            tracker: content.name
                        });

                        await DiscordMessages.sendActivityNotificationMessage(
                            guildId, content.serverId, Constants.COLOR_INACTIVE, str, null, content.title);
                        if (rustplus && (rustplus.serverId === content.serverId) && content.inGame) {
                            rustplus.sendTeamMessageAsync(str);
                        }
                    }
                }

                client.setInstance(guildId, instance);

                await DiscordMessages.sendTrackerMessage(guildId, trackerId);
            }
        }

        if (client.battlemetricsIntervalCounter === 29) {
            client.battlemetricsIntervalCounter = 0;
        }
        else {
            client.battlemetricsIntervalCounter += 1;
        }
    }
}