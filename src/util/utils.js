/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

module.exports = {
    parseArgs: function (str) {
        return str.trim().split(/[ ]+/);
    },

    getArgs: function (str, n = 0) {
        const args = this.parseArgs(str);
        if (isNaN(n)) n = 0;
        if (n < 1) return args;
        const newArgs = [];

        let remain = str;
        let counter = 1;
        for (const arg of args) {
            if (counter === n) {
                newArgs.push(remain);
                break;
            }
            remain = remain.slice(arg.length).trim();
            newArgs.push(arg);
            counter += 1;
        }

        return newArgs;
    },

    decodeHtml: function (str) {
        const htmlReservedSymbols = JSON.parse(Fs.readFileSync(
            Path.join(__dirname, '..', 'staticFiles', 'htmlReservedSymbols.json'), 'utf8'));

        for (const [key, value] of Object.entries(htmlReservedSymbols)) {
            str = str.replace(key, value);
        }

        return str;
    },

    removeInvisibleCharacters: function (str) {
        str = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
        return str.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    },
}