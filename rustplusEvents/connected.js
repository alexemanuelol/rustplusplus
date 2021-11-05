const fs = require('fs');
const InGameEventHandler = require('../inGameEvents/inGameEventHandler.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        rustplus.log('RUSTPLUS CONNECTED');

        /* Get map width/height and oceanMargin once when connected (to avoid calling getMap continuously) */
        rustplus.getMap((map) => {
            if (map.response.error && rustplus.interaction !== null) {
                rustplus.interaction.editReply({
                    content: ':x: steamId or Player Token is invalid',
                    ephemeral: true
                });
                rustplus.log('steamId or Player Token is invalid');
                rustplus.interaction = null;
                rustplus.disconnect();
                return;
            }
            else {
                /* SteamID and Player Token seem to be valid, add to instances json */
                let instances = JSON.parse(fs.readFileSync(`${__dirname}/../rustplusInstances.json`, 'utf8'));

                /* Delete previous instance if any */
                delete instances[rustplus.guildId];

                /* Add to object of instances */
                instances[rustplus.guildId] = {
                    server_ip: rustplus.serverIp,
                    app_port: rustplus.appPort,
                    steam_id: rustplus.steamId,
                    player_token: rustplus.playerToken
                }
                fs.writeFileSync(`${__dirname}/../rustplusInstances.json`, JSON.stringify(instances, null, 2));

                /* Add rustplus instance to Object */
                client.rustplusInstances[rustplus.guildId] = rustplus;

                if (rustplus.interaction) {
                    rustplus.interaction.editReply({
                        content: ':white_check_mark: Setup Successful, Connected!',
                        ephemeral: true
                    });
                    rustplus.log('Setup Successful, Connected');
                }
            }
            rustplus.mapWidth = map.response.map.width;
            rustplus.mapHeight = map.response.map.height;
            rustplus.mapOceanMargin = map.response.map.oceanMargin;
            rustplus.mapMonuments = map.response.map.monuments;

            /* Start a new instance of the inGameEventHandler interval function, save the interval ID */
            rustplus.intervalId = setInterval(InGameEventHandler.inGameEventHandler, 10000, rustplus, client);
        });

    },
};