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
const Client = require('../../index.ts');

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
}