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

import { log } from '../../index';

export interface CctvCodesMap {
    [monument: string]: string[];
}

export class CctvCodes {
    private cctvCodesFilePath: string;
    private cctvCodes: CctvCodesMap;

    constructor() {
        this.cctvCodesFilePath = path.join(__dirname, '..', 'staticFiles', 'cctvCodes.json');
        this.cctvCodes = {};

        this.loadAllCctvCodes();
    }

    private loadAllCctvCodes() {
        const fn = `[CctvCodes: loadAllCctvCodes]`;
        log.debug(`${fn} Reading all cctv codes.`);

        const cctvCodesFileContent = fs.readFileSync(this.cctvCodesFilePath, 'utf8');
        const cctvCodesFileContentParsed = JSON.parse(cctvCodesFileContent);

        log.debug(`${fn} Cctv codes file was successfully read.`);
        this.cctvCodes = cctvCodesFileContentParsed as CctvCodesMap;
    }

    public getCctvMonuments(): string[] {
        return Object.keys(this.cctvCodes);
    }

    public getCctvCodes(monument: string): string[] {
        if (!(monument in this.cctvCodes)) return [];
        return this.cctvCodes[monument];
    }

    public getAllCctvCodes(): CctvCodesMap {
        return this.cctvCodes;
    }
}