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

    https://github.com/alexemanuelol/rustplusplus

*/

const Axios = require('axios');
const Discord = require('discord.js');
const Path = require('path');
const PushReceiver = require('push-receiver');

const Battlemetrics = require('../structures/Battlemetrics');
const Constants = require('../util/constants.js');
const DiscordButtons = require('../discordTools/discordButtons.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Map = require('../util/map.js');
const Scrape = require('../util/scrape.js');

const NotificationType = {
    PAIRING: 1001,
    PLAYER_LOGGED_IN: 1002,
    PLAYER_DIED: 1003,
    SMART_ALARM: 1004,
    CLAN_ANNOUNCEMENT: 1005
}

async function startNewAuthTokenListener(client, guildId, steamId) {
    const authTokens = InstanceUtils.readAuthTokensFile(guildId);
    const hoster = authTokens.hoster;

    if (Object.keys(authTokens).length === 1) {
        client.log(client.intlGet(null, 'warningCap'),
            `Authentication Tokens are not registered for guild: ${guildId}, cannot start AuthTokenListener.`);
        return false;
    }

    if (!hoster) {
        client.log(client.intlGet(null, 'warningCap'),
            `Authentication Token hoster is not set for guild ${guildId}, please set a hoster.`);
    }

    if (!(steamId in authTokens)) {
        client.log(client.intlGet(null, 'warningCap'),
            `Could not find a authentication token for steamId: ${steamId}.`);
        return false;
    }

    client.log(client.intlGet(null, 'infoCap'),
        `Starting Auth Token Listener for guildId: ${guildId}, steamId: ${steamId}`);

    await authTokenListener(client, guildId, steamId, true);
    client.authTokenListenerIntervalIds[guildId][steamId] =
        setInterval(authTokenListener, Constants.AUTH_TOKEN_LISTENER_POLL_MS, client, guildId, steamId);

    return true;
}

async function authTokenListener(client, guildId, steamId, firstTime = false) {
    const authTokens = InstanceUtils.readAuthTokensFile(guildId);
    const hoster = authTokens.hoster;

    if (!(steamId in authTokens)) {
        client.log(client.intlGet(null, 'warningCap'),
            `Could not find a authentication token for steamId: ${steamId}. Stopping interval.`);

        if (client.authTokenListenerIntervalIds[guildId] && client.authTokenListenerIntervalIds[guildId][steamId]) {
            clearInterval(client.authTokenListenerIntervalIds[guildId][steamId]);
            delete client.authTokenListenerIntervalIds[guildId][steamId];
        }
        return;
    }

    let token = null;
    for (let [key, value] of Object.entries(authTokens)) {
        if (key === steamId) {
            token = value.auth_token;
            break;
        }
    }

    if (!token) return;

    let response = null;
    try {
        response = await Axios.post('https://companion-rust.facepunch.com/api/history/read', {
            AuthToken: token
        });

        if (response === null) {
            client.log(client.intlGet(null, 'warningCap'),
                `Request to api/history/read was not successful, response is null.`);
            return;
        }
    }
    catch (e) {
        client.log(client.intlGet(null, 'warningCap'),
            `Request to api/history/read was not successful: ${e}.`);
        return;
    }

    if (response.status !== 200) {
        client.log(client.intlGet(null, 'warningCap'),
            `Request to api/history/read was not successful, code: ${response.status}.`);
        return;
    }

    const notifications = response.data;

    if (firstTime) {
        for (const notification of notifications) {
            client.authTokenReadNotifications[guildId][steamId].push(notification.notificationId);
        }
        return;
    }

    /* Filter out the notifications that have already been read. */
    const unreadNotifications = notifications.filter(
        n => !client.authTokenReadNotifications[guildId][steamId].includes(n.notificationId));

    for (const notification of unreadNotifications) {
        const notificationId = notification.notificationId;
        const title = notification.title;
        const body = notification.body;
        const data = JSON.parse(notification.data);
        const channel = notification.channel;

        switch (channel) {
            case NotificationType.PAIRING: {
                switch (data.type) {
                    case 'server': {
                        client.log('AuthToken', `GuildID: ${guildId}, SteamID: ${steamId}, pairing: server`);
                        pairingServer(client, guildId, data, hoster);
                    } break;


                    case 'entity': {
                        switch (data.entityName) {
                            case 'Smart Switch': {
                                client.log('AuthToken',
                                    `GuildID: ${guildId}, SteamID: ${steamId}, pairing: entity: Switch`);
                                pairingEntitySwitch(client, guildId, data);
                            } break;

                            case 'Smart Alarm': {
                                client.log('AuthToken',
                                    `GuildID: ${guildId}, SteamID: ${steamId}, pairing: entity: Smart Alarm`);
                                pairingEntitySmartAlarm(client, guildId, data);
                            } break;

                            case 'Storage Monitor': {
                                client.log('AuthToken',
                                    `GuildID: ${guildId}, SteamID: ${steamId}, pairing: entity: Storage Monitor`);
                                pairingEntityStorageMonitor(client, guildId, data);
                            } break;

                            default: {
                                client.log('AuthToken',
                                    `GuildID: ${guildId}, SteamID: ${steamId}, ` +
                                    `pairing: entity: other\n${JSON.stringify(notification)}`);
                            } break;
                        }
                    } break;

                    default: {
                        client.log('AuthToken',
                            `GuildID: ${guildId}, SteamID: ${steamId}, pairing: other\n${JSON.stringify(notification)}`);
                    } break;
                }
            } break;

            case NotificationType.PLAYER_LOGGED_IN: {
                switch (data.type) {
                    case 'login': {
                        client.log('AuthToken', `GuildID: ${guildId}, SteamID: ${steamId}, playerLoggedIn: login`);
                        playerLoggedInLogin(client, guildId, data);
                    } break;

                    default: {
                        client.log('AuthToken',
                            `GuildID: ${guildId}, SteamID: ${steamId}, playerLoggedIn: other\n` +
                            `${JSON.stringify(notification)}`);
                    } break;
                }
            } break;

            case NotificationType.PLAYER_DIED: {
                switch (data.type) {
                    case 'death': {
                        client.log('AuthToken', `GuildID: ${guildId}, SteamID: ${steamId}, playerDied: death`);
                        playerDiedDeath(client, guildId, title, data, discordUserId);
                    } break;

                    default: {
                        client.log('AuthToken',
                            `GuildID: ${guildId}, SteamID: ${steamId}, playerDied: other\n` +
                            `${JSON.stringify(notification)}`);
                    } break;
                }
            } break;

            case NotificationType.SMART_ALARM: {
                switch (data.type) {
                    case 'alarm': {
                        client.log('AuthToken', `GuildID: ${guildId}, SteamID: ${steamId}, smartAlarm: alarm`);
                        smartAlarmAlarm(client, guildId, title, data, body);
                    } break;

                    default: {
                        if (title === 'You\'re getting raided!') {
                            /* Custom alarm from plugin: https://umod.org/plugins/raid-alarm */
                            client.log('AuthToken',
                                `GuildID: ${guildId}, SteamID: ${steamId}, smartAlarm: raid-alarm plugin`);
                            smartAlarmRaidAlarm(client, guildId, title, data, body);
                            break;
                        }
                        client.log('AuthToken',
                            `GuildID: ${guildId}, SteamID: ${steamId}, smartAlarm: other\n` +
                            `${JSON.stringify(notification)}`);
                    } break;
                }
            } break;

            default: {
                client.log('AuthToken', `GuildID: ${guildId}, SteamID: ${steamId}, other\n${JSON.stringify(notification)}`);
            } break;
        }

        client.authTokenReadNotifications[guildId][steamId].push(notificationId);
    }
}

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) return true;
    return false;
}

