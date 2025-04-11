/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

/* eslint-disable-next-line @typescript-eslint/no-require-imports */
const PushReceiverClient = require('@liamcottle/push-receiver/src/client');
import * as axios from 'axios';

import { DiscordManager } from './discordManager';
import { log, credentialsManager as cm, guildInstanceManager as gim, localeManager as lm, rustPlusManager as rpm } from '../../index';
import { ConnectionStatus } from './rustPlusManager';
import * as types from '../utils/types';
import * as vu from '../utils/validationUtils';
import * as constants from '../utils/constants'
import { PairingDataMap, SmartSwitchAutoSetting, StorageMonitorType } from './guildInstanceManager';
import * as discordMessages from '../discordUtils/discordMessages';


const NOTIFICATION_EXPIRATION_TIME_MS = 10_000;

export interface FcmListeners {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [steamId: types.SteamId]: any; /* Client */
}

export interface FcmNotification {
    id: string;
    from: string;
    category: string;
    token: string;
    appData: AppDataItem[];
    persistentId: string;
    ttl: number;
    sent: string;
}

export interface AppDataItem {
    key: string;
    value: string;
}

export enum ChannelIds {
    PAIRING = 'pairing',
    ALARM = 'alarm',
    PLAYER = 'player',
    TEAM = 'team',
    NEWS = 'news'
}

export enum PairingTypes {
    SERVER = 'server',
    ENTITY = 'entity'
}

export enum PairingEntityTypes {
    SMART_SWITCH = '1',
    SMART_ALARM = '2',
    STORAGE_MONITOR = '3'
}

export enum PairingEntityNames {
    SMART_SWITCH = 'Smart Switch',
    SMART_ALARM = 'Smart Alarm',
    STORAGE_MONITOR = 'Storage Monitor'
}

export enum AlarmTypes {
    ALARM = 'alarm'
}

export enum PlayerTypes {
    DEATH = 'death'
}

export enum TeamTypes {
    LOGIN = 'login'
}

export enum NewsTypes {
    NEWS = 'news'
}

export interface PairingServerBody {
    id: string;
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
    playerId: string;
    playerToken: string;
    type: string;
}

export interface PairingEntityBody {
    id: string;
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
    playerId: string;
    playerToken: string;
    entityId: string;
    entityType: string;
    entityName: string;
    type: string;
}

export interface AlarmAlarmBody {
    id: string;
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
    type: string;
}

export interface AlarmPluginBody {
    id: string;
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
}

export interface PlayerDeathBody {
    id: string;
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
    type: string;
    targetId: string;
    targetName: string;
}

export interface TeamLoginBody {
    id: string;
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
    type: string;
    targetId: string;
    targetName: string;
}

export interface NewsNewsBody {
    type: string;
    url: string;
}


export class FcmListenerManager {
    public dm: DiscordManager;
    private listeners: FcmListeners;

    constructor(dm: DiscordManager) {
        log.info('[FcmListenerManager: Init]');
        this.dm = dm;
        this.listeners = {};

        this.startAllListeners();
    }

    private startAllListeners(): void {
        const steamIds = cm.getCredentialSteamIds();
        for (const steamId of steamIds) {
            this.startListener(steamId);
        }
    }

    public isListenerActive(steamId: types.SteamId): boolean {
        return steamId in this.listeners;
    }

