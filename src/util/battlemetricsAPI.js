const RandomUsernames = require('./RandomUsernames.json');
const Scrape = require('./scrape.js');

module.exports = {
    getBattlemetricsServerId: async function (client, serverName) {
        let searchServerName = encodeURI(serverName);
        serverName = module.exports.escapeRegExp(serverName);
        searchServerName = searchServerName.replace('\#', '\*');
        const search = `https://www.battlemetrics.com/servers/search?q=${searchServerName}&sort=score&game=rust`;
        const response = await Scrape.scrape(search);

        if (response.status !== 200) {
            client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'failedToScrape', {
                scrape: search
            }), 'error')
            return null;
        }

        let regex = new RegExp(`"id":"(\\d+?)","game_id":"rust","name":"${serverName}","`, 'g');
        let data = regex.exec(response.data);

        try {
            if (data.length === 2) {
                return data[1];
            }
        }
        catch (e) { }

        return null;
    },

    getBattlemetricsServerPage: async function (client, serverId) {
        const search = `https://www.battlemetrics.com/servers/rust/${serverId}`;
        const response = await Scrape.scrape(search);

        if (response.status !== 200) {
            client.log(client.intlGet(null, 'errorCap'), client.intlGet(null, 'failedToScrape', {
                scrape: search
            }), 'error')
            return null;
        }

        return response.data;
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

        let regex = new RegExp(
            `"id":"${serverId}".*?"ip":"(.+?)","port":(.+?),".*?"rank":(\\d+?),".*?"country":"(.+?)","status":"(.+?)"`, 'g');
        let data = regex.exec(page);

        try {
            if (data.length === 6) {
                return {
                    ip: data[1],
                    port: data[2],
                    rank: data[3],
                    country: data[4],
                    status: (data[5] === 'online') ? true : false
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
        let regex = new RegExp(
            `<a class="css-zwebxb" href="/players/(\\d+?)">(.+?)</a>.*?time=".*?">(.+?)</`, 'gm');
        let players = page.matchAll(regex)

        for (let player of players) {
            try {
                if (player.length === 4) {
                    onlinePlayers.push({ id: player[1], name: player[2], time: player[3] });
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
}
