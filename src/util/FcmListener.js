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

const Discord = require('discord.js');
const Path = require('path');
const PushReceiverClient = require('@liamcottle/push-receiver/src/client');

const Battlemetrics = require('../structures/Battlemetrics');
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

    /* Destroy previous instance of fcm listener */
    if (client.fcmListeners[guild.id]) client.fcmListeners[guild.id].destroy();
    if (client.fcmListenersLite[guild.id][hoster]) {
        client.fcmListenersLite[guild.id][hoster].destroy();
        delete client.fcmListenersLite[guild.id][hoster];
    }

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'fcmListenerStartHost', {
        guildId: guild.id,
        steamId: hoster
    }));

    const discordUserId = credentials[hoster].discord_user_id;

    const androidId = credentials[hoster].gcm.android_id;
    const securityToken = credentials[hoster].gcm.security_token;
    client.fcmListeners[guild.id] = new PushReceiverClient(androidId, securityToken, [])
    client.fcmListeners[guild.id].on('ON_DATA_RECEIVED', (data) => {
        const appData = data.appData;

        if (!appData) {
            client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, appData could not be found.`)
            return;
        }

        const title = appData.find(item => item.key === 'title')?.value;
        const message = appData.find(item => item.key === 'message')?.value;
        const channelId = appData.find(item => item.key === 'channelId')?.value;

        if (!channelId) {
            client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, channelId could not be found.`)
            return;
        }

        const bodyCheck = appData.find(item => item.key === 'body');

        if (!bodyCheck) {
            client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, body could not be found.`)
            return;
        }

        const body = JSON.parse(bodyCheck.value);

        if (!body.type) {
            client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, body type could not be found.`)
            return;
        }

        switch (channelId) {
            case 'pairing': {
                switch (body.type) {
                    case 'server': {
                        client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, pairing: server`);
                        pairingServer(client, guild, title, message, body);
                    } break;

                    case 'entity': {
                        switch (body.entityName) {
                            case 'Smart Switch': {
                                client.log('FCM Host',
                                    `GuildID: ${guild.id}, SteamID: ${hoster}, pairing: entity: Switch`);
                                pairingEntitySwitch(client, guild, title, message, body);
                            } break;

                            case 'Smart Alarm': {
                                client.log('FCM Host',
                                    `GuildID: ${guild.id}, SteamID: ${hoster}, pairing: entity: Smart Alarm`);
                                pairingEntitySmartAlarm(client, guild, title, message, body);
                            } break;

                            case 'Storage Monitor': {
                                client.log('FCM Host',
                                    `GuildID: ${guild.id}, SteamID: ${hoster}, pairing: entity: Storage Monitor`);
                                pairingEntityStorageMonitor(client, guild, title, message, body);
                            } break;

                            default: {
                                client.log('FCM Host',
                                    `GuildID: ${guild.id}, SteamID: ${hoster}, ` +
                                    `pairing: entity: other\n${JSON.stringify(data)}`);
                            } break;
                        }
                    } break;

                    default: {
                        client.log('FCM Host',
                            `GuildID: ${guild.id}, SteamID: ${hoster}, pairing: other\n${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case 'alarm': {
                switch (body.type) {
                    case 'alarm': {
                        client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, alarm: alarm`);
                        alarmAlarm(client, guild, title, message, body);
                    } break;

                    default: {
                        if (title === 'You\'re getting raided!') {
                            /* Custom alarm from plugin: https://umod.org/plugins/raid-alarm */
                            client.log('FCM Host',
                                `GuildID: ${guild.id}, SteamID: ${hoster}, alarm: raid-alarm plugin`);
                            alarmRaidAlarm(client, guild, title, message, body);
                            break;
                        }
                        client.log('FCM Host',
                            `GuildID: ${guild.id}, SteamID: ${hoster}, alarm: other\n${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case 'player': {
                switch (body.type) {
                    case 'death': {
                        client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, player: death`);
                        playerDeath(client, guild, title, message, body, discordUserId);
                    } break;

                    default: {
                        client.log('FCM Host',
                            `GuildID: ${guild.id}, SteamID: ${hoster}, player: other\n${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case 'team': {
                switch (body.type) {
                    case 'login': {
                        client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, team: login`);
                        teamLogin(client, guild, title, message, body);
                    } break;

                    default: {
                        client.log('FCM Host',
                            `GuildID: ${guild.id}, SteamID: ${hoster}, team: other\n${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            //case 'news': {
            //    switch (body.type) {
            //        case 'news': {
            //            client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, news: news`);
            //            newsNews(client, guild, full, data, body);
            //        } break;

            //        default: {
            //            client.log('FCM Host',
            //                `GuildID: ${guild.id}, SteamID: ${hoster}, news: other\n${JSON.stringify(full)}`);
            //        } break;
            //    }
            //} break;

            default: {
                client.log('FCM Host', `GuildID: ${guild.id}, SteamID: ${hoster}, other\n${JSON.stringify(data)}`);
            } break;
        }
    });

    client.fcmListeners[guild.id].connect();
};

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) return true;
    return false;
}

async function pairingServer(client, guild, title, message, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    const server = instance.serverList[serverId];

    let messageObj = undefined;
    if (server) messageObj = await DiscordTools.getMessageById(guild.id, instance.channelId.servers, server.messageId);

    let battlemetricsId = null;
    const bmInstance = new Battlemetrics(null, title);
    await bmInstance.setup();
    if (bmInstance.lastUpdateSuccessful) {
        battlemetricsId = bmInstance.id;
        if (!client.battlemetricsInstances.hasOwnProperty(bmInstance.id)) {
            client.battlemetricsInstances[bmInstance.id] = bmInstance;
        }
    }

    instance.serverList[serverId] = {
        title: title,
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: body.playerToken,
        description: body.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
        img: isValidUrl(body.img) ? body.img.replace(/ /g, '%20') : Constants.DEFAULT_SERVER_IMG,
        url: isValidUrl(body.url) ? body.url.replace(/ /g, '%20') : Constants.DEFAULT_SERVER_URL,
        notes: server ? server.notes : {},
        switches: server ? server.switches : {},
        alarms: server ? server.alarms : {},
        storageMonitors: server ? server.storageMonitors : {},
        markers: server ? server.markers : {},
        switchGroups: server ? server.switchGroups : {},
        messageId: (messageObj !== undefined) ? messageObj.id : null,
        battlemetricsId: battlemetricsId,
        connect: (!bmInstance.lastUpdateSuccessful) ? null :
            `connect ${bmInstance.server_ip}:${bmInstance.server_port}`,
        cargoShipEgressTimeMs: server ? server.cargoShipEgressTimeMs : Constants.DEFAULT_CARGO_SHIP_EGRESS_TIME_MS,
        oilRigLockedCrateUnlockTimeMs: server ? server.oilRigLockedCrateUnlockTimeMs :
            Constants.DEFAULT_OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
        timeTillDay: server ? server.timeTillDay : null,
        timeTillNight: server ? server.timeTillNight : null
    };

    if (!instance.serverListLite.hasOwnProperty(serverId)) instance.serverListLite[serverId] = new Object();

    instance.serverListLite[serverId][body.playerId] = {
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: body.playerToken,
    };
    client.setInstance(guild.id, instance);

    await DiscordMessages.sendServerMessage(guild.id, serverId, null);
}

async function pairingEntitySwitch(client, guild, title, message, body) {
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
        autoDayNightOnOff: entityExist ? switches[body.entityId].autoDayNightOnOff : 0,
        location: entityExist ? switches[body.entityId].location : null,
        x: entityExist ? switches[body.entityId].x : null,
        y: entityExist ? switches[body.entityId].y : null,
        server: entityExist ? switches[body.entityId].server : body.name,
        proximity: entityExist ? switches[body.entityId].proximity : Constants.PROXIMITY_SETTING_DEFAULT_METERS,
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
                instance.serverList[serverId].switches[body.entityId].x = location.x;
                instance.serverList[serverId].switches[body.entityId].y = location.y;
            }
        }

        if (instance.serverList[serverId].switches[body.entityId].reachable) {
            instance.serverList[serverId].switches[body.entityId].active = info.entityInfo.payload.value;
        }
        client.setInstance(guild.id, instance);

        await DiscordMessages.sendSmartSwitchMessage(guild.id, serverId, body.entityId);
    }
}

async function pairingEntitySmartAlarm(client, guild, title, message, body) {
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
        lastTrigger: entityExist ? alarms[body.entityId].lastTrigger : null,
        command: entityExist ? alarms[body.entityId].command : body.entityId,
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

async function pairingEntityStorageMonitor(client, guild, title, message, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    if (!instance.serverList.hasOwnProperty(serverId)) return;
    const storageMonitors = instance.serverList[serverId].storageMonitors;

    const entityExist = instance.serverList[serverId].storageMonitors.hasOwnProperty(body.entityId);
    instance.serverList[serverId].storageMonitors[body.entityId] = {
        name: entityExist ? storageMonitors[body.entityId].name : client.intlGet(guild.id, 'storageMonitor'),
        reachable: entityExist ? storageMonitors[body.entityId].reachable : true,
        id: entityExist ? storageMonitors[body.entityId].id : body.entityId,
        type: entityExist ? storageMonitors[body.entityId].type : null,
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
            if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_TOOL_CUPBOARD_CAPACITY) {
                instance.serverList[serverId].storageMonitors[body.entityId].type = 'toolCupboard';
                instance.serverList[serverId].storageMonitors[body.entityId].image = 'tool_cupboard.png';
                if (info.entityInfo.payload.protectionExpiry === 0) {
                    instance.serverList[serverId].storageMonitors[body.entityId].decaying = true;
                }
            }
            else if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_VENDING_MACHINE_CAPACITY) {
                instance.serverList[serverId].storageMonitors[body.entityId].type = 'vendingMachine';
                instance.serverList[serverId].storageMonitors[body.entityId].image = 'vending_machine.png';
            }
            else if (info.entityInfo.payload.capacity === Constants.STORAGE_MONITOR_LARGE_WOOD_BOX_CAPACITY) {
                instance.serverList[serverId].storageMonitors[body.entityId].type = 'largeWoodBox';
                instance.serverList[serverId].storageMonitors[body.entityId].image = 'large_wood_box.png';
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

async function alarmAlarm(client, guild, title, message, body) {
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
        server.alarms[entityId].lastTrigger = Math.floor(new Date() / 1000);
        client.setInstance(guild.id, instance);
        await DiscordMessages.sendSmartAlarmTriggerMessage(guild.id, serverId, entityId);
        client.log(client.intlGet(null, 'infoCap'), `${title}: ${message}`);
    }
}

async function alarmRaidAlarm(client, guild, title, message, body) {
    const instance = client.getInstance(guild.id);
    const serverId = `${body.ip}-${body.port}`;
    const rustplus = client.rustplusInstances[guild.id];

    if (!instance.serverList.hasOwnProperty(serverId)) return;

    const files = [];
    if (body.img === '') {
        files.push(new Discord.AttachmentBuilder(Path.join(__dirname, '..', `resources/images/rocket.png`)));
    }

    const content = {
        embeds: [DiscordEmbeds.getAlarmRaidAlarmEmbed({ title: title, message: message }, body)],
        content: '@everyone',
        files: files
    }

    if (rustplus && (serverId === rustplus.serverId)) {
        await DiscordMessages.sendMessage(guild.id, content, null, instance.channelId.activity);
        rustplus.sendInGameMessage(`${title}: ${message}`);
    }

    client.log(client.intlGet(null, 'infoCap'), `${title} ${message}`);
}

async function playerDeath(client, guild, title, message, body, discordUserId) {
    const user = await DiscordTools.getUserById(guild.id, discordUserId);

    let png = null;
    if (body.targetId !== '') png = await Scrape.scrapeSteamProfilePicture(client, body.targetId);
    if (png === null) png = isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG;

    const content = {
        embeds: [DiscordEmbeds.getPlayerDeathEmbed({ title: title }, body, png)]
    }

    if (user) {
        await client.messageSend(user, content);
    }
}

async function teamLogin(client, guild, title, message, body) {
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

//async function newsNews(client, guild, full, data, body) {
//    const instance = client.getInstance(guild.id);
//
//    const content = {
//        embeds: [DiscordEmbeds.getNewsEmbed(guild.id, data)],
//        components: [DiscordButtons.getNewsButton(guild.id, body, isValidUrl(body.url))]
//    }
//
//    await DiscordMessages.sendMessage(guild.id, content, null, instance.channelId.activity);
//}