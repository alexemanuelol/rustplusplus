/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

const ROOT_DIR = path.join(__dirname, '..', '..');

export interface GuildInstance {
    activeServer: string | null;
    blacklist: Blacklist;
    channelIds: ChannelIds;
    commandAliases: CommandAlias[];
    firstTime: boolean;
    generalSettings: GeneralSettings;
    informationChannelMessageIds: InformationChannelMessageIds;
    marketSubscriptionList: MarketSubscriptionList;
    notificationSettings: NotificationSettings;
    roleId: string | null; // TODO! Change to list of roleIds
    serverList: { [serverId: string]: ServerInfo };
    serverListLite: { [serverId: string]: ServerInfoLite };
    teamChatColors: TeamChatColors;
    trackers: { [trackerId: string]: Tracker };
}

export interface Blacklist {
    discordIds: string[];
    steamIds: string[];
}

export interface ChannelIds {
    activity: string | null;
    alarms: string | null;
    category: string | null;
    commands: string | null;
    events: string | null;
    information: string | null;
    servers: string | null;
    settings: string | null;
    storageMonitors: string | null;
    switchGroups: string | null;
    switches: string | null;
    teamchat: string | null;
    trackers: string | null;
}

export interface CommandAlias {
    alias: string;
    index: number;
    value: string;
}

export interface GeneralSettings {
    [key: string]: boolean | number | string; /* Add an index signature */
    afkNotify: boolean;
    battlemetricsGlobalLogin: boolean;
    battlemetricsGlobalLogout: boolean;
    battlemetricsGlobalNameChanges: boolean;
    battlemetricsServerNameChanges: boolean;
    battlemetricsTrackerNameChanges: boolean;
    commandDelay: number;
    connectionNotify: boolean;
    deathNotify: boolean;
    displayInformationBattlemetricsAllOnlinePlayers: boolean;
    fcmAlarmNotificationEnabled: boolean;
    fcmAlarmNotificationEveryone: boolean;
    inGameCommandsEnabled: boolean;
    itemAvailableInVendingMachineNotifyInGame: boolean;
    language: string;
    leaderCommandEnabled: boolean;
    leaderCommandOnlyForPaired: boolean;
    mapWipeNotifyEveryone: boolean;
    muteInGameBotMessages: boolean;
    prefix: string;
    smartAlarmNotifyInGame: boolean;
    smartSwitchNotifyInGameWhenChangedFromDiscord: boolean;
    trademark: string;
    voiceGender: string;
}

export interface InformationChannelMessageIds {
    battlemetricsPlayers: string | null;
    event: string | null;
    map: string | null;
    server: string | null;
    team: string | null;
}

export interface MarketSubscriptionList {
    all: string[];
    buy: string[];
    sell: string[];
}

export interface NotificationSettings {
    [setting: string]: {
        [key: string]: boolean | string; /* Add an index signature */
        discord: boolean;
        image: string;
        inGame: boolean;
        voice: boolean;
    };
}

export interface ServerInfo {
    alarms: { [id: string]: SmartAlarm }; // TODO! Change to smartAlarms
    appPort: string;
    battlemetricsId: string | null;
    cargoShipEgressTimeMs: number;
    connect: string | null;
    description: string;
    image: string;
    markers: { [markerName: string]: Marker };
    messageId: string | null;
    notes: { [index: string]: string };
    oilRigLockedCrateUnlockTimeMs: number;
    playerToken: string;
    serverIp: string;
    steamId: string;
    storageMonitors: { [id: string]: StorageMonitor };
    switchGroups: { [groupId: string]: SmartSwitchGroup }; // TODO! Change to smartSwitchGroups
    switches: { [id: string]: SmartSwitch }; // TODO! Change to smartSwitches
    timeTillDay: { [inGameTime: string]: number };
    timeTillNight: { [inGameTime: string]: number };
    title: string;
    url: string;
}

export interface SmartAlarm {
    active: boolean;
    command: string;
    everyone: boolean;
    id: string;
    image: string;
    lastTrigger: number | null;
    location: string | null;
    message: string;
    messageId: string | null;
    name: string;
    reachable: boolean;
    server: string; // TODO! Change to serverName
    x: number | null;
    y: number | null;
}

export interface Marker {
    location: string;
    x: number;
    y: number;
}

export interface StorageMonitor {
    decaying: boolean;
    everyone: boolean;
    id: string;
    image: string;
    inGame: boolean;
    location: string | null;
    messageId: string | null;
    name: string;
    reachable: boolean;
    server: string; // TODO! Change to serverName
    type: string | null;
    upkeep: number | null;
    x: number | null;
    y: number | null;
}

export interface SmartSwitchGroup {
    command: string;
    image: string;
    messageId: string | null;
    name: string;
    switches: string[];
}

export interface SmartSwitch {
    active: boolean;
    autoDayNightOnOff: number; // TODO! Change name of this. Maybe autoConfig?
    command: string;
    id: string;
    image: string;
    location: string | null;
    messageId: string | null;
    name: string;
    proximity: number;
    reachable: boolean;
    server: string; // TODO! Change to serverName
    x: number | null;
    y: number | null;
}