async function pairingServer(client, guildId, data, hoster) {
    const instance = client.getInstance(guildId);
    const serverId = `${data.ip}-${data.port}`;
    const server = instance.serverList[serverId];

    if (data.playerId === hoster) {
        let message = undefined;
        if (server) message = await DiscordTools.getMessageById(guildId, instance.channelId.servers, server.messageId);

        let battlemetricsId = null;
        const bmInstance = new Battlemetrics(null, data.name);
        await bmInstance.setup();
        if (bmInstance.lastUpdateSuccessful) {
            battlemetricsId = bmInstance.id;
            if (!client.battlemetricsInstances.hasOwnProperty(bmInstance.id)) {
                client.battlemetricsInstances[bmInstance.id] = bmInstance;
            }
        }

        instance.serverList[serverId] = {
            title: data.name,
            serverIp: data.ip,
            appPort: data.port,
            steamId: data.playerId,
            playerToken: data.playerToken,
            description: data.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
            img: isValidUrl(data.img) ? data.img.replace(/ /g, '%20') : Constants.DEFAULT_SERVER_IMG,
            url: isValidUrl(data.url) ? data.url.replace(/ /g, '%20') : Constants.DEFAULT_SERVER_URL,
            notes: server ? server.notes : {},
            switches: server ? server.switches : {},
            alarms: server ? server.alarms : {},
            storageMonitors: server ? server.storageMonitors : {},
            markers: server ? server.markers : {},
            switchGroups: server ? server.switchGroups : {},
            messageId: (message !== undefined) ? message.id : null,
            battlemetricsId: battlemetricsId,
            connect: (!bmInstance.lastUpdateSuccessful) ? null :
                `connect ${bmInstance.server_ip}:${bmInstance.server_port}`,
            cargoShipEgressTimeMs: server ? server.cargoShipEgressTimeMs : Constants.DEFAULT_CARGO_SHIP_EGRESS_TIME_MS,
            oilRigLockedCrateUnlockTimeMs: server ? server.oilRigLockedCrateUnlockTimeMs :
                Constants.DEFAULT_OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
            timeTillDay: server ? server.timeTillDay : null,
            timeTillNight: server ? server.timeTillNight : null
        };
    }

    if (!instance.serverListLite.hasOwnProperty(serverId)) instance.serverListLite[serverId] = new Object();

    instance.serverListLite[serverId][data.playerId] = {
        serverIp: data.ip,
        appPort: data.port,
        steamId: data.playerId,
        playerToken: data.playerToken,
    };
    client.setInstance(guildId, instance);

    if (data.playerId !== hoster) {
        const rustplus = client.rustplusInstances[guildId];
        if (rustplus && (rustplus.serverId === serverId) && rustplus.team.leaderSteamId === data.playerId) {
            rustplus.updateLeaderRustPlusLiteInstance();
        }
    }

    await DiscordMessages.sendServerMessage(guildId, serverId, null);
}

