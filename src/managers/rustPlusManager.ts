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

import * as discordjs from 'discord.js';
import * as rp from 'rustplus-ts';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import { Logger } from 'winston';

import { log, discordManager as dm, guildInstanceManager as gim, config, localeManager as lm } from '../../index';
import * as constants from '../utils/constants';
import * as types from '../utils/types';
import {
    getServerId, getIpAndPort, GuildInstance, EventNotificationSettings, ServerInfo
} from './guildInstanceManager';
import { sendServerMessage } from '../discordUtils/discordMessages';
import * as rpTeamInfoHandler from '../handlers/rustPlusTeamInfoHandler';
import * as rpInfoHandler from '../handlers/rustPlusInfoHandler';
import * as rpTimeHandler from '../handlers/rustPlusTimeHandler';
import { RustPlusInfo } from '../structures/rustPlusInfo';
import { RustPlusTime } from '../structures/rustPlusTime';
import { RustPlusMap } from '../structures/rustPlusMap';
import { RustPlusMapMarkers } from '../structures/rustPlusMapMarkers';
import { RustPlusTeamInfo } from '../structures/rustPlusTeamInfo';
import * as discordMessages from '../discordUtils/discordMessages';
import * as discordVoice from '../discordUtils/discordVoice';
import * as Timer from '../utils/timer';
import * as informationChannelHandler from '../handlers/informationChannelHandler';
import { getPos, getPosString } from '../utils/map';
import { DockingStatus } from '../structures/rustPlusMapMarkers';


export type RustPlusInstanceMap = { [guildId: types.GuildId]: RustPlusServerMap };
export type RustPlusServerMap = { [serverId: types.ServerId]: RustPlusInstance };

export enum ConnectionStatus {
    Disconnected = 0,
    Connecting = 1,
    Connected = 2,
    Reconnecting = 3
}

export interface RustPlusConnectionMetaData {
    time: string;
    str: string;
}

export interface RustPlusDeathMetaData {
    time: string;
    name: string;
    location: string | null;
}

export interface TimersMetaData {
    index: number;
    timer: Timer.Timer;
    message: string;
}

export class RustPlusManager {
    private rustPlusInstanceMap: RustPlusInstanceMap;

    constructor() {
        this.rustPlusInstanceMap = {};
    }

    public hasInstance(guildId: types.GuildId, serverId: types.ServerId): boolean {
        if (Object.hasOwn(this.rustPlusInstanceMap, guildId) &&
            Object.hasOwn(this.rustPlusInstanceMap[guildId], serverId)) {
            return true;
        }

        return false;
    }

    public addInstance(guildId: types.GuildId, serverId: types.ServerId): boolean {
        const ipAndPort = getIpAndPort(serverId);

        if (!Object.hasOwn(this.rustPlusInstanceMap, guildId)) {
            this.rustPlusInstanceMap[guildId] = {};
        }

        if (Object.hasOwn(this.rustPlusInstanceMap, serverId)) {
            log.warn(`Instance already exist.`, { guildId: guildId, serverId: serverId });
            return false;
        }

        this.rustPlusInstanceMap[guildId][serverId] = new RustPlusInstance(guildId, ipAndPort.ip, ipAndPort.port);
        return true;
    }

    public removeInstance(guildId: types.GuildId, serverId: types.ServerId): boolean {
        if (!this.hasInstance(guildId, serverId)) {
            log.warn(`Instance does not exist.`, { guildId: guildId, serverId: serverId });
            return false;
        }

        this.rustPlusInstanceMap[guildId][serverId].shutdown();
        delete this.rustPlusInstanceMap[guildId][serverId];
        return true;
    }

    public getInstance(guildId: types.GuildId, serverId: types.ServerId): RustPlusInstance | null {
        return this.rustPlusInstanceMap[guildId]?.[serverId] ?? null;
    }
}

// TODO! Each rustplus instance have one main rpInstance and a main playerid/token
// - variable "available playerId/tokens to use for requests"
// - Save who made the last request
// - If teamChanged and player that made last request is not in same team and main playerid/token, then
//   the main playerid/token should regain last request status and update "available playerid/tokens"
// -
export class RustPlusInstance {
    private lg: winston.Logger;
    public guildId: types.GuildId;
    public ip: string;
    public port: string;
    public serverId: types.ServerId;
    public serverName: string;

    public rustPlus: rp.RustPlus;
    public connectionStatus: ConnectionStatus;
    public reconnectTimeoutId: NodeJS.Timeout | undefined;
    public reconnectTimeoutSeconds: number;

    public serverPollingHandlerIntervalId: NodeJS.Timeout | undefined;
    public serverPollingHandlerIntervalSeconds: number;
    public lastServerPollSuccessful: boolean;
    public lastServerPollSuccessfulTimestampSeconds: types.Timestamp | null;

    public inGameTeamChatQueue: string[];
    public inGameTeamChatTimeoutId: NodeJS.Timeout | undefined;
    public inGameTeamChatMessagesSentByBot: string[];

    private commandNames: string[];

    public rpInfo: RustPlusInfo | null;
    public rpTime: RustPlusTime | null;
    public rpMap: RustPlusMap | null;
    public rpTeamInfo: RustPlusTeamInfo | null;
    public rpMapMarkers: RustPlusMapMarkers | null;

    public allConnections: RustPlusConnectionMetaData[];
    public playerConnections: { [steamId: types.SteamId]: RustPlusConnectionMetaData[] };
    public allDeaths: RustPlusDeathMetaData[];
    public playerDeaths: { [steamId: types.SteamId]: RustPlusDeathMetaData[] };

