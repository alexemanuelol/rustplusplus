const Axios = require('axios');
const Constants = require('../util/constants.js');

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
        const response = await module.exports.scrape(`${Constants.STEAM_PROFILES_URL}${steamId}`);

        if (response === '') {
            rustplus.log('ERROR', `Failed to scrape '${Constants.STEAM_PROFILES_URL}${steamId}'.`, 'error');
            return response;
        }

        let png = response.data.match(/<img src="(.*_full.jpg)(.*?(?="))/);
        if (png) {
            return png[1];
        }

        return '';
    },
}