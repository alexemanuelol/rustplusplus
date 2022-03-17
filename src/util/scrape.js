const Axios = require('axios');

const STEAM_LINK = 'https://steamcommunity.com/profiles/';

module.exports = {
    scrape: async function (url) {
        try {
            return await Axios.get(url);
        }
        catch (e) {
            return '';
        }
    },

    scrapeSteamProfilePicture: async function (rustplus, steamId) {
        const response = await module.exports.scrape(`${STEAM_LINK}${steamId}`);

        if (response === '') {
            rustplus.log('ERROR', `Failed to scrape '${STEAM_LINK}${steamId}'.`, 'error');
            return response;
        }

        let png = response.data.match(/<img src="(.*_full.jpg)(.*?(?="))/);
        if (png) {
            return png[1];
        }

        return '';
    },
}