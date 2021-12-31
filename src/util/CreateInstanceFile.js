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
            rustplus: null,
            channelId: {
                category: null,
                settings: null,
                events: null
            },
            credentials: null
        }, null, 2));
    }
};
