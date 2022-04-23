const DiscordTools = require('../discordTools/discordTools.js');
const BattlemetricsAPI = require('../util/battlemetricsAPI.js');
const Scrape = require('../util/scrape.js');

module.exports = {
    handler: async function (client) {
        let forceSearch = (client.battlemetricsIntervalCounter === 0) ? true : false;
        client.guilds.cache.forEach(async (guild) => {
            let instance = client.readInstanceFile(guild.id);

            let calledPages = new Object();
            let calledSteamIdNames = new Object();

            for (const [key, value] of Object.entries(instance.trackers)) {
                if (!value.active) continue;
                instance = client.readInstanceFile(guild.id);

                let page = null;
                if (!Object.keys(calledPages).includes(value.battlemetricsId)) {
                    page = await BattlemetricsAPI.getBattlemetricsServerPage(
                        client, value.battlemetricsId);
                    if (page === null) continue;
                    calledPages[value.battlemetricsId] = page;
                }
                else {
                    page = calledPages[value.battlemetricsId];
                }

                let info = await BattlemetricsAPI.getBattlemetricsServerInfo(
                    client, value.battlemetricsId, page);
                if (info === null) continue;

                instance.trackers[key].status = info.status;

                let onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(
                    client, value.battlemetricsId, page);
                if (onlinePlayers === null) continue;

                for (let player of value.players) {
                    player = instance.trackers[key].players.find(e => e.steamId === player.steamId);
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
                for (let player of instance.trackers[key].players) {
                    if (player.status) {
                        allOffline = false;
                    }
                }

                if (!instance.trackers[key].allOffline && allOffline) {
                    if (instance.generalSettings.trackerNotifyAllOffline) {
                        await DiscordTools.sendTrackerAllOffline(guild.id, key);
                    }
                }
                else if (instance.trackers[key].allOffline && !allOffline) {
                    if (instance.generalSettings.trackerNotifyAnyOnline) {
                        await DiscordTools.sendTrackerAnyOnline(guild.id, key);
                    }
                }

                instance.trackers[key].allOffline = allOffline;
                client.writeInstanceFile(guild.id, instance);
                await DiscordTools.sendTrackerMessage(guild.id, key, true, false);
            }
        });

        if (client.battlemetricsIntervalCounter === 29) {
            client.battlemetricsIntervalCounter = 0;
        }
        else {
            client.battlemetricsIntervalCounter += 1;
        }

    },
}