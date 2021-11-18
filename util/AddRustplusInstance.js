const fs = require("fs");

module.exports = (guildId, serverIp, appPort, steamId, playerToken) => {
    let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));

    /* Add to object of instances */
    instances[guildId].rustplus = {
        server_ip: serverIp,
        app_port: appPort,
        steam_id: steamId,
        player_token: playerToken
    }
    fs.writeFileSync(`${__dirname}/../instances/instances.json`, JSON.stringify(instances, null, 2));
};
