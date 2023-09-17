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

const {getVoiceConnection} = require('@discordjs/voice');

module.exports = {
    name: 'voiceStateUpdate', async execute(client, oldState, newState) {

        if (oldState.member.id === client.user.id) {
            return;
        }

        if (oldState.channelId && !newState.channelId) {
            const botVoiceChannel = oldState.channel;
            if (!botVoiceChannel.members.has(client.user.id)) {
                return;
            }

            if (botVoiceChannel.members.size === 1) {
                setTimeout(() => {
                    if (botVoiceChannel.members.size === 1 && botVoiceChannel.members.has(client.user.id)) {
                        const connection = getVoiceConnection(oldState.guild.id);
                        if (connection) {
                            connection.destroy();
                        } else {
                        }
                    } else {
                    }
                }, 10000);  // 10 seconds
            }
        }
    }
};