    public timers: { [index: number]: TimersMetaData };
    public informationChannelCounter: number;

    constructor(guildId: types.GuildId, ip: string, port: string) {
        this.guildId = guildId;
        this.ip = ip;
        this.port = port;
        this.serverId = getServerId(ip, port);

        this.lg = log.child({ guildId: guildId, serverId: this.serverId });

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        this.serverName = gInstance.serverInfoMap[this.serverId].name;

        this.rustPlus = new rp.RustPlus(ip, port, false, log);
        this.connectionStatus = ConnectionStatus.Disconnected;
        this.reconnectTimeoutId = undefined;
        this.reconnectTimeoutSeconds = constants.DEFAULT_RECONNECT_TIMEOUT_SECONDS;

        this.serverPollingHandlerIntervalId = undefined;
        this.serverPollingHandlerIntervalSeconds = config.general.serverPollingHandlerIntervalMs / 1000;
        this.lastServerPollSuccessful = false;
        this.lastServerPollSuccessfulTimestampSeconds = null;

        this.inGameTeamChatQueue = [];
        this.inGameTeamChatTimeoutId = undefined;
        this.inGameTeamChatMessagesSentByBot = [];

        this.commandNames = this.getCommandNames();

        /* Latest request responses. */
        this.rpInfo = null;
        this.rpTime = null;
        this.rpMap = null;
        this.rpTeamInfo = null;
        this.rpMapMarkers = null;

        this.allConnections = [];
        this.playerConnections = {};
        this.allDeaths = [];
        this.playerDeaths = {};

        this.timers = {};
        this.informationChannelCounter = 0;

        //this.leaderSteamId = '0'; /* 0 When there is no leader. */
    }

    private getCommandNames(): string[] {
        return fs.readdirSync(path.join(__dirname, '..', 'prefixCommands'))
            .filter(file => file.endsWith('.ts'))
            .map(file => file.replace(/\.ts$/, ''));
    }

    public async startup() {
        await this.loadRustPlusEvents();
        await this.rustPlus.connect();

        /* Wait for 'connected' event before updating server embed. */
    }

    public async shutdown() {
        this.rustPlus.removeAllListeners();
        await this.rustPlus.disconnect();
        this.clearAllData();
    }

    public async scheduleReconnect() {
        this.rustPlus.removeAllListeners();
        await this.rustPlus.disconnect();

        if (this.connectionStatus !== ConnectionStatus.Reconnecting) {
            this.connectionStatus = ConnectionStatus.Reconnecting;
            await sendServerMessage(dm, this.guildId, this.serverId, this.connectionStatus);
            this.clearAllData();
            this.reconnectTimeoutSeconds = constants.DEFAULT_RECONNECT_TIMEOUT_SECONDS;
        }
        else {
            this.reconnectTimeoutSeconds = Math.min(this.reconnectTimeoutSeconds * 2,
                constants.MAX_RECONNECT_TIMEOUT_SECONDS);
        }

        this.lg.info(`Reconnecting in ${this.reconnectTimeoutSeconds} seconds.`);

        this.startReconnectionTimer();
    }

    private async loadRustPlusEvents() {
        const rustPlusEventFilesPath = path.join(__dirname, '..', 'rustPlusEvents');
        const rustPlusEventFiles = fs.readdirSync(rustPlusEventFilesPath).filter(file => file.endsWith('.ts'));

        for (const file of rustPlusEventFiles) {
            const filePath = path.join(rustPlusEventFilesPath, file);
            const { name, execute } = await import(filePath)

            this.rustPlus.on(name, (...args: unknown[]) => execute(this, ...args));
        }
    }

    private clearAllData() {
        this.stopReconnectionTimer();
        this.stopServerPollingHandler();

        this.inGameTeamChatQueue = [];
        clearTimeout(this.inGameTeamChatTimeoutId);
        this.inGameTeamChatTimeoutId = undefined;
        this.inGameTeamChatMessagesSentByBot = [];

        this.rpInfo = null;
        this.rpTime = null;
        this.rpMap = null;
        this.rpTeamInfo = null;
        this.rpMapMarkers = null;

        // TODO! Remove timers example: pollingTimer, inGameChatTimeout, customTimers like lockedCrate,
        // cargoship leave etc...

        for (const timer of Object.values(this.timers)) {
            timer.timer.stop();
        }
        this.timers = {};
    }

    public startReconnectionTimer() {
        if (this.reconnectTimeoutId !== undefined) {
            this.stopReconnectionTimer();
        }

        this.lg.info(`Start Reconnection Timer.`);

        this.reconnectTimeoutId = setTimeout(() => {
            this.startup();
        }, this.reconnectTimeoutSeconds * 1000);
    }

    public stopReconnectionTimer() {
        this.lg.info(`Stop Reconnection Timer.`);

        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = undefined;
    }

    public startServerPollingHandler() {
        if (this.serverPollingHandlerIntervalId !== undefined) {
            this.stopServerPollingHandler();
        }

        this.lg.info(`Start Server Polling Handler.`);

        this.serverPolling(true);
        this.serverPollingHandlerIntervalId = setInterval(() => {
            this.serverPolling();
        }, this.serverPollingHandlerIntervalSeconds * 1000);
    }

    public stopServerPollingHandler() {
        this.lg.info(`Stop Server Polling Handler.`);

        clearInterval(this.serverPollingHandlerIntervalId);
        this.serverPollingHandlerIntervalId = undefined;
    }

