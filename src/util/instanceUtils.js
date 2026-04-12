/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

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
        const targetPath = Path.join(__dirname, '..', '..', 'instances', `${guildId}.json`);
        const tempPath = targetPath + '.tmp';
        if (Fs.existsSync(tempPath)) {
            try {
                Fs.unlinkSync(tempPath);
            } catch (e) {
                console.warn(`Failed to remove stale temporary file: ${tempPath}`, e);
            }
        }

        // Fahren Sie mit dem normalen Lesen fort
        return JSON.parse(Fs.readFileSync(targetPath, 'utf8'));
    },

    writeInstanceFile: function (guildId, instance) {
        const targetPath = Path.join(__dirname, '..', '..', 'instances', `${guildId}.json`);
        const tempPath = targetPath + '.tmp';
        
        const data = JSON.stringify(instance, null, 2);

        Fs.writeFileSync(tempPath, data, 'utf8');
        try {
            const fd = Fs.openSync(tempPath, 'r+');
            Fs.fsyncSync(fd);
            Fs.closeSync(fd);
        } catch (error) {
            console.error(`Failed to sync file data: ${tempPath}:`, error);
            Fs.unlinkSync(tempPath); 
            throw error;
        }
        Fs.renameSync(tempPath, targetPath);
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
