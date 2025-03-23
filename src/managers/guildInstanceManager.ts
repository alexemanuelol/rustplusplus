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

import * as fs from 'fs';
import * as path from 'path';

import { log } from '../../index';
import * as types from '../utils/types';
import * as vu from '../utils/validationUtils';

export const VERSION = 1;

export enum ReadError {
    NotFound = 0,
    ReadFailed = 1,
    ParseFailed = 2,
    InvalidVersion = 3,
    InvalidFormat = 4
}

export enum WriteError {
    NoError = 0,
    InvalidFormat = 1,
    InvalidVersion = 2,
    WriteFailed = 3
}

export interface AllGuildInstances {
    [guildId: types.GuildId]: GuildInstance
}

export type PairingDataMap = { [serverId: types.ServerId]: { [steamId: types.SteamId]: PairingData } };
export type NotificationSettingMap = { [setting: string]: NotificationSetting };
export type TeamMemberChatColorMap = { [steamId: types.SteamId]: string };
export type TrackerMap = { [trackerId: string]: Tracker };
export type ServerInfoMap = { [serverId: types.ServerId]: ServerInfo };

export interface GuildInstance {
    version: types.Version;
    guildId: types.GuildId;
    pairingDataMap: PairingDataMap;
    activeServerId: types.ServerId | null;
    mainRequester: types.SteamId | null;
    guildChannelIds: GuildChannelIds;
    adminIds: types.RoleId[];
    roleIds: types.RoleId[];
    informationChannelMessageIds: InformationChannelMessageIds;
    generalSettings: GeneralSettings;
    notificationSettingMap: NotificationSettingMap;
    commandAliases: CommandAlias[];
    blacklist: Blacklist;
    teamMemberChatColorMap: TeamMemberChatColorMap;
    marketSubscriptionList: MarketSubscriptionList;
    trackerMap: TrackerMap;
    serverInfoMap: ServerInfoMap;
}

export interface PairingData {
    valid: boolean;
    serverIp: string;
    appPort: string;
    steamId: types.SteamId;
    playerToken: number;
}

export interface GuildChannelIds {
    category: types.ChannelId | null;
    settings: types.ChannelId | null;
    servers: types.ChannelId | null;
    information: types.ChannelId | null;
    events: types.ChannelId | null;
    activity: types.ChannelId | null;
    teamchat: types.ChannelId | null;
    commands: types.ChannelId | null;
    smartSwitches: types.ChannelId | null;
    smartSwitchGroups: types.ChannelId | null;
    smartAlarms: types.ChannelId | null;
    storageMonitors: types.ChannelId | null;
    trackers: types.ChannelId | null;
}

export interface InformationChannelMessageIds {
    map: types.MessageId | null;
    server: types.MessageId | null;
    event: types.MessageId | null;
    team: types.MessageId | null;
    battlemetricsPlayers: types.MessageId | null;
}

export interface GeneralSettings {
    language: string;
    prefix: string;
    trademark: string;
    voiceGender: string;
    fcmAlarmNotify: boolean;
    fcmAlarmNotifyEveryone: boolean;
    fcmAlarmPluginNotify: boolean;
    fcmAlarmPluginNotifyEveryone: boolean;
    fcmAlarmPluginNotifyInGame: boolean;
    fcmAlarmPluginNotifyActiveServer: boolean;
}

export interface NotificationSetting {
    discord: boolean;
    image: string;
    inGame: boolean;
    voice: boolean;
}

export interface CommandAlias {
    alias: string;
    index: number;
    value: string;
}

export interface Blacklist {
    discordIds: types.UserId[];
    steamIds: types.SteamId[];
}

export interface MarketSubscriptionList {
    all: string[];
    buy: string[];
    sell: string[];
}

export interface Tracker {
    name: string;
    serverId: types.ServerId;
    battlemetricsId: types.BattlemetricsId;
    title: string;
    image: string;
    clanTag: string;
    everyone: boolean;
    inGame: boolean;
    players: TrackerPlayer[];
    messageId: types.MessageId | null;
}

export interface TrackerPlayer {
    name: string | null;
    steamId: types.SteamId | null;
    playerId: string | null;
}