    private async serverPolling(firstPoll: boolean = false) {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.serverId];
        const requesterSteamId = server.requesterSteamId;
        if (requesterSteamId === null) return;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;
        if (!pairingData) {
            this.lastServerPollSuccessful = false;
            this.lg.warn(`pairingData for ${requesterSteamId} could not be found.`);
            return;
        }

        const rpInfo = await this.rustPlus.getInfoAsync(pairingData.steamId, pairingData.playerToken);
        if (!this.validateServerPollResponse(rpInfo, 'info', rp.isValidAppInfo)) return;
        const rpTime = await this.rustPlus.getTimeAsync(pairingData.steamId, pairingData.playerToken);
        if (!this.validateServerPollResponse(rpTime, 'time', rp.isValidAppTime)) return;
        const rpTeamInfo = await this.rustPlus.getTeamInfoAsync(pairingData.steamId, pairingData.playerToken);
        if (!this.validateServerPollResponse(rpTeamInfo, 'teamInfo', rp.isValidAppTeamInfo)) return;
        const rpMapMarkers = await this.rustPlus.getMapMarkersAsync(pairingData.steamId, pairingData.playerToken);
        if (!this.validateServerPollResponse(rpMapMarkers, 'mapMarkers', rp.isValidAppMapMarkers)) return;

        // if last false and not true, update embed
        this.lastServerPollSuccessful = true;
        this.lastServerPollSuccessfulTimestampSeconds = Math.floor(Date.now() / 1000);

        /**
         * If reached this, then all rustplus requests was successful.
         * Continue with updating structures
         */

        const info = ((rpInfo as rp.AppResponse).info as rp.AppInfo);
        const time = ((rpTime as rp.AppResponse).time as rp.AppTime);
        const mapMarkers = ((rpMapMarkers as rp.AppResponse).mapMarkers as rp.AppMapMarkers);
        const teamInfo = ((rpTeamInfo as rp.AppResponse).teamInfo as rp.AppTeamInfo);

        if (firstPoll || this.rpInfo === null || this.rpTime === null) {
            console.log('FIRST POLL')
            this.rpInfo = new RustPlusInfo(this, info);
            this.rpTime = new RustPlusTime(this, time);
            this.rpMapMarkers = new RustPlusMapMarkers(this, mapMarkers);
            this.rpTeamInfo = new RustPlusTeamInfo(this, teamInfo);
        }
        else {
            console.log('POLL')
        }

        // TODO! teamHandler
        await rpTeamInfoHandler.handler(this, teamInfo);
        (this.rpTeamInfo as RustPlusTeamInfo).updateTeamInfo(teamInfo);
        // TODO! update rpTeamInfo

        // TODO! smartSwitchHandler

        // TODO! timeHandler
        await rpInfoHandler.handler(this, info);
        await rpTimeHandler.handler(this, time);

        (this.rpInfo as RustPlusInfo).updateInfo(info);
        (this.rpTime as RustPlusTime).updateTime(time);
        (this.rpMapMarkers as RustPlusMapMarkers).updateMapMarkers(mapMarkers);
        (this.rpTeamInfo as RustPlusTeamInfo).updateTeamInfo(teamInfo);

        // TODO! smartAlarmHandler
        // TODO! storageMonitorHandler

