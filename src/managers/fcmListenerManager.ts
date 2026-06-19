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
import { z } from 'zod';

import {
    log, guildInstanceManager as gim, credentialsManager as cm, rustPlusManager as rpm,
    localeManager as lm, discordManager as dm
} from '../../index';
import { DiscordManager } from './discordManager';
import { ConnectionStatus } from './rustPlusManager';
import * as types from '../utils/types';
import * as vu from '../utils/validationUtils';
import * as constants from '../utils/constants'
import {
    GuildInstance, PairingDataMap, SmartSwitchConfigAutoSetting, StorageMonitorConfigType
} from './guildInstanceManager';
import * as discordMessages from '../discordUtils/discordMessages';


const NOTIFICATION_EXPIRATION_TIME_MS = 10_000;

export interface FcmListeners {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [steamId: types.SteamId]: any; /* Client */
}

export const AppDataItemSchema = z.object({
    key: z.string(),
    value: z.string(),
}).describe('AppDataItem');
export type AppDataItem = z.infer<typeof AppDataItemSchema>;

export const FcmNotificationSchema = z.object({
    id: z.string(),
    from: z.string(),
    category: z.string(),
    token: z.string(),
    appData: z.array(AppDataItemSchema),
    persistentId: z.string(),
    ttl: z.number(),
    sent: z.string(),
}).describe('FcmNotification');
export type FcmNotification = z.infer<typeof FcmNotificationSchema>;

export enum ChannelIds {
    PAIRING = 'pairing',
    ALARM = 'alarm',
    PLAYER = 'player',
    TEAM = 'team',
    NEWS = 'news'
}
export const ChannelIdsSchema = z.enum(['pairing', 'alarm', 'player', 'team', 'news']);

export enum PairingTypes {
    SERVER = 'server',
    ENTITY = 'entity'
}
export const PairingTypesSchema = z.enum(['server', 'entity']);

export enum PairingEntityTypes {
    SMART_SWITCH = '1',
    SMART_ALARM = '2',
    STORAGE_MONITOR = '3'
}
export const PairingEntityTypesSchema = z.enum(['1', '2', '3']);

export enum PairingEntityNames {
    SMART_SWITCH = 'Smart Switch',
    SMART_ALARM = 'Smart Alarm',
    STORAGE_MONITOR = 'Storage Monitor'
}
export const PairingEntityNamesSchema = z.enum(['Smart Switch', 'Smart Alarm', 'Storage Monitor']);

export enum AlarmTypes {
    ALARM = 'alarm'
}
export const AlarmTypesSchema = z.enum(['alarm']);

export enum PlayerTypes {
    DEATH = 'death'
}
export const PlayerTypesSchema = z.enum(['death']);

export enum TeamTypes {
    LOGIN = 'login'
}
export const TeamTypesSchema = z.enum(['login']);

export enum NewsTypes {
    NEWS = 'news'
}
export const NewsTypesSchema = z.enum(['news']);

export const PairingServerBodySchema = z.object({
    id: z.string(),
    name: z.string(),
    desc: z.string(),
    img: z.string(),
    logo: z.string(),
    url: z.string(),
    ip: z.string(),
    port: z.string(),
    playerId: z.string(),
    playerToken: z.string(),
    type: z.string(),
}).describe('PairingServerBody');
export type PairingServerBody = z.infer<typeof PairingServerBodySchema>;

export const PairingEntityBodySchema = z.object({
    id: z.string(),
    name: z.string(),
    desc: z.string(),
    img: z.string(),
    logo: z.string(),
    url: z.string(),
    ip: z.string(),
    port: z.string(),
    playerId: z.string(),
    playerToken: z.string(),
    entityId: z.string(),
    entityType: z.string(),
    entityName: z.string(),
    type: z.string(),
}).describe('PairingEntityBody');
export type PairingEntityBody = z.infer<typeof PairingEntityBodySchema>;


export const AlarmAlarmBodySchema = z.object({
    id: z.string(),
    name: z.string(),
    desc: z.string(),
    img: z.string(),
    logo: z.string(),
    url: z.string(),
    ip: z.string(),
    port: z.string(),
    type: z.string(),
}).describe('AlarmAlarmBody');
export type AlarmAlarmBody = z.infer<typeof AlarmAlarmBodySchema>;

