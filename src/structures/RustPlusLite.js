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

const RustPlusLib = require('@liamcottle/rustplus.js');

const Client = require('../../index.ts');

class RustPlusLite extends RustPlusLib {
    constructor(guildId, logger, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.serverId = `${this.server}-${this.port}`;
        this.guildId = guildId;

        this.logger = logger;

        /* Status flags */
        this.isActive = true;
        this.isConnected = false;
        this.isReconnecting = false;
        this.isOperational = false;
        this.isConnectionRefused = false;
        this.isDeleted = false;

        this.loadRustPlusLiteEvents();
    }

    loadRustPlusLiteEvents() {
        this.on('connected', (...args) => rustPlusLiteConnectedEvent(this, ...args));
        this.on('connecting', (...args) => rustPlusLiteConnectingEvent(this, ...args));
        this.on('disconnected', (...args) => rustPlusLiteDisconnectedEvent(this, ...args));
        this.on('error', (...args) => rustPlusLiteErrorEvent(this, ...args));
    }

    log(title, text, level = 'info') {
        this.logger.log(`${title} LITE`, text, level);
    }

    async getInfoAsync(timeout = 10000) {
        try {
            return await this.sendRequestAsync({
                getInfo: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async promoteToLeaderAsync(steamId, timeout = 10000) {
        try {
            return await this.sendRequestAsync({
                promoteToLeader: {
                    steamId: steamId
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    isResponseValid(response) {
        if (response === undefined) {
            this.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'responseIsUndefined'), 'error');
            return false;
        }
        else if (response.toString() === 'Error: Timeout reached while waiting for response') {
            this.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'responseTimeout'), 'error');
            return false;
        }
        else if (response.hasOwnProperty('error')) {
            this.log(Client.client.intlGet(null, 'errorCap'), Client.client.intlGet(null, 'responseContainError', {
                error: response.error
            }), 'error');
            return false;
        }
        else if (Object.keys(response).length === 0) {
            this.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'responseIsEmpty'), 'error');
            return false;
        }
        return true;
    }
}

async function rustPlusLiteConnectedEvent(rustplus) {
    rustplus.log(Client.client.intlGet(null, 'connectedCap'),
        Client.client.intlGet(null, 'connectedToServer'));
    rustplus.isConnected = true;
    rustplus.isConnectionRefused = false;

    const info = await rustplus.getInfoAsync();
    if (!rustplus.isResponseValid(info)) {
        rustplus.log(Client.client.intlGet(null, 'errorCap'),
            Client.client.intlGet(null, 'somethingWrongWithConnection'), 'error');

        rustplus.disconnect();
        return;
    }
    rustplus.log(Client.client.intlGet(null, 'connectedCap'),
        Client.client.intlGet(null, 'rustplusOperational'));
    rustplus.isReconnecting = false;
    rustplus.isOperational = true;
}

async function rustPlusLiteConnectingEvent(rustplus) {
    rustplus.log(Client.client.intlGet(null, 'connectingCap'),
        Client.client.intlGet(null, 'connectingToServer'));
}

async function rustPlusLiteDisconnectedEvent(rustplus) {
    rustplus.log(Client.client.intlGet(null, 'disconnectedCap'),
        Client.client.intlGet(null, 'disconnectedFromServer'));
    rustplus.isConnected = false;
    rustplus.isOperational = false;

    if (rustplus.isActive && !rustplus.isConnectionRefused) {
        rustplus.isReconnecting = true;
        rustplus.log(Client.client.intlGet(null, 'reconnectingCap'),
            Client.client.intlGet(null, 'reconnectingToServer'));
        rustplus.connect();
    }
}

async function rustPlusLiteErrorEvent(rustplus, error) {
    rustplus.log(Client.client.intlGet(null, 'errorCap'), err, 'error');

    if (error.code === 'ECONNREFUSED') {
        rustplus.isReconnecting = true;
        rustplus.isConnectionRefused = true;

        setTimeout(() => {
            rustplus.log(Client.client.intlGet(null, 'reconnectingCap'),
                Client.client.intlGet(null, 'reconnectingToServer'));
            rustplus.connect();
        }, 20000);
    }
}

module.exports = RustPlusLite;
