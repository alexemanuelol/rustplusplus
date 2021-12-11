const InGameEventHandler = require('../handlers/inGameEventHandler.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS CONNECTED');

        /* Get map width/height and oceanMargin once when connected (to avoid calling getMap continuously) */
        rustplus.getMap((map) => {
            rustplus.getInfo((info) => {
                if (map.response.error && rustplus.interaction !== null) {
                    rustplus.interaction.editReply({
                        content: ':x: steamId or Player Token is invalid, use the /setup command',
                        ephemeral: true
                    });
                    rustplus.log('steamId or Player Token is invalid, use the /setup command');
                    rustplus.interaction = null;
                    rustplus.disconnect();
                    return;
                }

                /* SteamID and Player Token seem to be valid, add to instances json */
                require('../util/AddRustplusInstance')(
                    rustplus.guildId,
                    rustplus.serverIp,
                    rustplus.appPort,
                    rustplus.steamId,
                    rustplus.playerToken);

                if (rustplus.interaction) {
                    rustplus.interaction.editReply({
                        content: ':white_check_mark: Successfully Connected!',
                        ephemeral: true
                    });
                    rustplus.log('Successfully Connected!');
                    rustplus.interaction = null;
                }

                rustplus.mapWidth = map.response.map.width;
                rustplus.mapHeight = map.response.map.height;
                rustplus.mapOceanMargin = map.response.map.oceanMargin;
                rustplus.mapMonuments = map.response.map.monuments;

                rustplus.serverName = info.response.info.name;

                /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
                rustplus.intervalId = setInterval(InGameEventHandler.inGameEventHandler, 10000, rustplus, client);
            });
        });
    },
};
