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

/*
 * This script is used to combine all of the item meta .json files from
 * the Rust game directory "<drive>:\SteamLibrary\steamapps\common\Rust\Bundles\items"
 * into a single items.json file to be used in this project.
 */

const Fs = require('fs');

var items = {};

/* Iterate each file in current directory. */
Fs.readdirSync('.').forEach(file => {
    /* Check if file is item meta file. */
    if (file.endsWith('.json')) {

        /* Read item meta. */
        var item = JSON.parse(Fs.readFileSync(file));

        /* Push item meta we want to keep. */
        items[item.itemid] = {
            shortname: item.shortname,
            name: item.Name,
            description: item.Description
        };
    }
});

/* Write formatted json to items.json. */
Fs.writeFileSync('items.json', JSON.stringify(items, null, 4));