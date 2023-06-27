/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

const Constants = require('../util/constants.js');
const Map = require('../util/map.js');
const Time = require('../util/timer.js');

class Player {
    constructor(player, rustplus) {
        this._steamId = player.steamId.toString();
        this._name = player.name;
        this._x = player.x;
        this._y = player.y;
        this._isOnline = player.isOnline;
        this._spawnTime = player.spawnTime;
        this._isAlive = player.isAlive;
        this._deathTime = player.deathTime;

        this._rustplus = rustplus;

        this._pos = null;
        this._lastMovement = new Date();
        this._teamLeader = false;
        this._afkSeconds = 0;
        this._wentOfflineTime = null;

        this.updatePos();
    }

    /* Getters and Setters */
    get steamId() { return this._steamId; }
    set steamId(steamId) { this._steamId = steamId; }
    get name() { return this._name; }
    set name(name) { this._name = name; }
    get x() { return this._x; }
    set x(x) { this._x = x; }
    get y() { return this._y; }
    set y(y) { this._y = y; }
    get isOnline() { return this._isOnline; }
    set isOnline(isOnline) { this._isOnline = isOnline; }
    get spawnTime() { return this._spawnTime; }
    set spawnTime(spawnTime) { this._spawnTime = spawnTime; }
    get isAlive() { return this._isAlive; }
    set isAlive(isAlive) { this._isAlive = isAlive; }
    get deathTime() { return this._deathTime; }
    set deathTime(deathTime) { this._deathTime = deathTime; }
    get rustplus() { return this._rustplus; }
    set rustplus(rustplus) { this._rustplus = rustplus; }
    get pos() { return this._pos; }
    set pos(pos) { this._pos = pos; }
    get lastMovement() { return this._lastMovement; }
    set lastMovement(lastMovement) { this._lastMovement = lastMovement; }
    get teamLeader() { return this._teamLeader; }
    set teamLeader(teamLeader) { this._teamLeader = teamLeader; }
    get afkSeconds() { return this._afkSeconds; }
    set afkSeconds(afkSeconds) { this._afkSeconds = afkSeconds; }
    get wentOfflineTime() { return this._wentOfflineTime; }
    set wentOfflineTime(wentOfflineTime) { this._wentOfflineTime = wentOfflineTime; }

    /* Change checkers */
    isSteamIdChanged(player) { return (this.steamId !== player.steamId.toString()); }
    isNameChanged(player) { return (this.name !== player.name); }
    isXChanged(player) { return (this.x !== player.x); }
    isYChanged(player) { return (this.y !== player.y); }
    isOnlineChanged(player) { return (this.isOnline !== player.isOnline); }
    isSpawnTimeChanged(player) { return (this.spawnTime !== player.spawnTime); }
    isAliveChanged(player) { return (this.isAlive !== player.isAlive); }
    isDeathTimeChanged(player) { return (this.deathTime !== player.deathTime); }

    /* Other checkers */
    isGoneOnline(player) { return ((this.isOnline === false) && (player.isOnline === true)); }
    isGoneOffline(player) { return ((this.isOnline === true) && (player.isOnline === false)); }
    isGoneAlive(player) { return ((this.isAlive === false) && (player.isAlive === true)); }
    isGoneDead(player) {
        return (((this.isAlive === true) && (player.isAlive === false))
            || this.isDeathTimeChanged(player));
    }
    isMoved(player) { return (this.isXChanged(player) || this.isYChanged(player)); }
    isAfk() { return (this.afkSeconds >= Constants.AFK_TIME_SECONDS) }
    isGoneAfk(player) {
        return (
            !this.isAfk() &&
            !this.isMoved(player) &&
            this.isOnline &&
            ((new Date() - this.lastMovement) / 1000) >= Constants.AFK_TIME_SECONDS);
    }

    updatePlayer(player) {
        if (this.isGoneOffline(player)) {
            this.wentOfflineTime = new Date();
        }

        if (this.isGoneOnline(player)) {
            this.lastMovement = new Date();
            this.afkSeconds = 0;
        }

        if (this.isMoved(player)) {
            this.lastMovement = new Date();
            this.afkSeconds = 0;
        }
        else {
            if (!this.isOnline && !this.isGoneOnline(player)) {
                this.afkSeconds = 0;
            }
            else {
                this.afkSeconds = (new Date() - this.lastMovement) / 1000;
            }
        }

        this.steamId = player.steamId.toString();
        this.name = player.name;
        this.x = player.x;
        this.y = player.y;
        this.isOnline = player.isOnline;
        this.spawnTime = player.spawnTime;
        this.isAlive = player.isAlive;
        this.deathTime = player.deathTime;

        this.updatePos();
    }

    updatePos() {
        if (this.isAlive || this.isOnline) {
            this.pos = Map.getPos(this.x, this.y, this.rustplus.info.mapSize, this.rustplus);
        }
        else {
            this.pos = null;
        }
    }

    getAfkSeconds() { return (new Date() - this.lastMovement) / 1000; }
    getAfkTime(ignore = '') { return Time.secondsToFullScale(this.getAfkSeconds(), ignore); }

    getAliveSeconds() {
        if (this.spawnTime === 0) return 0;
        return (new Date() - new Date(this.spawnTime * 1000)) / 1000;
    }
    getAliveTime(ignore = '') { return Time.secondsToFullScale(this.getAliveSeconds(), ignore); }

    getDeathSeconds() {
        if (this.deathTime === 0) return 0;
        return (new Date() - new Date(this.deathTime * 1000)) / 1000;
    }
    getDeathTime(ignore = '') { return (Time.secondsToFullScale(this.getDeathSeconds(), ignore)); }
    getOfflineTime(ignore = '') {
        if (this.wentOfflineTime === null) return null;
        const seconds = (new Date() - this.wentOfflineTime) / 1000;
        return (Time.secondsToFullScale(seconds, ignore));
    }

    async assignLeader() {
        return await this.rustplus.promoteToLeaderAsync(this.steamId);
    }
}

module.exports = Player;