const fs = require('fs');

module.exports = (client, guild) => {
    /* If instances/ directory does not exist, create it */
    if (!fs.existsSync(`${__dirname}/../instances`)) {
        fs.mkdirSync(`${__dirname}/../instances`);
    }

    if (!fs.existsSync(`${__dirname}/../instances/${guild.id}.json`)) {
        fs.writeFileSync(`${__dirname}/../instances/${guild.id}.json`, JSON.stringify({
            firstTime: true,
            generalSettings: client.readGeneralSettingsTemplate(),
            notificationSettings: client.readNotificationSettingsTemplate(),
            channelId: {
                category: null,
                information: null,
                servers: null,
                settings: null,
                events: null,
                teamchat: null,
                switches: null,
                activity: null
            },
            informationMessageId: {
                server: null,
                event: null,
                team: null
            },
            switches: {},
            markers: {},
            serverList: {}
        }, null, 2));
    }
};
