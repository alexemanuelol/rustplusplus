const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');
const Scrape = require('../util/scrape.js');

const DEFAULT_IMG = 'https://files.facepunch.com/lewis/1b2411b1/og-image.jpg';
const STEAM_LINK = 'https://steamcommunity.com/profiles/';

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

        if (rustplus.team.isLeaderSteamIdChanged(teamInfo)) {
            return;
        }

        let newPlayers = rustplus.team.getNewPlayers(teamInfo);
        let leftPlayers = rustplus.team.getLeftPlayers(teamInfo);

        for (let steamId of leftPlayers) {
            let player = rustplus.team.getPlayer(steamId);
            let png = await Scrape.scrapeSteamProfilePicture(rustplus, steamId);
            await channel.send({
                embeds: [new MessageEmbed()
                    .setColor('#ff0040')
                    .setAuthor({
                        name: `${player.name} left the team.`,
                        iconURL: (png !== '') ? png : DEFAULT_IMG,
                        url: `${STEAM_LINK}${steamId}`
                    })
                    .setTimestamp()
                    .setFooter({
                        text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
                    })
                ]
            });
        }

        for (let steamId of newPlayers) {
            for (let player of teamInfo.members) {
                if (player.steamId.toString() === steamId) {
                    let png = await Scrape.scrapeSteamProfilePicture(rustplus, steamId);
                    await channel.send({
                        embeds: [new MessageEmbed()
                            .setColor('#00ff40')
                            .setAuthor({
                                name: `${player.name} joined the team.`,
                                iconURL: (png !== '') ? png : DEFAULT_IMG,
                                url: `${STEAM_LINK}${steamId}`
                            })
                            .setTimestamp()
                            .setFooter({
                                text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
                            })
                        ]
                    });
                }
            }
        }

        for (let player of rustplus.team.players) {
            if (leftPlayers.includes(player.steamId)) {
                continue;
            }

            for (let playerUpdated of teamInfo.members) {
                if (player.steamId === playerUpdated.steamId.toString()) {
                    if (player.isGoneOnline(playerUpdated)) {
                        let png = await Scrape.scrapeSteamProfilePicture(rustplus, player.steamId);
                        await channel.send({
                            embeds: [new MessageEmbed()
                                .setColor('#00ff40')
                                .setAuthor({
                                    name: `${player.name} just connected.`,
                                    iconURL: (png !== '') ? png : DEFAULT_IMG,
                                    url: `${STEAM_LINK}${player.steamId}`
                                })
                                .setTimestamp()
                                .setFooter({
                                    text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
                                })
                            ]
                        });
                    }

                    if (player.isGoneOffline(playerUpdated)) {
                        let png = await Scrape.scrapeSteamProfilePicture(rustplus, player.steamId);
                        await channel.send({
                            embeds: [new MessageEmbed()
                                .setColor('#ff0040')
                                .setAuthor({
                                    name: `${player.name} just disconnected.`,
                                    iconURL: (png !== '') ? png : DEFAULT_IMG,
                                    url: `${STEAM_LINK}${player.steamId}`
                                })
                                .setTimestamp()
                                .setFooter({
                                    text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
                                })
                            ]
                        });
                    }

                    if (!player.isOnline && !playerUpdated.isOnline && player.isGoneDead(playerUpdated)) {
                        let png = await Scrape.scrapeSteamProfilePicture(rustplus, player.steamId);
                        await channel.send({
                            embeds: [new MessageEmbed()
                                .setColor('#ff0040')
                                .setAuthor({
                                    name: `${player.name} just got offline killed.`,
                                    iconURL: (png !== '') ? png : DEFAULT_IMG,
                                    url: `${STEAM_LINK}${player.steamId}`
                                })
                                .setTimestamp()
                                .setFooter({
                                    text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
                                })
                            ]
                        });
                    }
                    break;
                }
            }
        }
    },
}