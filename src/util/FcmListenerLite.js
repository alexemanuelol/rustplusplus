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

const PushReceiverClient = require('@liamcottle/push-receiver/src/client');

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Map = require('../util/map.js');
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

    if (client.fcmListenersLite[guild.id][steamId]) {
        client.fcmListenersLite[guild.id][steamId].destroy();
        delete client.fcmListenersLite[guild.id][steamId];
    }

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'fcmListenerStartLite', {
        guildId: guild.id,
        steamId: steamId
    }));

    const discordUserId = credentials[steamId].discord_user_id;

    const androidId = credentials[steamId].gcm.android_id;
    const securityToken = credentials[steamId].gcm.security_token;
    client.fcmListenersLite[guild.id][steamId] = new PushReceiverClient(androidId, securityToken, [])
    client.fcmListenersLite[guild.id][steamId].on('ON_DATA_RECEIVED', (data) => {
        const appData = data.appData;

        if (!appData) {
            client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${hoster}, appData could not be found.`)
            return;
        }

        const title = appData.find(item => item.key === 'title')?.value;
        const message = appData.find(item => item.key === 'message')?.value;
        const channelId = appData.find(item => item.key === 'channelId')?.value;

        if (!channelId) {
            client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${hoster}, channelId could not be found.`)
            return;
        }

        const bodyCheck = appData.find(item => item.key === 'body');

        if (!bodyCheck) {
            client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${hoster}, body could not be found.`)
            return;
        }

        const body = JSON.parse(bodyCheck.value);

        if (!body.type) {
            client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${hoster}, body type could not be found.`)
            return;
        }

        switch (channelId) {
            case 'pairing': {
                switch (body.type) {
                    case 'server': {
                        client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${steamId}, pairing: server`);
                        pairingServer(client, guild, steamId, title, message, body);
                    } break;

                    case 'entity': {
                        switch (body.entityName) {
                            case 'Smart Switch': {
                                client.log('FCM LITE',
                                    `GuildID: ${guild.id}, SteamID: ${steamId}, pairing: entity: Switch`);
                                pairingEntitySwitch(client, guild, title, message, body);
                            } break;

                            case 'Smart Alarm': {
                                client.log('FCM LITE',
                                    `GuildID: ${guild.id}, SteamID: ${steamId}, pairing: entity: Smart Alarm`);
                                pairingEntitySmartAlarm(client, guild, title, message, body);
                            } break;

                            case 'Storage Monitor': {
                                client.log('FCM LITE',
                                    `GuildID: ${guild.id}, SteamID: ${steamId}, pairing: entity: Storage Monitor`);
                                pairingEntityStorageMonitor(client, guild, title, message, body);
                            } break;

                            default: {
                                client.log('FCM LITE',
                                    `GuildID: ${guild.id}, SteamID: ${steamId}, ` +
                                    `pairing: entity: other\n${JSON.stringify(data)}`);
                            } break;
                        }
                    } break;

                    default: {
                    } break;
                }
            } break;

            case 'player': {
                switch (body.type) {
                    case 'death': {
                        client.log('FCM LITE', `GuildID: ${guild.id}, SteamID: ${steamId}, player: death`);
                        playerDeath(client, guild, title, message, body, discordUserId);
                    } break;

                    default: {
                    } break;
                }
            } break;

            default: {
            } break;
        }
    });

    client.fcmListenersLite[guild.id][steamId].connect();
};

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) return true;
    return false;
}

async function pairingServer(client, guild, steamId, title, message, body) {
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
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === body.playerId);
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
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === body.playerId);
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
            const player = teamInfo.teamInfo.members.find(e => e.steamId.toString() === body.playerId);
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

async function playerDeath(client, guild, title, message, body, discordUserId) {
    const user = await DiscordTools.getUserById(guild.id, discordUserId);
    if (!user) return;

    let png = null;
    if (body.targetId !== '') png = await Scrape.scrapeSteamProfilePicture(client, body.targetId);
    if (png === null) png = isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG;

    const content = {
        embeds: [DiscordEmbeds.getPlayerDeathEmbed({ title: title }, body, png)]
    }

    await client.messageSend(user, content);
}
