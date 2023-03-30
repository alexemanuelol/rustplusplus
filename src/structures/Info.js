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

const Map = require('../util/map.js');
const Timer = require('../util/timer');

class Info {
    constructor(info) {
        this._name = info.name;
        this._headerImage = info.headerImage;
        this._url = info.url;
        this._map = info.map;
        this._mapSize = info.mapSize;
        this._wipeTime = info.wipeTime;
        this._players = info.players;
        this._maxPlayers = info.maxPlayers;
        this._queuedPlayers = info.queuedPlayers;
        this._seed = info.seed;
        this._salt = info.salt;

        this._correctedMapSize = Map.getCorrectedMapSize(info.mapSize);
    }

    /* Getters and Setters */
    get name() { return this._name; }
    set name(name) { this._name = name; }
    get headerImage() { return this._headerImage; }
    set headerImage(headerImage) { this._headerImage = headerImage; }
    get url() { return this._url; }
    set url(url) { this._url = url; }
    get map() { return this._map; }
    set map(map) { this._map = map; }
    get mapSize() { return this._mapSize; }
    set mapSize(mapSize) { this._mapSize = mapSize; }
    get wipeTime() { return this._wipeTime; }
    set wipeTime(wipeTime) { this._wipeTime = wipeTime; }
    get players() { return this._players; }
    set players(players) { this._players = players; }
    get maxPlayers() { return this._maxPlayers; }
    set maxPlayers(maxPlayers) { this._maxPlayers = maxPlayers; }
    get queuedPlayers() { return this._queuedPlayers; }
    set queuedPlayers(queuedPlayers) { this._queuedPlayers = queuedPlayers; }
    get seed() { return this._seed; }
    set seed(seed) { this._seed = seed; }
    get salt() { return this._salt; }
    set salt(salt) { this._salt = salt; }
    get correctedMapSize() { return this._correctedMapSize; }
    set correctedMapSize(correctedMapSize) { this._correctedMapSize = correctedMapSize; }

    /* Change checkers */
    isNameChanged(info) { return ((this.name) !== (info.name)); }
    isHeaderImageChanged(info) { return ((this.headerImage) !== (info.headerImage)); }
    isUrlChanged(info) { return ((this.url) !== (info.url)); }
    isMapChanged(info) { return ((this.map) !== (info.map)); }
    isMapSizeChanged(info) { return ((this.mapSize) !== (info.mapSize)); }
    isWipeTimeChanged(info) { return ((this.wipeTime) !== (info.wipeTime)); }
    isPlayersChanged(info) { return ((this.players) !== (info.players)); }
    isMaxPlayersChanged(info) { return ((this.maxPlayers) !== (info.maxPlayers)); }
    isQueuedPlayersChanged(info) { return ((this.queuedPlayers) !== (info.queuedPlayers)); }
    isSeedChanged(info) { return ((this.seed) !== (info.seed)); }
    isSaltChanged(info) { return ((this.salt) !== (info.salt)); }

    /* Other checkers */
    isMaxPlayersIncreased(info) { return ((this.maxPlayers) < (info.maxPlayers)); }
    isMaxPlayersDecreased(info) { return ((this.maxPlayers) > (info.maxPlayers)); }
    isQueue() { return (this.queuedPlayers !== 0); }

    updateInfo(info) {
        this.name = info.name;
        this.headerImage = info.headerImage;
        this.url = info.url;
        this.map = info.map;
        this.mapSize = info.mapSize;
        this.wipeTime = info.wipeTime;
        this.players = info.players;
        this.maxPlayers = info.maxPlayers;
        this.queuedPlayers = info.queuedPlayers;
        this.seed = info.seed;
        this.salt = info.salt;

        this.correctedMapSize = Map.getCorrectedMapSize(info.mapSize);
    }

    getSecondsSinceWipe() { return (new Date() - new Date(this.wipeTime * 1000)) / 1000; }
    getTimeSinceWipe(ignore = '') { return Timer.secondsToFullScale(this.getSecondsSinceWipe(), ignore); }
}

module.exports = Info;