const BattlemetricsAPI = require('../util/battlemetricsAPI.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Scrape = require('../util/scrape.js');

module.exports = {
    handler: async function (client) {
        const forceSearch = (client.battlemetricsIntervalCounter === 0) ? true : false;

        const calledPages = new Object();
        const calledSteamIdNames = new Object();

        for (const guildItem of client.guilds.cache) {
            const guild = guildItem[1];
            let instance = client.readInstanceFile(guild.id);
            const activeServer = getActiveServerId(instance.serverList);

            if (activeServer !== null && instance.serverList[activeServer].battlemetricsId !== null) {
                let battlemetricsId = instance.serverList[activeServer].battlemetricsId;
                if (!Object.keys(calledPages).includes(battlemetricsId)) {
                    const page = await BattlemetricsAPI.getBattlemetricsServerPage(client, battlemetricsId);
                    if (page !== null) {
                        calledPages[battlemetricsId] = page;
                    }
                }
            }

            for (const [trackerId, content] of Object.entries(instance.trackers)) {
                if (!content.active) continue;
                instance = client.readInstanceFile(guild.id);

                let page = null;
                if (!Object.keys(calledPages).includes(content.battlemetricsId)) {
                    page = await BattlemetricsAPI.getBattlemetricsServerPage(client, content.battlemetricsId);
                    if (page === null) continue;
                    calledPages[content.battlemetricsId] = page;
                }
                else {
                    page = calledPages[content.battlemetricsId];
                }

                const info = await BattlemetricsAPI.getBattlemetricsServerInfo(
                    client, content.battlemetricsId, page);
                if (info === null) continue;

                instance.trackers[trackerId].status = info.status;

                const onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(
                    client, content.battlemetricsId, page);
                if (onlinePlayers === null) continue;

                for (let player of content.players) {
                    player = instance.trackers[trackerId].players.find(e => e.steamId === player.steamId);
                    let onlinePlayer = onlinePlayers.find(e => e.name === player.name);
                    if (onlinePlayer) {
                        player.status = true;
                        player.time = onlinePlayer.time;
                        player.playerId = onlinePlayer.id;
                    }
                    else {
                        if (!forceSearch) {
                            player.status = false;
                            continue
                        }

                        let playerName = null;
                        if (!Object.keys(calledSteamIdNames).includes(player.steamId)) {
                            playerName = await Scrape.scrapeSteamProfileName(client, player.steamId);
                            if (!playerName) continue;
                            calledSteamIdNames[player.steamId] = playerName;
                        }
                        else {
                            playerName = calledSteamIdNames[player.steamId];
                        }

                        onlinePlayer = onlinePlayers.find(e => e.name === playerName);
                        if (onlinePlayer) {
                            player.status = true;
                            player.time = onlinePlayer.time;
                            player.playerId = onlinePlayer.id;
                            player.name = onlinePlayer.name;
                        }
                        else {
                            player.status = false;
                            player.name = playerName;
                        }
                    }
                }
                client.writeInstanceFile(guild.id, instance);
                instance = client.readInstanceFile(guild.id);

                let allOffline = true;
                for (const player of instance.trackers[trackerId].players) {
                    if (player.status) {
                        allOffline = false;
                    }
                }

                if (!instance.trackers[trackerId].allOffline && allOffline) {
                    if (instance.generalSettings.trackerNotifyAllOffline) {
                        await DiscordMessages.sendTrackerAllOfflineMessage(guild.id, trackerId);
                    }
                }
                else if (instance.trackers[trackerId].allOffline && !allOffline) {
                    if (instance.generalSettings.trackerNotifyAnyOnline) {
                        await DiscordMessages.sendTrackerAnyOnlineMessage(guild.id, trackerId);
                    }
                }

                instance.trackers[trackerId].allOffline = allOffline;
                client.writeInstanceFile(guild.id, instance);
                await DiscordMessages.sendTrackerMessage(guild.id, trackerId);
            }
        }

        /* Update onlinePlayers Object */
        let battlemetricsOnlinePlayers = new Object();
        for (const [key, value] of Object.entries(calledPages)) {
            let onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(client, key, value);
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

function getActiveServerId(serverList) {
    for (const [key, value] of Object.entries(serverList)) {
        if (value.active) {
            return key;
        }
    }
    return null;
}