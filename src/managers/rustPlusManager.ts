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
import { getServerId, getIpAndPort, GuildInstance, EventNotificationSettings } from './guildInstanceManager';
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

        const args = messageString.slice(baseCommandStartRaw.length).trim().split(/\s+/);

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
}