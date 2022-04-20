const Scrape = require('./scrape.js');
const RandomUsernames = require('./RandomUsernames.json');

module.exports = {
    getBattlemetricsServerId: async function (client, serverName) {
        serverName = module.exports.escapeRegExp(serverName);
        const search = `https://www.battlemetrics.com/servers/search?q=${serverName}&sort=score`;
        const response = await Scrape.scrape(search);

        if (response.status !== 200) {
            client.log('ERROR', `Failed to scrape: '${search}'`, 'error')
            return null;
        }

        let regex = new RegExp(`"id":"(\\d+?)","game_id":"rust","name":"${serverName}","`, 'g');
        let data = regex.exec(response.data);

        if (data.length === 2) {
            return data[1];
        }

        return null;
    },

    getBattlemetricsServerPage: async function (client, serverId) {
        const search = `https://www.battlemetrics.com/servers/rust/${serverId}`;
        const response = await Scrape.scrape(search);

        if (response.status !== 200) {
            client.log('ERROR', `Failed to scrape: '${search}'`, 'error')
            return null;
        }

        return response.data;
    },

    getBattlemetricsServerInfo: async function (client, serverId, page = null) {
        if (page === null) {
            page = await module.exports.getBattlemetricsServerPage(client, serverId);

            if (page === null) {
                client.log('ERROR', `Failed to get server info via battlemetrics for serverId: ${serverId}.`, 'error');
                return null;
            }
        }

        let regex = new RegExp(
            `"id":"${serverId}".*?"ip":"(.+?)","port":(.+?),".*?"rank":(\\d+?),".*?"country":"(.+?)"`, 'g');
        let data = regex.exec(page);

        if (data.length === 5) {
            return { ip: data[1], port: data[2], rank: data[3], country: data[4] }
        }

        return null;
    },

    getBattlemetricsServerOnlinePlayers: async function (client, serverId, page = null) {
        if (page === null) {
            page = await module.exports.getBattlemetricsServerPage(client, serverId);

            if (page === null) {
                client.log('ERROR',
                    `Failed to get server team tracker info via battlemetrics for serverId: ${serverId}.`, 'error');
                return null;
            }
        }

        let onlinePlayers = [];
        let regex = new RegExp(
            `<a class="css-zwebxb" href="/players/(\\d+?)">(.+?)</a>.*?time=".*?">(.+?)</`, 'gm');
        let players = page.matchAll(regex)

        for (let player of players) {
            if (player.length === 4) {
                onlinePlayers.push({ id: player[1], name: player[2], time: player[3] });
            }
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
}