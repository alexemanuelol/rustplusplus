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

    https://github.com/alexemanuelol/rustPlusPlus

*/

module.exports = {
    commands: [
        'afk',
        'alive',
        'bradley',
        'cargo',
        'chinook',
        'connection',
        'connections',
        'crate',
        'heli',
        'large',
        'leader',
        'marker',
        'markers',
        'mute',
        'note',
        'notes',
        'offline',
        'online',
        'player',
        'players',
        'pop',
        'prox',
        'send',
        'small',
        'time',
        'timer',
        'timers',
        'tr',
        'trf',
        'tts',
        'unmute',
        'upkeep',
        'wipe'
    ],

    getListOfUsedKeywords: function (client, guildId, serverId) {
        const instance = client.getInstance(guildId);

        let list = [];
        list = [...module.exports.commands];
        for (const [id, value] of Object.entries(instance.serverList[serverId].switches)) {
            list.push(value.command);
        }

        for (const [id, value] of Object.entries(instance.serverList[serverId].switchGroups)) {
            list.push(value.command);
        }

        return list;
    }
}