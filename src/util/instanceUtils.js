const Fs = require('fs');
const Path = require('path');

const Client = require('../../index.ts');

module.exports = {
    getSmartDevice: function (guildId, entityId) {
        /* Temporary function till discord modals gets more functional */
        const instance = Client.client.getInstance(guildId);

        for (const serverId in instance.serverList) {
            for (const switchId in instance.serverList[serverId].switches) {
                if (entityId === switchId) return { type: 'switch', serverId: serverId }
            }
            for (const alarmId in instance.serverList[serverId].alarms) {
                if (entityId === alarmId) return { type: 'alarm', serverId: serverId }
            }
            for (const storageMonitorId in instance.serverList[serverId].storageMonitors) {
                if (entityId === storageMonitorId) return { type: 'storageMonitor', serverId: serverId }
            }
        }
        return null;
    },

    readInstanceFile: function (guildId) {
        const path = Path.join(__dirname, '..', '..', 'instances', `${guildId}.json`);
        return JSON.parse(Fs.readFileSync(path, 'utf8'));
    },

    writeInstanceFile: function (guildId, instance) {
        const path = Path.join(__dirname, '..', '..', 'instances', `${guildId}.json`);
        Fs.writeFileSync(path, JSON.stringify(instance, null, 2));
    },

    readCredentialsFile: function (guildId) {
        const path = Path.join(__dirname, '..', '..', 'credentials', `${guildId}.json`);
        return JSON.parse(Fs.readFileSync(path, 'utf8'));
    },

    writeCredentialsFile: function (guildId, credentials) {
        const path = Path.join(__dirname, '..', '..', 'credentials', `${guildId}.json`);
        Fs.writeFileSync(path, JSON.stringify(credentials, null, 2));
    },
}
