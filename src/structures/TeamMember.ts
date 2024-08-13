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

import * as constants from '../util/constants';
import { getTimeSince, secondsToFullScale } from '../util/timer';
import { getPos, MapLocation } from "../util/map";
const { RustPlus } = require('./RustPlus');

export interface TeamMemberData {
    steamId: number;
    name: string;
    x: number;
    y: number;
    isOnline: boolean;
    spawnTime: number;
    isAlive: boolean;
    deathTime: number;
}

export class TeamMember {
    private _steamId: string;
    private _name: string;
    private _x: number;
    private _y: number;
    private _isOnline: boolean;
    private _spawnTime: number;
    private _isAlive: boolean;
    private _deathTime: number;

    private _rustplus: typeof RustPlus;

    private _position: MapLocation | null;
    private _lastMovement: Date | null;
    private _afkSeconds: number;
    private _wentOnlineTime: Date | null;
    private _wentOfflineTime: Date | null;

    constructor(rustplus: typeof RustPlus, teamMember: TeamMemberData) {
        this._steamId = teamMember.steamId.toString();
        this._name = teamMember.name;
        this._x = teamMember.x;
        this._y = teamMember.y;
        this._isOnline = teamMember.isOnline;
        this._spawnTime = teamMember.spawnTime;
        this._isAlive = teamMember.isAlive;
        this._deathTime = teamMember.deathTime;

        this._rustplus = rustplus;

        this._position = null;
        this._lastMovement = new Date();
        this._afkSeconds = 0;
        this._wentOnlineTime = null;
        this._wentOfflineTime = null;

        this.updatePosition();
    }

    /* Getters and Setters */
    get steamId(): string { return this._steamId; }
    set steamId(steamId: string) { this._steamId = steamId; }
    get name(): string { return this._name; }
    set name(name: string) { this._name = name; }
    get x(): number { return this._x; }
    set x(x: number) { this._x = x; }
    get y(): number { return this._y; }
    set y(y: number) { this._y = y; }
    get isOnline(): boolean { return this._isOnline; }
    set isOnline(isOnline: boolean) { this._isOnline = isOnline; }
    get spawnTime(): number { return this._spawnTime; }
    set spawnTime(spawnTime: number) { this._spawnTime = spawnTime; }
    get isAlive(): boolean { return this._isAlive; }
    set isAlive(isAlive: boolean) { this._isAlive = isAlive; }
    get deathTime(): number { return this._deathTime; }
    set deathTime(deathTime: number) { this._deathTime = deathTime; }
    get rustplus(): typeof RustPlus { return this._rustplus; }
    set rustplus(rustplus: typeof RustPlus) { this._rustplus = rustplus; }
    get position(): MapLocation | null { return this._position; }
    set position(position: MapLocation | null) { this._position = position; }
    get lastMovement(): Date | null { return this._lastMovement; }
    set lastMovement(lastMovement: Date | null) { this._lastMovement = lastMovement; }
    get afkSeconds(): number { return this._afkSeconds; }
    set afkSeconds(afkSeconds: number) { this._afkSeconds = afkSeconds; }
    get wentOnlineTime(): Date | null { return this._wentOnlineTime; }
    set wentOnlineTime(wentOnlineTime: Date | null) { this._wentOnlineTime = wentOnlineTime; }
    get wentOfflineTime(): Date | null { return this._wentOfflineTime; }
    set wentOfflineTime(wentOfflineTime: Date | null) { this._wentOfflineTime = wentOfflineTime; }

    /* Change checkers */
    isSteamIdChanged(teamMember: TeamMemberData): boolean { return this.steamId !== teamMember.steamId.toString(); }
    isNameChanged(teamMember: TeamMemberData): boolean { return this.name !== teamMember.name; }
    isXChanged(teamMember: TeamMemberData): boolean { return this.x !== teamMember.x; }
    isYChanged(teamMember: TeamMemberData): boolean { return this.y !== teamMember.y; }
    isOnlineChanged(teamMember: TeamMemberData): boolean { return this.isOnline !== teamMember.isOnline; }
    isSpawnTimeChanged(teamMember: TeamMemberData): boolean { return this.spawnTime !== teamMember.spawnTime; }
    isAliveChanged(teamMember: TeamMemberData): boolean { return this.isAlive !== teamMember.isAlive; }
    isDeathTimeChanged(teamMember: TeamMemberData): boolean { return this.deathTime !== teamMember.deathTime; }

