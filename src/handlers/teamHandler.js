const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus, client, teamInfo) {
        /* Handle team changes */
        module.exports.checkChanges(rustplus, client, teamInfo);
    },

    checkChanges: async function (rustplus, client, teamInfo) {
        let instance = client.readInstanceFile(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;
        const server = instance.serverList[serverId];

        if (rustplus.team.isLeaderSteamIdChanged(teamInfo)) return;

        const newPlayers = rustplus.team.getNewPlayers(teamInfo);
        const leftPlayers = rustplus.team.getLeftPlayers(teamInfo);

        for (const steamId of leftPlayers) {
            const player = rustplus.team.getPlayer(steamId);
            const str = `${player.name} left the team.`;
            await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#606060', str, steamId);
            if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
            rustplus.log('INFO', str);
        }

        for (const steamId of newPlayers) {
            for (const player of teamInfo.members) {
                if (player.steamId.toString() === steamId) {
                    const str = `${player.name} joined the team.`;
                    await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#00ff40', str, steamId);
                    if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
                    rustplus.log('INFO', str);
                }
            }
        }

        for (const player of rustplus.team.players) {
            if (leftPlayers.includes(player.steamId)) continue;
            for (const playerUpdated of teamInfo.members) {
                if (player.steamId === playerUpdated.steamId.toString()) {
                    if (player.isGoneDead(playerUpdated)) {
                        const str = `${player.name} just died at ${player.pos.string}.`;
                        await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#ff0040', str,
                            player.steamId);
                        if (instance.generalSettings.deathNotify) rustplus.sendTeamMessageAsync(str);
                        rustplus.log('INFO', str);
                    }

                    if (player.isGoneAfk(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            const str = `${player.name} just went AFK.`;
                            rustplus.sendTeamMessageAsync(str);
                            rustplus.log('INFO', str);
                        }
                    }

                    if (player.isAfk() && player.isMoved(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            const afkTime = player.getAfkTime('dhs');
                            const str = `${player.name} just returned (${afkTime}).`;
                            rustplus.sendTeamMessageAsync(str);
                            rustplus.log('INFO', str);
                        }
                    }

                    if (player.isGoneOnline(playerUpdated)) {
                        const str = `${player.name} just connected.`;
                        await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#00ff40', str,
                            player.steamId);
                        if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
                        rustplus.log('INFO', `${player.name} just connected to ${server.title}.`);
                    }

                    if (player.isGoneOffline(playerUpdated)) {
                        const str = `${player.name} just disconnected.`;
                        await DiscordMessages.sendActivityNotificationMessage(guildId, serverId, '#ff0040', str,
                            player.steamId);
                        if (instance.generalSettings.connectionNotify) await rustplus.sendTeamMessageAsync(str);
                        rustplus.log('INFO', `${player.name} just disconnected from ${server.title}.`);
                    }
                    break;
                }
            }
        }
    },
}