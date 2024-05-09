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

import { localeManager } from '../../index';

export const GRID_DIAMETER: number = 146.25;

export interface MapLocation {
    location: string | null;
    monument: string | null;
    string: string | null;
    x: number;
    y: number;
}

export interface Monument {
    token: string;
    x: number;
    y: number;
}

export interface MonumentInfo {
    clean: string;
    map: string;
    radius: number;
}

export interface MonumentsInfo {
    [monument: string]: MonumentInfo;
}

export function getPos(locale: string, x: number, y: number, mapSize: number,
    monuments: Monument[] | null = null, monumentsInfo: MonumentsInfo | null = null): MapLocation {
    const correctedMapSize: number = getCorrectedMapSize(mapSize);
    const location: MapLocation = {
        location: null,
        monument: null,
        string: null,
        x: x,
        y: y
    };

    if (isOutsideGridSystem(x, y, correctedMapSize)) {
        if (isOutsideRowOrColumn(x, y, correctedMapSize)) {
            if (x < 0 && y > correctedMapSize) {
                location.location = localeManager.getIntl(locale, 'northWest');
            }
            else if (x < 0 && y < 0) {
                location.location = localeManager.getIntl(locale, 'southWest');
            }
            else if (x > correctedMapSize && y > correctedMapSize) {
                location.location = localeManager.getIntl(locale, 'northEast');
            }
            else {
                location.location = localeManager.getIntl(locale, 'southEast');
            }
        }
        else {
            let str = '';
            if (x < 0 || x > correctedMapSize) {
                str += (x < 0) ? localeManager.getIntl(locale, 'westOfGrid') :
                    localeManager.getIntl(locale, 'eastOfGrid');
                str += ` ${getGridPosNumberY(y, correctedMapSize)}`;
            }
            else {
                str += (y < 0) ? localeManager.getIntl(locale, 'southOfGrid') :
                    localeManager.getIntl(locale, 'northOfGrid');
                str += ` ${getGridPosLettersX(x, correctedMapSize)}`;
            }
            location.location = str;
        }
    }
    else {
        location.location = getGridPos(x, y, mapSize);
    }

    if (monuments !== null && monumentsInfo !== null) {
        for (const monument of monuments) {
            if (monument.token === 'DungeonBase' || !(monument.token in monumentsInfo)) continue;
            if (getDistance(x, y, monument.x, monument.y) <=
                monumentsInfo[monument.token].radius) {
                location.monument = monumentsInfo[monument.token].clean;
                break;
            }
        }
    }

    location.string = `${location.location}${location.monument !== null ? ` (${location.monument})` : ''}`;

    return location;
}

export function getGridPos(x: number, y: number, mapSize: number): string | null {
    const correctedMapSize: number = getCorrectedMapSize(mapSize);

    /* Outside the grid system */
    if (isOutsideGridSystem(x, y, correctedMapSize)) {
        return null;
    }

    const gridPosLetters: string = getGridPosLettersX(x, correctedMapSize);
    const gridPosNumber: number = getGridPosNumberY(y, correctedMapSize);

    return gridPosLetters + gridPosNumber;
}

export function getGridPosLettersX(x: number, mapSize: number): string {
    let counter: number = 1;
    let gridLetters: string = '?';
    for (let startGrid: number = 0; startGrid < mapSize; startGrid += GRID_DIAMETER) {
        if (x >= startGrid && x <= (startGrid + GRID_DIAMETER)) {
            /* We're at the correct grid! */
            gridLetters = numberToLetters(counter);
            break;
        }
        counter++;
    }
    return gridLetters;
}

export function getGridPosNumberY(y: number, mapSize: number): number {
    let counter: number = 1;
    let gridNumber: number = 0;
    const numberOfGrids = Math.floor(mapSize / GRID_DIAMETER);
    for (let startGrid: number = 0; startGrid < mapSize; startGrid += GRID_DIAMETER) {
        if (y >= startGrid && y <= (startGrid + GRID_DIAMETER)) {
            /* We're at the correct grid! */
            gridNumber = numberOfGrids - counter;
            break;
        }
        counter++;
    }
    return gridNumber;
}

export function numberToLetters(number: number): string {
    const mod: number = number % 26;
    let pow: number = number / 26 | 0;
    const out: string = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
    return pow ? numberToLetters(pow) + out : out;
}

export function getCorrectedMapSize(mapSize: number): number {
    const remainder: number = mapSize % GRID_DIAMETER;
    const offset: number = GRID_DIAMETER - remainder;
    return (remainder < 120) ? mapSize - remainder : mapSize + offset;
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

export function isOutsideRowOrColumn(x: number, y: number, mapSize: number): boolean {
    if ((x < 0 && y > mapSize) || (x < 0 && y < 0) || (x > mapSize && y > mapSize) || (x > mapSize && y < 0)) {
        return true;
    }
    return false;
}