        // TODO! informationChannelHandler
        await informationChannelHandler.handler(this);
    }

    public inGameTeamChatQueueMessage(message: string | string[]) {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const inGameChatMessageDelayMs = gInstance.generalSettings.inGameChatMessageDelay * 1000;
        const trademark = gInstance.generalSettings.inGameChatTrademark;
        const trademarkString = trademark === '' ? '' : `${trademark} | `;
        const messageMaxLength = constants.MAX_LENGTH_TEAM_MESSAGE - trademarkString.length;

        if (!gInstance.generalSettings.inGameChatBotUnmuted ||
            !gInstance.generalSettings.inGameChatFunctionalityEnabled) return;

        const messages = Array.isArray(message) ? message : [message];
        for (const msg of messages) {
            const strings = msg.match(new RegExp(`.{1,${messageMaxLength}}(\\s|$)`, 'g')) as string[];

            for (const str of strings) {
                this.inGameTeamChatQueue.push(`${trademarkString}${str}`);
            }
        }

        if (this.inGameTeamChatTimeoutId === undefined) {
            this.inGameTeamChatTimeoutId = setTimeout(this.inGameTeamChatMessageQueueHandler.bind(this),
                inGameChatMessageDelayMs);
        }
    }

    private inGameTeamChatMessageQueueHandler() {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.serverId];
        const requesterSteamId = server.requesterSteamId;

        clearTimeout(this.inGameTeamChatTimeoutId);
        this.inGameTeamChatTimeoutId = undefined;

        if (this.inGameTeamChatQueue.length === 0) return;

        const message = this.inGameTeamChatQueue[0];
        this.inGameTeamChatQueue = this.inGameTeamChatQueue.slice(1);

        if (requesterSteamId === null) return;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;
        if (!pairingData) {
            this.lg.warn(`pairingData for ${requesterSteamId} could not be found.`);
            return;
        }

        this.inGameTeamChatAddMessageToSentByBot(message);
        this.rustPlus.sendTeamMessageAsync(pairingData.steamId, pairingData.playerToken, message);
        this.lg.info(`Message sent in-game: '${message}'.`);

        this.inGameTeamChatResetMessageQueueTimeout();
    }

    public inGameTeamChatResetMessageQueueTimeout() {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const inGameChatMessageDelayMs = gInstance.generalSettings.inGameChatMessageDelay * 1000;

        clearTimeout(this.inGameTeamChatTimeoutId);
        this.inGameTeamChatTimeoutId = undefined;
        if (this.inGameTeamChatQueue.length !== 0) {
            this.inGameTeamChatTimeoutId = setTimeout(this.inGameTeamChatMessageQueueHandler.bind(this),
                inGameChatMessageDelayMs);
        }
    }

    public inGameTeamChatAddMessageToSentByBot(message: string) {
        if (this.inGameTeamChatMessagesSentByBot.length === constants.BOT_MESSAGE_HISTORY_LIMIT) {
            this.inGameTeamChatMessagesSentByBot.pop();
        }
        this.inGameTeamChatMessagesSentByBot.unshift(message);
    }

    public async prefixCommandHandler(message: rp.AppTeamMessage | discordjs.Message, inGame: boolean):
        Promise<boolean> {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;
        const commandPrefix = gInstance.generalSettings.inGameChatCommandPrefix;

        const messageString = inGame ? (message as rp.AppTeamMessage).message :
            (message as discordjs.Message).cleanContent;

        const match = messageString.match(/^\S+\s?/);
        const baseCommandStartRaw = match ? match[0] : null;
        if (!baseCommandStartRaw || !baseCommandStartRaw.startsWith(`${commandPrefix}`)) return false;
        const baseCommandNameRaw = baseCommandStartRaw.slice(commandPrefix.length).trim();

        let aliasResolvedCommandName = baseCommandNameRaw;
        for (const alias of gInstance.aliases) {
            if (aliasResolvedCommandName === alias.alias) {
                aliasResolvedCommandName = alias.value;
                break;
            }
        }

        let command = this.commandNames.find(command => aliasResolvedCommandName === `${command}`);
        if (!command) {
            const commandNamesCurrentLocale = Object.fromEntries(
                this.commandNames.map(commandName => {
                    return [lm.getIntl(language, `prefixCommand-${commandName}`), commandName];
                })
            );

            if (!(aliasResolvedCommandName in commandNamesCurrentLocale)) return false;

            command = commandNamesCurrentLocale[aliasResolvedCommandName];
        }

        const commandPath = path.join(__dirname, '..', 'prefixCommands', `${command}.ts`);
        const commandModule = await import(commandPath);

        const args = messageString.slice(baseCommandStartRaw.length).trim().split(/\s+/).filter(Boolean);

        return await commandModule.execute(this, args, message);
    }

    public sendPrefixCommandResponse(response: string | string[], inGame: boolean) {
        if (inGame) {
            this.inGameTeamChatQueueMessage(response);
        }
        else {
            const formattedResponse = Array.isArray(response) ? response.join('\n') : response;
            discordMessages.sendPrefixCommandResponseMessage(dm, this.guildId, formattedResponse);
        }
    }

    public async validateServerPollResponse(response: rp.AppResponse | Error | rp.ConsumeTokensError,
        responseParam: keyof rp.AppResponse, validationCallback: (input: unknown, logger: Logger | null) => boolean):
        Promise<boolean> {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const requesterSteamId = gInstance.serverInfoMap[this.serverId].requesterSteamId;

        if (requesterSteamId === null) return false;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;

        if (rp.isValidAppResponse(response, log)) {
            if (!validationCallback(response[responseParam], log)) {
                if (rp.isValidAppError(response.error, log)) {
                    this.lg.warn(`AppError: ${response.error.error}`);
                    if (this.rustPlus.getAppResponseError(response) === rp.AppResponseError.NotFound) {
                        /* pairingData is no longer valid. */
                        if (pairingData && pairingData.valid) {
                            this.lg.warn(`PairingData no longer valid for ${requesterSteamId}.`);
                            pairingData.valid = false;
                            gim.updateGuildInstance(this.guildId);
                            await sendServerMessage(dm, this.guildId, this.serverId, this.connectionStatus);
                        }
                    }
                }
                else {
                    this.lg.error(`We got completely wrong response: ${JSON.stringify(response)}`);
                }

                // TODO! Send message in activity channel saying that the requesters request was not successful.

                this.lastServerPollSuccessful = false;
                return false;
            }
            else {
                if (pairingData && !pairingData.valid) {
                    pairingData.valid = true;
                    gim.updateGuildInstance(this.guildId);
                    await sendServerMessage(dm, this.guildId, this.serverId, this.connectionStatus);
                }
            }
        }
        else {
            /* Error or rp.ConsumeTokensError */
            if (response instanceof Error) {
                this.lg.error(`$Error: ${response.message}`);
            }
            else {
                this.lg.error(`ConsumeTokensError: ${response}`);
            }

            // TODO! Perhaps send the message here too

            this.lastServerPollSuccessful = false;
            return false;
        }

        return true;
    }

    public async validatePairingData() {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        for (const [steamId, pairingData] of Object.entries(gInstance.pairingDataMap[this.serverId])) {
            const rpInfo = await this.rustPlus.getInfoAsync(pairingData.steamId, pairingData.playerToken);
            if (rp.isValidAppResponse(rpInfo, log)) {
                if (!rp.isValidAppInfo(rpInfo.info, log)) {
                    if (rp.isValidAppError(rpInfo.error, log)) {
                        this.lg.warn(`SteamId: ${steamId}, AppError: ${rpInfo.error.error}`);
                        if (this.rustPlus.getAppResponseError(rpInfo) === rp.AppResponseError.NotFound) {
                            this.lg.warn(`PairingData no longer valid for ${steamId}.`);
                            pairingData.valid = false;
                        }
                    }
                    else {
                        this.lg.error(`We got completely wrong response: ${JSON.stringify(rpInfo)}`);
                    }
                }
                else {
                    pairingData.valid = true;
                }
            }
            else {
                /* Error or rp.ConsumeTokensError */
                if (rpInfo instanceof Error) {
                    this.lg.error(`Error: ${rpInfo.message}`);
                }
                else {
                    this.lg.error(`ConsumeTokensError: ${rpInfo}`);
                }
            }
        }
        gim.updateGuildInstance(this.guildId);
    }

    public async setupRequesting() {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.serverId];
        const requesterSteamId = server.requesterSteamId;
        if (requesterSteamId === null) return;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;
        if (!pairingData) return;

        const rpInfo = await this.rustPlus.getInfoAsync(pairingData.steamId, pairingData.playerToken);
        if (!this.validateServerPollResponse(rpInfo, 'info', rp.isValidAppInfo)) return;
        const info = ((rpInfo as rp.AppResponse).info as rp.AppInfo);
        this.rpInfo = new RustPlusInfo(this, info);

        const rpMap = await this.rustPlus.getMapAsync(pairingData.steamId, pairingData.playerToken, true,
            3 * 60 * 1000); /* 3 min timeout */
        if (!this.validateServerPollResponse(rpMap, 'map', rp.isValidAppMap)) {
            // TODO! Server connection invalid message, invalid pairingData?
            return;
        }

        const map = ((rpMap as rp.AppResponse).map as rp.AppMap);

        if (this.rpMap !== null) {
            if (this.rpMap.isJpgImageChanged(map)) {
                // TODO! Notify that the map was wiped
                console.log('MAP WAS WIPED')
            }

            this.rpMap.updateMap(map);
        }
        else {
            this.rpMap = new RustPlusMap(this, map);
        }
        await this.rpMap.writeImage();
        // TODO! Just update map in information channel

        await this.setupSmartDevices();
        this.startServerPollingHandler();
    }

    public async setupSmartDevices() {

        // TODO! Go through all smart devices to get the status of them
        // - Smart Switches, current status
        // - Smart Alarms, current status
        // - Storage Monitors, Type, content inside...
        // - Smart Switch Groups...

        // TODO! Start smart devices handlers
        // - smartSwitchPollingHandler

    }

    public async sendEventNotification(setting: keyof EventNotificationSettings, text: string) {

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const settingData = gInstance.eventNotificationSettings[setting];

        if (settingData.discord) {
            await discordMessages.sendEventNotificationMessage(dm, this.guildId, this.serverId, setting, text);
        }
        if (settingData.inGame) {
            this.inGameTeamChatQueueMessage(text);
        }
        if (settingData.voice) {
            await discordVoice.sendDiscordVoiceMessage(this.guildId, text);
        }

        this.lg.info(`Event Notification: ${text}`);
    }

    public async updateConnections(steamId: types.SteamId, str: string) {
        const time = Timer.getCurrentDateTime();
        const data = {
            time: time,
            str: str
        }

        if (this.allConnections.length === 10) {
            this.allConnections.pop();
        }
        this.allConnections.unshift(data)

        if (!this.playerConnections[steamId]) {
            this.playerConnections[steamId] = [];
        }

        if (this.playerConnections[steamId].length === 10) {
            this.playerConnections[steamId].pop();
        }
        this.playerConnections[steamId].unshift(data);
    }

    public async updateDeaths(steamId: types.SteamId, name: string, location: string | null) {
        const time = Timer.getCurrentDateTime();
        const data = {
            time: time,
            name: name,
            location: location
        }

        if (this.allDeaths.length === 10) {
            this.allDeaths.pop();
        }
        this.allDeaths.unshift(data)

        if (!this.playerDeaths[steamId]) {
            this.playerDeaths[steamId] = [];
        }

        if (this.playerDeaths[steamId].length === 10) {
            this.playerDeaths[steamId].pop();
        }
        this.playerDeaths[steamId].unshift(data);
    }

    /**
     * Information channel server methods
     */

    public getInformationChannelServerPlayersString(): string {
        let str = '\u200B';

        if (this.rpInfo) {
            str = `${this.rpInfo.appInfo.players}`;
            str += this.rpInfo.isQueue() ? `(${this.rpInfo.appInfo.queuedPlayers})` : '';
            str += `/${this.rpInfo.appInfo.maxPlayers}`;
        }

        return str;
    }

    public getInformationChannelServerTimeString(): string {
        let str = '\u200B';

        if (this.rpTime) {
            str = `${Timer.convertDecimalToHoursMinutes(this.rpTime.appTime.time)}`;
        }

        return str;
    }

    public getInformationChannelServerWipeString(): string {
        let str = '\u200B';

        if (this.rpInfo) {
            str = `<t:${this.rpInfo.appInfo.wipeTime}:R>`;
        }

        return str;
    }

    public getInformationChannelServerTimeTillString(): string {
        let str = '\u200B';

        if (this.rpTime) {
            const timeTillData = this.rpTime.getTimeTillSunriseOrSunset();
            const timeTillTimestamp = Math.floor((new Date().getTime() / 1000)) + timeTillData.timeTillSeconds;
            str = `<t:${timeTillTimestamp}:R>`;
        }

        return str;
    }

    public getInformationChannelServerMapSizeString(): string {
        let str = '\u200B';

        if (this.rpInfo) {
            str = `${this.rpInfo.appInfo.mapSize}`;
        }

        return str;
    }

    public getInformationChannelServerMapSeedString(): string {
        let str = '\u200B';

        if (this.rpInfo) {
            str = `${this.rpInfo.appInfo.seed}`;
        }

        return str;
    }

    public getInformationChannelServerMapSaltString(): string {
        let str = '\u200B';

        if (this.rpInfo) {
            str = `${this.rpInfo.appInfo.salt}`;
        }

        return str;
    }

    public getInformationChannelServerMapString(): string {
        let str = '\u200B';

        if (this.rpInfo) {
            str = `${this.rpInfo.appInfo.map}`;
        }

        return str;
    }

    public getInformationChannelServerConnectString(): string {
        let str = '\u200B';

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const serverInfo = gInstance.serverInfoMap[this.serverId];

        if (serverInfo && serverInfo.connect !== null) {
            str = `${serverInfo.connect}`;
        }

        return str;
    }

    /**
     * Information channel event methods
     */

    public getInformationChannelEventCargoShipString(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const strings: string[] = [];
        if (this.rpMapMarkers) {
            if (this.rpMapMarkers.cargoShips.length === 0) {
                if (this.rpMapMarkers.dateCargoShipLeftMap === null) {
                    strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
                }
                else {
                    const timestampSinceLeft = Math.floor(this.rpMapMarkers.dateCargoShipLeftMap.getTime() / 1000);
                    const timeSinceLeft = `<t:${timestampSinceLeft}:R>`;
                    strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLeftTime', {
                        time: timeSinceLeft
                    }));
                }
            }

            for (const cargoShip of this.rpMapMarkers.cargoShips) {
                const metaData = this.rpMapMarkers.cargoShipMetaData[cargoShip.id];
                const pos = getPos(cargoShip.x, cargoShip.y, this);
                const posString = (pos !== null) ? getPosString(pos, this, true, false) :
                    lm.getIntl(language, 'unknown');

                let str: string;
                if (metaData.isLeaving) {
                    str = lm.getIntl(language, 'infoChannelEmbedEventPhraseLeavingAtPos', { pos: posString });
                }
                else if (metaData.dockingStatus !== null && metaData.dockingStatus === DockingStatus.DOCKING) {
                    str = lm.getIntl(language, 'infoChannelEmbedEventPhraseDockingAtPos', { pos: posString });
                }
                else if (metaData.dockingStatus !== null && metaData.dockingStatus === DockingStatus.DOCKED) {
                    str = lm.getIntl(language, 'infoChannelEmbedEventPhraseDockedAtPos', { pos: posString });
                }
                else if (metaData.dockingStatus !== null && metaData.dockingStatus === DockingStatus.UNDOCKING) {
                    str = lm.getIntl(language, 'infoChannelEmbedEventPhraseUndockingAtPos', { pos: posString });
                }
                else {
                    str = lm.getIntl(language, 'infoChannelEmbedEventPhraseLocatedAtPos', { pos: posString });
                }
                str += '\n';

                const timeSinceSpawnSeconds = Math.floor(metaData.spawnTime.getTime() / 1000);
                const timeSinceSpawnString = `<t:${timeSinceSpawnSeconds}:R>`;
                str += ` ${lm.getIntl(language, 'infoChannelEmbedEventPhraseSpawnedTime', {
                    time: timeSinceSpawnString
                })}\n`;

                const numberOfHarborsDocked = `${metaData.harborsDocked.length}`;
                str += ` ${lm.getIntl(language, 'infoChannelEmbedEventPhraseDockedAtXHarbors', {
                    num: numberOfHarborsDocked
                })}\n`;

                const numberOfLockedCratesSpawned = `${metaData.lockedCrateSpawnCounter}`;
                str += ` ${lm.getIntl(language, 'infoChannelEmbedEventPhraseNumLockedCratesSpawned', {
                    num: numberOfLockedCratesSpawned
                })}\n`;

                if (!metaData.isLeaving) {
                    const timer0 = this.rpMapMarkers.cargoShipEgressTimeoutIds[cargoShip.id];
                    const timer1 = this.rpMapMarkers.cargoShipEgressAfterHarbor1TimeoutIds[cargoShip.id];
                    const timer2 = this.rpMapMarkers.cargoShipEgressAfterHarbor2TimeoutIds[cargoShip.id];

                    let timeLeftString0: string = '';
                    let timeLeftString1: string = '';
                    if (timer0 && timer0.running && !timer1 && !timer2) {
                        const timeLeftSeconds = Math.floor(timer0.getTimeLeftMs() / 1000);
                        const timestamp = Math.floor((new Date().getTime() / 1000) + timeLeftSeconds);
                        timeLeftString0 = `<t:${timestamp}:R>`;
                    }
                    else if (timer0 && timer0.running && timer2 && timer2.running) {
                        const timeLeftSeconds0 = Math.floor(timer0.getTimeLeftMs() / 1000);
                        const timestamp0 = Math.floor((new Date().getTime() / 1000) + timeLeftSeconds0);
                        timeLeftString0 = `<t:${timestamp0}:R>`;
                        const timeLeftSeconds1 = Math.floor(timer2.getTimeLeftMs() / 1000);
                        const timestamp1 = Math.floor((new Date().getTime() / 1000) + timeLeftSeconds1);
                        timeLeftString1 = `<t:${timestamp1}:R>`;
                    }
                    else if (timer1 && timer1.running && timer2 && timer2.running) {
                        const timeLeftSeconds0 = Math.floor(timer1.getTimeLeftMs() / 1000);
                        const timestamp0 = Math.floor((new Date().getTime() / 1000) + timeLeftSeconds0);
                        timeLeftString0 = `<t:${timestamp0}:R>`;
                        const timeLeftSeconds1 = Math.floor(timer2.getTimeLeftMs() / 1000);
                        const timestamp1 = Math.floor((new Date().getTime() / 1000) + timeLeftSeconds1);
                        timeLeftString1 = `<t:${timestamp1}:R>`;
                    }
                    else if (timer0 && !timer0.running && timer2 && timer2.running) {
                        const timeLeftSeconds = Math.floor(timer2.getTimeLeftMs() / 1000);
                        const timestamp = Math.floor((new Date().getTime() / 1000) + timeLeftSeconds);
                        timeLeftString0 = `<t:${timestamp}:R>`;
                    }
                    else {
                        /* Do nothing */
                    }

                    if (timeLeftString0 !== '' && timeLeftString1 !== '') {
                        const timeLeftString = lm.getIntl(language, 'infoChannelEmbedEventPhraseLeavingXOrYTime', {
                            time1: timeLeftString0,
                            time2: timeLeftString1
                        });
                        str += `${timeLeftString}\n`;
                    }
                    else if (timeLeftString0 !== '') {
                        const timeLeftString = lm.getIntl(language, 'infoChannelEmbedEventPhraseLeavingTime', {
                            time: timeLeftString0
                        });
                        str += `${timeLeftString}\n`;
                    }
                }

                strings.push(str.trim());
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }

    public getInformationChannelEventPatrolHelicopterString(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        if (!this.rpMapMarkers) {
            return '\u200B';
        }

        const strings: string[] = [];
        if (this.rpMapMarkers.patrolHelicopters.length === 0) {
            const dateDestroyed = this.rpMapMarkers.datePatrolHelicopterDestroyed;
            const dateDespawned = this.rpMapMarkers.datePatrolHelicopterDespawned;
            const destroyedLocation = this.rpMapMarkers.patrolHelicopterLastDestroyedLocation;

            if (dateDestroyed) {
                const unixTimestampDestroyed = Math.floor(dateDestroyed.getTime() / 1000);
                const timeDestroyed = Timer.getDiscordRelativeTime(unixTimestampDestroyed);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseDestroyedTimeAtPos', {
                    time: timeDestroyed,
                    location: destroyedLocation ?? lm.getIntl(language, 'unknown')
                }));
            }

            if (dateDespawned) {
                const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
                const timeDespawned = Timer.getDiscordRelativeTime(unixTimestampDespawned);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLeftTime', {
                    time: timeDespawned
                }));
            }

            if (strings.length === 0) {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
            }
        }

        for (const patrolHelicopter of this.rpMapMarkers.patrolHelicopters) {
            const metaData = this.rpMapMarkers.patrolHelicopterMetaData[patrolHelicopter.id];

            const pos = getPos(patrolHelicopter.x, patrolHelicopter.y, this);
            const posString = (pos !== null) ? getPosString(pos, this, true, false) :
                lm.getIntl(language, 'unknown');

            if (metaData.isLeaving) {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLeavingAtPos', { pos: posString }));
            }
            else {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLocatedAtPos', { pos: posString }));
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }

    public getInformationChannelEventSmallOilRigString(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const serverInfo = gInstance.serverInfoMap[this.serverId] as ServerInfo;
        const language = gInstance.generalSettings.language;

        if (!this.rpMapMarkers) {
            return '\u200B';
        }

        const strings: string[] = [];
        for (const content of Object.values(this.rpMapMarkers.oilRigLockedCrateUnlockedMetaData)) {
            if (content.oilRig === 'oil_rig_small') {
                const dateTriggered = content.dateTriggered;
                const unixTimestampTriggered = Math.floor(dateTriggered.getTime() / 1000);
                const eventDurationSeconds = Math.floor(serverInfo.oilRigLockedCrateUnlockTimeMs / 1000);
                const unixTimestampUnlocks = unixTimestampTriggered + eventDurationSeconds;
                const timeUnlocks = Timer.getDiscordRelativeTime(unixTimestampUnlocks);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLockedCrateUnlocksTime', {
                    time: timeUnlocks
                }));
            }
        }

        if (strings.length === 0) {
            if (this.rpMapMarkers.dateSmallOilRigLastTriggered !== null) {
                const dateLastTriggered = this.rpMapMarkers.dateSmallOilRigLastTriggered;
                const unixTimestampLastTriggered = Math.floor(dateLastTriggered.getTime() / 1000);
                const timeLastTriggered = Timer.getDiscordRelativeTime(unixTimestampLastTriggered);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseTriggeredTime', {
                    time: timeLastTriggered
                }));
            }
            else {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }

    public getInformationChannelEventLargeOilRigString(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const serverInfo = gInstance.serverInfoMap[this.serverId] as ServerInfo;
        const language = gInstance.generalSettings.language;

        if (!this.rpMapMarkers) {
            return '\u200B';
        }

        const strings: string[] = [];
        for (const content of Object.values(this.rpMapMarkers.oilRigLockedCrateUnlockedMetaData)) {
            if (content.oilRig === 'large_oil_rig') {
                const dateTriggered = content.dateTriggered;
                const unixTimestampTriggered = Math.floor(dateTriggered.getTime() / 1000);
                const eventDurationSeconds = Math.floor(serverInfo.oilRigLockedCrateUnlockTimeMs / 1000);
                const unixTimestampUnlocks = unixTimestampTriggered + eventDurationSeconds;
                const timeUnlocks = Timer.getDiscordRelativeTime(unixTimestampUnlocks);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLockedCrateUnlocksTime', {
                    time: timeUnlocks
                }));
            }
        }

        if (strings.length === 0) {
            if (this.rpMapMarkers.dateLargeOilRigLastTriggered !== null) {
                const dateLastTriggered = this.rpMapMarkers.dateLargeOilRigLastTriggered;
                const unixTimestampLastTriggered = Math.floor(dateLastTriggered.getTime() / 1000);
                const timeLastTriggered = Timer.getDiscordRelativeTime(unixTimestampLastTriggered);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseTriggeredTime', {
                    time: timeLastTriggered
                }));
            }
            else {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }

    public getInformationChannelEventChinook47String(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        if (!this.rpMapMarkers) {
            return '\u200B';
        }

        const dateDespawned = this.rpMapMarkers.dateCh47Despawned;

        const strings: string[] = [];
        if (this.rpMapMarkers.ch47s.length === 0) {
            if (dateDespawned === null) {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
            }
            else {
                const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
                const timeDespawned = Timer.getDiscordRelativeTime(unixTimestampDespawned);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLeftTime', {
                    time: timeDespawned
                }));
            }
        }

        for (const ch47 of this.rpMapMarkers.ch47s) {
            const metaData = this.rpMapMarkers.ch47MetaData[ch47.id];
            const dateSpawned = this.rpMapMarkers.dateCh47Spawned[ch47.id];

            const pos = getPos(ch47.x, ch47.y, this);
            const posString = (pos !== null) ? getPosString(pos, this, true, false) :
                lm.getIntl(language, 'unknown');

            strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLocatedAtPos', { pos: posString }));

            if (dateSpawned) {
                const unixTimestampSpawned = Math.floor(dateSpawned.getTime() / 1000);
                const timeSpawned = Timer.getDiscordRelativeTime(unixTimestampSpawned);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseSpawnedTime', { time: timeSpawned }));
            }

            if (metaData.lockedCrateNotified) {
                const monumentName = lm.getIntl(language, metaData.lockedCrateDropLocation as string);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLockedCrateDroppedAtPos', {
                    monument: monumentName
                }));
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }

    public getInformationChannelEventTravellingVendorString(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        if (!this.rpMapMarkers) {
            return '\u200B';
        }

        const dateDespawned = this.rpMapMarkers.dateTravellingVendorDespawned;

        const strings: string[] = [];
        if (this.rpMapMarkers.travellingVendors.length === 0) {
            if (dateDespawned !== null) {
                const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
                const timeDespawned = Timer.getDiscordRelativeTime(unixTimestampDespawned);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLeftTime', {
                    time: timeDespawned
                }));
            }
            else {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
            }
        }
        else {
            for (const travellingVendor of this.rpMapMarkers.travellingVendors) {
                const dateSpawned = this.rpMapMarkers.dateTravellingVendorSpawned[travellingVendor.id];

                const pos = getPos(travellingVendor.x, travellingVendor.y, this);
                const posString = (pos !== null) ? getPosString(pos, this, true, false) :
                    lm.getIntl(language, 'unknown');

                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseLocatedAtPos', { pos: posString }));

                if (dateSpawned) {
                    const unixTimestampSpawned = Math.floor(dateSpawned.getTime() / 1000);
                    const eventDurationSeconds = Math.floor(
                        constants.DEFAULT_TRAVELLING_VENDOR_ACTIVE_TIME_MS / 1000);
                    const unixTimestampDespawn = unixTimestampSpawned + eventDurationSeconds;

                    const timeSpawned = Timer.getDiscordRelativeTime(unixTimestampSpawned);
                    const timeDespawn = Timer.getDiscordRelativeTime(unixTimestampDespawn);

                    strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseSpawnedTime', {
                        time: timeSpawned
                    }));
                    strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseDespawnsTime', {
                        time: timeDespawn
                    }));
                }
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }

    public getInformationChannelEventDeepSeaString(): string {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        if (!this.rpMapMarkers) {
            return '\u200B';
        }

        const dateSpawned = this.rpMapMarkers.dateDeepSeaSpawned;
        const dateDespawned = this.rpMapMarkers.dateDeepSeaDespawned;

        const strings: string[] = [];
        if (dateSpawned !== null) {
            const unixTimestampSpawned = Math.floor(dateSpawned.getTime() / 1000);
            const eventDurationSeconds = Math.floor(constants.DEFAULT_DEEP_SEA_DURATION_TIME_MS / 1000);
            const unixTimestampDespawn = unixTimestampSpawned + eventDurationSeconds;

            const timeSpawned = Timer.getDiscordRelativeTime(unixTimestampSpawned);
            const timeDespawn = Timer.getDiscordRelativeTime(unixTimestampDespawn);

            strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseActive'));
            strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseSpawnedTime', { time: timeSpawned }));
            strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseDespawnsTime', { time: timeDespawn }));
        }
        else {
            if (dateDespawned !== null) {
                const unixTimestampDespawned = Math.floor(dateDespawned.getTime() / 1000);
                const timeDespawned = Timer.getDiscordRelativeTime(unixTimestampDespawned);
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseDespawnedTime', { time: timeDespawned }));
            }
            else {
                strings.push(lm.getIntl(language, 'infoChannelEmbedEventPhraseNotActive'));
            }
        }

        return strings.length === 0 ? '\u200B' : strings.join('\n');
    }
}