async function pairingEntitySwitch(client, guildId, data) {
    const instance = client.getInstance(guildId);
    const serverId = `${data.ip}-${data.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const switches = instance.serverList[serverId].switches;

    const entityExist = instance.serverList[serverId].switches.hasOwnProperty(data.entityId);
    instance.serverList[serverId].switches[data.entityId] = {
        active: entityExist ? switches[data.entityId].active : false,
        reachable: entityExist ? switches[data.entityId].reachable : true,
        name: entityExist ? switches[data.entityId].name : client.intlGet(guildId, 'smartSwitch'),
        command: entityExist ? switches[data.entityId].command : data.entityId,
        image: entityExist ? switches[data.entityId].image : 'smart_switch.png',
        autoDayNightOnOff: entityExist ? switches[data.entityId].autoDayNightOnOff : 0,
        location: entityExist ? switches[data.entityId].location : null,
        x: entityExist ? switches[data.entityId].x : null,
        y: entityExist ? switches[data.entityId].y : null,
        server: entityExist ? switches[data.entityId].server : data.name,
        proximity: entityExist ? switches[data.entityId].proximity : Constants.PROXIMITY_SETTING_DEFAULT_METERS,
        messageId: entityExist ? switches[data.entityId].messageId : null
    };
    client.setInstance(guildId, instance);

    const rustplus = client.rustplusInstances[guildId];
    if (rustplus && serverId === rustplus.serverId) {
        const info = await rustplus.getEntityInfoAsync(data.entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.serverList[serverId].switches[data.entityId].reachable = false;
        }

        const teamInfo = await rustplus.getTeamInfoAsync();
        if (await rustplus.isResponseValid(teamInfo)) {
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === rustplus.playerId);
            if (player) {
                const location = Map.getPos(player.x, player.y, rustplus.info.correctedMapSize, rustplus);
                instance.serverList[serverId].switches[data.entityId].location = location.location;
                instance.serverList[serverId].switches[data.entityId].x = location.x;
                instance.serverList[serverId].switches[data.entityId].y = location.y;
            }
        }

        if (instance.serverList[serverId].switches[data.entityId].reachable) {
            instance.serverList[serverId].switches[data.entityId].active = info.entityInfo.payload.value;
        }
        client.setInstance(guildId, instance);

        await DiscordMessages.sendSmartSwitchMessage(guildId, serverId, data.entityId);
    }
}

async function pairingEntitySmartAlarm(client, guildId, data) {
    const instance = client.getInstance(guildId);
    const serverId = `${data.ip}-${data.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const alarms = instance.serverList[serverId].alarms;

    const entityExist = instance.serverList[serverId].alarms.hasOwnProperty(data.entityId);
    instance.serverList[serverId].alarms[data.entityId] = {
        active: entityExist ? alarms[data.entityId].active : false,
        reachable: entityExist ? alarms[data.entityId].reachable : true,
        everyone: entityExist ? alarms[data.entityId].everyone : false,
        name: entityExist ? alarms[data.entityId].name : client.intlGet(guildId, 'smartAlarm'),
        message: entityExist ? alarms[data.entityId].message : client.intlGet(guildId, 'baseIsUnderAttack'),
        lastTrigger: entityExist ? alarms[data.entityId].lastTrigger : null,
        command: entityExist ? alarms[data.entityId].command : data.entityId,
        id: entityExist ? alarms[data.entityId].id : data.entityId,
        image: entityExist ? alarms[data.entityId].image : 'smart_alarm.png',
        location: entityExist ? alarms[data.entityId].location : null,
        server: entityExist ? alarms[data.entityId].server : data.name,
        messageId: entityExist ? alarms[data.entityId].messageId : null
    };
    client.setInstance(guildId, instance);

    const rustplus = client.rustplusInstances[guildId];
    if (rustplus && serverId === rustplus.serverId) {
        const info = await rustplus.getEntityInfoAsync(data.entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.serverList[serverId].alarms[data.entityId].reachable = false;
        }

        const teamInfo = await rustplus.getTeamInfoAsync();
        if (await rustplus.isResponseValid(teamInfo)) {
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === rustplus.playerId);
            if (player) {
                const location = Map.getPos(player.x, player.y, rustplus.info.correctedMapSize, rustplus);
                instance.serverList[serverId].alarms[data.entityId].location = location.location;
            }
        }

        if (instance.serverList[serverId].alarms[data.entityId].reachable) {
            instance.serverList[serverId].alarms[data.entityId].active = info.entityInfo.payload.value;
        }
        client.setInstance(guildId, instance);
    }

    await DiscordMessages.sendSmartAlarmMessage(guildId, serverId, data.entityId);
}

