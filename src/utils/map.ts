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

import * as fs from 'fs';
import * as path from 'path';

import { localeManager as lm, guildInstanceManager as gim } from "../../index";
import { GuildInstance } from "../managers/guildInstanceManager";
import { RustPlusInstance } from "../managers/rustPlusManager";
import * as constants from '../utils/constants';


export enum Outside {
    N = 'north',
    E = 'east',
    S = 'south',
    W = 'west'
}

export enum Corner {
    NW = 'northWest',
    SW = 'southWest',
    NE = 'northEast',
    SE = 'southEast'
}
export interface Position {
    x: number;
    y: number;
    grid: string | null;
    monument: string;
    outside: Outside | null;
    corner: Corner | null;
}

export interface MonumentsInfo {
    monuments: {
        [monumentName: string]: { radius: number };
    }
}

export function getPos(x: number, y: number, rpInstance: RustPlusInstance): Position | null {
    const gInstance = gim.getGuildInstance(rpInstance.guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const mapSize = rpInstance.rpInfo?.appInfo.mapSize;
    const monuments = rpInstance.rpMap?.appMap.monuments;
    if (!mapSize || !monuments) return null;

    const pos: Position = {
        x: x,
        y: y,
        grid: null,
        monument: '',
        outside: null,
        corner: null
    }

    if (isOutsideGridSystem(x, y, mapSize)) {
        if (isOutsideGridCorners(x, y, mapSize)) {
            if (x < 0 && y > mapSize) {
                pos.corner = Corner.NW;
            }
            else if (x < 0 && y < 0) {
                pos.corner = Corner.SW;
            }
            else if (x > mapSize && y > mapSize) {
                pos.corner = Corner.NE;
            }
            else {
                pos.corner = Corner.SE;
            }
        }
        else {
            if (x < 0) {
                pos.outside = Outside.W;
            }
            else if (x > mapSize) {
                pos.outside = Outside.E;
            }
            else if (y < 0) {
                pos.outside = Outside.S;
            }
            else {
                pos.outside = Outside.N;
            }
        }
    }
    else {
        pos.grid = getGridPos(x, y, mapSize) as string;
    }

    const monumentsInfo = getMonumentsInfo().monuments;
    for (const monument of monuments) {
        if (monument.token === 'DungeonBase' || !(monument.token in Object.keys(monumentsInfo))) continue;
        if (getDistance(x, y, monument.x, monument.y) <=
            monumentsInfo[monument.token].radius) {
            pos.monument = lm.getIntl(language, `monumentName-${monument.token}`);
            break;
        }
    }

    return pos;
}

export function getPosString(position: Position, rpInstance: RustPlusInstance, short: boolean = false,
    monument: boolean = false): string {
    const gInstance = gim.getGuildInstance(rpInstance.guildId) as GuildInstance;
    const language = gInstance.generalSettings.language;
    const mapSize = rpInstance.rpInfo?.appInfo.mapSize;
    if (!mapSize) return '';

    let str = '';
    if (position.grid) {
        str = position.grid;
    }
    else if (position.outside) {
        const outside = (position.outside === Outside.W || position.outside === Outside.E) ?
            `${getGridPosNumberY(position.y, mapSize)}` :
            `${getGridPosLettersX(position.x, mapSize)}`;
        const phrase = `${position.outside}OfGrid${short ? 'Short' : ''}`;
        str = lm.getIntl(language, phrase, { outside: outside });
    }
    else {
        str = lm.getIntl(language, `${position.corner}${short ? 'Short' : ''}`);
    }

    if (monument) {
        str = `${str}${position.monument ? ` (${position.monument})` : ''}`;
    }

    return str;
}

export function getGridPos(x: number, y: number, mapSize: number): string | null {
    if (isOutsideGridSystem(x, y, mapSize)) return null;

    const gridPosLetters = getGridPosLettersX(x, mapSize);
    const gridPosNumber = getGridPosNumberY(y, mapSize);

    return gridPosLetters + gridPosNumber;
}

export function getGridPosLettersX(x: number, mapSize: number): string {
    let grid;
    const numberOfGrids = Math.floor(mapSize / constants.GRID_DIAMETER);
    const gridDiameter = mapSize / numberOfGrids;
    for (grid = 0; grid < numberOfGrids; grid++) {
        if (grid === (numberOfGrids - 1) || x > mapSize) break;
        if (x >= (grid * gridDiameter) && x < ((grid * gridDiameter) + gridDiameter)) break;
    }
    return numberToLetters(grid + 1);
}

export function getGridPosNumberY(y: number, mapSize: number): number {
    let grid;
    const numberOfGrids = Math.floor(mapSize / constants.GRID_DIAMETER);
    const gridDiameter = mapSize / numberOfGrids;
    for (grid = 0; grid < numberOfGrids; grid++) {
        if (grid === (numberOfGrids - 1) || y > mapSize) break;
        if (y <= (mapSize - grid * gridDiameter) && y > ((mapSize - grid * gridDiameter) - gridDiameter)) break;
    }
    return grid;
}

export function numberToLetters(num: number): string {
    const mod = num % 26;
    let pow = num / 26 | 0;
    const out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
    return pow ? numberToLetters(pow) + out : out;
}

export function getAngleBetweenPoints(x1: number, y1: number, x2: number, y2: number): number {
    let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

    if (angle < 0) {
        angle = 360 + angle;
    }

    return Math.floor((Math.abs(angle - 360) + 90) % 360);
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
    /* Pythagoras is the man! */
    const a = x1 - x2;
    const b = y1 - y2;
    return Math.sqrt(a * a + b * b);
}

export function isOutsideGridSystem(x: number, y: number, mapSize: number, offset: number = 0): boolean {
    if (x < -offset || x > (mapSize + offset) || y < -offset || y > (mapSize + offset)) {
        return true;
    }
    return false;
}

export function isOutsideGridCorners(x: number, y: number, mapSize: number): boolean {
    if ((x < 0 && y > mapSize) || (x < 0 && y < 0) || (x > mapSize && y > mapSize) || (x > mapSize && y < 0)) {
        return true;
    }
    return false;
}

export function getMonumentsInfo(): MonumentsInfo {
    const monumentsFilePath = path.join(__dirname, '..', 'staticFiles', 'monuments.json');

    const monumentsFileContent = fs.readFileSync(monumentsFilePath, 'utf8');
    const monumentsFileContentParsed = JSON.parse(monumentsFileContent);

    return monumentsFileContentParsed as MonumentsInfo;
}