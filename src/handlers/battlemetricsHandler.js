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

const BattlemetricsAPI = require('../util/battlemetricsAPI.js');
const Constants = require('../util/constants.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Scrape = require('../util/scrape.js');

module.exports = {
    handler: async function (client, firstTime = false) {
        const forceSearch = (client.battlemetricsIntervalCounter === 0) ? true : false;

        const calledPages = new Object();
        const calledSteamIdNames = new Object();

        /* Populate calledPages with all battlemetrics pages */
        for (const guildItem of client.guilds.cache) {
            const guild = guildItem[1];
            const instance = client.getInstance(guild.id);
            const activeServer = instance.activeServer;

            if (activeServer !== null && instance.serverList[activeServer].battlemetricsId !== null) {
                const battlemetricsId = instance.serverList[activeServer].battlemetricsId;
                if (!Object.keys(calledPages).includes(battlemetricsId)) {
                    const page = await BattlemetricsAPI.getBattlemetricsServerPage(client, battlemetricsId);
                    if (page !== null) calledPages[battlemetricsId] = page;
                }
            }

            for (const [trackerId, content] of Object.entries(instance.trackers)) {
                if (!content.active) continue;
                if (!Object.keys(calledPages).includes(content.battlemetricsId)) {
                    const page = await BattlemetricsAPI.getBattlemetricsServerPage(client, content.battlemetricsId);
                    if (page !== null) calledPages[content.battlemetricsId] = page;
                }
            }
        }

        /* Go through all trackers in all instances */
        for (const guildItem of client.guilds.cache) {
            const guild = guildItem[1];
            const instance = client.getInstance(guild.id);

            /* Clear status and offlineTime for all players */
            if (firstTime) {
                for (const [trackerId, content] of Object.entries(instance.trackers)) {
                    for (let player of content.players) {
                        player.status = false;
                        player.offlineTime = null;
                    }
                }
                client.setInstance(guild.id, instance);
            }

            for (const [trackerId, content] of Object.entries(instance.trackers)) {
                if (!content.active) continue;

                const bmId = content.battlemetricsId;

                /* Get the page */
                const page = Object.keys(calledPages).includes(bmId) ? calledPages[bmId] : null;
                if (page === null) continue;

                /* Get info from page */
                const info = await BattlemetricsAPI.getBattlemetricsServerInfo(client, bmId, page);
                if (info === null) continue;

                instance.trackers[trackerId].status = info.status;

                /* Get online players from page */
                const onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(client, bmId, page);
                if (onlinePlayers === null) continue;

                const rustplus = client.rustplusInstances[guild.id];

                /* Loop through all players of the tracker */
                for (let player of content.players) {
                    const onlinePlayer = onlinePlayers.find(e => e.name === player.name);
                    if (onlinePlayer) {
                        if (player.status === false && !firstTime) {
                            const str = client.intlGet(guild.id, 'playerJustConnectedTracker', {
                                name: player.name,
                                tracker: content.name
                            });
                            await DiscordMessages.sendActivityNotificationMessage(
                                guild.id, content.serverId, Constants.COLOR_ACTIVE, str, null, content.title);
                            if (instance.generalSettings.trackerNotifyInGameConnections && rustplus &&
                                (rustplus.serverId === content.serverId) && content.inGame) {
                                rustplus.sendTeamMessageAsync(str);
                            }
                        }

                        player.status = true;
                        player.time = onlinePlayer.time;
                        player.playerId = onlinePlayer.id;
                    }
                    else {
                        if (player.status === true) {
                            player.offlineTime = Date.now();

                            if (!firstTime) {
                                const str = client.intlGet(guild.id, 'playerJustDisconnectedTracker', {
                                    name: player.name,
                                    tracker: content.name
                                });

                                await DiscordMessages.sendActivityNotificationMessage(
                                    guild.id, content.serverId, Constants.COLOR_INACTIVE, str, null, content.title);
                                if (instance.generalSettings.trackerNotifyInGameConnections && rustplus &&
                                    (rustplus.serverId === content.serverId) && content.inGame) {
                                    rustplus.sendTeamMessageAsync(str);
                                }
                            }
                        }

                        if (!forceSearch) {
                            player.status = false;
                            continue;
                        }

                        let playerSteamName = null;
                        if (!Object.keys(calledSteamIdNames).includes(player.steamId)) {
                            playerSteamName = await Scrape.scrapeSteamProfileName(client, player.steamId);
                            if (!playerSteamName) continue;
                            calledSteamIdNames[player.steamId] = playerSteamName;
                        }
                        else {
                            playerSteamName = calledSteamIdNames[player.steamId];
                        }

                        const playerSteamNameClan = (content.clanTag !== '' ? `${content.clanTag} ` : '') +
                            `${playerSteamName}`;

                        if (player.name !== playerSteamNameClan && player.name !== '-') {
                            if (content.nameChangeHistory.length === 10) {
                                content.nameChangeHistory.pop();
                            }
                            content.nameChangeHistory.unshift(
                                `${player.name} → ${playerSteamNameClan} (${player.steamId}).`);
                        }

                        const newPlayerName = onlinePlayers.find(e => e.name === playerSteamNameClan);
                        if (newPlayerName) {
                            player.status = true;
                            player.time = newPlayerName.time;
                            player.playerId = newPlayerName.id;
                            player.name = newPlayerName.name;
                        }
                        else {
                            player.status = false;
                            player.name = playerSteamNameClan;
                        }
                    }
                }
                client.setInstance(guild.id, instance);

                let allOffline = true;
                for (const player of instance.trackers[trackerId].players) {
                    if (player.status) {
                        allOffline = false;
                    }
                }

                if (!instance.trackers[trackerId].allOffline && allOffline) {
                    if (instance.generalSettings.trackerNotifyAllOffline && !firstTime) {
                        await DiscordMessages.sendTrackerAllOfflineMessage(guild.id, trackerId);

                        if (rustplus && (rustplus.serverId === instance.trackers[trackerId].serverId) &&
                            instance.trackers[trackerId].inGame) {
                            const text = client.intlGet(guild.id, 'allJustOfflineTracker', {
                                tracker: instance.trackers[trackerId].name
                            });
                            rustplus.sendTeamMessageAsync(text);
                        }
                    }
                }
                else if (instance.trackers[trackerId].allOffline && !allOffline) {
                    if (instance.generalSettings.trackerNotifyAnyOnline && !firstTime) {
                        await DiscordMessages.sendTrackerAnyOnlineMessage(guild.id, trackerId);

                        if (rustplus && (rustplus.serverId === instance.trackers[trackerId].serverId) &&
                            instance.trackers[trackerId].inGame) {
                            const text = client.intlGet(guild.id, 'anyJustOnlineTracker', {
                                tracker: instance.trackers[trackerId].name
                            });
                            rustplus.sendTeamMessageAsync(text);
                        }
                    }
                }

                instance.trackers[trackerId].allOffline = allOffline;
                client.setInstance(guild.id, instance);
                await DiscordMessages.sendTrackerMessage(guild.id, trackerId);
            }
        }

        /* Update onlinePlayers Object */
        const battlemetricsOnlinePlayers = new Object();
        for (const [key, value] of Object.entries(calledPages)) {
            const onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(client, key, value);
            if (onlinePlayers === null) continue;
            battlemetricsOnlinePlayers[key] = onlinePlayers;
        }
        client.battlemetricsOnlinePlayers = JSON.parse(JSON.stringify(battlemetricsOnlinePlayers));

        if (client.battlemetricsIntervalCounter === 29) {
            client.battlemetricsIntervalCounter = 0;
        }
        else {
            client.battlemetricsIntervalCounter += 1;
        }
    }
}