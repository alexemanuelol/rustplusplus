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

const { getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');

module.exports = {
  async sendvoice(guildID, event) {
    try {
      await playVoice(guildID, event);
    } catch (error) {
      console.error('Error:', error);
    }
  },
};

function playVoice(guildID, event, voice = 'Sally') {
    return new Promise((resolve, reject) => {
      const connection = getVoiceConnection(guildID);
      const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(event)}`;
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      const resource = createAudioResource(url);
      connection.subscribe(player);
      player.play(resource);
      player.on('error', (error) => {
        console.error('Error:', error);
        reject(error);
      });
    });
  }