export type NoteMap = { [index: string]: string };
export type SmartSwitchMap = { [entityId: types.EntityId]: SmartSwitch };
export type SmartAlarmMap = { [entityId: types.EntityId]: SmartAlarm };
export type StorageMonitorMap = { [entityId: types.EntityId]: StorageMonitor };
export type SmartSwitchGroupMap = { [groupId: string]: SmartSwitchGroup };

export interface ServerInfo {
    /* From FCM notification */
    name: string;
    desc: string;
    img: string;
    logo: string;
    url: string;
    ip: string;
    port: string;
    /* Rest */
    messageId: types.MessageId | null;
    pairedDate: types.Timestamp;
    connect: string | null;
    noteMap: NoteMap;
    battlemetricsId: types.BattlemetricsId | null;
    smartSwitchMap: SmartSwitchMap;
    smartAlarmMap: SmartAlarmMap;
    storageMonitorMap: StorageMonitorMap;
    smartSwitchGroupMap: SmartSwitchGroupMap;
}

export interface SmartSwitch {
    /* From FCM notification */
    entityId: string;
    /* Rest */
    messageId: types.MessageId | null;
    pairedDate: types.Timestamp;
    name: string;
    command: string;
    img: string;
    autoSetting: SmartSwitchAutoSetting;
    proximitySetting: number;
}

export enum SmartSwitchAutoSetting {
    Off = 0,
    AutoDay = 1,
    AutoNight = 2,
    AutoOn = 3,
    AutoOff = 4,
    AutoOnProximity = 5,
    AutoOffProximity = 6,
    AutoOnAnyOnline = 7,
    AutoOffAnyOnline = 8
}

export interface SmartAlarm {
    /* From FCM notification */
    entityId: types.EntityId;
    /* Rest */
    messageId: types.MessageId | null;
    pairedDate: types.Timestamp;
    name: string;
    command: string;
    img: string;
    everyone: boolean;
    lastTrigger: types.Timestamp | null;
    message: string;
}

export interface StorageMonitor {
    /* From FCM notification */
    entityId: types.EntityId;
    /* Rest */
    messageId: types.MessageId | null;
    pairedDate: types.Timestamp;
    name: string;
    img: string;
    everyone: boolean;
    inGame: boolean;
    type: StorageMonitorType;
}

export enum StorageMonitorType {
    Unknown = 0,
    ToolCupboard = 1,
    VendingMachine = 2,
    LargeWoodBox = 3
}

export interface SmartSwitchGroup {
    messageId: types.MessageId | null;
    name: string;
    command: string;
    image: string;
    smartSwitches: types.EntityId[];
}

export class GuildInstanceManager {
    private guildInstanceFilesPath: string;
    private templateFilesPath: string;
    private allGuildInstances: AllGuildInstances;
    private generalSettingsTemplate: GeneralSettings | null;
    private notificationSettingsTemplate: { [setting: string]: NotificationSetting } | null;

    constructor(guildInstanceFilesPath: string, templateFilesPath: string) {
        const funcName = '[GuildInstanceManager Init]';
        log.info(`${funcName} Guild instances path '${guildInstanceFilesPath}'.`);
        this.guildInstanceFilesPath = guildInstanceFilesPath;
        this.templateFilesPath = templateFilesPath;
        this.allGuildInstances = {};

        this.generalSettingsTemplate = this.readGeneralSettingsTemplate();
        this.notificationSettingsTemplate = this.readNotificationSettingsTemplate();

        if (this.generalSettingsTemplate === null || this.notificationSettingsTemplate === null) {
            log.error(`${funcName} General/Notification settings template could not be read. Exiting...`);
            process.exit(1);
        }

        this.loadAllGuildInstances();
    }

    private loadAllGuildInstances(): void {
        const funcName = '[loadAllGuildInstances]';
        const guildInstanceFiles = fs.readdirSync(this.guildInstanceFilesPath);

        guildInstanceFiles.forEach((file) => {
            const guildId = path.basename(file, '.json');
            const gInstance = this.readGuildInstanceFile(guildId);

            if (typeof gInstance === 'number') {
                log.error(`${funcName} Failed to load GuildInstance file. exiting...`, { guildId: guildId });
                process.exit(1);
            }

            this.allGuildInstances[guildId] = gInstance;
        });
    }

