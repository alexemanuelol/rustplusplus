const { listen } = require('push-receiver');
const DiscordTools = require('../discordTools/discordTools.js');
const Constants = require('../util/constants.js');

module.exports = async (client, guild) => {
    let credentials = client.readCredentialsFile(guild.id);

    if (credentials.credentials === null) {
        return;
    }

    /* Destroy previous instance of fcm listener */
    if (client.currentFcmListeners[guild.id]) {
        client.currentFcmListeners[guild.id].destroy();
    }

    let startTime = new Date();
    client.currentFcmListeners[guild.id] =
        await listen(credentials.credentials.fcm_credentials, async ({ notification, persistentId }) => {
            /* Create a delay so that buffered notifications are ignored. */
            if ((new Date() - startTime) < 3000) return;

            /* Parse the notification body. */
            const full = notification
            const data = full.data;
            const body = JSON.parse(data.body);

            switch (data.channelId) {
                case 'pairing': {
                    switch (body.type) {
                        case 'server': {
                            client.log('FCM', `${guild.id} pairing: server`);
                            pairingServer(client, guild, full, data, body);
                        } break;

                        case 'entity': {
                            switch (body.entityName) {
                                case 'Switch': {
                                    client.log('FCM', `${guild.id} pairing: entity: Switch`);
                                    pairingEntitySwitch(client, guild, full, data, body);
                                } break;

                                case 'Smart Alarm': {
                                    client.log('FCM', `${guild.id} pairing: entity: Smart Alarm`);
                                    pairingEntitySmartAlarm(client, guild, full, data, body);
                                } break;

                                case 'Storage Monitor': {
                                    client.log('FCM', `${guild.id} pairing: entity: Storage Monitor`);
                                    pairingEntityStorageMonitor(client, guild, full, data, body);
                                } break;

                                default: {
                                    client.log('FCM', `${guild.id} pairing: entity: other\n${JSON.stringify(full)}`);
                                } break;
                            }
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} pairing: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'alarm': {
                    switch (body.type) {
                        case 'alarm': {
                            client.log('FCM', `${guild.id} alarm: alarm`);
                            alarmAlarm(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} alarm: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'player': {
                    switch (body.type) {
                        case 'death': {
                            client.log('FCM', `${guild.id} player: death`);
                            playerDeath(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} player: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'team': {
                    switch (body.type) {
                        case 'login': {
                            client.log('FCM', `${guild.id} team: login`);
                            teamLogin(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} team: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'news': {
                    switch (body.type) {
                        case 'news': {
                            client.log('FCM', `${guild.id} news: news`);
                            newsNews(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} news: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                default: {
                    client.log('FCM', `${guild.id} other\n${JSON.stringify(full)}`);
                } break;
            }
        });
};

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) {
        return true;
    }
    return false;
}

async function pairingServer(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;

    let exist = instance.serverList.hasOwnProperty(serverId);

    let message = undefined;
    if (exist) {
        message = await DiscordTools.getMessageById(
            guild.id, instance.channelId.servers, instance.serverList[serverId].messageId);
    }

    instance.serverList[serverId] = {
        active: (exist) ? instance.serverList[serverId].active : false,
        title: data.title,
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: body.playerToken,
        description: body.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
        img: isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG,
        url: isValidUrl(body.url) ? body.url : Constants.DEFAULT_SERVER_URL,
        timeTillDay: null,
        timeTillNight: null,
        messageId: (message !== undefined) ? message.id : null
    };
    client.writeInstanceFile(guild.id, instance);

    await DiscordTools.sendServerMessage(guild.id, serverId, null);
}

async function pairingEntitySwitch(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let id = body.entityId;

    if (instance.switches.hasOwnProperty(id)) {
        return;
    }

    instance.switches[id] = {
        active: false,
        name: 'Smart Switch',
        command: id,
        image: 'smart_switch.png',
        autoDayNight: 0,
        server: body.name,
        ipPort: `${body.ip}-${body.port}`
    };
    client.writeInstanceFile(guild.id, instance);

    let rustplus = client.rustplusInstances[guild.id];
    if (!rustplus) return;

    let serverId = `${rustplus.server}-${rustplus.port}`;

    if (`${body.ip}-${body.port}` === serverId) {
        let info = await rustplus.getEntityInfoAsync(id);
        if (info.error) return;

        let active = info.entityInfo.payload.value;
        instance = client.readInstanceFile(guild.id);
        instance.switches[id].active = active;
        client.writeInstanceFile(guild.id, instance);

        DiscordTools.sendSmartSwitchMessage(guild.id, id);
    }
}

async function pairingEntitySmartAlarm(client, guild, full, data, body) {

}

async function pairingEntityStorageMonitor(client, guild, full, data, body) {

}

async function alarmAlarm(client, guild, full, data, body) {

}

async function playerDeath(client, guild, full, data, body) {

}

async function teamLogin(client, guild, full, data, body) {

}

async function newsNews(client, guild, full, data, body) {

}