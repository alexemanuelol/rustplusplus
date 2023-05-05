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

const RandomUsernames = require('./RandomUsernames.json');
const Scrape = require('./scrape.js');

module.exports = {
    getBattlemetricsServerId: async function (client, serverName) {
        let searchServerName = encodeURI(serverName);
        serverName = module.exports.escapeRegExp(serverName);
        searchServerName = searchServerName.replace('\#', '\*');
        const search = `https://api.battlemetrics.com/servers?filter[search]=${searchServerName}&filter[game]=rust`;
        const response = await Scrape.scrape(search);

        if (response.status !== 200) {
            client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'failedToScrape', {
                scrape: search
            }), 'error')
            return null;
        }

        let id = response.data['data'][0]['attributes'].id;

        try {
            if (id !== null) {
                return id;
            }
        }
        catch (e) { }

        return null;
    },

    getBattlemetricsServerPage: async function (client, serverId) {
        const search = `https://api.battlemetrics.com/servers/${serverId}?include=player`;
        const response = await Scrape.scrape(search);

        if (response.status !== 200) {
            client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'failedToScrape', {
                scrape: search
            }), 'error')
            return null;
        }
        return response['data'];
    },

    getBattlemetricsServerInfo: async function (client, serverId, page = null) {
        if (page === null) {
            page = await module.exports.getBattlemetricsServerPage(client, serverId);

            if (page === null) {
                client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'failedToGetServerInfo', {
                    id: serverId
                }), 'error')
                return null;
            }
        }
        let data = page['data']['attributes']
        try {
            if (page.length !== null) {
                return {
                    ip: data.ip,
                    port: data.port,
                    rank: data.rank,
                    country: data.country,
                    status: (data.status === 'online') ? true : false
                }
            }
        }
        catch (e) { }

        return null;
    },

    getBattlemetricsServerOnlinePlayers: async function (client, serverId, page = null) {
        if (page === null) {
            page = await module.exports.getBattlemetricsServerPage(client, serverId);

            if (page === null) {
                client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'failedToGetTeamTrackerInfo', {
                    id: serverId
                }), 'error')
                return null;
            }
        }

        let onlinePlayers = [];
        let players = page['included']

        for (let player of players) {
            try {
                if (player.length !== null) {
                    onlinePlayers.push({
                        id: player['attributes'].id,
                        name: player['attributes'].name,
                        time: await this.formatTime(player['attributes'].updatedAt)
                    });
                }
            }
            catch (e) { }
        }
        return onlinePlayers;
    },

    isBattlemetricsServerHidden: function (players) {
        for (let player of players) {
            if (!RandomUsernames.RandomUsernames.includes(player.name)) {
                return false;
            }
        }

        if (players.length <= 3) {
            /* In case there are too few people on the server to decide */
            return false;
        }
        return true;
    },

    escapeRegExp: function (text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    },

    formatTime: async function (timestamp) {
        const date = new Date(timestamp);
        const now = Date.now();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hoursStr = diffHours.toString().padStart(2, '0');
        const minutesStr = diffMinutes.toString().padStart(2, '0');
        return `${hoursStr}:${minutesStr}`;
    }
}
