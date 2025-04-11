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

import * as rp from 'rustplus-ts';
import * as fs from 'fs';
import * as path from 'path';

import { log, discordManager as dm, guildInstanceManager as gim } from '../../index';
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
        const funcName = '[RustPlusManager: Init]';
        log.info(`${funcName}`);
        this.rustPlusInstanceMap = {};
    }

    public hasInstance(guildId: types.GuildId, serverId: types.ServerId): boolean {
        if (Object.hasOwn(this.rustPlusInstanceMap, guildId) &&
            Object.hasOwn(this.rustPlusInstanceMap[guildId], serverId)) {
            return true;
        }

        return false;
    }

    public addInstance(guildId: types.GuildId, serverId: types.ServerId, mainSteamId: types.SteamId): boolean {
        const funcName = '[RustPlusManager: addInstance]';
        const ipAndPort = getIpAndPort(serverId);
        const logParam = { guildId: guildId, serverId: serverId };

        if (!Object.hasOwn(this.rustPlusInstanceMap, guildId)) {
            this.rustPlusInstanceMap[guildId] = {};
        }

        if (Object.hasOwn(this.rustPlusInstanceMap, serverId)) {
            log.warn(`${funcName} Instance already exist.`, logParam);
            return false;
        }

        this.rustPlusInstanceMap[guildId][serverId] = new RustPlusInstance(guildId, ipAndPort.ip, ipAndPort.port,
            mainSteamId);
        log.info(`${funcName} Instance added.`, logParam);
        return true;
    }

    public removeInstance(guildId: types.GuildId, serverId: types.ServerId): boolean {
        const funcName = '[RustPlusManager: removeInstance]';
        const logParam = { guildId: guildId, serverId: serverId };

        if (!this.hasInstance(guildId, serverId)) {
            log.warn(`${funcName} Instance does not exist.`, logParam);
            return false;
        }

        this.rustPlusInstanceMap[guildId][serverId].shutdown();
        delete this.rustPlusInstanceMap[guildId][serverId];
        log.info(`${funcName} Instance removed.`, logParam);
        return true;
    }

    public getInstance(guildId: types.GuildId, serverId: types.ServerId): RustPlusInstance | null {
        if (!this.hasInstance(guildId, serverId)) {
            return null;
        }
        return this.rustPlusInstanceMap[guildId][serverId];
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
    public mainSteamId: types.SteamId;
    public serverId: types.ServerId;
    public serverName: string;

    public rustPlus: rp.RustPlus;
    public connectionStatus: ConnectionStatus;
    public reconnectTimeoutId: NodeJS.Timeout | undefined;
    public reconnectTimeoutSeconds: number;
    //private rpInfo: RustPlusInfo | null;
    //private rpTime: RustPlusTime | null;
    //private appMap: rustplus.AppMap | null;
    //private appTeamInfo: rustplus.AppTeamInfo | null;
    //private appMapMarkers: rustplus.AppMapMarkers | null;


    constructor(guildId: types.GuildId, ip: string, port: string, mainSteamId: types.SteamId) {
        this.guildId = guildId;
        this.ip = ip;
        this.port = port;
        this.mainSteamId = mainSteamId
        this.serverId = getServerId(ip, port);

        const gInstance = gim.getGuildInstance(this.guildId) as GuildInstance;
        this.serverName = gInstance.serverInfoMap[this.serverId].name;

        this.rustPlus = new rp.RustPlus(ip, port, false, log);
        this.connectionStatus = ConnectionStatus.Disconnected;
        this.reconnectTimeoutId = undefined;
        this.reconnectTimeoutSeconds = constants.DEFAULT_RECONNECT_TIMEOUT_SECONDS;

        /* Latest request responses. */
        //this.rpInfo = null;
        //this.rpTime = null;

        //this.appMap = null; // Maybe not save map in memory? quite big
        //this.appTeamInfo = null;
        //this.appMapMarkers = null;



        //this.leaderSteamId = '0'; /* 0 When there is no leader. */
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
        const funcName = '[RustPlusInstance: scheduleReconnect]';
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

        log.info(`${funcName} Reconnecting in ${this.reconnectTimeoutSeconds} seconds.`, {
            guildId: this.guildId,
            serverId: this.serverId,
            serverName: this.serverName
        });

        this.reconnectTimeoutId = setTimeout(async () => {
            await this.startup();
        }, this.reconnectTimeoutSeconds * 1000);
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
        clearTimeout(this.reconnectTimeoutId);

        // TODO! Remove timers example: pollingTimer, inGameChatTimeout, customTimers like lockedCrate, cargoship leave etc...
    }
}