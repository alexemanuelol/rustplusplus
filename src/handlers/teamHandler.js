const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client, teamInfo) {
        /* Handle team changes */
        module.exports.checkChanges(rustplus, client, teamInfo);
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
            await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#606060', str, steamId);
            if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
            rustplus.log(client.intlGet(null, 'infoCap'), str);
        }

        for (const steamId of newPlayers) {
            for (const player of teamInfo.members) {
                if (player.steamId.toString() === steamId) {
                    const str = client.intlGet(guildId, 'playerJoinedTheTeam', { name: player.name });
                    await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#00ff40', str, steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
                    rustplus.log(client.intlGet(null, 'infoCap'), str);
                }
            }
        }

        for (const player of rustplus.team.players) {
            if (leftPlayers.includes(player.steamId)) continue;
            for (const playerUpdated of teamInfo.members) {
                if (player.steamId === playerUpdated.steamId.toString()) {
                    if (player.isGoneDead(playerUpdated)) {
                        const location = player.pos === null ? 'spawn' : player.pos.string;
                        const str = client.intlGet(guildId, 'playerJustDied', {
                            name: player.name,
                            location: location
                        });
                        await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#ff0040', str,
                            player.steamId);
                        if (instance.generalSettings.deathNotify) rustplus.sendTeamMessageAsync(str);
                        rustplus.log(client.intlGet(null, 'infoCap'), str);
                    }

                    if (player.isGoneAfk(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            const str = client.intlGet(guildId, 'playerJustWentAfk', { name: player.name });
                            rustplus.sendTeamMessageAsync(str);
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
                            rustplus.sendTeamMessageAsync(str);
                            rustplus.log(client.intlGet(null, 'infoCap'), str);
                        }
                    }

                    if (player.isGoneOnline(playerUpdated)) {
                        const str = client.intlGet(guildId, 'playerJustConnected', { name: player.name });
                        await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#00ff40', str,
                            player.steamId);
                        if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
                        rustplus.log(client.intlGet(null, 'infoCap'),
                            client.intlGet(null, 'playerJustConnectedTo', {
                                name: player.name,
                                server: server.title
                            }));
                    }

                    if (player.isGoneOffline(playerUpdated)) {
                        const str = client.intlGet(guildId, 'playerJustDisconnected', { name: player.name });
                        await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#ff0040', str,
                            player.steamId);
                        if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
                        rustplus.log(client.intlGet(null, 'infoCap'),
                            client.intlGet(null, 'playerJustDisconnectedFrom', {
                                name: player.name,
                                server: server.title
                            }));
                    }
                    break;
                }
            }
        }
    },
}