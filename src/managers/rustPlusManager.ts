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

import * as rp from 'rustplus-ts';

import { log } from '../../index';
import * as types from '../utils/types';
import { RustPlusTime } from '../structures/rustPlusTime';
import { RustPlusInfo } from '../structures/rustPlusInfo';

export interface RustPlusInstances {
    [guildId: types.GuildId]: {
        [serverId: types.ServerId]: RustPlus;
    }
}

export function getServerId(ip: string, port: string): types.ServerId {
    return `${ip}-${port}`;
}

export class RustPlusMananger {
    private rustPlusInstances: RustPlusInstances;

    constructor() {
        log.info(`RustPlusManager init.`);
        this.rustPlusInstances = {};
    }

    public instanceExist(guildId: types.GuildId, serverId: types.ServerId): boolean {
        if (this.rustPlusInstances.hasOwnProperty(guildId) &&
            this.rustPlusInstances[guildId].hasOwnProperty(serverId)) {
            return true;
        }
        return false;
    }

    public addInstance(guildId: types.GuildId, ip: string, port: string): boolean {
        log.info(`RustPlusManager addInstance guildId: ${guildId}, ip: ${ip}, port: ${port}.`);
        if (!this.rustPlusInstances.hasOwnProperty(guildId)) {
            this.rustPlusInstances[guildId] = {};
        }

        const serverId = getServerId(ip, port);
        if (this.instanceExist(guildId, serverId)) {
            log.warn(`RustPlusManager addInstance, instance already exist.`);
            return false;
        }

        this.rustPlusInstances[guildId][serverId] = new RustPlus(guildId, ip, port);

        log.info(`RustPlusManager addInstance guildId: ${guildId}, ip: ${ip}, port: ${port}, ` +
            `successfully added instance.`);
        return true;
    }

    public async removeInstance(guildId: types.GuildId, serverId: types.ServerId): Promise<boolean> {
        log.info(`RustPlusManager removeInstance guildId: ${guildId}, serverId: ${serverId}.`);
        if (!this.instanceExist(guildId, serverId)) {
            log.warn(`RustPlusManager removeInstance, instance does not exist.`);
            return false;
        }

        await this.rustPlusInstances[guildId][serverId].disconnect();
        this.rustPlusInstances[guildId][serverId].removeAllListeners();
        this.rustPlusInstances[guildId][serverId].cleanupBeforeRemove();
        delete this.rustPlusInstances[guildId][serverId];

        log.info(`RustPlusManager removeInstance guildId: ${guildId}, serverId: ${serverId}, ` +
            `successfully removed instance.`);
        return true;
    }

    public getRustPlusInstance(guildId: types.GuildId, serverId: types.ServerId): RustPlus | null {
        if (!this.instanceExist(guildId, serverId)) return null;
        return this.rustPlusInstances[guildId][serverId];
    }
}

export class RustPlus extends rp.RustPlus {
    public guildId: types.GuildId;
    public serverId: types.ServerId;

    private rpInfo: RustPlusInfo | null;
    private rpTime: RustPlusTime | null;

    private appMap: rustplus.AppMap | null;
    private appTeamInfo: rustplus.AppTeamInfo | null;
    private appMapMarkers: rustplus.AppMapMarkers | null;


    constructor(guildId: types.GuildId, ip: string, port: string) {
        super(ip, port);

        this.guildId = guildId;
        this.serverId = `${ip}-${port}`;

        /* Latest request responses. */
        this.rpInfo = null;
        this.rpTime = null;

        this.appMap = null; // Maybe not save map in memory? quite big
        this.appTeamInfo = null;
        this.appMapMarkers = null;



        //this.leaderSteamId = '0'; /* 0 When there is no leader. */

    }

    cleanupBeforeRemove() {

    }
}



//import * as trp from 'rustplus-ts';
//
//
//async function test() {
//    const ip = '137.83.91.161'
//    const port = '28082'
//    const playerId = '76561198114074446';
//    const playerToken = 149637386;
//
//    const a = new trp.RustPlus(ip, port);
//    a.on('connected', async () => {
//        console.log('EVENT connected');
//        const response = await a.getInfoAsync(playerId, playerToken);
//        console.log(response)
//
//        a.disconnect()
//    });
//
//    a.connect()
//}
//
//test()