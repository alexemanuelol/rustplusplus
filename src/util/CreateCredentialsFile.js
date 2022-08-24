const Fs = require('fs');

module.exports = (client, guild) => {
    if (!Fs.existsSync(`${__dirname}/../../credentials/${guild.id}.json`)) {
        Fs.writeFileSync(`${__dirname}/../../credentials/${guild.id}.json`, JSON.stringify({
            credentials: null
        }, null, 2));
    }
};