export const AlarmPluginBodySchema = z.object({
    id: z.string(),
    name: z.string(),
    desc: z.string(),
    img: z.string(),
    logo: z.string(),
    url: z.string(),
    ip: z.string(),
    port: z.string(),
}).describe('AlarmPluginBody');
export type AlarmPluginBody = z.infer<typeof AlarmPluginBodySchema>;

export const PlayerDeathBodySchema = z.object({
    id: z.string(),
    name: z.string(),
    desc: z.string(),
    img: z.string(),
    logo: z.string(),
    url: z.string(),
    ip: z.string(),
    port: z.string(),
    type: z.string(),
    targetId: z.string(),
    targetName: z.string()
}).describe('PlayerDeathBody');
export type PlayerDeathBody = z.infer<typeof PlayerDeathBodySchema>;

export const TeamLoginBodySchema = z.object({
    id: z.string(),
    name: z.string(),
    desc: z.string(),
    img: z.string(),
    logo: z.string(),
    url: z.string(),
    ip: z.string(),
    port: z.string(),
    type: z.string(),
    targetId: z.string(),
    targetName: z.string()
}).describe('TeamLoginBody');
export type TeamLoginBody = z.infer<typeof TeamLoginBodySchema>;

export const NewsNewsBodySchema = z.object({
    type: z.string(),
    url: z.string(),
}).describe('NewsNewsBody');
export type NewsNewsBody = z.infer<typeof NewsNewsBodySchema>;


export class FcmListenerManager {
    public dm: DiscordManager;
    private listeners: FcmListeners;

    constructor(dm: DiscordManager) {
        log.info(`[${this.constructor.name}] Initializing...`);
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
        const fn = `[${this.constructor.name}: startListener]`;
        const logParam = { steamId: steamId };

        if (this.isListenerActive(steamId)) {
            this.stopListener(steamId);
        }

        const credentials = cm.getCredentials(steamId);
        if (!credentials) {
            return false;
        }

        const androidId = credentials.gcm.androidId;
        const securityToken = credentials.gcm.securityToken;
        this.listeners[steamId] = new PushReceiverClient(androidId, securityToken, [], steamId);
        this.listeners[steamId].on('ON_DATA_RECEIVED', (data: unknown) => {
            const fn = `[${this.constructor.name}: onDataReceived]`;
            const logParam = { steamId: steamId };

            if (!vu.isValidObject(data, FcmNotificationSchema)) {
                log.warn(`${fn} data is not of type FcmNotification. Data: ${JSON.stringify(data)}`, logParam);
                return;
            }

            if ((Date.now() - parseInt((data as FcmNotification).sent)) > NOTIFICATION_EXPIRATION_TIME_MS) {
                log.warn(`${fn} data have expired '${(data as FcmNotification).sent}'.`, logParam);
                return;
            }

            this.onDataReceived(steamId, data);
        });
        this.listeners[steamId].connect();
        log.info(`${fn} FCM Listener started.`, logParam);

        return true;
    }

    public stopListener(steamId: types.SteamId): void {
        const fn = `[${this.constructor.name}: stopListener]`;
        const logParam = { steamId: steamId };

        if (steamId in this.listeners) {
            this.listeners[steamId].destroy();
            delete this.listeners[steamId];
            log.info(`${fn} FCM Listener stopped.`, logParam);
        }
    }