    public startListener(steamId: types.SteamId): boolean {
        const funcName = `[FcmListenerManager: startListener: ${steamId}]`;
        if (this.isListenerActive(steamId)) {
            this.stopListener(steamId);
        }

        const credentials = cm.getCredentials(steamId);
        if (!credentials) {
            return false;
        }

        const androidId = credentials.gcm.androidId;
        const securityToken = credentials.gcm.securityToken;
        this.listeners[steamId] = new PushReceiverClient(androidId, securityToken, []);
        (this.listeners[steamId]).on('ON_DATA_RECEIVED', (data: unknown) => {
            const funcName = `[FcmListenerManager: ON_DATA_RECEIVED: ${steamId}]`;
            if (!isValidFcmNotificaton(data)) {
                log.warn(`${funcName} data is not of type FcmNotification. Data: ${JSON.stringify(data)}`);
                return;
            }

            if ((Date.now() - parseInt((data as FcmNotification).sent)) > NOTIFICATION_EXPIRATION_TIME_MS) {
                log.warn(`${funcName} data have expired '${(data as FcmNotification).sent}'.`);
                return;
            }

            this.onDataReceived(steamId, data);
        });
        this.listeners[steamId].connect();
        log.info(`${funcName} FCM Listener started.`);

        return true;
    }

    public stopListener(steamId: types.SteamId): void {
        const funcName = `[FcmListenerManager: stopListener: ${steamId}]`;
        if (steamId in this.listeners) {
            log.info(`${funcName} FCM Listener stopped.`);
            this.listeners[steamId].destroy();
            delete this.listeners[steamId];
        }
    }

