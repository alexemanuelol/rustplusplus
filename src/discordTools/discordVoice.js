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

const path = require('path');
const say = require('say');
const { getVoiceConnection, createAudioPlayer, createAudioResource, NoSubscriberBehavior } = require('@discordjs/voice');

module.exports = {
  async sendvoice(guildID, event) {
    try {
      const filePath = await getVoiceFile(event);
      await playVoice(guildID, filePath);
    } catch (error) {
      console.error('Error:', error);
    }
  },
};

function getVoiceFile(event) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(__dirname, '../resources/voice', 'output.wav');
    say.getInstalledVoices((err, voices) => {
        if (err) {
            reject(err);
            return;
        }
        console.log(voices);
    });
    say.export(event, undefined, 1, filePath, (err) => {
      if (err) {
        reject(err);
        return;
      }
      console.log('Success!');
      resolve(filePath);
    });
  });
}

function playVoice(guildID, filePath) {
    return new Promise((resolve, reject) => {
      const connection = getVoiceConnection(guildID);
      if (connection) console.log('connection is ok');
      if (!connection) {
        reject(new Error('connection is not ok'));
        return;
      }
      const player = createAudioPlayer({
        behaviors: {
          noSubscriber: NoSubscriberBehavior.Pause,
        },
      });
      const resource = createAudioResource(filePath);
      connection.subscribe(player);
      player.play(resource);
      player.on('error', (error) => {
        console.error('Error:', error);
        reject(error);
      });
      player.on('warn', (warning) => {
        console.warn('Warning:', warning);
      });
      player.on('stateChange', (oldState, newState) => {
        if (newState.status === 'idle') {
          resolve();
        }
      });
    });
  }
