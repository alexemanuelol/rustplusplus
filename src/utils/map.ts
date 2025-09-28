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

export interface Point {
    x: number;
    y: number;
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
    const margin = 1;

    for (grid = 0; grid < numberOfGrids; grid++) {
        if (grid === (numberOfGrids - 1) || x > mapSize) break;
        const left = grid * gridDiameter;
        const right = left + gridDiameter;
        if ((x + margin) < right) break;
    }

    return numberToLetters(grid + 1);
}

export function getGridPosNumberY(y: number, mapSize: number): number {
    let grid;
    const numberOfGrids = Math.floor(mapSize / constants.GRID_DIAMETER);
    const gridDiameter = mapSize / numberOfGrids;
    const margin = 1;

    for (grid = 0; grid < numberOfGrids; grid++) {
        if (grid === (numberOfGrids - 1) || y > mapSize) break;
        const upper = mapSize - (grid * gridDiameter);
        const lower = upper - gridDiameter;
        if ((y - margin) > lower) break;
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

export function isSameDirection(p1: Point, p2: Point, p3: Point, threshold: number = 0.017): boolean {
    /* threshold default = ~1° in radians */

    /* Vector A (p1 -> p2) */
    const ax = p2.x - p1.x;
    const ay = p2.y - p1.y;

    /* Vector B (p2 -> p3) */
    const bx = p3.x - p2.x;
    const by = p3.y - p2.y;

    /* normalize A */
    const amag = Math.sqrt(ax * ax + ay * ay);
    if (amag === 0) return false;
    const nax = ax / amag;
    const nay = ay / amag;

    /* normalize B */
    const bmag = Math.sqrt(bx * bx + by * by);
    if (bmag === 0) return false;
    const nbx = bx / bmag;
    const nby = by / bmag;

    /* dot product */
    const dot = nax * nbx + nay * nby;
    /* clamp to avoid NaN due to float precision */
    const clamped = Math.min(1, Math.max(-1, dot));

    /* angle between vectors */
    const angle = Math.acos(clamped);

    return angle < threshold;
}

export function isFacing(point1: Point, point2: Point, rotation: number, thresholdDeg: number = 30): boolean {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const mag = Math.sqrt(dx * dx + dy * dy);
    if (mag === 0) return true;

    const dirX = dx / mag;
    const dirY = dy / mag;

    const rad = (rotation * Math.PI) / 180;
    const fx = -Math.sin(rad);
    const fy = Math.cos(rad);

    const dot = fx * dirX + fy * dirY;
    const angle = Math.acos(dot) * (180 / Math.PI);

    return angle <= thresholdDeg;
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