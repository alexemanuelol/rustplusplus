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
import { Logger } from 'winston';

import { log, discordManager as dm, guildInstanceManager as gim, config, localeManager as lm } from '../../index';
import * as constants from '../utils/constants';
import * as types from '../utils/types';
import { getServerId, getIpAndPort, GuildInstance } from './guildInstanceManager';
import { sendServerMessage } from '../discordUtils/discordMessages';
//import { RustPlusTime } from '../structures/rustPlusTime';
//import { RustPlusInfo } from '../structures/rustPlusInfo';


export type RustPlusInstanceMap = { [guildId: types.GuildId]: RustPlusServerMap };
export type RustPlusServerMap = { [serverId: types.ServerId]: RustPlusInstance };

export enum ConnectionStatus {
    Disconnected = 0,
    Connecting = 1,
    Connected = 2,
    Reconnecting = 3
}

export class RustPlusManager {
    private rustPlusInstanceMap: RustPlusInstanceMap;

    constructor() {
        const fn = '[RustPlusManager: Init]';
        log.info(`${fn}`);
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
        const fn = '[RustPlusManager: addInstance]';
        const ipAndPort = getIpAndPort(serverId);
        const logParam = {
            guildId: guildId,
            serverId: serverId
        };

        if (!Object.hasOwn(this.rustPlusInstanceMap, guildId)) {
            this.rustPlusInstanceMap[guildId] = {};
        }

        if (Object.hasOwn(this.rustPlusInstanceMap, serverId)) {
            log.warn(`${fn} Instance already exist.`, logParam);
            return false;
        }

        this.rustPlusInstanceMap[guildId][serverId] = new RustPlusInstance(guildId, ipAndPort.ip, ipAndPort.port);
        log.info(`${fn} Instance added.`, logParam);
        return true;
    }

