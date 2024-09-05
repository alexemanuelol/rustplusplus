/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2023 FaiThiX

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
const { getVoiceConnection, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const Actors = require('../staticFiles/actors.json');
const Client = require('../../index.js');
const voice = require('../commands/voice');
const InstanceUtils = require('../util/instanceUtils.js');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    sendDiscordVoiceMessage: async function (guildId, text) {
        const connection = getVoiceConnection(guildId);
        const voice = await this.getVoice(guildId);
        const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;

        if (connection) {
            let stream = (await (await fetch(url)).blob()).stream()
            const resource = createAudioResource(stream);
            const player = createAudioPlayer();
            connection.subscribe(player);
            player.play(resource);
        }
    },

    getVoice: async function (guildId) {
        const instance = Client.client.getInstance(guildId);
        const gender = instance.generalSettings.voiceGender;
        const language = instance.generalSettings.language;

        if (Actors[language]?.[gender] === null || Actors[language]?.[gender] === undefined) {
            return Actors[language]?.[gender === 'male' ? 'female' : 'male'];
        }
        else {
            return Actors[language]?.[gender];
        }
    },

    getSmartDeviceNotFoundVoice: async function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const server = instance.serverList[serverId];
    
        // Check each possible source for the entity
        const entity =  (server.alarms[entityId] !== undefined && server.alarms[entityId] !== null) ? server.alarms[entityId] :
                        (server.storageMonitors[entityId] !== undefined && server.storagemonitors[entityId] !== null) ? server.storagemonitors[entityId] :
                        server.switches[entityId];
    
        if (!entity) {
            console.error(`Entity with ID ${entityId} not found in alarms, storagemonitors, or switches.`);
            return;
        }
    
        const credentials = InstanceUtils.readCredentialsFile(guildId);
        const user = await DiscordTools.getUserById(guildId, credentials[server.steamId].discordUserId);
        const grid = entity.location !== null ? ` (${entity.location})` : '';
    
        let voice = Client.client.intlGet(guildId, 'smartDeviceNotFound', {
            device: `${entity.name}${grid}`,
            user: user.user.username
        });
        console.log(voice);
        return voice;
    },
    

    getSmartDeviceDisconnectedVoice: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        let voice = Client.client.intlGet(guildId, 'isNoLongerConnected', {
            device: `${entity.name}${grid}`
        });
        console.log(voice);
        return voice;
    },

    getDecayingNotificationVoice: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].storageMonitors[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';
        console.log("logpoint 2")

        let voice = Client.client.intlGet(guildId, 'isDecaying', {
            device: `${entity.name}${grid}`
        });
        console.log(voice);
        return voice;
    },

    getAlarmVoice: function (guildId, serverId, entityId) {
        const instance = Client.client.getInstance(guildId);
        const entity = instance.serverList[serverId].alarms[entityId];
        const grid = entity.location !== null ? ` (${entity.location})` : '';

        let voice = Client.client.intlGet(guildId, 'smartAlarmTriggered', { grid });
        console.log(voice);
        return voice;
    },
}