    private onDataReceived(steamId: types.SteamId, data: FcmNotification): void {
        const fn = `[${this.constructor.name}: onDataReceived]`;
        const logParam = { steamId: steamId };

        const appData: AppDataItem[] = data.appData;

        const title = appData.find(item => item.key === 'title')?.value;
        if (!title) {
            log.warn(`${fn} title not found. Data: ${JSON.stringify(data)}`, logParam);
            return;
        }

        const message = appData.find(item => item.key === 'message')?.value;
        if (!message) {
            log.warn(`${fn} message not found. Data: ${JSON.stringify(data)}`, logParam);
            return;
        }

        const channelId = appData.find(item => item.key === 'channelId')?.value;
        if (!vu.isValidObject(channelId, ChannelIdsSchema)) {
            log.warn(`${fn} channelId '${channelId}' not found. Data: ${JSON.stringify(data)}`, logParam);
            return;
        }

        const bodyObject = appData.find(item => item.key === 'body');
        if (!bodyObject) {
            log.warn(`${fn} body not found. Data: ${JSON.stringify(data)}`, logParam);
            return;
        }
        const body = JSON.parse(bodyObject.value);

        switch (channelId) {
            case ChannelIds.PAIRING: {
                switch (body.type) {
                    case PairingTypes.SERVER: {
                        log.info(`${fn} ${ChannelIds.PAIRING}: ${PairingTypes.SERVER}`, logParam);
                        if (!vu.isValidObject(body, PairingServerBodySchema)) return;

                        pairingServer(this, steamId, body);
                    } break;

                    case PairingTypes.ENTITY: {
                        // TODO! If entity pairing, pair server too, all parts of server pairing body is available in
                        // entity pairing body
                        switch (body.entityType) {
                            case PairingEntityTypes.SMART_SWITCH: {
                                log.info(`${fn} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: ` +
                                    `${PairingEntityNames.SMART_SWITCH}`, logParam);
                                if (!vu.isValidObject(body, PairingEntityBodySchema)) return;

                                pairingEntitySmartSwitch(this, steamId, body);
                            } break;

                            case PairingEntityTypes.SMART_ALARM: {
                                log.info(`${fn} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: ` +
                                    `${PairingEntityNames.SMART_ALARM}`, logParam);
                                if (!vu.isValidObject(body, PairingEntityBodySchema)) return;

                                pairingEntitySmartAlarm(this, steamId, body);
                            } break;

                            case PairingEntityTypes.STORAGE_MONITOR: {
                                log.info(`${fn} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: ` +
                                    `${PairingEntityNames.STORAGE_MONITOR}`, logParam);
                                if (!vu.isValidObject(body, PairingEntityBodySchema)) return;

                                pairingEntityStorageMonitor(this, steamId, body);
                            } break;

                            default: {
                                log.warn(`${fn} ${ChannelIds.PAIRING}: ${PairingTypes.ENTITY}: other.`, logParam);
                                if (!vu.isValidObject(body, PairingEntityBodySchema)) return;
                            } break;
                        }
                    } break;

                    default: {
                        log.warn(`${fn} ${ChannelIds.PAIRING}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`, logParam);
                    } break;
                }
            } break;

            case ChannelIds.ALARM: {
                switch (body.type) {
                    case AlarmTypes.ALARM: {
                        log.info(`${fn} ${ChannelIds.ALARM}: ${AlarmTypes.ALARM}`, logParam);
                        if (!vu.isValidObject(body, AlarmAlarmBodySchema)) return;

                        alarmAlarm(this, steamId, title, message, body);
                    } break;

                    default: {
                        if (title === 'You\'re getting raided!') {
                            /* Custom alarm from plugin: https://umod.org/plugins/raid-alarm */
                            log.info(`${fn} ${ChannelIds.ALARM}: plugin`, logParam);
                            if (!vu.isValidObject(body, AlarmPluginBodySchema)) return;

                            alarmPlugin(this, steamId, title, message, body);
                            break;
                        }

                        log.warn(`${fn} ${ChannelIds.ALARM}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`, logParam);
                    } break;
                }
            } break;

            case ChannelIds.PLAYER: {
                switch (body.type) {
                    case PlayerTypes.DEATH: {
                        log.info(`${fn} ${ChannelIds.PLAYER}: ${PlayerTypes.DEATH}`, logParam);
                        if (!vu.isValidObject(body, PlayerDeathBodySchema)) return;

                        playerDeath(this, steamId, title, body);
                    } break;

                    default: {
                        log.warn(`${fn} ${ChannelIds.PLAYER}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`, logParam);
                    } break;
                }
            } break;

            case ChannelIds.TEAM: {
                switch (body.type) {
                    case TeamTypes.LOGIN: {
                        log.info(`${fn} ${ChannelIds.TEAM}: ${TeamTypes.LOGIN}`, logParam);
                        if (!vu.isValidObject(body, TeamLoginBodySchema)) return;

                        teamLogin(this, steamId, body);
                    } break;

                    default: {
                        log.warn(`${fn} ${ChannelIds.TEAM}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`, logParam);
                    } break;
                }
            } break;

            case ChannelIds.NEWS: {
                switch (body.type) {
                    case NewsTypes.NEWS: {
                        log.info(`${fn} ${ChannelIds.NEWS}: ${NewsTypes.NEWS}`, logParam);
                        if (!vu.isValidObject(body, NewsNewsBodySchema)) return;

                        newsNews(this, steamId, title, message, body);
                    } break;

                    default: {
                        log.warn(`${fn} ${ChannelIds.NEWS}: other body type: ${body.type}. Data: ` +
                            `${JSON.stringify(data)}`, logParam);
                    } break;
                }
            } break;

            default: {
                log.warn(`${fn} other channel id: ${channelId}. Data: ` +
                    `${JSON.stringify(data)}`, logParam);
            } break;
        }
    }
}

