const Fs = require('fs');
const Path = require('path');

const InstanceUtils = require('../util/instanceUtils.js');

module.exports = (client, guild) => {
    let instance = null;
    if (!Fs.existsSync(Path.join(__dirname, '..', '..', 'instances', `${guild.id}.json`))) {
        instance = {
            firstTime: true,
            role: null,
            generalSettings: client.readGeneralSettingsTemplate(),
            notificationSettings: client.readNotificationSettingsTemplate(),
            channelId: {
                category: null,
                information: null,
                servers: null,
                settings: null,
                commands: null,
                events: null,
                teamchat: null,
                switches: null,
                alarms: null,
                storageMonitors: null,
                activity: null,
                trackers: null
            },
            informationMessageId: {
                map: null,
                server: null,
                event: null,
                team: null
            },
            serverList: {},
            trackers: {},
            marketSubscribeItemIds: []
        };
    }
    else {
        instance = InstanceUtils.readInstanceFile(guild.id);

        if (!instance.hasOwnProperty('firstTime')) {
            instance.firstTime = true;
        }

        if (!instance.hasOwnProperty('role')) {
            instance.role = null;
        }

        if (!instance.hasOwnProperty('generalSettings')) {
            instance.generalSettings = client.readGeneralSettingsTemplate();
        }
        else {
            const generalSettings = client.readGeneralSettingsTemplate();

            for (const [key, value] of Object.entries(generalSettings)) {
                if (!instance.generalSettings.hasOwnProperty(key)) {
                    instance.generalSettings[key] = value;
                }
            }
        }

        if (!instance.hasOwnProperty('notificationSettings')) {
            instance.notificationSettings = client.readNotificationSettingsTemplate();
        }
        else {
            const notificationSettings = client.readNotificationSettingsTemplate();

            for (const [key, value] of Object.entries(notificationSettings)) {
                if (!instance.notificationSettings.hasOwnProperty(key)) {
                    instance.notificationSettings[key] = value;
                }
            }
        }

        if (!instance.hasOwnProperty('channelId')) {
            instance.channelId = {
                category: null,
                information: null,
                servers: null,
                settings: null,
                commands: null,
                events: null,
                teamchat: null,
                switches: null,
                alarms: null,
                storageMonitors: null,
                activity: null,
                trackers: null
            }
        }
        else {
            if (!instance.channelId.hasOwnProperty('category')) instance.channelId.category = null;
            if (!instance.channelId.hasOwnProperty('information')) instance.channelId.information = null;
            if (!instance.channelId.hasOwnProperty('servers')) instance.channelId.servers = null;
            if (!instance.channelId.hasOwnProperty('settings')) instance.channelId.settings = null;
            if (!instance.channelId.hasOwnProperty('commands')) instance.channelId.commands = null;
            if (!instance.channelId.hasOwnProperty('events')) instance.channelId.events = null;
            if (!instance.channelId.hasOwnProperty('teamchat')) instance.channelId.teamchat = null;
            if (!instance.channelId.hasOwnProperty('switches')) instance.channelId.switches = null;
            if (!instance.channelId.hasOwnProperty('alarms')) instance.channelId.alarms = null;
            if (!instance.channelId.hasOwnProperty('storageMonitors')) instance.channelId.storageMonitors = null;
            if (!instance.channelId.hasOwnProperty('activity')) instance.channelId.activity = null;
            if (!instance.channelId.hasOwnProperty('trackers')) instance.channelId.trackers = null;
        }

        if (!instance.hasOwnProperty('informationMessageId')) {
            instance.informationMessageId = {
                map: null,
                server: null,
                event: null,
                team: null
            }
        }
        else {
            if (!instance.informationMessageId.hasOwnProperty('map')) instance.informationMessageId.map = null;
            if (!instance.informationMessageId.hasOwnProperty('server')) instance.informationMessageId.server = null;
            if (!instance.informationMessageId.hasOwnProperty('event')) instance.informationMessageId.event = null;
            if (!instance.informationMessageId.hasOwnProperty('team')) instance.informationMessageId.team = null;
        }

        if (!instance.hasOwnProperty('serverList')) instance.serverList = {};
        if (!instance.hasOwnProperty('trackers')) instance.trackers = {};
        if (!instance.hasOwnProperty('marketSubscribeItemIds')) instance.marketSubscribeItemIds = [];
    }

    client.setInstance(guild.id, instance);
};
