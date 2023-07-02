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

const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'error',
    async execute(rustplus, client, err) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisRustplusInstance();

        rustplus.log(client.intlGet(null, 'errorCap'), err, 'error');

        switch (err.code) {
            case 'ETIMEDOUT': {
                errorTimedOut(rustplus, client, err);
            } break;

            case 'ENOTFOUND': {
                errorNotFound(rustplus, client, err);
            } break;

            case 'ECONNREFUSED': {
                await errorConnRefused(rustplus, client, err);
            } break;

            default: {
                errorOther(rustplus, client, err);
            } break;
        }
    },
};

function errorTimedOut(rustplus, client, err) {
    if (err.syscall === 'connect') {
        rustplus.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'couldNotConnectTo', {
            id: rustplus.serverId
        }), 'error');
    }
}

function errorNotFound(rustplus, client, err) {
    if (err.syscall === 'getaddrinfo') {
        rustplus.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'couldNotConnectTo', {
            id: rustplus.serverId
        }), 'error');
    }
}

async function errorConnRefused(rustplus, client, err) {
    rustplus.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'connectionRefusedTo', {
        id: rustplus.serverId
    }), 'error');
}

function errorOther(rustplus, client, err) {
    if (err.toString() === 'Error: WebSocket was closed before the connection was established') {
        rustplus.log(client.intlGet(null, 'errorCap'),
            client.intlGet(null, 'websocketClosedBeforeConnection'), 'error');
    }
}