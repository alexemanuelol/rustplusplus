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

    https://github.com/alexemanuelol/rustPlusPlus

*/

const PushReceiver = require('push-receiver');

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Scrape = require('../util/scrape.js');

module.exports = async (client, guild, steamId) => {
    const credentials = InstanceUtils.readCredentialsFile(guild.id);
    const hoster = credentials.hoster;

    if (!Object.keys(credentials).includes(steamId)) {
        client.log(client.intlGet(null, 'warningCap'), client.intlGet(null, 'credentialsNotRegistered', {
            steamId: steamId
        }));
        return;
    }

    if (steamId === hoster) {
        client.log(client.intlGet(null, 'warningCap'),
            client.intlGet(null, 'credentialsCannotStartLiteAlreadyHoster', {
                steamId: steamId
            }));
        return;
    }

    if (client.fcmListenersLite[guild.id][steamId]) client.fcmListenersLite[guild.id][steamId].destroy();

    const discordUserId = credentials[steamId].discordUserId;

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'fcmListenerStartLite', {
        guildId: guild.id,
        steamId: steamId
    }));

    let startTime = new Date();
    client.fcmListenersLite[guild.id][steamId] =
        await PushReceiver.listen(credentials[steamId].fcm_credentials, async ({ notification, persistentId }) => {
            /* Create a delay so that buffered notifications are ignored. */
            if ((new Date() - startTime) < 10000) return;

            /* Parse the notification body. */
            const full = notification
            const data = full.data;
            const body = JSON.parse(data.body);

            switch (data.channelId) {
                case 'pairing': {
                    switch (body.type) {
                        case 'server': {
                            client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${steamId}, pairing: server`);
                            pairingServer(client, guild, steamId, full, data, body);
                        } break;

                        default: {
                        } break;
                    }
                } break;

                case 'player': {
                    switch (body.type) {
                        case 'death': {
                            client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${steamId}, player: death`);
                            playerDeath(client, guild, full, data, body, discordUserId);
                        } break;

                        default: {
                        } break;
                    }
                } break;

                default: {
                } break;
            }
        });
};

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) return true;
    return false;
}

async function pairingServer(client, guild, steamId, full, data, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;

    if (!instance.serverListLite.hasOwnProperty(serverId)) instance.serverListLite[serverId] = new Object();

    instance.serverListLite[serverId][steamId] = {
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: body.playerToken,
    };
    client.setInstance(guild.id, instance);

    const rustplus = client.rustplusInstances[guild.id];
    if (rustplus && (rustplus.serverId === serverId) && rustplus.team.leaderSteamId === steamId) {
        rustplus.updateLeaderRustPlusLiteInstance();
    }
}

async function playerDeath(client, guild, full, data, body, discordUserId) {
    const user = await DiscordTools.getUserById(guild.id, discordUserId);
    if (!user) return;

    let png = null;
    if (body.targetId !== '') png = await Scrape.scrapeSteamProfilePicture(client, body.targetId);
    if (png === null) png = isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG;

    const content = {
        embeds: [DiscordEmbeds.getPlayerDeathEmbed(data, body, png)]
    }

    await client.messageSend(user, content);
}
