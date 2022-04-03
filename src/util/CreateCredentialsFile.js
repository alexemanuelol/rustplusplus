const fs = require('fs');

module.exports = (client, guild) => {
    /* If credential/ directory does not exist, create it */
    if (!fs.existsSync(`${__dirname}/../credentials`)) {
        fs.mkdirSync(`${__dirname}/../credentials`);
    }

    if (!fs.existsSync(`${__dirname}/../credentials/${guild.id}.json`)) {
        fs.writeFileSync(`${__dirname}/../credentials/${guild.id}.json`, JSON.stringify({
            credentials: null
        }, null, 2));
    }
};