    private readGeneralSettingsTemplate(): GeneralSettings | null {
        const funcName = '[readGeneralSettingsTemplate]';
        log.info(`${funcName} Reading general settings template.`);

        const templateFilePath = path.join(this.templateFilesPath, 'generalSettingsTemplate.json');

        let templateFileContent: string;
        try {
            templateFileContent = fs.readFileSync(templateFilePath, 'utf8');
        }
        catch (error) {
            log.warn(`${funcName} Failed to read general settings template file: '${templateFilePath}', ${error}`);
            return null;
        }

        log.info(`${funcName} Template was successfully read.`);
        return JSON.parse(templateFileContent) as GeneralSettings;
    }

    private readNotificationSettingsTemplate(): { [setting: string]: NotificationSetting } | null {
        const funcName = '[readNotificationSettingsTemplate]';
        log.info(`${funcName} Reading notification settings template.`);

        const templateFilePath = path.join(this.templateFilesPath, 'notificationSettingsTemplate.json');

        let templateFileContent: string;
        try {
            templateFileContent = fs.readFileSync(templateFilePath, 'utf8');
        }
        catch (error) {
            log.warn(`${funcName} Failed to read notification settings template file: '${templateFilePath}', ${error}`);
            return null;
        }

        log.info(`${funcName} Template was successfully read.`);
        return JSON.parse(templateFileContent) as { [setting: string]: NotificationSetting };
    }

    private readGuildInstanceFile(guildId: types.GuildId): GuildInstance | ReadError {
        const funcName = '[readGuildInstanceFile]';
        const logParam = { guildId: guildId };

        log.info(`${funcName} Reading GuildInstance file.`, logParam);

        const guildInstanceFilePath = path.join(this.guildInstanceFilesPath, `${guildId}.json`);

        if (!fs.existsSync(guildInstanceFilePath)) {
            log.warn(`${funcName} GuildInstance file could not be found.`, logParam);
            return ReadError.NotFound;
        }

        let guildInstanceFileContent: string;
        try {
            guildInstanceFileContent = fs.readFileSync(guildInstanceFilePath, 'utf8');
        }
        catch (error) {
            log.warn(`${funcName} Failed to read GuildInstance file '${guildInstanceFilePath}', ${error}`, logParam);
            return ReadError.ReadFailed;
        }

        let guildInstanceFileContentParsed: GuildInstance;
        try {
            guildInstanceFileContentParsed = JSON.parse(guildInstanceFileContent);
        }
        catch (error) {
            log.warn(`${funcName} GuildInstance file failed to be parsed. Data: ` +
                `${guildInstanceFileContent}, ${error}`, logParam);
            return ReadError.ParseFailed;
        }

        if (!isValidGuildInstance(guildInstanceFileContentParsed)) {
            log.warn(`${funcName} GuildInstance file have invalid format. Data: ` +
                `${JSON.stringify(guildInstanceFileContentParsed)}`, logParam);
            return ReadError.InvalidFormat;
        }

        if (guildInstanceFileContentParsed.version !== VERSION) {
            log.warn(`${funcName} GuildInstance file have invalid version. ` +
                `Expected: ${VERSION}, Actual: ${guildInstanceFileContentParsed.version}`, logParam);
            return ReadError.InvalidVersion;
        }

        log.info(`${funcName} GuildInstance file was successfully read.`, logParam);
        return guildInstanceFileContentParsed as GuildInstance;
    }

