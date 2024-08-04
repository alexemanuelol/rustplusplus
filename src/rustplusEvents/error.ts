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

import { localeManager as lm } from "../../index";
const { RustPlus } = require('../structures/RustPlus');
const Config = require('../../config');

export const name = 'error';

export async function execute(rustplus: typeof RustPlus, err: any) {
    if (!rustplus.isServerAvailable()) return rustplus.deleteThisRustplusInstance();

    rustplus.error(err);

    switch (err.code) {
        case 'ETIMEDOUT': {
            errorTimedOut(rustplus, err);
        } break;

        case 'ENOTFOUND': {
            errorNotFound(rustplus, err);
        } break;

        case 'ECONNREFUSED': {
            await errorConnRefused(rustplus, err);
        } break;

        default: {
            errorOther(rustplus, err);
        } break;
    }
}

function errorTimedOut(rustplus: typeof RustPlus, err: any) {
    if (err.syscall === 'connect') {
        rustplus.error(lm.getIntl(Config.general.language, 'couldNotConnectTo', {
            id: rustplus.serverId
        }));
    }
}

function errorNotFound(rustplus: typeof RustPlus, err: any) {
    if (err.syscall === 'getaddrinfo') {
        rustplus.error(lm.getIntl(Config.general.language, 'couldNotConnectTo', {
            id: rustplus.serverId
        }));
    }
}

async function errorConnRefused(rustplus: typeof RustPlus, err: any) {
    rustplus.error(lm.getIntl(Config.general.language, 'connectionRefusedTo', {
        id: rustplus.serverId
    }));
}

function errorOther(rustplus: typeof RustPlus, err: any) {
    if (err.toString() === 'Error: WebSocket was closed before the connection was established') {
        rustplus.error(lm.getIntl(Config.general.language, 'websocketClosedBeforeConnection'));
    }
}