    public removeInstance(guildId: types.GuildId, serverId: types.ServerId): boolean {
        const fn = '[RustPlusManager: removeInstance]';
        const logParam = {
            guildId: guildId,
            serverId: serverId
        };

        if (!this.hasInstance(guildId, serverId)) {
            log.warn(`${fn} Instance does not exist.`, logParam);
            return false;
        }

        this.rustPlusInstanceMap[guildId][serverId].shutdown();
        delete this.rustPlusInstanceMap[guildId][serverId];
        log.info(`${fn} Instance removed.`, logParam);
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
    public inGameTeamChatTimeout: NodeJS.Timeout | undefined;
    public inGameTeamChatMessagesSentByBot: string[];

    private commandNames: string[];

    //private rpInfo: RustPlusInfo | null;
    //private rpTime: RustPlusTime | null;
    //private appMap: rustplus.AppMap | null;
    //private appTeamInfo: rustplus.AppTeamInfo | null;
    //private appMapMarkers: rustplus.AppMapMarkers | null;


    constructor(guildId: types.GuildId, ip: string, port: string) {
        this.guildId = guildId;
        this.ip = ip;
        this.port = port;
        this.serverId = getServerId(ip, port);

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
        this.inGameTeamChatTimeout = undefined;
        this.inGameTeamChatMessagesSentByBot = [];

        this.commandNames = this.getCommandNames();

        /* Latest request responses. */
        //this.rpInfo = null;
        //this.rpTime = null;

        //this.appMap = null; // Maybe not save map in memory? quite big
        //this.appTeamInfo = null;
        //this.appMapMarkers = null;



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
        const fn = '[RustPlusInstance: scheduleReconnect]';
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

        log.info(`${fn} Reconnecting in ${this.reconnectTimeoutSeconds} seconds.`, {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        });

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
        clearTimeout(this.inGameTeamChatTimeout);
        this.inGameTeamChatTimeout = undefined;
        this.inGameTeamChatMessagesSentByBot = [];

        // TODO! Remove timers example: pollingTimer, inGameChatTimeout, customTimers like lockedCrate,
        // cargoship leave etc...
    }

    public startReconnectionTimer() {
        const fn = '[RustPlusInstance: startReconnectionTimer]';
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        if (this.reconnectTimeoutId !== undefined) {
            this.stopReconnectionTimer();
        }

        log.info(`${fn}`, logParam);

        this.reconnectTimeoutId = setTimeout(() => {
            this.startup();
        }, this.reconnectTimeoutSeconds * 1000);
    }

    public stopReconnectionTimer() {
        const fn = '[RustPlusInstance: stopReconnectionTimer]';
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        log.info(`${fn}`, logParam);

        clearTimeout(this.reconnectTimeoutId);
        this.reconnectTimeoutId = undefined;
    }

    public startServerPollingHandler() {
        const fn = '[RustPlusInstance: startServerPollingHandler]';
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        if (this.serverPollingHandlerIntervalId !== undefined) {
            this.stopServerPollingHandler();
        }

        log.info(`${fn}`, logParam);

        this.serverPolling(true);
        this.serverPollingHandlerIntervalId = setInterval(() => {
            this.serverPolling();
        }, this.serverPollingHandlerIntervalSeconds * 1000);
    }

    public stopServerPollingHandler() {
        const fn = '[RustPlusInstance: stopServerPollingHandler]';
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        log.info(`${fn}`, logParam);

        clearInterval(this.serverPollingHandlerIntervalId);
        this.serverPollingHandlerIntervalId = undefined;
    }

    private async serverPolling(firstPoll: boolean = false) {
        const fn = '[RustPlusManager: serverPolling]';
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.serverId];
        const requesterSteamId = server.requesterSteamId;
        if (requesterSteamId === null) return;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;
        if (!pairingData) {
            this.lastServerPollSuccessful = false;
            log.warn(`${fn} pairingData for ${requesterSteamId} could not be found.`, logParam);
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

        this.lastServerPollSuccessful = true;
        this.lastServerPollSuccessfulTimestampSeconds = Math.floor(Date.now() / 1000);

        /**
         * If reached this, then all rustplus requests was successful.
         * Continue with updating structures
         */

        if (firstPoll) {
            console.log('FIRST POLL')
            // TODO! Set rpInfo, rpTime, rpTeamInfo, rpMapMarkers
        }
        else {
            console.log('POLL')
        }

        // TODO! teamHandler
        // TODO! update rpTeamInfo

        // TODO! smartSwitchHandler

        // TODO! timeHandler

        // TODO! update rpTime
        // TODO! update rpInfo
        // TODO! update rpMapMarkers

        // TODO! smartAlarmHandler
        // TODO! storageMonitorHandler

        // TODO! informationChannelHandler
    }

    public inGameTeamChatQueueMessage(message: string | string[]) {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const inGameChatMessageDelayMs = gInstance.generalSettings.inGameChatMessageDelay * 1000;
        const trademark = gInstance.generalSettings.inGameChatTrademark;
        const trademarkString = trademark === '' ? '' : `${trademark} | `;
        const messageMaxLength = constants.MAX_LENGTH_TEAM_MESSAGE - trademarkString.length;

        if (!gInstance.generalSettings.inGameChatBotUnmuted) return;

        const messages = Array.isArray(message) ? message : [message];
        for (const msg of messages) {
            const strings = msg.match(new RegExp(`.{1,${messageMaxLength}}(\\s|$)`, 'g')) as string[];

            for (const str of strings) {
                this.inGameTeamChatQueue.push(`${trademarkString}${str}`);
            }
        }

        if (this.inGameTeamChatTimeout === undefined) {
            this.inGameTeamChatTimeout = setTimeout(this.inGameTeamChatMessageQueueHandler.bind(this),
                inGameChatMessageDelayMs);
        }
    }

    private inGameTeamChatMessageQueueHandler() {
        const fn = '[RustPlusManager: inGameTeamChatMessageQueueHandler]';
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const server = gInstance.serverInfoMap[this.serverId];
        const requesterSteamId = server.requesterSteamId;

        clearTimeout(this.inGameTeamChatTimeout);
        this.inGameTeamChatTimeout = undefined;

        if (this.inGameTeamChatQueue.length === 0) return;

        const message = this.inGameTeamChatQueue[0];
        this.inGameTeamChatQueue = this.inGameTeamChatQueue.slice(1);

        if (requesterSteamId === null) return;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;
        if (!pairingData) {
            log.warn(`${fn} pairingData for ${requesterSteamId} could not be found.`, logParam);
            return;
        }

        this.inGameTeamChatAddMessageToSentByBot(message);
        this.rustPlus.sendTeamMessageAsync(pairingData.steamId, pairingData.playerToken, message);
        log.info(`${fn} Message sent in-game: '${message}'.`, logParam);

        this.inGameTeamChatResetMessageQueueTimeout();
    }

    public inGameTeamChatResetMessageQueueTimeout() {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const inGameChatMessageDelayMs = gInstance.generalSettings.inGameChatMessageDelay * 1000;

        clearTimeout(this.inGameTeamChatTimeout);
        this.inGameTeamChatTimeout = undefined;
        if (this.inGameTeamChatQueue.length !== 0) {
            this.inGameTeamChatTimeout = setTimeout(this.inGameTeamChatMessageQueueHandler.bind(this),
                inGameChatMessageDelayMs);
        }
    }

    public inGameTeamChatAddMessageToSentByBot(message: string) {
        if (this.inGameTeamChatMessagesSentByBot.length === constants.BOT_MESSAGE_HISTORY_LIMIT) {
            this.inGameTeamChatMessagesSentByBot.pop();
        }
        this.inGameTeamChatMessagesSentByBot.unshift(message);
    }

    public async prefixCommandHandler(message: rp.AppTeamMessage | discordjs.Message): Promise<boolean> {
        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;
        const commandPrefix = gInstance.generalSettings.inGameChatCommandPrefix;

        const messageString = Object.hasOwn(message, 'steamId') ? (message as rp.AppTeamMessage).message :
            (message as discordjs.Message).cleanContent;

        const commandNamesCurrentLocale = this.commandNames.map(commandName =>
            lm.getIntl(language, `prefixCommand-${commandName}`)
        );
        const commandNames = [...this.commandNames, ...commandNamesCurrentLocale];

        const command = commandNames.find(command => messageString.startsWith(`${commandPrefix}${command}`));
        if (!command) return false;

        const commandPath = path.join(__dirname, '..', 'prefixCommands', `${command}.ts`);
        const commandModule = await import(commandPath);

        return await commandModule.execute(this, message);
    }

    public async validateServerPollResponse(response: rp.AppResponse | Error | rp.ConsumeTokensError,
        responseParam: keyof rp.AppResponse, validationCallback: (input: unknown, logger: Logger | null) => boolean):
        Promise<boolean> {
        const fn = `[RustPlusManager: validateServerPollResponse]`
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        const requesterSteamId = gInstance.serverInfoMap[this.serverId].requesterSteamId;

        if (requesterSteamId === null) return false;

        const pairingData = gInstance.pairingDataMap[this.serverId]?.[requesterSteamId] ?? null;

        if (rp.isValidAppResponse(response, log)) {
            if (!validationCallback(response[responseParam], log)) {
                if (rp.isValidAppError(response.error, log)) {
                    log.warn(`${fn} AppError: ${response.error.error}`, logParam);
                    if (this.rustPlus.getAppResponseError(response) === rp.AppResponseError.NotFound) {
                        /* pairingData is no longer valid. */
                        if (pairingData && pairingData.valid) {
                            log.warn(`${fn} PairingData no longer valid for ${requesterSteamId}.`, logParam);
                            pairingData.valid = false;
                            gim.updateGuildInstance(this.guildId);
                            await sendServerMessage(dm, this.guildId, this.serverId, this.connectionStatus);
                        }
                    }
                }
                else {
                    log.error(`${fn} We got completely wrong response: ${JSON.stringify(response)}`, logParam);
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
                log.error(`${fn} Error: ${response.message}`, logParam);
            }
            else {
                log.error(`${fn} ConsumeTokensError: ${response}`, logParam);
            }

            // TODO! Perhaps send the message here too

            this.lastServerPollSuccessful = false;
            return false;
        }

        return true;
    }

    public async validatePairingData() {
        const fn = `[RustPlusManager: validatePairingData]`
        const logParam = {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        };

        log.info(`${fn}`, logParam);

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        for (const [steamId, pairingData] of Object.entries(gInstance.pairingDataMap[this.serverId])) {
            const rpInfo = await this.rustPlus.getInfoAsync(pairingData.steamId, pairingData.playerToken);
            if (rp.isValidAppResponse(rpInfo, log)) {
                if (!rp.isValidAppInfo(rpInfo.info, log)) {
                    if (rp.isValidAppError(rpInfo.error, log)) {
                        log.warn(`${fn} SteamId: ${steamId}, AppError: ${rpInfo.error.error}`, logParam);
                        if (this.rustPlus.getAppResponseError(rpInfo) === rp.AppResponseError.NotFound) {
                            log.warn(`${fn} PairingData no longer valid for ${steamId}.`, logParam);
                            pairingData.valid = false;
                        }
                    }
                    else {
                        log.error(`${fn} We got completely wrong response: ${JSON.stringify(rpInfo)}`, logParam);
                    }
                }
                else {
                    pairingData.valid = true;
                }
            }
            else {
                /* Error or rp.ConsumeTokensError */
                if (rpInfo instanceof Error) {
                    log.error(`${fn} Error: ${rpInfo.message}`, logParam);
                }
                else {
                    log.error(`${fn} ConsumeTokensError: ${rpInfo}`, logParam);
                }
            }
        }
        gim.updateGuildInstance(this.guildId);
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
}