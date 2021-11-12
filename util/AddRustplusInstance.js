const fs = require("fs");

module.exports = (guildId, serverIp, appPort, steamId, playerToken) => {
    let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/rustplusInstances.json`, 'utf8'));

    /* Delete previous instance if any */
    delete instances[guildId];

    /* Add to object of instances */
    instances[guildId] = {
        server_ip: serverIp,
        app_port: appPort,
        steam_id: steamId,
        player_token: playerToken
    }
    fs.writeFileSync(`${__dirname}/../instances/rustplusInstances.json`, JSON.stringify(instances, null, 2));
};
