/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)
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

const Fs = require('fs');
const Path = require('path');

class Cctv {
    constructor() {
        this._cctvs = JSON.parse(Fs.readFileSync(
            Path.join(__dirname, '..', 'staticFiles', 'cctv.json'), 'utf8'));
    }

    /* Getters and Setters */
    get cctvs() { return this._cctvs; }
    set cctvs(cctvs) { this._cctvs = cctvs; }

    cctvExist(monument) { return (monument in this.cctvs) ? true : false; }

    isDynamic(monument) {
        if (!this.cctvExist(monument)) return undefined;
        return this.cctvs[monument].dynamic;
    }

    getCodes(monument) {
        if (!this.cctvExist(monument)) return undefined;
        return this.cctvs[monument].codes;
    }

}

module.exports = Cctv;