    private writeGuildInstanceFile(guildId: types.GuildId, gInstance: GuildInstance): WriteError {
        const funcName = '[writeGuildInstanceFile]';
        const logParam = { guildId: guildId };

        log.info(`${funcName} Writing guildInstance to file.`, logParam);

        if (!isValidGuildInstance(gInstance)) {
            log.warn(`${funcName} GuildInstance have invalid format. Data: ${JSON.stringify(gInstance)}`, logParam);
            return WriteError.InvalidFormat;
        }

        if (gInstance.version !== VERSION) {
            log.warn(`${funcName} GuildInstance have invalid version. Expected: ${VERSION}, ` +
                `Actual: ${gInstance.version}`, logParam);
            return WriteError.InvalidVersion;
        }

        const guildInstanceFilePath = path.join(this.guildInstanceFilesPath, `${guildId}.json`);
        const guildInstanceString = JSON.stringify(gInstance, null, 2);

        try {
            fs.writeFileSync(guildInstanceFilePath, guildInstanceString);
        }
        catch (error) {
            log.warn(`${funcName} Failed to write GuildInstance file '${guildInstanceFilePath}', ${error}`, logParam);
            return WriteError.WriteFailed;
        }

        log.info(`${funcName} GuildInstance was successfully written.`, logParam);
        return WriteError.NoError;
    }

    private deleteGuildInstanceFile(guildId: types.GuildId): boolean {
        const funcName = '[deleteGuildInstanceFile]';
        const logParam = { guildId: guildId };

        log.info(`${funcName} Delete GuildInstance file.`, logParam);
        const guildInstanceFilePath = path.join(this.guildInstanceFilesPath, `${guildId}.json`);

        if (!fs.existsSync(guildInstanceFilePath)) {
            log.warn(`${funcName} Could not find GuildInstance file '${guildInstanceFilePath}'.`, logParam);
            return false;
        }

        try {
            fs.unlinkSync(guildInstanceFilePath);
        }
        catch (error) {
            log.warn(`${funcName} Failed to delete GuildInstance file '${guildInstanceFilePath}', ${error}`, logParam);
            return false;
        }

        log.info(`${funcName} GuildInstance file '${guildInstanceFilePath}' was successfully deleted.`, logParam);
        return true;
    }

    private getNewEmptyGuildInstance(guildId: types.GuildId): GuildInstance {
        return {
            version: VERSION,
            guildId: guildId,
            pairingDataMap: {},
            activeServerId: null,
            mainRequester: null,
            guildChannelIds: {
                category: null,
                settings: null,
                servers: null,
                information: null,
                events: null,
                activity: null,
                teamchat: null,
                commands: null,
                smartSwitches: null,
                smartSwitchGroups: null,
                smartAlarms: null,
                storageMonitors: null,
                trackers: null
            },
            adminIds: [],
            roleIds: [],
            informationChannelMessageIds: {
                map: null,
                server: null,
                event: null,
                team: null,
                battlemetricsPlayers: null
            },
            generalSettings: structuredClone(this.generalSettingsTemplate) as GeneralSettings,
            notificationSettingMap: structuredClone(this.notificationSettingsTemplate) as {
                [setting: string]: NotificationSetting
            },
            commandAliases: [],
            blacklist: {
                discordIds: [],
                steamIds: []
            },
            teamMemberChatColorMap: {},
            marketSubscriptionList: {
                all: [],
                buy: [],
                sell: []
            },
            trackerMap: {},
            serverInfoMap: {}
        }
    }

    public getGuildInstanceGuildIds(): types.GuildId[] {
        return Object.keys(this.allGuildInstances);
    }

    public getGuildInstance(guildId: types.GuildId): GuildInstance | null {
        const gInstance = this.allGuildInstances[guildId];
        return gInstance ?? null;
    }

    public getGuildInstanceDeepCopy(guildId: types.GuildId): GuildInstance | null {
        const gInstance = this.allGuildInstances[guildId];
        return gInstance ? structuredClone(gInstance) : null;
    }

    public updateGuildInstance(guildId: types.GuildId): boolean {
        const funcName = '[updateGuildInstance]';
        const logParam = { guildId: guildId };

        const gInstance = this.allGuildInstances[guildId];
        if (!gInstance) {
            log.warn(`${funcName} GuildInstance not found.`, logParam);
            return false;
        }

        const result = this.writeGuildInstanceFile(guildId, gInstance);
        if (result !== WriteError.NoError) {
            log.warn(`${funcName} Failed to update GuildInstance.`, logParam);
            return false;
        }

        return true;
    }

