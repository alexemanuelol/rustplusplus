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

import * as fs from 'fs';
import * as path from 'path';
import { Guild } from 'discord.js';

export default function createCredentialsFile(guild: Guild): void {
    const credentialsPath = path.join(__dirname, '..', '..', 'credentials', `${guild.id}.json`);

    if (!fs.existsSync(credentialsPath)) {
        fs.writeFileSync(credentialsPath, JSON.stringify({ hoster: null }, null, 2));
    }
}