export interface ServerInfoLite {
    [steamId: string]: {
        serverIp: string;
        appPort: string;
        steamId: string;
        playerToken: string;
    };
}

export interface TeamChatColors {
    [steamId: string]: string;
}

export interface Tracker {
    name: string;
    serverId: string;
    battlemetricsId: string;
    title: string;
    image: string;
    clanTag: string;
    everyone: boolean;
    inGame: boolean;
    players: TrackerPlayer[];
    messageId: string | null;
}

export interface TrackerPlayer {
    name: string;
    steamId: string;
    playerId: string | null;
}

function readGeneralSettingsTemplate(): GeneralSettings {
    const templatePath: string = path.join(ROOT_DIR, 'src', 'templates', 'generalSettingsTemplate.json');
    const templateContent: string = fs.readFileSync(templatePath, 'utf8');
    return JSON.parse(templateContent);
}

function readNotificationSettingsTemplate(): NotificationSettings {
    const templatePath: string = path.join(ROOT_DIR, 'src', 'templates', 'notificationSettingsTemplate.json');
    const templateContent: string = fs.readFileSync(templatePath, 'utf8');
    return JSON.parse(templateContent);
}

export function readGuildInstanceFile(guildId: string): GuildInstance {
    const guildInstanceFilePath: string = path.join(ROOT_DIR, 'guildInstances', `${guildId}.json`);
    const guildInstanceFileContent: string = fs.readFileSync(guildInstanceFilePath, 'utf8');
    return JSON.parse(guildInstanceFileContent);
}

export function writeGuildInstanceFile(guildId: string, guildInstance: GuildInstance): void {
    const guildInstanceFilePath: string = path.join(ROOT_DIR, 'guildInstances', `${guildId}.json`);
    const guildInstanceString: string = JSON.stringify(guildInstance, null, 2);
    fs.writeFileSync(guildInstanceFilePath, guildInstanceString);
}

function getNewGuildInstance(): GuildInstance {
    return {
        activeServer: null,
        blacklist: {
            discordIds: [],
            steamIds: []
        },
        channelIds: {
            activity: null,
            alarms: null,
            category: null,
            commands: null,
            events: null,
            information: null,
            servers: null,
            settings: null,
            storageMonitors: null,
            switchGroups: null,
            switches: null,
            teamchat: null,
            trackers: null
        },
        commandAliases: [],
        firstTime: true,
        generalSettings: readGeneralSettingsTemplate(),
        informationChannelMessageIds: {
            battlemetricsPlayers: null,
            event: null,
            map: null,
            server: null,
            team: null
        },
        marketSubscriptionList: {
            all: [],
            buy: [],
            sell: []
        },
        notificationSettings: readNotificationSettingsTemplate(),
        roleId: null,
        serverList: {},
        serverListLite: {},
        teamChatColors: {},
        trackers: {}
    }
}

