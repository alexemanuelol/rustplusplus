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

import { getCorrectedMapSize } from "../util/map";
import { secondsToFullScale, getTimeSince } from "../util/timer";

export interface InfoResponseData {
    name: string;
    headerImage: string;
    url: string;
    map: string;
    mapSize: number;
    wipeTime: number;
    players: number;
    maxPlayers: number;
    queuedPlayers: number;
    seed: number;
    salt: number;
    logoImage: string;
    nexus: string;
    nexusId: number;
    nexusZone: string;
}

export class Info {
    private _name: string;
    private _headerImage: string;
    private _url: string;
    private _map: string;
    private _mapSize: number;
    private _wipeTime: number;
    private _players: number;
    private _maxPlayers: number;
    private _queuedPlayers: number;
    private _seed: number;
    private _salt: number;
    private _logoImage: string;
    private _nexus: string;
    private _nexusId: number;
    private _nexusZone: string;

    private _correctedMapSize: number;

    constructor(info: InfoResponseData) {
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
        this._logoImage = info.logoImage;
        this._nexus = info.nexus;
        this._nexusId = info.nexusId;
        this._nexusZone = info.nexusZone;

        this._correctedMapSize = getCorrectedMapSize(info.mapSize);
    }

    /* Getters and Setters */
    get name(): string { return this._name; }
    set name(name: string) { this._name = name; }
    get headerImage(): string { return this._headerImage; }
    set headerImage(headerImage: string) { this._headerImage = headerImage; }
    get url(): string { return this._url; }
    set url(url: string) { this._url = url; }
    get map(): string { return this._map; }
    set map(map: string) { this._map = map; }
    get mapSize(): number { return this._mapSize; }
    set mapSize(mapSize: number) { this._mapSize = mapSize; }
    get wipeTime(): number { return this._wipeTime; }
    set wipeTime(wipeTime: number) { this._wipeTime = wipeTime; }
    get players(): number { return this._players; }
    set players(players: number) { this._players = players; }
    get maxPlayers(): number { return this._maxPlayers; }
    set maxPlayers(maxPlayers: number) { this._maxPlayers = maxPlayers; }
    get queuedPlayers(): number { return this._queuedPlayers; }
    set queuedPlayers(queuedPlayers: number) { this._queuedPlayers = queuedPlayers; }
    get seed(): number { return this._seed; }
    set seed(seed: number) { this._seed = seed; }
    get salt(): number { return this._salt; }
    set salt(salt: number) { this._salt = salt; }
    get logoImage(): string { return this._logoImage; }
    set logoImage(logoImage: string) { this._logoImage = logoImage; }
    get nexus(): string { return this._nexus; }
    set nexus(nexus: string) { this._nexus = nexus; }
    get nexusId(): number { return this._nexusId; }
    set nexusId(nexusId: number) { this._nexusId = nexusId; }
    get nexusZone(): string { return this._nexusZone; }
    set nexusZone(nexusZone: string) { this._nexusZone = nexusZone; }
    get correctedMapSize(): number { return this._correctedMapSize; }
    set correctedMapSize(correctedMapSize: number) { this._correctedMapSize = correctedMapSize; }

    /* Change checkers */
    isNameChanged(info: InfoResponseData): boolean { return this.name !== info.name; }
    isHeaderImageChanged(info: InfoResponseData): boolean { return this.headerImage !== info.headerImage; }
    isUrlChanged(info: InfoResponseData): boolean { return this.url !== info.url; }
    isMapChanged(info: InfoResponseData): boolean { return this.map !== info.map; }
    isMapSizeChanged(info: InfoResponseData): boolean { return this.mapSize !== info.mapSize; }
    isWipeTimeChanged(info: InfoResponseData): boolean { return this.wipeTime !== info.wipeTime; }
    isPlayersChanged(info: InfoResponseData): boolean { return this.players !== info.players; }
    isMaxPlayersChanged(info: InfoResponseData): boolean { return this.maxPlayers !== info.maxPlayers; }
    isQueuedPlayersChanged(info: InfoResponseData): boolean { return this.queuedPlayers !== info.queuedPlayers; }
    isSeedChanged(info: InfoResponseData): boolean { return this.seed !== info.seed; }
    isSaltChanged(info: InfoResponseData): boolean { return this.salt !== info.salt; }
    isLogoImageChanged(info: InfoResponseData): boolean { return this.logoImage !== info.logoImage; }
    isNexusChanged(info: InfoResponseData): boolean { return this.nexus !== info.nexus; }
    isNexusIdChanged(info: InfoResponseData): boolean { return this.nexusId !== info.nexusId; }
    isNexusZoneChanged(info: InfoResponseData): boolean { return this.nexusZone !== info.nexusZone; }

    /* Other checkers */
    isMaxPlayersIncreased(info: InfoResponseData): boolean { return this.maxPlayers < info.maxPlayers; }
    isMaxPlayersDecreased(info: InfoResponseData): boolean { return this.maxPlayers > info.maxPlayers; }
    isQueue(): boolean { return this.queuedPlayers !== 0; }

    updateInfo(info: InfoResponseData) {
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
        this._logoImage = info.logoImage;
        this._nexus = info.nexus;
        this._nexusId = info.nexusId;
        this._nexusZone = info.nexusZone;

        this.correctedMapSize = getCorrectedMapSize(info.mapSize);
    }

    getSecondsSinceWipe(): number {
        return getTimeSince(new Date(this.wipeTime * 1000));
    }

    getTimeSinceWipe(ignore: string = ''): string {
        return secondsToFullScale(this.getSecondsSinceWipe(), ignore);
    }
}