    /* Other checkers */
    isGoneOnline(teamMember: TeamMemberData): boolean {
        return (this.isOnline === false) && (teamMember.isOnline === true);
    }

    isGoneOffline(teamMember: TeamMemberData): boolean {
        return (this.isOnline === true) && (teamMember.isOnline === false);
    }

    isGoneAlive(teamMember: TeamMemberData): boolean {
        return ((this.isAlive === false) && (teamMember.isAlive === true)) || this.isSpawnTimeChanged(teamMember);
    }

    isGoneDead(teamMember: TeamMemberData): boolean {
        return ((this.isAlive === true) && (teamMember.isAlive === false)) || this.isDeathTimeChanged(teamMember);
    }

    isMoved(teamMember: TeamMemberData): boolean {
        return this.isXChanged(teamMember) || this.isYChanged(teamMember);
    }

    isAfk(): boolean {
        return this.afkSeconds >= constants.AFK_TIME_SECONDS;
    }

    isGoneAfk(teamMember: TeamMemberData): boolean {
        return !this.isAfk() && !this.isMoved(teamMember) && this.isOnline && this.lastMovement !== null &&
            getTimeSince(this.lastMovement) >= constants.AFK_TIME_SECONDS;
    }

    updateTeamMember(teamMember: TeamMemberData) {
        if (this.isGoneOffline(teamMember)) {
            this.wentOfflineTime = new Date();
            this.wentOnlineTime = null;
            this.lastMovement = null;
            this.afkSeconds = 0;
        }

        if (this.isGoneOnline(teamMember)) {
            this.wentOnlineTime = new Date();
            this.wentOfflineTime = null;
            this.lastMovement = new Date();
            this.afkSeconds = 0;
        }

        if (this.isMoved(teamMember)) {
            this.lastMovement = new Date();
            this.afkSeconds = 0;
        }
        else {
            if (!this.isOnline) {
                this.afkSeconds = 0;
            }
            else {
                this.afkSeconds = ((new Date()).getTime() - (this.lastMovement as Date).getTime()) / 1000;
            }
        }

        this.steamId = teamMember.steamId.toString();
        this.name = teamMember.name;
        this.x = teamMember.x;
        this.y = teamMember.y;
        this.isOnline = teamMember.isOnline;
        this.spawnTime = teamMember.spawnTime;
        this.isAlive = teamMember.isAlive;
        this.deathTime = teamMember.deathTime;

        this.updatePosition();
    }

    updatePosition() {
        if (this.isAlive || this.isOnline) {
            this.position = getPos(
                this.rustplus.generalSettings.language,
                this.x,
                this.y,
                this.rustplus.rpInfo.mapSize,
                this.rustplus.map.monuments,
                this.rustplus.map.monumentInfo);
        }
        else {
            this.position = null;
        }
    }

    getAfkTime(ignore: string = ''): string {
        return secondsToFullScale(this.afkSeconds, ignore);
    }

    getAliveSeconds(): number {
        if (this.spawnTime === 0) return 0;
        return getTimeSince(new Date(this.spawnTime * 1000));
    }

    getAliveTime(ignore: string = ''): string {
        return secondsToFullScale(this.getAliveSeconds(), ignore);
    }

    getDeathSeconds(): number {
        if (this.deathTime === 0) return 0;
        return getTimeSince(new Date(this.deathTime * 1000));
    }

    getDeathTime(ignore: string = ''): string {
        return secondsToFullScale(this.getDeathSeconds(), ignore);
    }

    getOnlineTime(ignore: string = ''): string | null {
        if (this.wentOnlineTime === null) return null;
        return secondsToFullScale(getTimeSince(this.wentOnlineTime as Date), ignore);
    }

    getOfflineTime(ignore: string = ''): string | null {
        if (this.wentOfflineTime === null) return null;
        return secondsToFullScale(getTimeSince(this.wentOfflineTime as Date), ignore);
    }
}