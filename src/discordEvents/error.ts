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

import { log } from '../../index';
import { DiscordManager } from '../managers/discordManager';

export const name = 'error';
export const once = false;

export function execute(dm: DiscordManager, error: Error) {
    const fName = `[discordEvent: ${name}]`;

    const errorString = formatError(error);
    const errorLineArray = errorString.split('\n');
    for (const line of errorLineArray) {
        log.error(`${fName} ${line}`);
    }
}

function formatError(error: Error): string {
    return `Error: ${error.message}\n` +
        `Stack Trace:\n${error.stack}\n` +
        `Code: ${'code' in error ? error.code : 'Unknown'}\n` +
        `Require Stack: ${'requireStack' in error ? JSON.stringify(error.requireStack, null, 2) : 'Unknown'}`;
}