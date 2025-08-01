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
export class RustPlusInfo {
    public rpInstance: RustPlusInstance;
    public appInfo: rp.AppInfo;

    constructor(rpInstance: RustPlusInstance, appInfo: rp.AppInfo) {
        this.rpInstance = rpInstance;
        this.appInfo = appInfo
    }

    public updateInfo(appInfo: rp.AppInfo) {
        this.appInfo = appInfo
    }

    public isNameChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.name !== appInfo.name;
    }

    public isHeaderImageChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.headerImage !== appInfo.headerImage;
    }

    public isUrlChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.url !== appInfo.url;
    }

    public isMapChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.map !== appInfo.map;
    }

    public isMapSizeChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.mapSize !== appInfo.mapSize;
    }

    public isWipeTimeChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.wipeTime !== appInfo.wipeTime;
    }

    public isPlayersChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.players !== appInfo.players;
    }

    public isMaxPlayersChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.maxPlayers !== appInfo.maxPlayers;
    }

    public isQueuedPlayersChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.queuedPlayers !== appInfo.queuedPlayers;
    }

    public isSeedChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.seed !== appInfo.seed;
    }

    public isSaltChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.salt !== appInfo.salt;
    }

    public isLogoImageChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.logoImage !== appInfo.logoImage;
    }

    public isNexusChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.nexus !== appInfo.nexus;
    }

    public isNexusIdChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.nexusId !== appInfo.nexusId;
    }

    public isNexusZoneChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.nexusZone !== appInfo.nexusZone;
    }

    public isCamerasEnabledChanged(appInfo: rp.AppInfo): boolean {
        return this.appInfo.camerasEnabled !== appInfo.camerasEnabled;
    }

    public isMaxPlayersIncreased(appInfo: rp.AppInfo) {
        return ((this.appInfo.maxPlayers) < (appInfo.maxPlayers));
    }

    public isMaxPlayersDecreased(appInfo: rp.AppInfo) {
        return ((this.appInfo.maxPlayers) > (appInfo.maxPlayers));
    }

    public isQueue(): boolean {
        return this.appInfo.queuedPlayers !== 0;
    }

    public getSecondsSinceWipe(): number {
        return Math.floor((Date.now() / 1000) - this.appInfo.wipeTime);
    }

    public getTimeSinceWipe(ignore: string = ''): string {
        return secondsToFullScale(this.getSecondsSinceWipe(), ignore);
    }
}