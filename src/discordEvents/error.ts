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

import { log } from '../../index';

export const name = 'error';

export async function execute(error: Error) {
    const errorString = formatError(error);
    const errorLineArray = errorString.split('\n');
    for (const line of errorLineArray) {
        log.error(line)
    }
    process.exit(1);
}

function formatError(error: Error): string {
    return `Error: ${error.message}\n` +
        `Stack Trace:\n${error.stack}\n` +
        `Code: ${(<any>error).code}\n` +
        `Require Stack: ${JSON.stringify((<any>error).requireStack, null, 2)}`;
}