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

import { log } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { RustPlusInfo } from '../structures/rustPlusInfo';

export async function handler(rpInstance: RustPlusInstance, info: rp.AppInfo) {
    const fn = '[rustPlusInfoHandler: handler]';
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    if ((rpInstance.rpInfo as RustPlusInfo).isNameChanged(info)) {
        log.info(`${fn} name changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.name}, ` +
            `new: ${info.name}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isHeaderImageChanged(info)) {
        log.info(`${fn} headerImage changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.headerImage}, ` +
            `new: ${info.headerImage}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isUrlChanged(info)) {
        log.info(`${fn} url changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.url}, ` +
            `new: ${info.url}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isMapChanged(info)) {
        log.info(`${fn} map changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.map}, ` +
            `new: ${info.map}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isMapSizeChanged(info)) {
        log.info(`${fn} mapSize changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.mapSize}, ` +
            `new: ${info.mapSize}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isWipeTimeChanged(info)) {
        log.info(`${fn} wipeTime changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.wipeTime}, ` +
            `new: ${info.wipeTime}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isPlayersChanged(info)) {
        //log.info(`${fn} players changed, ` +
        //    `old: ${rpInstance.rpInfo?.appInfo.players}, ` +
        //    `new: ${info.players}`,
        //    logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isMaxPlayersChanged(info)) {
        log.info(`${fn} maxPlayers changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.maxPlayers}, ` +
            `new: ${info.maxPlayers}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isQueuedPlayersChanged(info)) {
        //log.info(`${fn} queuedPlayers changed, ` +
        //    `old: ${rpInstance.rpInfo?.appInfo.queuedPlayers}, ` +
        //    `new: ${info.queuedPlayers}`,
        //    logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isSeedChanged(info)) {
        log.info(`${fn} seed changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.seed}, ` +
            `new: ${info.seed}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isSaltChanged(info)) {
        log.info(`${fn} salt changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.salt}, ` +
            `new: ${info.salt}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isLogoImageChanged(info)) {
        log.info(`${fn} logoImage changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.logoImage}, ` +
            `new: ${info.logoImage}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isNexusChanged(info)) {
        log.info(`${fn} nexus changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.nexus}, ` +
            `new: ${info.nexus}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isNexusIdChanged(info)) {
        log.info(`${fn} nexusId changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.nexusId}, ` +
            `new: ${info.nexusId}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isNexusZoneChanged(info)) {
        log.info(`${fn} nexusZone changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.nexusZone}, ` +
            `new: ${info.nexusZone}`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isCamerasEnabledChanged(info)) {
        log.info(`${fn} camerasEnabled changed, ` +
            `old: ${rpInstance.rpInfo?.appInfo.camerasEnabled}, ` +
            `new: ${info.camerasEnabled}`,
            logParam);
    }

    /**
     * Custom handlers
     */

    if ((rpInstance.rpInfo as RustPlusInfo).isMaxPlayersIncreased(info)) {
        log.info(`${fn} Max players increased from ` +
            `${rpInstance.rpInfo?.appInfo.maxPlayers} to ` +
            `${info.maxPlayers}.`,
            logParam);
    }

    if ((rpInstance.rpInfo as RustPlusInfo).isMaxPlayersDecreased(info)) {
        log.info(`${fn} Max players decreased from ` +
            `${rpInstance.rpInfo?.appInfo.maxPlayers} to ` +
            `${info.maxPlayers}.`,
            logParam);
    }
}