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
    getListOfCommandKeywords: function (client, guildId) {
        return [
            client.intlGet(guildId, 'commandSyntaxAfk'),
            client.intlGet(guildId, 'commandSyntaxAlive'),
            client.intlGet(guildId, 'commandSyntaxBradley'),
            client.intlGet(guildId, 'commandSyntaxCargo'),
            client.intlGet(guildId, 'commandSyntaxChinook'),
            client.intlGet(guildId, 'commandSyntaxConnection'),
            client.intlGet(guildId, 'commandSyntaxConnections'),
            client.intlGet(guildId, 'commandSyntaxCrate'),
            client.intlGet(guildId, 'commandSyntaxDeath'),
            client.intlGet(guildId, 'commandSyntaxDeaths'),
            client.intlGet(guildId, 'commandSyntaxHeli'),
            client.intlGet(guildId, 'commandSyntaxLarge'),
            client.intlGet(guildId, 'commandSyntaxLeader'),
            client.intlGet(guildId, 'commandSyntaxMarker'),
            client.intlGet(guildId, 'commandSyntaxMarkers'),
            client.intlGet(guildId, 'commandSyntaxMarket'),
            client.intlGet(guildId, 'commandSyntaxMute'),
            client.intlGet(guildId, 'commandSyntaxNote'),
            client.intlGet(guildId, 'commandSyntaxNotes'),
            client.intlGet(guildId, 'commandSyntaxOffline'),
            client.intlGet(guildId, 'commandSyntaxOnline'),
            client.intlGet(guildId, 'commandSyntaxPlayer'),
            client.intlGet(guildId, 'commandSyntaxPlayers'),
            client.intlGet(guildId, 'commandSyntaxPop'),
            client.intlGet(guildId, 'commandSyntaxProx'),
            client.intlGet(guildId, 'commandSyntaxSend'),
            client.intlGet(guildId, 'commandSyntaxSmall'),
            client.intlGet(guildId, 'commandSyntaxTime'),
            client.intlGet(guildId, 'commandSyntaxTimer'),
            client.intlGet(guildId, 'commandSyntaxTimers'),
            client.intlGet(guildId, 'commandSyntaxTranslateTo'),
            client.intlGet(guildId, 'commandSyntaxTranslateFromTo'),
            client.intlGet(guildId, 'commandSyntaxTTS'),
            client.intlGet(guildId, 'commandSyntaxUnmute'),
            client.intlGet(guildId, 'commandSyntaxUpkeep'),
            client.intlGet(guildId, 'commandSyntaxWipe')
        ];
    },

    getListOfUsedKeywords: function (client, guildId, serverId) {
        const instance = client.getInstance(guildId);

        let list = [];
        list = [...module.exports.getListOfCommandKeywords(client, guildId)];
        for (const [, value] of Object.entries(instance.serverList[serverId].switches)) {
            list.push(value.command);
        }

        for (const [, value] of Object.entries(instance.serverList[serverId].switchGroups)) {
            list.push(value.command);
        }

        return list;
    }
}