const PushReceiver = require('push-receiver');

const BattlemetricsAPI = require('../util/battlemetricsAPI.js');
const Constants = require('../util/constants.js');
const DiscordButtons = require('../discordTools/discordButtons.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Map = require('../util/map.js');
const Scrape = require('../util/scrape.js');

module.exports = async (client, guild) => {
    const credentials = InstanceUtils.readCredentialsFile(guild.id);
    const hoster = credentials.hoster;

    if (Object.keys(credentials).length === 1) {
        client.log(client.intlGet(null, 'warningCap'),
            client.intlGet(null, 'credentialsNotRegisteredForGuild', { id: guild.id }));
        return;
    }

    if (!hoster) {
        client.log(client.intlGet(null, 'warningCap'),
            client.intlGet(guild.id, 'credentialsHosterNotSetForGuild', { id: guild.id }));
        return;
    }

    const discordUserId = credentials[hoster].discordUserId;

    /* Destroy previous instance of fcm listener */
    if (client.currentFcmListeners[guild.id]) client.currentFcmListeners[guild.id].destroy();

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'fcmListenerStartIn', { id: guild.id }));

    let startTime = new Date();
    client.currentFcmListeners[guild.id] =
        await PushReceiver.listen(credentials[hoster].fcm_credentials, async ({ notification, persistentId }) => {
            /* Create a delay so that buffered notifications are ignored. */
            if ((new Date() - startTime) < 5000) return;

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
                            if (data.title === 'You\'re getting raided!') {
                                /* Custom alarm from plugin: https://umod.org/plugins/raid-alarm */
                                client.log('FCM', `${guild.id} alarm: raid-alarm plugin`);
                                alarmRaidAlarm(client, guild, full, data, body);
                                break;
                            }
                            client.log('FCM', `${guild.id} alarm: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'player': {
                    switch (body.type) {
                        case 'death': {
                            client.log('FCM', `${guild.id} player: death`);
                            playerDeath(client, guild, full, data, body, discordUserId);
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
    if (url.startsWith('https') || url.startsWith('http')) return true;
    return false;
}

async function pairingServer(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    const server = instance.serverList[serverId];

    let message = undefined;
    if (server) message = await DiscordTools.getMessageById(guild.id, instance.channelId.servers, server.messageId);

    let info = null;
    let battlemetricsId = await BattlemetricsAPI.getBattlemetricsServerId(client, data.title);
    if (battlemetricsId !== null) {
        info = await BattlemetricsAPI.getBattlemetricsServerInfo(client, battlemetricsId);
        let onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(client, battlemetricsId);
        if (BattlemetricsAPI.isBattlemetricsServerHidden(onlinePlayers)) {
            battlemetricsId = null;
        }
    }

    instance.serverList[serverId] = {
        active: server ? server.active : false,
        title: data.title,
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: body.playerToken,
        description: body.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
        img: isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG,
        url: isValidUrl(body.url) ? body.url : Constants.DEFAULT_SERVER_URL,
        notes: server ? server.notes : {},
        switches: server ? server.switches : {},
        alarms: server ? server.alarms : {},
        storageMonitors: server ? server.storageMonitors : {},
        markers: server ? server.markers : {},
        switchGroups: server ? server.switchGroups : {},
        messageId: (message !== undefined) ? message.id : null,
        battlemetricsId: battlemetricsId,
        connect: (info === null) ? 'Unavailable' : `${client.intlGet(guild.id, 'connect')} ${info.ip}:${info.port}`,
        cargoShipEgressTimeMs: server ? server.cargoShipEgressTimeMs : Constants.DEFAULT_CARGO_SHIP_EGRESS_TIME_MS,
        bradleyApcRespawnTimeMs: server ? server.bradleyApcRespawnTimeMs :
            Constants.DEFAULT_BRADLEY_APC_RESPAWN_TIME_MS,
        lockedCrateDespawnTimeMs: server ? server.lockedCrateDespawnTimeMs :
            Constants.DEFAULT_LOCKED_CRATE_DESPAWN_TIME_MS,
        lockedCrateDespawnWarningTimeMs: server ? server.lockedCrateDespawnWarningTimeMs :
            Constants.DEFAULT_LOCKED_CRATE_DESPAWN_WARNING_TIME_MS,
        oilRigLockedCrateUnlockTimeMs: server ? server.oilRigLockedCrateUnlockTimeMs :
            Constants.DEFAULT_OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
        timeTillDay: server ? server.timeTillDay : null,
        timeTillNight: server ? server.timeTillNight : null
    };
    client.setInstance(guild.id, instance);

    await DiscordMessages.sendServerMessage(guild.id, serverId, null);
}

async function pairingEntitySwitch(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const switches = instance.serverList[serverId].switches;

    const entityExist = instance.serverList[serverId].switches.hasOwnProperty(body.entityId);
    instance.serverList[serverId].switches[body.entityId] = {
        active: entityExist ? switches[body.entityId].active : false,
        reachable: entityExist ? switches[body.entityId].reachable : true,
        name: entityExist ? switches[body.entityId].name : client.intlGet(guild.id, 'smartSwitch'),
        command: entityExist ? switches[body.entityId].command : body.entityId,
        image: entityExist ? switches[body.entityId].image : 'smart_switch.png',
        autoDayNight: entityExist ? switches[body.entityId].autoDayNight : 0,
        location: entityExist ? switches[body.entityId].location : null,
        server: entityExist ? switches[body.entityId].server : body.name,
        messageId: entityExist ? switches[body.entityId].messageId : null
    };
    client.setInstance(guild.id, instance);

    const rustplus = client.rustplusInstances[guild.id];
    if (rustplus && serverId === rustplus.serverId) {
        const info = await rustplus.getEntityInfoAsync(body.entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.serverList[serverId].switches[body.entityId].reachable = false;
        }

        const teamInfo = await rustplus.getTeamInfoAsync();
        if (await rustplus.isResponseValid(teamInfo)) {
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === rustplus.playerId);
            if (player) {
                const location = Map.getPos(player.x, player.y, rustplus.info.correctedMapSize, rustplus);
                instance.serverList[serverId].switches[body.entityId].location = location.location;
            }
        }

        if (instance.serverList[serverId].switches[body.entityId].reachable) {
            instance.serverList[serverId].switches[body.entityId].active = info.entityInfo.payload.value;
        }
        client.setInstance(guild.id, instance);

        await DiscordMessages.sendSmartSwitchMessage(guild.id, serverId, body.entityId);
    }
}

async function pairingEntitySmartAlarm(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const alarms = instance.serverList[serverId].alarms;

    const entityExist = instance.serverList[serverId].alarms.hasOwnProperty(body.entityId);
    instance.serverList[serverId].alarms[body.entityId] = {
        active: entityExist ? alarms[body.entityId].active : false,
        reachable: entityExist ? alarms[body.entityId].reachable : true,
        everyone: entityExist ? alarms[body.entityId].everyone : false,
        name: entityExist ? alarms[body.entityId].name : client.intlGet(guild.id, 'smartAlarm'),
        message: entityExist ? alarms[body.entityId].message : client.intlGet(guild.id, 'baseIsUnderAttack'),
        id: entityExist ? alarms[body.entityId].id : body.entityId,
        image: entityExist ? alarms[body.entityId].image : 'smart_alarm.png',
        location: entityExist ? alarms[body.entityId].location : null,
        server: entityExist ? alarms[body.entityId].server : body.name,
        messageId: entityExist ? alarms[body.entityId].messageId : null
    };
    client.setInstance(guild.id, instance);

    const rustplus = client.rustplusInstances[guild.id];
    if (rustplus && serverId === rustplus.serverId) {
        const info = await rustplus.getEntityInfoAsync(body.entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.serverList[serverId].alarms[body.entityId].reachable = false;
        }

        const teamInfo = await rustplus.getTeamInfoAsync();
        if (await rustplus.isResponseValid(teamInfo)) {
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === rustplus.playerId);
            if (player) {
                const location = Map.getPos(player.x, player.y, rustplus.info.correctedMapSize, rustplus);
                instance.serverList[serverId].alarms[body.entityId].location = location.location;
            }
        }

        if (instance.serverList[serverId].alarms[body.entityId].reachable) {
            instance.serverList[serverId].alarms[body.entityId].active = info.entityInfo.payload.value;
        }
        client.setInstance(guild.id, instance);
    }

    await DiscordMessages.sendSmartAlarmMessage(guild.id, serverId, body.entityId);
}

async function pairingEntityStorageMonitor(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const storageMonitors = instance.serverList[serverId].storageMonitors;

    const entityExist = instance.serverList[serverId].storageMonitors.hasOwnProperty(body.entityId);
    instance.serverList[serverId].storageMonitors[body.entityId] = {
        name: entityExist ? storageMonitors[body.entityId].name : client.intlGet(guild.id, 'storageMonitor'),
        reachable: entityExist ? storageMonitors[body.entityId].reachable : true,
        id: entityExist ? storageMonitors[body.entityId].id : body.entityId,
        type: entityExist ? storageMonitors[body.entityId].type : 'container',
        decaying: entityExist ? storageMonitors[body.entityId].decaying : false,
        upkeep: entityExist ? storageMonitors[body.entityId].upkeep : null,
        everyone: entityExist ? storageMonitors[body.entityId].everyone : false,
        inGame: entityExist ? storageMonitors[body.entityId].inGame : true,
        image: entityExist ? storageMonitors[body.entityId].image : 'storage_monitor.png',
        location: entityExist ? storageMonitors[body.entityId].location : null,
        server: entityExist ? storageMonitors[body.entityId].server : body.name,
        messageId: entityExist ? storageMonitors[body.entityId].messageId : null
    };
    client.setInstance(guild.id, instance);

    const rustplus = client.rustplusInstances[guild.id];
    if (rustplus && serverId === rustplus.serverId) {
        const info = await rustplus.getEntityInfoAsync(body.entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.serverList[serverId].storageMonitors[body.entityId].reachable = false;
        }

        const teamInfo = await rustplus.getTeamInfoAsync();
        if (await rustplus.isResponseValid(teamInfo)) {
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === rustplus.playerId);
            if (player) {
                const location = Map.getPos(player.x, player.y, rustplus.info.correctedMapSize, rustplus);
                instance.serverList[serverId].storageMonitors[body.entityId].location = location.location;
            }
        }

        if (instance.serverList[serverId].storageMonitors[body.entityId].reachable) {
            if (info.entityInfo.payload.capacity === 28) {
                instance.serverList[serverId].storageMonitors[body.entityId].type = 'toolcupboard';
                instance.serverList[serverId].storageMonitors[body.entityId].image = 'tool_cupboard.png';
                if (info.entityInfo.payload.protectionExpiry === 0) {
                    instance.serverList[serverId].storageMonitors[body.entityId].decaying = true;
                }
            }

            rustplus.storageMonitors[body.entityId] = {
                items: info.entityInfo.payload.items,
                expiry: info.entityInfo.payload.protectionExpiry,
                capacity: info.entityInfo.payload.capacity,
                hasProtection: info.entityInfo.payload.hasProtection
            }
        }
        client.setInstance(guild.id, instance);

        await DiscordMessages.sendStorageMonitorMessage(guild.id, serverId, body.entityId);
    }
}

async function alarmAlarm(client, guild, full, data, body) {
    /* Unfortunately the alarm notification from the fcm listener is unreliable. The notification does not include
    which entityId that got triggered which makes it impossible to know which Smart Alarms are still being used
    actively. Also, from testing it seems that notifications don't always reach this fcm listener which makes it even
    more unreliable. The only advantage to using the fcm listener alarm notification is that it includes the title and
    description messagethat is configured on the Smart Alarm in the game. Due to missing out on this data, Smart Alarm
    title and description message needs to be re-configured via the /alarm slash command. Alarms that are used on the
    connected rust server will be handled through the message event from rustplus. Smart Alarms that are still attached
    to the credential owner and which is not part of the currently connected rust server can notify IF the general
    setting fcmAlarmNotificationEnabled is enabled. Those notifications will be handled here. */

    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    const entityId = body.entityId;
    const server = instance.serverList[serverId];
    const rustplus = client.rustplusInstances[guild.id];

    if (!server || (server && !server.alarms[entityId])) return;

    if ((!rustplus || (rustplus && (rustplus.serverId !== serverId))) &&
        instance.generalSettings.fcmAlarmNotificationEnabled) {
        await DiscordMessages.sendSmartAlarmTriggerMessage(guild.id, serverId, entityId);
        client.log(client.intlGet(null, 'infoCap'), `${data.title}: ${data.message}`);
    }
}

async function alarmRaidAlarm(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    const rustplus = client.rustplusInstances[guild.id];

    if (!instance.serverList.hasOwnProperty(serverId)) return;

    const content = {
        embeds: [DiscordEmbeds.getAlarmRaidAlarmEmbed(data, body)],
        content: '@everyone'
    }

    await DiscordMessages.sendMessage(guild.id, content, null, instance.channelId.activity);

    if (rustplus && (serverId === rustplus.serverId)) {
        rustplus.sendTeamMessageAsync(`${data.title}: ${data.message}`);
    }

    client.log(client.intlGet(null, 'infoCap'), `${data.title} ${data.message}`);
}

async function playerDeath(client, guild, full, data, body, discordUserId) {
    const user = await DiscordTools.getUserById(guild.id, discordUserId);

    let png = null;
    if (body.targetId !== '') png = await Scrape.scrapeSteamProfilePicture(client, body.targetId);
    if (png === null) png = isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG;

    const content = {
        embeds: [DiscordEmbeds.getPlayerDeathEmbed(data, body, png)]
    }

    if (user) {
        await client.messageSend(user, content);
    }
}

async function teamLogin(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);

    const content = {
        embeds: [DiscordEmbeds.getTeamLoginEmbed(
            guild.id, body, await Scrape.scrapeSteamProfilePicture(client, body.targetId))]
    }

    const rustplus = client.rustplusInstances[guild.id];
    const serverId = `${body.ip}-${body.port}`;

    if (!rustplus || (rustplus && (serverId !== rustplus.serverId))) {
        await DiscordMessages.sendMessage(guild.id, content, null, instance.channelId.activity);
        client.log(client.intlGet(null, 'infoCap'),
            client.intlGet(null, 'playerJustConnectedTo', {
                name: body.targetName,
                server: body.name
            }));
    }
}

async function newsNews(client, guild, full, data, body) {
    const instance = client.getInstance(guild.id);

    const content = {
        embeds: [DiscordEmbeds.getNewsEmbed(guild.id, data)],
        components: [DiscordButtons.getNewsButton(guild.id, body, isValidUrl(body.url))]
    }

    await DiscordMessages.sendMessage(guild.id, content, null, instance.channelId.activity);
}