export function createGuildInstanceFile(guildId: string): void {
    const newGuildInstance: GuildInstance = getNewGuildInstance();

    const guildInstancePath: string = path.join(ROOT_DIR, 'guildInstances', `${guildId}.json`);

    if (fs.existsSync(guildInstancePath)) {
        const oldGuildInstance: GuildInstance = readGuildInstanceFile(guildId);

        /* activeServer */
        if (oldGuildInstance.hasOwnProperty('activeServer')) {
            newGuildInstance.activeServer = oldGuildInstance.activeServer;
        }

        /* blacklist */
        if (oldGuildInstance.hasOwnProperty('blacklist')) {
            if (oldGuildInstance.blacklist.hasOwnProperty('discordIds')) {
                newGuildInstance.blacklist.discordIds = oldGuildInstance.blacklist.discordIds;
            }
            if (oldGuildInstance.blacklist.hasOwnProperty('steamIds')) {
                newGuildInstance.blacklist.steamIds = oldGuildInstance.blacklist.steamIds;
            }
        }

        /* channelIds */
        if (oldGuildInstance.hasOwnProperty('channelIds')) {
            if (oldGuildInstance.channelIds.hasOwnProperty('activity')) {
                newGuildInstance.channelIds.activity = oldGuildInstance.channelIds.activity;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('alarms')) {
                newGuildInstance.channelIds.alarms = oldGuildInstance.channelIds.alarms;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('category')) {
                newGuildInstance.channelIds.category = oldGuildInstance.channelIds.category;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('commands')) {
                newGuildInstance.channelIds.commands = oldGuildInstance.channelIds.commands;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('events')) {
                newGuildInstance.channelIds.events = oldGuildInstance.channelIds.events;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('information')) {
                newGuildInstance.channelIds.information = oldGuildInstance.channelIds.information;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('servers')) {
                newGuildInstance.channelIds.servers = oldGuildInstance.channelIds.servers;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('settings')) {
                newGuildInstance.channelIds.settings = oldGuildInstance.channelIds.settings;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('storageMonitors')) {
                newGuildInstance.channelIds.storageMonitors = oldGuildInstance.channelIds.storageMonitors;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('switchGroups')) {
                newGuildInstance.channelIds.switchGroups = oldGuildInstance.channelIds.switchGroups;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('switches')) {
                newGuildInstance.channelIds.switches = oldGuildInstance.channelIds.switches;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('teamchat')) {
                newGuildInstance.channelIds.teamchat = oldGuildInstance.channelIds.teamchat;
            }
            if (oldGuildInstance.channelIds.hasOwnProperty('trackers')) {
                newGuildInstance.channelIds.trackers = oldGuildInstance.channelIds.trackers;
            }
        }

        /* commandAliases */
        if (oldGuildInstance.hasOwnProperty('commandAliases')) {
            newGuildInstance.commandAliases = oldGuildInstance.commandAliases;
        }

        /* firstTime */
        if (oldGuildInstance.hasOwnProperty('firstTime')) {
            newGuildInstance.firstTime = oldGuildInstance.firstTime;
        }

        /* generalSettings */
        if (oldGuildInstance.hasOwnProperty('generalSettings')) {
            for (const key in newGuildInstance.generalSettings) {
                if (oldGuildInstance.generalSettings.hasOwnProperty(key)) {
                    newGuildInstance.generalSettings[key] = oldGuildInstance.generalSettings[key];
                }
            }
        }

        /* informationChannelMessageIds */
        if (oldGuildInstance.hasOwnProperty('informationChannelMessageIds')) {
            if (oldGuildInstance.informationChannelMessageIds.hasOwnProperty('battlemetricsPlayers')) {
                newGuildInstance.informationChannelMessageIds.battlemetricsPlayers =
                    oldGuildInstance.informationChannelMessageIds.battlemetricsPlayers;
            }
            if (oldGuildInstance.informationChannelMessageIds.hasOwnProperty('event')) {
                newGuildInstance.informationChannelMessageIds.event =
                    oldGuildInstance.informationChannelMessageIds.event;
            }
            if (oldGuildInstance.informationChannelMessageIds.hasOwnProperty('map')) {
                newGuildInstance.informationChannelMessageIds.map =
                    oldGuildInstance.informationChannelMessageIds.map;
            }
            if (oldGuildInstance.informationChannelMessageIds.hasOwnProperty('server')) {
                newGuildInstance.informationChannelMessageIds.server =
                    oldGuildInstance.informationChannelMessageIds.server;
            }
            if (oldGuildInstance.informationChannelMessageIds.hasOwnProperty('team')) {
                newGuildInstance.informationChannelMessageIds.team =
                    oldGuildInstance.informationChannelMessageIds.team;
            }
        }

        /* marketSubscriptionList */
        if (oldGuildInstance.hasOwnProperty('marketSubscriptionList')) {
            if (oldGuildInstance.marketSubscriptionList.hasOwnProperty('all')) {
                newGuildInstance.marketSubscriptionList.all = oldGuildInstance.marketSubscriptionList.all;
            }
            if (oldGuildInstance.marketSubscriptionList.hasOwnProperty('buy')) {
                newGuildInstance.marketSubscriptionList.buy = oldGuildInstance.marketSubscriptionList.buy;
            }
            if (oldGuildInstance.marketSubscriptionList.hasOwnProperty('sell')) {
                newGuildInstance.marketSubscriptionList.sell = oldGuildInstance.marketSubscriptionList.sell;
            }
        }

        /* notificationSettings */
        if (oldGuildInstance.hasOwnProperty('notificationSettings')) {
            for (const setting in newGuildInstance.notificationSettings) {
                if (oldGuildInstance.notificationSettings.hasOwnProperty(setting)) {
                    for (const key in newGuildInstance.notificationSettings[setting]) {
                        if (oldGuildInstance.notificationSettings[setting].hasOwnProperty(key)) {
                            newGuildInstance.notificationSettings[setting][key] =
                                oldGuildInstance.notificationSettings[setting][key];
                        }
                    }
                }
            }
        }

        /* roleId */
        if (oldGuildInstance.hasOwnProperty('roleId')) {
            newGuildInstance.roleId = oldGuildInstance.roleId;
        }

        /* serverList */
        if (oldGuildInstance.hasOwnProperty('serverList')) {
            newGuildInstance.serverList = oldGuildInstance.serverList;
        }

        /* serverListLite */
        if (oldGuildInstance.hasOwnProperty('serverListLite')) {
            newGuildInstance.serverListLite = oldGuildInstance.serverListLite;
        }

        /* teamChatColors */
        if (oldGuildInstance.hasOwnProperty('teamChatColors')) {
            newGuildInstance.teamChatColors = oldGuildInstance.teamChatColors;
        }

        /* trackers */
        if (oldGuildInstance.hasOwnProperty('trackers')) {
            newGuildInstance.trackers = oldGuildInstance.trackers;
        }
    }

    writeGuildInstanceFile(guildId, newGuildInstance);
}