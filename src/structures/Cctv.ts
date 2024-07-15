/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2023 Squidysquid1

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

export interface CctvData {
    [monument: string]: {
        dynamic: boolean;
        codes: string[];
    };
}

export class Cctv {
    cctvs: CctvData;

    constructor() {
        const filePath = path.join(__dirname, '..', 'staticFiles', 'cctv.json');
        this.cctvs = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }

    cctvExist(monument: string): boolean {
        return monument in this.cctvs;
    }

    isDynamic(monument: string): boolean | null {
        if (!this.cctvExist(monument)) return null;
        return this.cctvs[monument].dynamic;
    }

    getCodes(monument: string): string[] | null {
        if (!this.cctvExist(monument)) return null;
        return this.cctvs[monument].codes;
    }
}