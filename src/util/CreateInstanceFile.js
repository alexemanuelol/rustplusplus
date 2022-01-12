const fs = require('fs');

module.exports = (client, guild) => {
    /* If instances/ directory does not exist, create it */
    if (!fs.existsSync(`${__dirname}/../instances`)) {
        fs.mkdirSync(`${__dirname}/../instances`);
    }

    if (!fs.existsSync(`${__dirname}/../instances/${guild.id}.json`)) {
        fs.writeFileSync(`${__dirname}/../instances/${guild.id}.json`, JSON.stringify({
            generalSettings: client.readGeneralSettingsTemplate(),
            notificationSettings: client.readNotificationSettingsTemplate(),
            channelId: {
                category: null,
                servers: null,
                settings: null,
                events: null
            },
            serverList: {},
            credentials: null
        }, null, 2));
    }
};