async function pairingEntityStorageMonitor(client, guildId, data) {
    const instance = client.getInstance(guildId);
    const serverId = `${data.ip}-${data.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const storageMonitors = instance.serverList[serverId].storageMonitors;

    const entityExist = instance.serverList[serverId].storageMonitors.hasOwnProperty(data.entityId);
    instance.serverList[serverId].storageMonitors[data.entityId] = {
        name: entityExist ? storageMonitors[data.entityId].name : client.intlGet(guildId, 'storageMonitor'),
        reachable: entityExist ? storageMonitors[data.entityId].reachable : true,
        id: entityExist ? storageMonitors[data.entityId].id : data.entityId,
        type: entityExist ? storageMonitors[data.entityId].type : null,
        decaying: entityExist ? storageMonitors[data.entityId].decaying : false,
        upkeep: entityExist ? storageMonitors[data.entityId].upkeep : null,
        everyone: entityExist ? storageMonitors[data.entityId].everyone : false,
        inGame: entityExist ? storageMonitors[data.entityId].inGame : true,
        image: entityExist ? storageMonitors[data.entityId].image : 'storage_monitor.png',
        location: entityExist ? storageMonitors[data.entityId].location : null,
        server: entityExist ? storageMonitors[data.entityId].server : data.name,
        messageId: entityExist ? storageMonitors[data.entityId].messageId : null
    };
    client.setInstance(guildId, instance);

    const rustplus = client.rustplusInstances[guildId];
    if (rustplus && serverId === rustplus.serverId) {
        const info = await rustplus.getEntityInfoAsync(data.entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.serverList[serverId].storageMonitors[data.entityId].reachable = false;
        }

        const teamInfo = await rustplus.getTeamInfoAsync();
        if (await rustplus.isResponseValid(teamInfo)) {
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === rustplus.playerId);
            if (player) {
                const location = Map.getPos(player.x, player.y, rustplus.info.correctedMapSize, rustplus);
                instance.serverList[serverId].storageMonitors[data.entityId].location = location.location;
            }
        }

        if (instance.serverList[serverId].storageMonitors[data.entityId].reachable) {
            if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_TOOL_CUPBOARD_CAPACITY) {
                instance.serverList[serverId].storageMonitors[data.entityId].type = 'toolCupboard';
                instance.serverList[serverId].storageMonitors[data.entityId].image = 'tool_cupboard.png';
                if (info.entityInfo.payload.protectionExpiry === 0) {
                    instance.serverList[serverId].storageMonitors[data.entityId].decaying = true;
                }
            }
            else if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_VENDING_MACHINE_CAPACITY) {
                instance.serverList[serverId].storageMonitors[data.entityId].type = 'vendingMachine';
                instance.serverList[serverId].storageMonitors[data.entityId].image = 'vending_machine.png';
            }
            else if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_LARGE_WOOD_BOX_CAPACITY) {
                instance.serverList[serverId].storageMonitors[data.entityId].type = 'largeWoodBox';
                instance.serverList[serverId].storageMonitors[data.entityId].image = 'large_wood_box.png';
            }

            rustplus.storageMonitors[data.entityId] = {
                items: info.entityInfo.payload.items,
                expiry: info.entityInfo.payload.protectionExpiry,
                capacity: info.entityInfo.payload.capacity,
                hasProtection: info.entityInfo.payload.hasProtection
            }
        }
        client.setInstance(guildId, instance);

        await DiscordMessages.sendStorageMonitorMessage(guildId, serverId, data.entityId);
    }
}

async function playerLoggedInLogin(client, guildId, data) {
    const instance = client.getInstance(guildId);

    const content = {
        embeds: [DiscordEmbeds.getTeamLoginEmbed(
            guildId, data, await Scrape.scrapeSteamProfilePicture(client, data.targetId))]
    }

    const rustplus = client.rustplusInstances[guildId];
    const serverId = `${data.ip}-${data.port}`;

    if (!rustplus || (rustplus && (serverId !== rustplus.serverId))) {
        await DiscordMessages.sendMessage(guildId, content, null, instance.channelId.activity);
        client.log(client.intlGet(null, 'infoCap'),
            client.intlGet(null, 'playerJustConnectedTo', {
                name: data.targetName,
                server: data.name
            }));
    }
}

async function playerDiedDeath(client, guildId, title, data, discordUserId) {
    const user = await DiscordTools.getUserById(guildId, discordUserId);

    let png = null;
    if (data.targetId !== '') png = await Scrape.scrapeSteamProfilePicture(client, data.targetId);
    if (png === null) png = isValidUrl(data.img) ? data.img : Constants.DEFAULT_SERVER_IMG;

    const content = {
        embeds: [DiscordEmbeds.getPlayerDeathEmbed({ title: title }, data, png)]
    }

    if (user) {
        await client.messageSend(user, content);
    }
}

async function smartAlarmAlarm(client, guildId, title, data, message) {
    /* Unfortunately the alarm notification from the fcm listener is unreliable. The notification does not include
    which entityId that got triggered which makes it impossible to know which Smart Alarms are still being used
    actively. Also, from testing it seems that notifications don't always reach this fcm listener which makes it even
    more unreliable. The only advantage to using the fcm listener alarm notification is that it includes the title and
    description messagethat is configured on the Smart Alarm in the game. Due to missing out on this data, Smart Alarm
    title and description message needs to be re-configured via the /alarm slash command. Alarms that are used on the
    connected rust server will be handled through the message event from rustplus. Smart Alarms that are still attached
    to the credential owner and which is not part of the currently connected rust server can notify IF the general
    setting fcmAlarmNotificationEnabled is enabled. Those notifications will be handled here. */

    const instance = client.getInstance(guildId);
    const serverId = `${data.ip}-${data.port}`;
    const entityId = data.entityId;
    const server = instance.serverList[serverId];
    const rustplus = client.rustplusInstances[guildId];

    if (!server || (server && !server.alarms[entityId])) return;

    if ((!rustplus || (rustplus && (rustplus.serverId !== serverId))) &&
        instance.generalSettings.fcmAlarmNotificationEnabled) {
        server.alarms[entityId].lastTrigger = Math.floor(new Date() / 1000);
        client.setInstance(guildId, instance);
        await DiscordMessages.sendSmartAlarmTriggerMessage(guildId, serverId, entityId);
        client.log(client.intlGet(null, 'infoCap'), `${title}: ${message}`);
    }
}

async function smartAlarmRaidAlarm(client, guildId, title, data, message) {
    const instance = client.getInstance(guildId);
    const serverId = `${data.ip}-${data.port}`;
    const rustplus = client.rustplusInstances[guildId];

    if (!instance.serverList.hasOwnProperty(serverId)) return;

    const files = [];
    if (data.img === '') {
        files.push(new Discord.AttachmentBuilder(Path.join(__dirname, '..', `resources/images/rocket.png`)));
    }

    const content = {
        embeds: [DiscordEmbeds.getAlarmRaidAlarmEmbed({ title: title, message: message }, data)],
        content: '@everyone',
        files: files
    }

    if (rustplus && (serverId === rustplus.serverId)) {
        await DiscordMessages.sendMessage(guildId, content, null, instance.channelId.activity);
        rustplus.sendInGameMessage(`${title}: ${message}`);
    }

    client.log(client.intlGet(null, 'infoCap'), `${title} ${message}`);
}

module.exports = {
    startNewAuthTokenListener
}