    public deleteGuildInstance(guildId: types.GuildId): boolean {
        const result = this.deleteGuildInstanceFile(guildId);
        if (result) {
            delete this.allGuildInstances[guildId];
            return true;
        }
        return false;
    }

    public addNewGuildInstance(guildId: types.GuildId): boolean {
        const funcName = '[addNewGuildInstance]';
        const logParam = { guildId: guildId };

        const gInstance = this.getNewEmptyGuildInstance(guildId);

        if (guildId in this.allGuildInstances && this.allGuildInstances[guildId] !== null) {
            log.warn(`${funcName} GuildInstance is already present.`, logParam);
            return false;
        }

        const result = this.writeGuildInstanceFile(guildId, gInstance);
        if (result !== WriteError.NoError) {
            log.warn(`${funcName} Failed to write new GuildInstance file.`, logParam);
            return false;
        }

        this.allGuildInstances[guildId] = gInstance;

        return true;
    }
}

/**
 * Validation functions.
 */

export function isValidGuildInstance(object: unknown): object is GuildInstance {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as GuildInstance;

    const interfaceName = 'GuildInstance';
    const validKeys = [
        'version',
        'guildId',
        'pairingDataMap',
        'activeServerId',
        'mainRequester',
        'guildChannelIds',
        'adminIds',
        'roleIds',
        'informationChannelMessageIds',
        'generalSettings',
        'notificationSettingMap',
        'commandAliases',
        'blacklist',
        'teamMemberChatColorMap',
        'marketSubscriptionList',
        'trackerMap',
        'serverInfoMap'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('version', obj.version, 'number'));
    errors.push(vu.validateType('guildId', obj.guildId, 'string'));
    errors.push(vu.validateNestedObjectOfInterfaces('pairingDataMap', obj.pairingDataMap, isValidPairingData));
    errors.push(vu.validateType('activeServerId', obj.activeServerId, 'string', null));
    errors.push(vu.validateType('mainRequester', obj.mainRequester, 'string', null));
    errors.push(vu.validateInterface('guildChannelIds', obj.guildChannelIds, isValidGuildChannelIds));
    errors.push(vu.validateArrayOfTypes('adminIds', obj.adminIds, 'string'));
    errors.push(vu.validateArrayOfTypes('roleIds', obj.roleIds, 'string'));
    errors.push(vu.validateInterface('informationChannelMessageIds', obj.informationChannelMessageIds,
        isValidInformationChannelMessageIds));
    errors.push(vu.validateInterface('generalSettings', obj.generalSettings, isValidGeneralSettings));
    errors.push(vu.validateObjectOfInterfaces('notificationSettingMap', obj.notificationSettingMap,
        isValidNotificationSetting));
    errors.push(vu.validateArrayOfInterfaces('commandAliases', obj.commandAliases, isValidCommandAlias));
    errors.push(vu.validateInterface('blacklist', obj.blacklist, isValidBlacklist));
    errors.push(vu.validateObjectOfTypes('teamMemberChatColorMap', obj.teamMemberChatColorMap, 'string'));
    errors.push(vu.validateInterface('marketSubscriptionList', obj.marketSubscriptionList,
        isValidMarketSubscriptionList));
    errors.push(vu.validateObjectOfInterfaces('trackerMap', obj.trackerMap, isValidTracker));
    errors.push(vu.validateObjectOfInterfaces('serverInfoMap', obj.serverInfoMap, isValidServerInfo));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidPairingData(object: unknown): object is PairingData {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as PairingData;

    const interfaceName = 'PairingData';
    const validKeys = [
        'valid',
        'serverIp',
        'appPort',
        'steamId',
        'playerToken'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('valid', obj.valid, 'boolean'));
    errors.push(vu.validateType('serverIp', obj.serverIp, 'string'));
    errors.push(vu.validateType('appPort', obj.appPort, 'string'));
    errors.push(vu.validateType('steamId', obj.steamId, 'string'));
    errors.push(vu.validateType('playerToken', obj.playerToken, 'number'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidGuildChannelIds(object: unknown): object is GuildChannelIds {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as GuildChannelIds;

    const interfaceName = 'GuildChannelIds';
    const validKeys = [
        'category',
        'settings',
        'servers',
        'information',
        'events',
        'activity',
        'teamchat',
        'commands',
        'smartSwitches',
        'smartSwitchGroups',
        'smartAlarms',
        'storageMonitors',
        'trackers'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('category', obj.category, 'string', null));
    errors.push(vu.validateType('settings', obj.settings, 'string', null));
    errors.push(vu.validateType('servers', obj.servers, 'string', null));
    errors.push(vu.validateType('information', obj.information, 'string', null));
    errors.push(vu.validateType('events', obj.events, 'string', null));
    errors.push(vu.validateType('activity', obj.activity, 'string', null));
    errors.push(vu.validateType('teamchat', obj.teamchat, 'string', null));
    errors.push(vu.validateType('commands', obj.commands, 'string', null));
    errors.push(vu.validateType('smartSwitches', obj.smartSwitches, 'string', null));
    errors.push(vu.validateType('smartSwitchGroups', obj.smartSwitchGroups, 'string', null));
    errors.push(vu.validateType('smartAlarms', obj.smartAlarms, 'string', null));
    errors.push(vu.validateType('storageMonitors', obj.storageMonitors, 'string', null));
    errors.push(vu.validateType('trackers', obj.trackers, 'string', null));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidInformationChannelMessageIds(object: unknown): object is InformationChannelMessageIds {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as InformationChannelMessageIds;

    const interfaceName = 'InformationChannelMessageIds';
    const validKeys = [
        'map',
        'server',
        'event',
        'team',
        'battlemetricsPlayers'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('map', obj.map, 'string', null));
    errors.push(vu.validateType('server', obj.server, 'string', null));
    errors.push(vu.validateType('event', obj.event, 'string', null));
    errors.push(vu.validateType('team', obj.team, 'string', null));
    errors.push(vu.validateType('battlemetricsPlayers', obj.battlemetricsPlayers, 'string', null));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidGeneralSettings(object: unknown): object is GeneralSettings {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as GeneralSettings;

    const interfaceName = 'GeneralSettings';
    const validKeys = [
        'language',
        'prefix',
        'trademark',
        'voiceGender',
        'fcmAlarmNotify',
        'fcmAlarmNotifyEveryone',
        'fcmAlarmPluginNotify',
        'fcmAlarmPluginNotifyEveryone',
        'fcmAlarmPluginNotifyInGame',
        'fcmAlarmPluginNotifyActiveServer'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('language', obj.language, 'string'));
    errors.push(vu.validateType('prefix', obj.prefix, 'string'));
    errors.push(vu.validateType('trademark', obj.trademark, 'string'));
    errors.push(vu.validateType('voiceGender', obj.voiceGender, 'string'));
    errors.push(vu.validateType('fcmAlarmNotify', obj.fcmAlarmNotify, 'boolean'));
    errors.push(vu.validateType('fcmAlarmNotifyEveryone', obj.fcmAlarmNotifyEveryone, 'boolean'));
    errors.push(vu.validateType('fcmAlarmPluginNotify', obj.fcmAlarmPluginNotify, 'boolean'));
    errors.push(vu.validateType('fcmAlarmPluginNotifyEveryone', obj.fcmAlarmPluginNotifyEveryone, 'boolean'));
    errors.push(vu.validateType('fcmAlarmPluginNotifyInGame', obj.fcmAlarmPluginNotifyInGame, 'boolean'));
    errors.push(vu.validateType('fcmAlarmPluginNotifyActiveServer', obj.fcmAlarmPluginNotifyActiveServer,
        'boolean'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidNotificationSetting(object: unknown): object is NotificationSetting {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as NotificationSetting;

    const interfaceName = 'NotificationSetting';
    const validKeys = [
        'discord',
        'image',
        'inGame',
        'voice'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('discord', obj.discord, 'boolean'));
    errors.push(vu.validateType('image', obj.image, 'string'));
    errors.push(vu.validateType('inGame', obj.inGame, 'boolean'));
    errors.push(vu.validateType('voice', obj.voice, 'boolean'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidCommandAlias(object: unknown): object is CommandAlias {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as CommandAlias;

    const interfaceName = 'CommandAlias';
    const validKeys = [
        'alias',
        'index',
        'value'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('alias', obj.alias, 'string'));
    errors.push(vu.validateType('index', obj.index, 'number'));
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

export function isValidBlacklist(object: unknown): object is Blacklist {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as Blacklist;

    const interfaceName = 'Blacklist';
    const validKeys = [
        'discordIds',
        'steamIds'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateArrayOfTypes('discordIds', obj.discordIds, 'string'));
    errors.push(vu.validateArrayOfTypes('steamIds', obj.steamIds, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidMarketSubscriptionList(object: unknown): object is MarketSubscriptionList {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as MarketSubscriptionList;

    const interfaceName = 'MarketSubscriptionList';
    const validKeys = [
        'all',
        'buy',
        'sell'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateArrayOfTypes('all', obj.all, 'string'));
    errors.push(vu.validateArrayOfTypes('buy', obj.buy, 'string'));
    errors.push(vu.validateArrayOfTypes('sell', obj.sell, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidTracker(object: unknown): object is Tracker {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as Tracker;

    const interfaceName = 'Tracker';
    const validKeys = [
        'name',
        'serverId',
        'battlemetricsId',
        'title',
        'image',
        'clanTag',
        'everyone',
        'inGame',
        'players',
        'messageId'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('serverId', obj.serverId, 'string'));
    errors.push(vu.validateType('battlemetricsId', obj.battlemetricsId, 'string'));
    errors.push(vu.validateType('title', obj.title, 'string'));
    errors.push(vu.validateType('image', obj.image, 'string'));
    errors.push(vu.validateType('clanTag', obj.clanTag, 'string'));
    errors.push(vu.validateType('everyone', obj.everyone, 'boolean'));
    errors.push(vu.validateType('inGame', obj.inGame, 'boolean'));
    errors.push(vu.validateArrayOfInterfaces('players', obj.players, isValidTrackerPlayer))
    errors.push(vu.validateType('messageId', obj.messageId, 'string', null));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidTrackerPlayer(object: unknown): object is TrackerPlayer {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as TrackerPlayer;

    const interfaceName = 'TrackerPlayer';
    const validKeys = [
        'name',
        'steamId',
        'playerId'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('name', obj.name, 'string', null));
    errors.push(vu.validateType('steamId', obj.steamId, 'string', null));
    errors.push(vu.validateType('playerId', obj.playerId, 'string', null));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidServerInfo(object: unknown): object is ServerInfo {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as ServerInfo;

    const interfaceName = 'ServerInfo';
    const validKeys = [
        'name',
        'desc',
        'img',
        'logo',
        'url',
        'ip',
        'port',
        'messageId',
        'pairedDate',
        'connect',
        'noteMap',
        'battlemetricsId',
        'smartSwitchMap',
        'smartAlarmMap',
        'storageMonitorMap',
        'smartSwitchGroupMap',
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('desc', obj.desc, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('logo', obj.logo, 'string'));
    errors.push(vu.validateType('url', obj.url, 'string'));
    errors.push(vu.validateType('ip', obj.ip, 'string'));
    errors.push(vu.validateType('port', obj.port, 'string'));
    errors.push(vu.validateType('messageId', obj.messageId, 'string', null));
    errors.push(vu.validateType('pairedDate', obj.pairedDate, 'number'));
    errors.push(vu.validateType('connect', obj.connect, 'string', null));
    errors.push(vu.validateObjectOfTypes('noteMap', obj.noteMap, 'string'));
    errors.push(vu.validateType('battlemetricsId', obj.battlemetricsId, 'string', null));
    errors.push(vu.validateObjectOfInterfaces('smartSwitchMap', obj.smartSwitchMap, isValidSmartSwitch));
    errors.push(vu.validateObjectOfInterfaces('smartAlarmMap', obj.smartAlarmMap, isValidSmartAlarm));
    errors.push(vu.validateObjectOfInterfaces('storageMonitorMap', obj.storageMonitorMap, isValidStorageMonitor));
    errors.push(vu.validateObjectOfInterfaces('smartSwitchGroupMap', obj.smartSwitchGroupMap,
        isValidSmartSwitchGroup));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidSmartSwitch(object: unknown): object is SmartSwitch {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as SmartSwitch;

    const interfaceName = 'SmartSwitch';
    const validKeys = [
        'entityId',
        'messageId',
        'pairedDate',
        'name',
        'command',
        'img',
        'autoSetting',
        'proximitySetting'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('entityId', obj.entityId, 'string'));
    errors.push(vu.validateType('messageId', obj.messageId, 'string', null));
    errors.push(vu.validateType('pairedDate', obj.pairedDate, 'number'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('command', obj.command, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateInterface('autoSetting', obj.autoSetting, isValidSmartSwitchAutoSetting));
    errors.push(vu.validateType('proximitySetting', obj.proximitySetting, 'number'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidSmartSwitchAutoSetting(value: unknown): value is SmartSwitchAutoSetting {
    return typeof value === 'number' && Object.values(SmartSwitchAutoSetting).includes(value);
}

export function isValidSmartAlarm(object: unknown): object is SmartAlarm {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as SmartAlarm;

    const interfaceName = 'SmartAlarm';
    const validKeys = [
        'entityId',
        'messageId',
        'pairedDate',
        'name',
        'command',
        'img',
        'everyone',
        'lastTrigger',
        'message'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('entityId', obj.entityId, 'string'));
    errors.push(vu.validateType('messageId', obj.messageId, 'string', null));
    errors.push(vu.validateType('pairedDate', obj.pairedDate, 'number'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('command', obj.command, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('everyone', obj.everyone, 'boolean'));
    errors.push(vu.validateType('lastTrigger', obj.lastTrigger, 'string', null));
    errors.push(vu.validateType('message', obj.message, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidStorageMonitor(object: unknown): object is StorageMonitor {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as StorageMonitor;

    const interfaceName = 'StorageMonitor';
    const validKeys = [
        'entityId',
        'messageId',
        'pairedDate',
        'name',
        'img',
        'everyone',
        'inGame',
        'type'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('entityId', obj.entityId, 'string'));
    errors.push(vu.validateType('messageId', obj.messageId, 'string', null));
    errors.push(vu.validateType('pairedDate', obj.pairedDate, 'number'));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('img', obj.img, 'string'));
    errors.push(vu.validateType('everyone', obj.everyone, 'boolean'));
    errors.push(vu.validateType('inGame', obj.inGame, 'boolean'));
    errors.push(vu.validateInterface('type', obj.type, isValidStorageMonitorType));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}

export function isValidStorageMonitorType(value: unknown): value is StorageMonitorType {
    return typeof value === 'number' && Object.values(StorageMonitorType).includes(value);
}

export function isValidSmartSwitchGroup(object: unknown): object is SmartSwitchGroup {
    if (typeof object !== 'object' || object === null || Array.isArray(object)) {
        return false;
    }

    const obj = object as SmartSwitchGroup;

    const interfaceName = 'SmartSwitchGroup';
    const validKeys = [
        'messageId',
        'name',
        'command',
        'image',
        'smartSwitches'
    ];

    const errors: (vu.ValidationError | null)[] = [];
    errors.push(vu.validateType('messageId', obj.messageId, 'string', null));
    errors.push(vu.validateType('name', obj.name, 'string'));
    errors.push(vu.validateType('command', obj.command, 'string'));
    errors.push(vu.validateType('image', obj.image, 'string'));
    errors.push(vu.validateArrayOfTypes('smartSwitches', obj.smartSwitches, 'string'));

    const filteredErrors = errors.filter((error): error is vu.ValidationError => error !== null);

    const objectKeys = Object.keys(object);
    const missingKeys = validKeys.filter(key => !objectKeys.includes(key));
    const unknownKeys = objectKeys.filter(key => !validKeys.includes(key));
    const hasAllRequiredKeys = missingKeys.length === 0;
    const hasOnlyValidKeys = unknownKeys.length === 0;

    vu.logValidations(interfaceName, filteredErrors, missingKeys, unknownKeys);

    return filteredErrors.length === 0 && hasAllRequiredKeys && hasOnlyValidKeys;
}