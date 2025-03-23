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

import * as rp from 'rustplus-ts';

import { localeManager as lm } from '../../index';
import { MonumentsMapInfo } from '../structures/rustPlusMap';

export const GRID_DIAMETER: number = 146.25;

export interface MapLocation {
    location: string | null;
    monument: string | null;
    string: string | null;
    x: number;
    y: number;
}

export function isValidMapLocation(object: any): object is MapLocation {
    if (typeof object !== 'object' || object === null) {
        return false;
    }

    const hasValidLocation = object.location === null || typeof object.location === 'string';
    const hasValidMonument = object.monument === null || typeof object.monument === 'string';
    const hasValidString = object.string === null || typeof object.string === 'string';
    const hasValidX = typeof object.x === 'number';
    const hasValidY = typeof object.y === 'number';

    const validKeys = [
        'location', 'monument', 'string', 'x', 'y'
    ];
    const hasOnlyValidKeys = Object.keys(object).every(key => validKeys.includes(key));

    return hasValidLocation && hasValidMonument && hasValidString && hasValidX && hasValidY && hasOnlyValidKeys;
}

export function getPos(locale: string, x: number, y: number, mapSize: number,
    monuments: rp.AppMap_Monument[] | null = null, monumentsMapInfo: MonumentsMapInfo | null = null): MapLocation {
    const location: MapLocation = {
        location: null,
        monument: null,
        string: null,
        x: x,
        y: y
    };

    if (isOutsideGridSystem(x, y, mapSize)) {
        if (isOutsideRowOrColumn(x, y, mapSize)) {
            if (x < 0 && y > mapSize) {
                location.location = lm.getIntl(locale, 'northWest');
            }
            else if (x < 0 && y < 0) {
                location.location = lm.getIntl(locale, 'southWest');
            }
            else if (x > mapSize && y > mapSize) {
                location.location = lm.getIntl(locale, 'northEast');
            }
            else {
                location.location = lm.getIntl(locale, 'southEast');
            }
        }
        else {
            let str = '';
            if (x < 0 || x > mapSize) {
                str += (x < 0) ? lm.getIntl(locale, 'westOfGrid') :
                    lm.getIntl(locale, 'eastOfGrid');
                str += ` ${getGridPosNumberY(y, mapSize)}`;
            }
            else {
                str += (y < 0) ? lm.getIntl(locale, 'southOfGrid') :
                    lm.getIntl(locale, 'northOfGrid');
                str += ` ${getGridPosLettersX(x, mapSize)}`;
            }
            location.location = str;
        }
    }
    else {
        location.location = getGridPos(x, y, mapSize);
    }

    if (monuments !== null && monumentsMapInfo !== null) {
        for (const monument of monuments) {
            if (monument.token === 'DungeonBase' || !(monument.token in monumentsMapInfo)) continue;
            if (getDistance(x, y, monument.x, monument.y) <=
                monumentsMapInfo[monument.token as keyof MonumentsMapInfo].radius) {
                location.monument = monumentsMapInfo[monument.token as keyof MonumentsMapInfo].name_clean;
                break;
            }
        }
    }

    location.string = `${location.location}${location.monument !== null ? ` (${location.monument})` : ''}`;

    return location;
}

export function getGridPos(x: number, y: number, mapSize: number): string | null {
    /* Outside the grid system */
    if (isOutsideGridSystem(x, y, mapSize)) {
        return null;
    }

    const gridPosLetters: string = getGridPosLettersX(x, mapSize);
    const gridPosNumber: number = getGridPosNumberY(y, mapSize);

    return gridPosLetters + gridPosNumber;
}

export function getGridPosLettersX(x: number, mapSize: number): string {
    let counter = 1;
    let gridLetters = '?';
    for (let startGrid = 0; startGrid < mapSize; startGrid += GRID_DIAMETER) {
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
    let counter = 1;
    let gridNumber = 0;
    const numberOfGrids = Math.floor(mapSize / GRID_DIAMETER);
    for (let startGrid = 0; startGrid < mapSize; startGrid += GRID_DIAMETER) {
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
    const mod = number % 26;
    let pow = number / 26 | 0;
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

export function isOutsideRowOrColumn(x: number, y: number, mapSize: number): boolean {
    if ((x < 0 && y > mapSize) || (x < 0 && y < 0) || (x > mapSize && y > mapSize) || (x > mapSize && y < 0)) {
        return true;
    }
    return false;
}