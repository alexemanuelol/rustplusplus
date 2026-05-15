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

import { RustPlusInstance } from '../managers/rustPlusManager';
import { secondsToFullScale } from '../utils/timer';
import * as constants from '../utils/constants';

export class RustPlusTeamInfoMember {
    public rpInstance: RustPlusInstance;
    public appTeamInfoMember: rp.AppTeamInfo_Member;
    public lastMovementDate: Date | null;
    public wentOfflineDate: Date | null;
    public wasAfk: boolean;

    constructor(rpInstance: RustPlusInstance, appTeamInfoMember: rp.AppTeamInfo_Member) {
        this.rpInstance = rpInstance;
        this.appTeamInfoMember = appTeamInfoMember;
        this.lastMovementDate = null;
        this.wentOfflineDate = null;
        this.wasAfk = false;
    }

    public updateTeamInfoMember(appTeamInfoMember: rp.AppTeamInfo_Member) {
        if (this.isGoneOffline(appTeamInfoMember)) {
            this.lastMovementDate = null;
            this.wentOfflineDate = new Date();
            this.wasAfk = false;
        }

        if (this.isGoneOnline(appTeamInfoMember)) {
            this.lastMovementDate = new Date();
            this.wasAfk = false;
        }

        if (this.isMoved(appTeamInfoMember)) {
            this.lastMovementDate = new Date();
            this.wasAfk = false;
        }
        else {
            if (this.isGoneAfk(appTeamInfoMember)) {
                this.wasAfk = true;
            }
        }

        this.appTeamInfoMember = appTeamInfoMember;
    }

    public isSteamIdChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.steamId !== appTeamInfoMember.steamId;
    }

    public isNameChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.name !== appTeamInfoMember.name;
    }

    public isXChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.x !== appTeamInfoMember.x;
    }

    public isYChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.y !== appTeamInfoMember.y;
    }

    public isOnlineChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.isOnline !== appTeamInfoMember.isOnline;
    }

    public isSpawnTimeChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.spawnTime !== appTeamInfoMember.spawnTime;
    }

    public isAliveChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.isAlive !== appTeamInfoMember.isAlive;
    }

    public isDeathTimeChanged(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return this.appTeamInfoMember.deathTime !== appTeamInfoMember.deathTime;
    }

    /**
     * Other methods
     */

    public isGoneOnline(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return (this.appTeamInfoMember.isOnline === false && appTeamInfoMember.isOnline === true);
    }

    public isGoneOffline(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return (this.appTeamInfoMember.isOnline === true && appTeamInfoMember.isOnline === false);
    }

    public isGoneAlive(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return (this.appTeamInfoMember.isAlive === false && appTeamInfoMember.isAlive === true);
    }

    public isGoneDead(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return (this.appTeamInfoMember.isAlive === true && appTeamInfoMember.isAlive === false) ||
            this.isDeathTimeChanged(appTeamInfoMember);
    }

    public isMoved(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return (this.isXChanged(appTeamInfoMember) || this.isYChanged(appTeamInfoMember));
    }

    public isAfk(): boolean {
        if (this.lastMovementDate === null) {
            return false;
        }

        return ((Date.now() - this.lastMovementDate.getTime()) / 1000) >= constants.AFK_TIME_SECONDS;
    }

    public isGoneAfk(appTeamInfoMember: rp.AppTeamInfo_Member): boolean {
        return (
            !this.wasAfk &&
            this.isAfk() &&
            !this.isMoved(appTeamInfoMember) &&
            this.appTeamInfoMember.isOnline);
    }

    public getAfkSeconds(): number {
        if (this.lastMovementDate === null) {
            return 0;
        }
        return (new Date().getTime() - this.lastMovementDate.getTime()) / 1000;
    }

    public getAfkTime(ignore: string = ''): string {
        return secondsToFullScale(this.getAfkSeconds(), ignore);
    }

    public getAliveSeconds(): number {
        if (this.appTeamInfoMember.spawnTime === 0) return 0;
        return (new Date().getTime() - new Date(this.appTeamInfoMember.spawnTime * 1000).getTime()) / 1000;
    }

    public getAliveTime(ignore: string = ''): string {
        return secondsToFullScale(this.getAliveSeconds(), ignore);
    }

    public getDeathSeconds(): number {
        if (this.appTeamInfoMember.deathTime === 0) return 0;
        return (new Date().getTime() - new Date(this.appTeamInfoMember.deathTime * 1000).getTime()) / 1000;
    }

    public getDeathTime(ignore: string = ''): string {
        return secondsToFullScale(this.getDeathSeconds(), ignore);
    }

    public getOfflineTime(ignore: string = ''): string | null {
        if (this.wentOfflineDate === null) return null;
        const seconds = (new Date().getTime() - this.wentOfflineDate.getTime()) / 1000;
        return (secondsToFullScale(seconds, ignore));
    }
}