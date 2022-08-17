const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');
const Scrape = require('../util/scrape.js');
const Constants = require('../util/constants.js');

module.exports = {
    handler: async function (rustplus, client, teamInfo) {
        /* Handle team changes */
        module.exports.checkChanges(rustplus, client, teamInfo);
    },

    checkChanges: async function (rustplus, client, teamInfo) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.activity);

        if (!channel) {
            client.log('ERROR', 'Invalid guild or channel.', 'error');
            return;
        }

        if (rustplus.team.isLeaderSteamIdChanged(teamInfo)) return;

        let newPlayers = rustplus.team.getNewPlayers(teamInfo);
        let leftPlayers = rustplus.team.getLeftPlayers(teamInfo);

        for (let steamId of leftPlayers) {
            let player = rustplus.team.getPlayer(steamId);
            let png = await Scrape.scrapeSteamProfilePicture(client, steamId);
            await client.messageSend(channel, {
                embeds: [new MessageEmbed()
                    .setColor('#606060')
                    .setAuthor({
                        name: `${player.name} left the team.`,
                        iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                        url: `${Constants.STEAM_PROFILES_URL}${steamId}`
                    })
                    .setTimestamp()
                    .setFooter({ text: instance.serverList[rustplus.serverId].title })
                ]
            });

            if (instance.generalSettings.connectionNotify) {
                await rustplus.sendTeamMessageAsync(`${player.name} left the team.`);
            }

            rustplus.log('INFO', `${player.name} left the team.`);
        }

        for (let steamId of newPlayers) {
            for (let player of teamInfo.members) {
                if (player.steamId.toString() === steamId) {
                    let png = await Scrape.scrapeSteamProfilePicture(client, steamId);
                    await client.messageSend(channel, {
                        embeds: [new MessageEmbed()
                            .setColor('#00ff40')
                            .setAuthor({
                                name: `${player.name} joined the team.`,
                                iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                                url: `${Constants.STEAM_PROFILES_URL}${steamId}`
                            })
                            .setTimestamp()
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })
                        ]
                    });

                    if (instance.generalSettings.connectionNotify) {
                        await rustplus.sendTeamMessageAsync(`${player.name} joined the team.`);
                    }

                    rustplus.log('INFO', `${player.name} joined the team.`);
                }
            }
        }

        for (let player of rustplus.team.players) {
            if (leftPlayers.includes(player.steamId)) {
                continue;
            }

            for (let playerUpdated of teamInfo.members) {
                if (player.steamId === playerUpdated.steamId.toString()) {
                    if (player.isGoneDead(playerUpdated)) {
                        let pos = player.pos;
                        let png = await Scrape.scrapeSteamProfilePicture(client, player.steamId);
                        await client.messageSend(channel, {
                            embeds: [new MessageEmbed()
                                .setColor('#ff0040')
                                .setAuthor({
                                    name: `${player.name} just died at ${pos}.`,
                                    iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                                    url: `${Constants.STEAM_PROFILES_URL}${player.steamId}`
                                })
                                .setTimestamp()
                                .setFooter({ text: instance.serverList[rustplus.serverId].title })
                            ]
                        });

                        if (instance.generalSettings.deathNotify) {
                            rustplus.sendTeamMessageAsync(`${player.name} just died at ${pos}.`);
                        }

                        rustplus.log('INFO', `${player.name} just died at ${pos}.`);
                    }

                    if (player.isGoneAfk(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            rustplus.sendTeamMessageAsync(`${player.name} just went AFK.`);
                            rustplus.log('INFO', `${player.name} just went AFK.`);
                        }
                    }

                    if (player.isAfk() && player.isMoved(playerUpdated)) {
                        if (instance.generalSettings.afkNotify) {
                            let afkTime = player.getAfkTime('dhs');
                            rustplus.sendTeamMessageAsync(`${player.name} just returned (${afkTime}).`);
                            rustplus.log('INFO', `${player.name} just returned (${afkTime}).`);
                        }
                    }

                    if (player.isGoneOnline(playerUpdated)) {
                        let png = await Scrape.scrapeSteamProfilePicture(client, player.steamId);
                        await client.messageSend(channel, {
                            embeds: [new MessageEmbed()
                                .setColor('#00ff40')
                                .setAuthor({
                                    name: `${player.name} just connected.`,
                                    iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                                    url: `${Constants.STEAM_PROFILES_URL}${player.steamId}`
                                })
                                .setTimestamp()
                                .setFooter({ text: instance.serverList[rustplus.serverId].title })
                            ]
                        });

                        if (instance.generalSettings.connectionNotify) {
                            await rustplus.sendTeamMessageAsync(
                                `${player.name} just connected.`);
                        }

                        rustplus.log('INFO', `${player.name} just connected to ${instance.serverList[rustplus.serverId].title}.`);
                    }

                    if (player.isGoneOffline(playerUpdated)) {
                        let png = await Scrape.scrapeSteamProfilePicture(client, player.steamId);
                        await client.messageSend(channel, {
                            embeds: [new MessageEmbed()
                                .setColor('#ff0040')
                                .setAuthor({
                                    name: `${player.name} just disconnected.`,
                                    iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                                    url: `${Constants.STEAM_PROFILES_URL}${player.steamId}`
                                })
                                .setTimestamp()
                                .setFooter({ text: instance.serverList[rustplus.serverId].title })
                            ]
                        });

                        if (instance.generalSettings.connectionNotify) {
                            await rustplus.sendTeamMessageAsync(
                                `${player.name} just disconnected.`);
                        }

                        rustplus.log('INFO', `${player.name} just disconnected from ${instance.serverList[rustplus.serverId].title}.`);
                    }
                    break;
                }
            }
        }
    },
}