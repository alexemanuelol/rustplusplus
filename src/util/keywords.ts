/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import { GuildInstance, readGuildInstanceFile } from './guild-instance';
import { localeManager as lm } from '../../index';

export function getListOfCommandKeywords(locale: string): string[] {
    return [
        lm.getIntl(locale, 'commandSyntaxAfk'),
        lm.getIntl(locale, 'commandSyntaxAlive'),
        lm.getIntl(locale, 'commandSyntaxCargo'),
        lm.getIntl(locale, 'commandSyntaxChinook'),
        lm.getIntl(locale, 'commandSyntaxConnection'),
        lm.getIntl(locale, 'commandSyntaxConnections'),
        lm.getIntl(locale, 'commandSyntaxCraft'),
        lm.getIntl(locale, 'commandSyntaxDeath'),
        lm.getIntl(locale, 'commandSyntaxDeaths'),
        lm.getIntl(locale, 'commandSyntaxDecay'),
        lm.getIntl(locale, 'commandSyntaxEvents'),
        lm.getIntl(locale, 'commandSyntaxHeli'),
        lm.getIntl(locale, 'commandSyntaxLarge'),
        lm.getIntl(locale, 'commandSyntaxLeader'),
        lm.getIntl(locale, 'commandSyntaxMarker'),
        lm.getIntl(locale, 'commandSyntaxMarkers'),
        lm.getIntl(locale, 'commandSyntaxMarket'),
        lm.getIntl(locale, 'commandSyntaxMute'),
        lm.getIntl(locale, 'commandSyntaxNote'),
        lm.getIntl(locale, 'commandSyntaxNotes'),
        lm.getIntl(locale, 'commandSyntaxOffline'),
        lm.getIntl(locale, 'commandSyntaxOnline'),
        lm.getIntl(locale, 'commandSyntaxPlayer'),
        lm.getIntl(locale, 'commandSyntaxPlayers'),
        lm.getIntl(locale, 'commandSyntaxPop'),
        lm.getIntl(locale, 'commandSyntaxProx'),
        lm.getIntl(locale, 'commandSyntaxRecycle'),
        lm.getIntl(locale, 'commandSyntaxResearch'),
        lm.getIntl(locale, 'commandSyntaxSend'),
        lm.getIntl(locale, 'commandSyntaxSmall'),
        lm.getIntl(locale, 'commandSyntaxStack'),
        lm.getIntl(locale, 'commandSyntaxSteamid'),
        lm.getIntl(locale, 'commandSyntaxTeam'),
        lm.getIntl(locale, 'commandSyntaxTime'),
        lm.getIntl(locale, 'commandSyntaxTimer'),
        lm.getIntl(locale, 'commandSyntaxTimers'),
        lm.getIntl(locale, 'commandSyntaxTranslateTo'),
        lm.getIntl(locale, 'commandSyntaxTranslateFromTo'),
        lm.getIntl(locale, 'commandSyntaxTTS'),
        lm.getIntl(locale, 'commandSyntaxUnmute'),
        lm.getIntl(locale, 'commandSyntaxUpkeep'),
        lm.getIntl(locale, 'commandSyntaxUptime'),
        lm.getIntl(locale, 'commandSyntaxWipe'),
        lm.getIntl('en', 'commandSyntaxAfk'),
        lm.getIntl('en', 'commandSyntaxAlive'),
        lm.getIntl('en', 'commandSyntaxCargo'),
        lm.getIntl('en', 'commandSyntaxChinook'),
        lm.getIntl('en', 'commandSyntaxConnection'),
        lm.getIntl('en', 'commandSyntaxConnections'),
        lm.getIntl('en', 'commandSyntaxCraft'),
        lm.getIntl('en', 'commandSyntaxDeath'),
        lm.getIntl('en', 'commandSyntaxDeaths'),
        lm.getIntl('en', 'commandSyntaxDecay'),
        lm.getIntl('en', 'commandSyntaxEvents'),
        lm.getIntl('en', 'commandSyntaxHeli'),
        lm.getIntl('en', 'commandSyntaxLarge'),
        lm.getIntl('en', 'commandSyntaxLeader'),
        lm.getIntl('en', 'commandSyntaxMarker'),
        lm.getIntl('en', 'commandSyntaxMarkers'),
        lm.getIntl('en', 'commandSyntaxMarket'),
        lm.getIntl('en', 'commandSyntaxMute'),
        lm.getIntl('en', 'commandSyntaxNote'),
        lm.getIntl('en', 'commandSyntaxNotes'),
        lm.getIntl('en', 'commandSyntaxOffline'),
        lm.getIntl('en', 'commandSyntaxOnline'),
        lm.getIntl('en', 'commandSyntaxPlayer'),
        lm.getIntl('en', 'commandSyntaxPlayers'),
        lm.getIntl('en', 'commandSyntaxPop'),
        lm.getIntl('en', 'commandSyntaxProx'),
        lm.getIntl('en', 'commandSyntaxRecycle'),
        lm.getIntl('en', 'commandSyntaxResearch'),
        lm.getIntl('en', 'commandSyntaxSend'),
        lm.getIntl('en', 'commandSyntaxSmall'),
        lm.getIntl('en', 'commandSyntaxStack'),
        lm.getIntl('en', 'commandSyntaxSteamid'),
        lm.getIntl('en', 'commandSyntaxTeam'),
        lm.getIntl('en', 'commandSyntaxTime'),
        lm.getIntl('en', 'commandSyntaxTimer'),
        lm.getIntl('en', 'commandSyntaxTimers'),
        lm.getIntl('en', 'commandSyntaxTranslateTo'),
        lm.getIntl('en', 'commandSyntaxTranslateFromTo'),
        lm.getIntl('en', 'commandSyntaxTTS'),
        lm.getIntl('en', 'commandSyntaxUnmute'),
        lm.getIntl('en', 'commandSyntaxUpkeep'),
        lm.getIntl('en', 'commandSyntaxUptime'),
        lm.getIntl('en', 'commandSyntaxWipe')
    ];
}

export function getListOfUsedKeywords(guildId: string, serverId: string): string[] {
    const guildInstance: GuildInstance = readGuildInstanceFile(guildId);

    let list: string[] = [];
    list = [...getListOfCommandKeywords(guildInstance.generalSettings.language)];

    for (const content of Object.values(guildInstance.serverList[serverId].alarms)) {
        list.push(content.command);
    }

    for (const content of Object.values(guildInstance.serverList[serverId].switches)) {
        list.push(content.command);
    }

    for (const content of Object.values(guildInstance.serverList[serverId].switchGroups)) {
        list.push(content.command);
    }

    return list;
}