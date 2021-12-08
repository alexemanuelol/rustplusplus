const Client = require('../../index.js');

module.exports = (guildId, serverIp, appPort, steamId, playerToken) => {
    let instance = Client.client.readInstanceFile(guildId);

    instance.rustplus = {
        server_ip: serverIp,
        app_port: appPort,
        steam_id: steamId,
        player_token: playerToken
    };

    Client.client.writeInstanceFile(guildId, instance);
};
