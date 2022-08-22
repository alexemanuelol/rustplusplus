const Fs = require('fs');

module.exports = (client, guild) => {
    /* If credential/ directory does not exist, create it */
    if (!Fs.existsSync(`${__dirname}/../credentials`)) {
        Fs.mkdirSync(`${__dirname}/../credentials`);
    }

    if (!Fs.existsSync(`${__dirname}/../credentials/${guild.id}.json`)) {
        Fs.writeFileSync(`${__dirname}/../credentials/${guild.id}.json`, JSON.stringify({
            credentials: null
        }, null, 2));
    }
};
