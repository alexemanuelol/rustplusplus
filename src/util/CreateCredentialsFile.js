/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

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

module.exports = (client, guild) => {
    if (!Fs.existsSync(Path.join(__dirname, '..', '..', 'credentials', `${guild.id}.json`))) {
        Fs.writeFileSync(Path.join(__dirname, '..', '..', 'credentials', `${guild.id}.json`),
            JSON.stringify({ hoster: null }, null, 2));
    }
};
