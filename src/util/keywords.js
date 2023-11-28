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

module.exports = {
    getListOfCommandKeywords: function (client, guildId) {
        return [
            client.intlGet(guildId, 'commandSyntaxAfk'),
            client.intlGet(guildId, 'commandSyntaxAlive'),
            client.intlGet(guildId, 'commandSyntaxCargo'),
            client.intlGet(guildId, 'commandSyntaxChinook'),
            client.intlGet(guildId, 'commandSyntaxConnection'),
            client.intlGet(guildId, 'commandSyntaxConnections'),
            client.intlGet(guildId, 'commandSyntaxCraft'),
            client.intlGet(guildId, 'commandSyntaxDeath'),
            client.intlGet(guildId, 'commandSyntaxDeaths'),
            client.intlGet(guildId, 'commandSyntaxDecay'),
            client.intlGet(guildId, 'commandSyntaxEvents'),
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
            client.intlGet(guildId, 'commandSyntaxRecycle'),
            client.intlGet(guildId, 'commandSyntaxResearch'),
            client.intlGet(guildId, 'commandSyntaxSend'),
            client.intlGet(guildId, 'commandSyntaxSmall'),
            client.intlGet(guildId, 'commandSyntaxStack'),
            client.intlGet(guildId, 'commandSyntaxSteamid'),
            client.intlGet(guildId, 'commandSyntaxTeam'),
            client.intlGet(guildId, 'commandSyntaxTime'),
            client.intlGet(guildId, 'commandSyntaxTimer'),
            client.intlGet(guildId, 'commandSyntaxTimers'),
            client.intlGet(guildId, 'commandSyntaxTranslateTo'),
            client.intlGet(guildId, 'commandSyntaxTranslateFromTo'),
            client.intlGet(guildId, 'commandSyntaxTTS'),
            client.intlGet(guildId, 'commandSyntaxUnmute'),
            client.intlGet(guildId, 'commandSyntaxUpkeep'),
            client.intlGet(guildId, 'commandSyntaxUptime'),
            client.intlGet(guildId, 'commandSyntaxWipe'),
            client.intlGet('en', 'commandSyntaxAfk'),
            client.intlGet('en', 'commandSyntaxAlive'),
            client.intlGet('en', 'commandSyntaxCargo'),
            client.intlGet('en', 'commandSyntaxChinook'),
            client.intlGet('en', 'commandSyntaxConnection'),
            client.intlGet('en', 'commandSyntaxConnections'),
            client.intlGet('en', 'commandSyntaxCraft'),
            client.intlGet('en', 'commandSyntaxDeath'),
            client.intlGet('en', 'commandSyntaxDeaths'),
            client.intlGet('en', 'commandSyntaxDecay'),
            client.intlGet('en', 'commandSyntaxEvents'),
            client.intlGet('en', 'commandSyntaxHeli'),
            client.intlGet('en', 'commandSyntaxLarge'),
            client.intlGet('en', 'commandSyntaxLeader'),
            client.intlGet('en', 'commandSyntaxMarker'),
            client.intlGet('en', 'commandSyntaxMarkers'),
            client.intlGet('en', 'commandSyntaxMarket'),
            client.intlGet('en', 'commandSyntaxMute'),
            client.intlGet('en', 'commandSyntaxNote'),
            client.intlGet('en', 'commandSyntaxNotes'),
            client.intlGet('en', 'commandSyntaxOffline'),
            client.intlGet('en', 'commandSyntaxOnline'),
            client.intlGet('en', 'commandSyntaxPlayer'),
            client.intlGet('en', 'commandSyntaxPlayers'),
            client.intlGet('en', 'commandSyntaxPop'),
            client.intlGet('en', 'commandSyntaxProx'),
            client.intlGet('en', 'commandSyntaxRecycle'),
            client.intlGet('en', 'commandSyntaxResearch'),
            client.intlGet('en', 'commandSyntaxSend'),
            client.intlGet('en', 'commandSyntaxSmall'),
            client.intlGet('en', 'commandSyntaxStack'),
            client.intlGet('en', 'commandSyntaxSteamid'),
            client.intlGet('en', 'commandSyntaxTeam'),
            client.intlGet('en', 'commandSyntaxTime'),
            client.intlGet('en', 'commandSyntaxTimer'),
            client.intlGet('en', 'commandSyntaxTimers'),
            client.intlGet('en', 'commandSyntaxTranslateTo'),
            client.intlGet('en', 'commandSyntaxTranslateFromTo'),
            client.intlGet('en', 'commandSyntaxTTS'),
            client.intlGet('en', 'commandSyntaxUnmute'),
            client.intlGet('en', 'commandSyntaxUpkeep'),
            client.intlGet('en', 'commandSyntaxUptime'),
            client.intlGet('en', 'commandSyntaxWipe')
        ];
    },

    getListOfUsedKeywords: function (client, guildId, serverId) {
        const instance = client.getInstance(guildId);

        let list = [];
        list = [...module.exports.getListOfCommandKeywords(client, guildId)];
        for (const [id, value] of Object.entries(instance.serverList[serverId].alarms)) {
            list.push(value.command);
        }

        for (const [id, value] of Object.entries(instance.serverList[serverId].switches)) {
            list.push(value.command);
        }

        for (const [id, value] of Object.entries(instance.serverList[serverId].switchGroups)) {
            list.push(value.command);
        }

        return list;
    }
}