async function pairingServer(flm: FcmListenerManager, steamId: types.SteamId, body: PairingServerBody) {
    const fn = `[${flm.constructor.name}: pairingServer]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
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
            img: await vu.isValidImageUrl(img) ? img : constants.DEFAULT_SERVER_IMAGE,
            logo: await vu.isValidImageUrl(logo) ? logo : constants.DEFAULT_SERVER_IMAGE,
            url: vu.isValidUrl(url) ? url : constants.DEFAULT_SERVER_URL,
            ip: body.ip,
            port: body.port,
            messageId: (message) ? message.id : null,
            pairedDate: Math.floor(Date.now() / 1000),
            requesterSteamId: serverInfo ? serverInfo.requesterSteamId : body.playerId,
            active: serverInfo ? serverInfo.active : false,
            connect: null,
            markerMap: serverInfo ? serverInfo.markerMap : {},
            noteMap: serverInfo ? serverInfo.noteMap : {},
            battlemetricsId: null,
            smartSwitchConfigMap: serverInfo ? serverInfo.smartSwitchConfigMap : {},
            smartAlarmConfigMap: serverInfo ? serverInfo.smartAlarmConfigMap : {},
            storageMonitorConfigMap: serverInfo ? serverInfo.storageMonitorConfigMap : {},
            smartSwitchGroupConfigMap: serverInfo ? serverInfo.smartSwitchGroupConfigMap : {},
            customVariables: serverInfo ? serverInfo.customVariables : {
                cargoShipEgressTimeMs: constants.DEFAULT_CARGO_SHIP_EGRESS_TIME_MS,
                cargoShipHarborDockingTimeMs: constants.DEFAULT_CARGO_SHIP_HARBOR_DOCKING_TIME_MS,
                cargoShipLootRounds: constants.CARGO_SHIP_LOOT_ROUNDS,
                cargoShipLootRoundsSpacingTimeMs: constants.DEFAULT_CARGO_SHIP_LOOT_ROUNDS_SPACING_TIME_MS,
                deepSeaDurationTimeMs: constants.DEFAULT_DEEP_SEA_DURATION_TIME_MS,
                lockedCrateUnlockTimeMs: constants.DEFAULT_LOCKED_CRATE_UNLOCK_TIME_MS,
                travellingVendorDurationTimeMs: constants.DEFAULT_TRAVELLING_VENDOR_ACTIVE_TIME_MS
            },
            dayDurationSeconds: serverInfo ? serverInfo.dayDurationSeconds : null,
            nightDurationSeconds: serverInfo ? serverInfo.nightDurationSeconds : null
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        if (gInstance.serverToView === null) gInstance.serverToView = serverId;
        gim.updateGuildInstance(guildId);

        let connectionStatus = ConnectionStatus.Disconnected;
        const rpInstance = rpm.getInstance(guildId, serverId);
        if (rpInstance) {
            connectionStatus = rpInstance.connectionStatus;
        }

        await discordMessages.sendServerMessage(flm.dm, guildId, serverId, connectionStatus);
    }
}

async function pairingEntitySmartSwitch(flm: FcmListenerManager, steamId: types.SteamId, body: PairingEntityBody) {
    const fn = `[${flm.constructor.name}: pairingEntitySmartSwitch]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${fn} Could not find server.`, { guildId: guildId, serverId: serverId, steamId: steamId });
            continue;
        }

        const smartSwitchConfigMap = serverInfo.smartSwitchConfigMap;
        const exist = body.entityId in smartSwitchConfigMap;
        smartSwitchConfigMap[body.entityId] = {
            entityId: body.entityId,
            messageId: exist ? smartSwitchConfigMap[body.entityId].messageId : null,
            pairedDate: Math.floor(Date.now() / 1000),
            name: exist ? smartSwitchConfigMap[body.entityId].name : lm.getIntl(language, 'smartSwitch'),
            command: exist ? smartSwitchConfigMap[body.entityId].command : body.entityId,
            img: exist ? smartSwitchConfigMap[body.entityId].img : 'smart_switch.png',
            autoSetting: exist ? smartSwitchConfigMap[body.entityId].autoSetting : SmartSwitchConfigAutoSetting.Off,
            proximitySetting: exist ? smartSwitchConfigMap[body.entityId].proximitySetting :
                constants.PROXIMITY_SETTING_DEFAULT_METERS
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        gim.updateGuildInstance(guildId);

        // TODO! Add the switch to rustplusManager

        const rpInstance = rpm.getInstance(guildId, serverId);
        if (rpInstance && serverInfo.active) {
            await discordMessages.sendSmartSwitchMessage(flm.dm, guildId, serverId, body.entityId);
        }
    }
}

async function pairingEntitySmartAlarm(flm: FcmListenerManager, steamId: types.SteamId, body: PairingEntityBody) {
    const fn = `[${flm.constructor.name}: pairingEntitySmartAlarm]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${fn} Could not find server.`, { guildId: guildId, serverId: serverId, steamId: steamId });
            continue;
        }

        const smartAlarmConfigMap = serverInfo.smartAlarmConfigMap;
        const exist = body.entityId in smartAlarmConfigMap;
        smartAlarmConfigMap[body.entityId] = {
            entityId: body.entityId,
            messageId: exist ? smartAlarmConfigMap[body.entityId].messageId : null,
            pairedDate: Math.floor(Date.now() / 1000),
            name: exist ? smartAlarmConfigMap[body.entityId].name : lm.getIntl(language, 'smartAlarm'),
            command: exist ? smartAlarmConfigMap[body.entityId].command : body.entityId,
            img: exist ? smartAlarmConfigMap[body.entityId].img : 'smart_alarm.png',
            everyone: exist ? smartAlarmConfigMap[body.entityId].everyone : false,
            inGame: exist ? smartAlarmConfigMap[body.entityId].inGame : false,
            lastTrigger: exist ? smartAlarmConfigMap[body.entityId].lastTrigger : null,
            message: exist ? smartAlarmConfigMap[body.entityId].message : lm.getIntl(language, 'yourBaseIsUnderAttack')
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        gim.updateGuildInstance(guildId);

        // TODO! Add the alarm to rustplusManager

        const rpInstance = rpm.getInstance(guildId, serverId);
        if (rpInstance && serverInfo.active) {
            await discordMessages.sendSmartAlarmMessage(flm.dm, guildId, serverId, body.entityId);
        }
    }
}

async function pairingEntityStorageMonitor(flm: FcmListenerManager, steamId: types.SteamId, body: PairingEntityBody) {
    const fn = `[${flm.constructor.name}: pairingEntityStorageMonitor]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${fn} Could not find server.`, { guildId: guildId, serverId: serverId, steamId: steamId });
            continue;
        }

        const storageMonitorConfigMap = serverInfo.storageMonitorConfigMap;
        const exist = body.entityId in storageMonitorConfigMap;
        storageMonitorConfigMap[body.entityId] = {
            entityId: body.entityId,
            messageId: exist ? storageMonitorConfigMap[body.entityId].messageId : null,
            pairedDate: Math.floor(Date.now() / 1000),
            name: exist ? storageMonitorConfigMap[body.entityId].name : lm.getIntl(language, 'storageMonitor'),
            img: exist ? storageMonitorConfigMap[body.entityId].img : 'storage_monitor.png',
            everyone: exist ? storageMonitorConfigMap[body.entityId].everyone : false,
            inGame: exist ? storageMonitorConfigMap[body.entityId].inGame : true,
            type: exist ? storageMonitorConfigMap[body.entityId].type : StorageMonitorConfigType.Unknown
        };

        updatePairingDetails(gInstance.pairingDataMap, serverId, steamId, body);
        gim.updateGuildInstance(guildId);

        // TODO! Add the storagemonitor to rustplusManager

        const rpInstance = rpm.getInstance(guildId, serverId);
        if (rpInstance && serverInfo.active) {
            await discordMessages.sendStorageMonitorMessage(flm.dm, guildId, serverId, body.entityId);
        }
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

    const fn = `[${flm.constructor.name}: alarmAlarm]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    log.info(`${fn} alarmAlarm: ${title}: ${message}`, logParam);

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${fn} Could not find server.`, { guildId: guildId, serverId: serverId, steamId: steamId });
            continue;
        }

        const rpInstance = rpm.getInstance(guildId, serverId);
        if (!rpInstance && !serverInfo.active && steamId === serverInfo.requesterSteamId &&
            gInstance.generalSettings.fcmAlarmNotify) {
            await discordMessages.sendFcmAlarmTriggerMessage(flm.dm, guildId, serverId, title, message);
        }
    }
}

async function alarmPlugin(flm: FcmListenerManager, steamId: types.SteamId, title: string, message: string,
    body: AlarmPluginBody) {
    const fn = `[${flm.constructor.name}: alarmPlugin]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    log.info(`${fn} alarmPlugin: ${title}: ${message}`, logParam);

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${fn} Could not find server.`, { guildId: guildId, serverId: serverId, steamId: steamId });
            continue;
        }

        if (gInstance.generalSettings.fcmAlarmPluginNotify && steamId === serverInfo.requesterSteamId) {
            if ((gInstance.generalSettings.fcmAlarmPluginNotifyActiveServer && serverInfo.active) ||
                !gInstance.generalSettings.fcmAlarmPluginNotifyActiveServer) {
                discordMessages.sendFcmAlarmPluginTriggerMessage(flm.dm, guildId, serverId, title, message);
            }

            /* Send messages in game if configured. */
            if (gInstance.generalSettings.fcmAlarmPluginNotifyInGame) {
                for (const [sId, content] of Object.entries(gInstance.serverInfoMap)) {
                    const rpInstance = rpm.getInstance(guildId, sId);
                    if (rpInstance && content.active) {
                        if ((gInstance.generalSettings.fcmAlarmPluginNotifyActiveServer && serverInfo.active) ||
                            !gInstance.generalSettings.fcmAlarmPluginNotifyActiveServer) {
                            // TODO! Send to in-game chat notification for the raid alarm plugin
                        }
                    }
                }
            }
        }
    }
}

async function playerDeath(flm: FcmListenerManager, steamId: types.SteamId, title: string, body: PlayerDeathBody) {
    await discordMessages.sendFcmPlayerDeathMessage(flm.dm, steamId, title, body);
}

async function teamLogin(flm: FcmListenerManager, steamId: types.SteamId, body: TeamLoginBody) {
    const fn = `[${flm.constructor.name}: teamLogin]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);
    const serverId = `${body.ip}-${body.port}`;

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

        const serverInfo = gInstance.serverInfoMap[serverId];
        if (!serverInfo) {
            log.warn(`${fn} Could not find server.`, { guildId: guildId, serverId: serverId, steamId: steamId });
            continue;
        }

        const rpInstance = rpm.getInstance(guildId, serverId);
        if (!rpInstance && !serverInfo.active && steamId === serverInfo.requesterSteamId) {
            await discordMessages.sendFcmTeamLoginMessage(flm.dm, guildId, body);
            log.info(`${fn} teamLogin: ${body.targetName} just connected to ${body.name}.`, logParam);
        }
    }
}

async function newsNews(flm: FcmListenerManager, steamId: types.SteamId, title: string, message: string,
    body: NewsNewsBody) {
    const fn = `[${flm.constructor.name}: newsNews]`;
    const logParam = { steamId: steamId };

    const credentials = cm.getCredentials(steamId);

    if (!credentials) {
        log.warn(`${fn} Could not find Credentials.`, logParam);
        return;
    }

    const associatedGuilds = await dm.getGuildIdsForUser(credentials.discordUserId);
    for (const guildId of associatedGuilds) {
        const gInstance = gim.getGuildInstance(guildId) as GuildInstance;

        if (steamId === gInstance.newsReceiver) {
            await discordMessages.sendFcmNewsNewsMessage(flm.dm, guildId, title, message, body);
        }
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