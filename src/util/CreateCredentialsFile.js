const Fs = require('fs');
const Path = require('path');

module.exports = (client, guild) => {
    if (!Fs.existsSync(Path.join(__dirname, '..', '..', 'credentials', `${guild.id}.json`))) {
        Fs.writeFileSync(Path.join(__dirname, '..', '..', 'credentials', `${guild.id}.json`),
            JSON.stringify({ hoster: null }, null, 2));
    }
};