    private onDataReceived(steamId: types.SteamId, data: FcmNotification): void {
        const funcName = `[FcmListenerManager: onDataReceived: ${steamId}]`;
        const appData: AppDataItem[] = data.appData;

        const title = appData.find(item => item.key === 'title')?.value;
        if (!title) {
            log.warn(`${funcName} title not found. Data: ${JSON.stringify(data)}`);
            return;
        }

        const message = appData.find(item => item.key === 'message')?.value;
        if (!message) {
            log.warn(`${funcName} message not found. Data: ${JSON.stringify(data)}`);
            return;
        }

        const channelId = appData.find(item => item.key === 'channelId')?.value;
        if (!isValidChannelId(channelId)) {
            log.warn(`${funcName} channelId '${channelId}' not found. Data: ${JSON.stringify(data)}`);
            return;
        }

        const bodyObject = appData.find(item => item.key === 'body');
        if (!bodyObject) {
            log.warn(`${funcName} body not found. Data: ${JSON.stringify(data)}`);
            return;
        }
        const body = JSON.parse(bodyObject.value);

        switch (channelId) {
            case ChannelIds.PAIRING: {
                switch (body.type) {
                    case PairingTypes.SERVER: {
                        log.info(`${funcName} ${ChannelIds.PAIRING}: ${PairingTypes.SERVER}`);
                        if (!isValidPairingServerBody(body)) return;

                        pairingServer(this, steamId, body);
                    } break;

                    case PairingTypes.ENTITY: {
                        // TODO! If entity pairing, pair server too, all parts of server pairing body is available in entity pairing body
                        switch (body.entityType) {
                            case PairingEntityTypes.SMART_SWITCH: {
                                log.info(`${funcName} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: ` +
                                    `${PairingEntityNames.SMART_SWITCH}`);
                                if (!isValidPairingEntityBody(body)) return;

                                pairingEntitySmartSwitch(this, steamId, body);
                            } break;

                            case PairingEntityTypes.SMART_ALARM: {
                                log.info(`${funcName} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: ` +
                                    `${PairingEntityNames.SMART_ALARM}`);
                                if (!isValidPairingEntityBody(body)) return;

                                pairingEntitySmartAlarm(this, steamId, body);
                            } break;

                            case PairingEntityTypes.STORAGE_MONITOR: {
                                log.info(`${funcName} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: ` +
                                    `${PairingEntityNames.STORAGE_MONITOR}`);
                                if (!isValidPairingEntityBody(body)) return;

                                pairingEntityStorageMonitor(this, steamId, body);
                            } break;

                            default: {
                                log.info(`${funcName} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: other.`);
                                if (!isValidPairingEntityBody(body)) return;
                            } break;
                        }
                    } break;

                    default: {
                        log.info(`${funcName} ${ChannelIds.PAIRING}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case ChannelIds.ALARM: {
                switch (body.type) {
                    case AlarmTypes.ALARM: {
                        log.info(`${funcName} ${ChannelIds.ALARM}: ${AlarmTypes.ALARM}`);
                        if (!isValidAlarmAlarmBody(body)) return;

                        alarmAlarm(this, steamId, title, message, body);
                    } break;

                    default: {
                        if (title === 'You\'re getting raided!') {
                            /* Custom alarm from plugin: https://umod.org/plugins/raid-alarm */
                            log.info(`${funcName} ${ChannelIds.ALARM}: plugin`);
                            if (!isValidAlarmPluginBody(body)) return;

                            alarmPlugin(this, steamId, title, message, body);
                            break;
                        }

                        log.info(`${funcName} ${ChannelIds.ALARM}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case ChannelIds.PLAYER: {
                switch (body.type) {
                    case PlayerTypes.DEATH: {
                        log.info(`${funcName} ${ChannelIds.PLAYER}: ${PlayerTypes.DEATH}`);
                        if (!isValidPlayerDeathBody(body)) return;

                        playerDeath(this, steamId, title, body);
                    } break;

                    default: {
                        log.info(`${funcName} ${ChannelIds.PLAYER}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case ChannelIds.TEAM: {
                switch (body.type) {
                    case TeamTypes.LOGIN: {
                        log.info(`${funcName} ${ChannelIds.TEAM}: ${TeamTypes.LOGIN}`);
                        if (!isValidTeamLoginBody(body)) return;

                        teamLogin(this, steamId, body);
                    } break;

                    default: {
                        log.info(`${funcName} ${ChannelIds.TEAM}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            case ChannelIds.NEWS: {
                switch (body.type) {
                    case NewsTypes.NEWS: {
                        log.info(`${funcName} ${ChannelIds.NEWS}: ${NewsTypes.NEWS}`);
                        if (!isValidNewsNewsBody(body)) return;

                        newsNews(this, steamId, title, message, body);
                    } break;

                    default: {
                        log.info(`${funcName} ${ChannelIds.NEWS}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`);
                    } break;
                }
            } break;

            default: {
                log.info(`${funcName} other channel id: ${channelId}. Data: ` +
                    `${JSON.stringify(data)}`);
            } break;
        }
    }
}

async function pairingServer(flm: FcmListenerManager, steamId: types.SteamId, body: PairingServerBody) {
    const funcName = `[FcmListenerManager: pairingServer: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const serverInfo = gInstance.serverInfoMap[serverId];

        let message = null;
        if (serverInfo && gInstance.guildChannelIds.servers !== null && serverInfo.messageId !== null) {
            message = await flm.dm.getMessage(guildId, gInstance.guildChannelIds.servers, serverInfo.messageId);
        }

        const img = encodeURI(decodeURI(body.img));
        const logo = encodeURI(decodeURI(body.logo));
        const url = encodeURI(decodeURI(body.url));

        gInstance.serverInfoMap[serverId] = {
            name: body.name,
            desc: JSON.parse(`"${body.desc}"`),
            img: await isValidImageUrl(img) ? img : constants.DEFAULT_SERVER_IMAGE,
            logo: await isValidImageUrl(logo) ? logo : constants.DEFAULT_SERVER_IMAGE,
            url: isValidUrl(url) ? url : constants.DEFAULT_SERVER_URL,
            ip: body.ip,
            port: body.port,
            messageId: (message) ? message.id : null,
            pairedDate: Math.floor(Date.now() / 1000),
            mainSteamId: serverInfo ? serverInfo.mainSteamId : body.playerId,
            active: serverInfo ? serverInfo.active : false,
            connect: null,
            noteMap: serverInfo ? serverInfo.noteMap : {},
            battlemetricsId: null,
            smartSwitchMap: serverInfo ? serverInfo.smartSwitchMap : {},
            smartAlarmMap: serverInfo ? serverInfo.smartAlarmMap : {},
            storageMonitorMap: serverInfo ? serverInfo.storageMonitorMap : {},
            smartSwitchGroupMap: serverInfo ? serverInfo.smartSwitchGroupMap : {}
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        if (gInstance.serverToView === null) gInstance.serverToView = serverId;
        gim.updateGuildInstance(guildId);

        let connectionStatus = ConnectionStatus.Disconnected;
        const rustPlusInstance = rpm.getInstance(guildId, serverId);
        if (rustPlusInstance) {
            connectionStatus = rustPlusInstance.connectionStatus;
        }

        await discordMessages.sendServerMessage(flm.dm, guildId, serverId, connectionStatus);
    }
}

async function pairingEntitySmartSwitch(flm: FcmListenerManager, steamId: types.SteamId, body: PairingEntityBody) {
    const funcName = `[FcmListenerManager: pairingEntity: SmartSwitch: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const language = gInstance.generalSettings.language;
        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${funcName} Could not find server.`, { guildId: guildId, serverId: serverId });
            continue;
        }

        const smartSwitchMap = serverInfo.smartSwitchMap;
        const exist = body.entityId in smartSwitchMap;
        smartSwitchMap[body.entityId] = {
            entityId: body.entityId,
            messageId: exist ? smartSwitchMap[body.entityId].messageId : null,
            pairedDate: Math.floor(Date.now() / 1000),
            name: exist ? smartSwitchMap[body.entityId].name : lm.getIntl(language, 'smartSwitch'),
            command: exist ? smartSwitchMap[body.entityId].command : body.entityId,
            img: exist ? smartSwitchMap[body.entityId].img : 'smart_switch.png',
            autoSetting: exist ? smartSwitchMap[body.entityId].autoSetting : SmartSwitchAutoSetting.Off,
            proximitySetting: exist ? smartSwitchMap[body.entityId].proximitySetting :
                constants.PROXIMITY_SETTING_DEFAULT_METERS
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        gim.updateGuildInstance(guildId);

        // TODO! Add the switch to rustplusManager

        // TODO! Only send message if activeServerId is the same as serverId
        await discordMessages.sendSmartSwitchMessage(flm.dm, guildId, serverId, body.entityId);
    }
}

async function pairingEntitySmartAlarm(flm: FcmListenerManager, steamId: types.SteamId, body: PairingEntityBody) {
    const funcName = `[FcmListenerManager: pairingEntity: SmartAlarm: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const language = gInstance.generalSettings.language;
        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${funcName} Could not find server.`, { guildId: guildId, serverId: serverId });
            continue;
        }

        const smartAlarmMap = serverInfo.smartAlarmMap;
        const exist = body.entityId in smartAlarmMap;
        smartAlarmMap[body.entityId] = {
            entityId: body.entityId,
            messageId: exist ? smartAlarmMap[body.entityId].messageId : null,
            pairedDate: Math.floor(Date.now() / 1000),
            name: exist ? smartAlarmMap[body.entityId].name : lm.getIntl(language, 'smartAlarm'),
            command: exist ? smartAlarmMap[body.entityId].command : body.entityId,
            img: exist ? smartAlarmMap[body.entityId].img : 'smart_alarm.png',
            everyone: exist ? smartAlarmMap[body.entityId].everyone : false,
            inGame: exist ? smartAlarmMap[body.entityId].inGame : false,
            lastTrigger: exist ? smartAlarmMap[body.entityId].lastTrigger : null,
            message: exist ? smartAlarmMap[body.entityId].message : lm.getIntl(language, 'yourBaseIsUnderAttack')
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        gim.updateGuildInstance(guildId);

        // TODO! Add the alarm to rustplusManager

        // TODO! Only send message if activeServerId is the same as serverId
        await discordMessages.sendSmartAlarmMessage(flm.dm, guildId, serverId, body.entityId);
    }
}

async function pairingEntityStorageMonitor(flm: FcmListenerManager, steamId: types.SteamId, body: PairingEntityBody) {
    const funcName = `[FcmListenerManager: pairingEntity: StorageMonitor: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const language = gInstance.generalSettings.language;
        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${funcName} Could not find server.`, { guildId: guildId, serverId: serverId });
            continue;
        }

        const storageMonitorMap = serverInfo.storageMonitorMap;
        const exist = body.entityId in storageMonitorMap;
        storageMonitorMap[body.entityId] = {
            entityId: body.entityId,
            messageId: exist ? storageMonitorMap[body.entityId].messageId : null,
            pairedDate: Math.floor(Date.now() / 1000),
            name: exist ? storageMonitorMap[body.entityId].name : lm.getIntl(language, 'storageMonitor'),
            img: exist ? storageMonitorMap[body.entityId].img : 'storage_monitor.png',
            everyone: exist ? storageMonitorMap[body.entityId].everyone : false,
            inGame: exist ? storageMonitorMap[body.entityId].inGame : true,
            type: exist ? storageMonitorMap[body.entityId].type : StorageMonitorType.Unknown
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        gim.updateGuildInstance(guildId);

        // TODO! Add the storagemonitor to rustplusManager

        // TODO! Only send message if activeServerId is the same as serverId
        await discordMessages.sendStorageMonitorMessage(flm.dm, guildId, serverId, body.entityId);
    }
}

async function alarmAlarm(flm: FcmListenerManager, steamId: types.SteamId, title: string, message: string,
    body: AlarmAlarmBody) {
    /* Unfortunately the alarm notification from the fcm listener is unreliable. The notification does not include
    which entityId that got triggered which makes it impossible to know which Smart Alarms are still being used
    actively. Also, from testing it seems that notifications don't always reach this fcm listener which makes it even
    more unreliable. The only advantage to using the fcm listener alarm notification is that it includes the title and
    description message that is configured on the Smart Alarm in the game. Due to missing out on this data, Smart Alarm
    title and description message needs to be re-configured via the alarm edit modal. Alarms that are used on the
    connected rust server will be handled through the message event from rustplus. Smart Alarms that are still attached
    to the credential owner and which is not part of the currently connected rust server can notify IF the general
    setting fcmAlarmNotificationEnabled is enabled. Those notifications will be handled here. */

    // Potential todo: Only allow alarm from a specific teammember from fcm? Otherwise there will be posted alarm
    // notifications for each "subscribed" alarm.

    const funcName = `[FcmListenerManager: alarmAlarm: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    log.info(`${funcName} ${title}: ${message}`);

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${funcName} Could not find server.`, { guildId: guildId, serverId: serverId });
            continue;
        }

        // TODO! If serverId !== activeServerId from gInstance OR rustplusManager does not exist for the serverId
        // and fcmAlarmNotify === true then call the fcm alarm function

        await discordMessages.sendFcmAlarmTriggerMessage(flm.dm, guildId, serverId, title, message);
    }
}

async function alarmPlugin(flm: FcmListenerManager, steamId: types.SteamId, title: string, message: string, body: AlarmPluginBody) {
    const funcName = `[FcmListenerManager: alarmPlugin: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    log.info(`${funcName} ${title}: ${message}`);

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${funcName} Could not find server.`, { guildId: guildId, serverId: serverId });
            continue;
        }

        // TODO! If fcmAlarmPluginNotifyActiveServer, then only notify if  serverId === activeServerId
        // if fcmAlarmPluginNotify is false then dont send message.
        // if fcmAlarmPluginNotifyInGame, then notify in game too

        await discordMessages.sendFcmAlarmPluginTriggerMessage(flm.dm, guildId, serverId, title, message);
    }
}

async function playerDeath(flm: FcmListenerManager, steamId: types.SteamId, title: string, body: PlayerDeathBody) {
    const funcName = `[FcmListenerManager: playerDeath: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    await discordMessages.sendFcmPlayerDeathMessage(flm.dm, steamId, title, body);
}

async function teamLogin(flm: FcmListenerManager, steamId: types.SteamId, body: TeamLoginBody) {
    const funcName = `[FcmListenerManager: teamLogin: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${funcName} Could not find server.`, { guildId: guildId, serverId: serverId });
            continue;
        }

        // TODO! If serverId !== activeServerId from gInstance OR rustplusManager does not exist for the serverId
        // then send the message, ALSO, now all fcm listeners will notify about this, todo: only allow once

        //await discordMessages.sendFcmAlarmTriggerMessage(flm.dm, guildId, serverId, title, message);
        await discordMessages.sendFcmTeamLoginMessage(flm.dm, guildId, serverId, body);
        log.info(`${funcName} ${body.targetName} just connected to ${body.name}.`);
    }
}

async function newsNews(flm: FcmListenerManager, steamId: types.SteamId, title: string, message: string,
    body: NewsNewsBody) {
    const funcName = `[FcmListenerManager: newsNews: ${steamId}]`;
    const credentials = cm.getCredentials(steamId);

    if (!credentials) {
        log.warn(`${funcName} Could not find Credentials.`);
        return;
    }

    const associatedGuilds = credentials.associatedGuilds;
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId);
        if (!gInstance) {
            log.warn(`${funcName} Could not find GuildInstance.`, { guildId: guildId });
            continue;
        }

        // TODO! Only send message once, not all users that have fcm listeners

        await discordMessages.sendFcmNewsNewsMessage(flm.dm, guildId, title, message, body);
    }
}


/**
 * Other functions.
 */

function updatePairingDetails(pairingDataMap: PairingDataMap, serverId: types.ServerId, steamId: types.SteamId,
    body: PairingServerBody | PairingEntityBody): void {
    if (!(serverId in pairingDataMap)) {
        pairingDataMap[serverId] = {};
    }
    pairingDataMap[serverId][steamId] = {
        valid: true,
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: Number(body.playerToken)
    };
}


/**
 * Validation functions.
 */

export function isValidChannelId(value: unknown): value is ChannelIds {
    return typeof value === 'string' && Object.values(ChannelIds).includes(value as ChannelIds);
}

export function isValidPairingType(value: unknown): value is PairingTypes {
    return typeof value === 'string' && Object.values(PairingTypes).includes(value as PairingTypes);
}

export function isValidPairingEntityType(value: unknown): value is PairingEntityTypes {
    return typeof value === 'string' && Object.values(PairingEntityTypes).includes(value as PairingEntityTypes);
}

export function isValidPairingEntityName(value: unknown): value is PairingEntityNames {
    return typeof value === 'string' && Object.values(PairingEntityNames).includes(value as PairingEntityNames);
}

export function isValidAlarmType(value: unknown): value is AlarmTypes {
    return typeof value === 'string' && Object.values(AlarmTypes).includes(value as AlarmTypes);
}

export function isValidPlayerType(value: unknown): value is PlayerTypes {
    return typeof value === 'string' && Object.values(PlayerTypes).includes(value as PlayerTypes);
}

export function isValidTeamType(value: unknown): value is TeamTypes {
    return typeof value === 'string' && Object.values(TeamTypes).includes(value as TeamTypes);
}

export function isValidNewsType(value: unknown): value is NewsTypes {
    return typeof value === 'string' && Object.values(NewsTypes).includes(value as NewsTypes);
}

export function isValidUrl(url: string): boolean {
    let urlObj;
    try {
        urlObj = new URL(url);
    }
    catch {
        return false;
    }

    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
}

export async function isValidImageUrl(url: string): Promise<boolean> {
    try {
        const response = await axios.default.get(url, {
            responseType: 'arraybuffer',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Node.js image validator)'
            },
            method: 'HEAD',
            timeout: 5000
        });

        const contentType = response.headers['content-type'];
        return contentType && contentType.startsWith('image/');
    }
    catch {
        return false;
    }
}

export function isValidFcmNotificaton(object: unknown): object is FcmNotification {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as FcmNotification;

    const interfaceName = 'FcmNotification';
    const validKeys = [
        'id',
        'from',
        'category',
        'token',
        'appData',
        'persistentId',
        'ttl',
        'sent'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('from', obj.from, 'string'));
    errors.push(vu.validateType('category', obj.category, 'string'));
    errors.push(vu.validateType('token', obj.token, 'string'));
    errors.push(vu.validateArrayOfInterfaces('appData', obj.appData, isValidAppDataItem));
    errors.push(vu.validateType('persistentId', obj.persistentId, 'string'));
    errors.push(vu.validateType('ttl', obj.ttl, 'number'));
    errors.push(vu.validateType('sent', obj.sent, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidAppDataItem(object: unknown): object is AppDataItem {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as AppDataItem;

    const interfaceName = 'AppDataItem';
    const validKeys = [
        'key',
        'value'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('key', obj.key, 'string'));
    errors.push(vu.validateType('value', obj.value, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidPairingServerBody(object: unknown): object is PairingServerBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as PairingServerBody;

    const interfaceName = 'PairingServerBody';
    const validKeys = [
        'id',
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port',
        'playerId',
        'playerToken',
        'type'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));
    errors.push(vu.validateType('playerId', obj.playerId, 'string'));
    errors.push(vu.validateType('playerToken', obj.playerToken, 'string'));
    errors.push(vu.validateInterface('type', obj.type, isValidPairingType));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidPairingEntityBody(object: unknown): object is PairingEntityBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as PairingEntityBody;

    const interfaceName = 'PairingEntityBody';
    const validKeys = [
        'id',
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port',
        'playerId',
        'playerToken',
        'entityId',
        'entityType',
        'entityName',
        'type'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));
    errors.push(vu.validateType('playerId', obj.playerId, 'string'));
    errors.push(vu.validateType('playerToken', obj.playerToken, 'string'));
    errors.push(vu.validateType('entityId', obj.entityId, 'string'));
    errors.push(vu.validateInterface('entityType', obj.entityType, isValidPairingEntityType));
    errors.push(vu.validateInterface('entityName', obj.entityName, isValidPairingEntityName));
    errors.push(vu.validateInterface('type', obj.type, isValidPairingType));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidAlarmAlarmBody(object: unknown): object is AlarmAlarmBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as AlarmAlarmBody;

    const interfaceName = 'AlarmAlarmBody';
    const validKeys = [
        'id',
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port',
        'type'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));
    errors.push(vu.validateType('type', obj.type, 'string'));
    errors.push(vu.validateInterface('type', obj.type, isValidAlarmType));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidAlarmPluginBody(object: unknown): object is AlarmPluginBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as AlarmPluginBody;

    const interfaceName = 'AlarmPluginBody';
    const validKeys = [
        'id',
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidPlayerDeathBody(object: unknown): object is PlayerDeathBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as PlayerDeathBody;

    const interfaceName = 'PlayerDeathBody';
    const validKeys = [
        'id',
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port',
        'type',
        'targetId',
        'targetName'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));
    errors.push(vu.validateInterface('type', obj.type, isValidPlayerType));
    errors.push(vu.validateType('targetId', obj.targetId, 'string'));
    errors.push(vu.validateType('targetName', obj.targetName, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidTeamLoginBody(object: unknown): object is TeamLoginBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as TeamLoginBody;

    const interfaceName = 'TeamLoginBody';
    const validKeys = [
        'id',
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port',
        'type',
        'targetId',
        'targetName'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('id', obj.id, 'string'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));
    errors.push(vu.validateInterface('type', obj.type, isValidTeamType));
    errors.push(vu.validateType('targetId', obj.targetId, 'string'));
    errors.push(vu.validateType('targetName', obj.targetName, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidNewsNewsBody(object: unknown): object is NewsNewsBody {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as NewsNewsBody;

    const interfaceName = 'NewsNewsBody';
    const validKeys = [
        'type',
        'url'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('type', obj.type, 'string'));
    errors.push(vu.validateInterface('type', obj.type, isValidNewsType));
    errors.push(vu.validateType('url', obj.url, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}