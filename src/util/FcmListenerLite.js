const PushReceiver = require('push-receiver');

const InstanceUtils = require('../util/instanceUtils.js');

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
                            client.log('FCM Lite', `GuildID: ${guild.id}, SteamID: ${steamId}, pairing: server`);
                            pairingServer(client, guild, steamId, full, data, body);
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