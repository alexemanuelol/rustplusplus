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
import { localeManager } from '../../index';

export function getListOfCommandKeywords(locale: string): string[] {
    return [
        localeManager.getIntl(locale, 'commandSyntaxAfk'),
        localeManager.getIntl(locale, 'commandSyntaxAlive'),
        localeManager.getIntl(locale, 'commandSyntaxCargo'),
        localeManager.getIntl(locale, 'commandSyntaxChinook'),
        localeManager.getIntl(locale, 'commandSyntaxConnection'),
        localeManager.getIntl(locale, 'commandSyntaxConnections'),
        localeManager.getIntl(locale, 'commandSyntaxCraft'),
        localeManager.getIntl(locale, 'commandSyntaxDeath'),
        localeManager.getIntl(locale, 'commandSyntaxDeaths'),
        localeManager.getIntl(locale, 'commandSyntaxDecay'),
        localeManager.getIntl(locale, 'commandSyntaxEvents'),
        localeManager.getIntl(locale, 'commandSyntaxHeli'),
        localeManager.getIntl(locale, 'commandSyntaxLarge'),
        localeManager.getIntl(locale, 'commandSyntaxLeader'),
        localeManager.getIntl(locale, 'commandSyntaxMarker'),
        localeManager.getIntl(locale, 'commandSyntaxMarkers'),
        localeManager.getIntl(locale, 'commandSyntaxMarket'),
        localeManager.getIntl(locale, 'commandSyntaxMute'),
        localeManager.getIntl(locale, 'commandSyntaxNote'),
        localeManager.getIntl(locale, 'commandSyntaxNotes'),
        localeManager.getIntl(locale, 'commandSyntaxOffline'),
        localeManager.getIntl(locale, 'commandSyntaxOnline'),
        localeManager.getIntl(locale, 'commandSyntaxPlayer'),
        localeManager.getIntl(locale, 'commandSyntaxPlayers'),
        localeManager.getIntl(locale, 'commandSyntaxPop'),
        localeManager.getIntl(locale, 'commandSyntaxProx'),
        localeManager.getIntl(locale, 'commandSyntaxRecycle'),
        localeManager.getIntl(locale, 'commandSyntaxResearch'),
        localeManager.getIntl(locale, 'commandSyntaxSend'),
        localeManager.getIntl(locale, 'commandSyntaxSmall'),
        localeManager.getIntl(locale, 'commandSyntaxStack'),
        localeManager.getIntl(locale, 'commandSyntaxSteamid'),
        localeManager.getIntl(locale, 'commandSyntaxTeam'),
        localeManager.getIntl(locale, 'commandSyntaxTime'),
        localeManager.getIntl(locale, 'commandSyntaxTimer'),
        localeManager.getIntl(locale, 'commandSyntaxTimers'),
        localeManager.getIntl(locale, 'commandSyntaxTranslateTo'),
        localeManager.getIntl(locale, 'commandSyntaxTranslateFromTo'),
        localeManager.getIntl(locale, 'commandSyntaxTTS'),
        localeManager.getIntl(locale, 'commandSyntaxUnmute'),
        localeManager.getIntl(locale, 'commandSyntaxUpkeep'),
        localeManager.getIntl(locale, 'commandSyntaxUptime'),
        localeManager.getIntl(locale, 'commandSyntaxWipe'),
        localeManager.getIntl('en', 'commandSyntaxAfk'),
        localeManager.getIntl('en', 'commandSyntaxAlive'),
        localeManager.getIntl('en', 'commandSyntaxCargo'),
        localeManager.getIntl('en', 'commandSyntaxChinook'),
        localeManager.getIntl('en', 'commandSyntaxConnection'),
        localeManager.getIntl('en', 'commandSyntaxConnections'),
        localeManager.getIntl('en', 'commandSyntaxCraft'),
        localeManager.getIntl('en', 'commandSyntaxDeath'),
        localeManager.getIntl('en', 'commandSyntaxDeaths'),
        localeManager.getIntl('en', 'commandSyntaxDecay'),
        localeManager.getIntl('en', 'commandSyntaxEvents'),
        localeManager.getIntl('en', 'commandSyntaxHeli'),
        localeManager.getIntl('en', 'commandSyntaxLarge'),
        localeManager.getIntl('en', 'commandSyntaxLeader'),
        localeManager.getIntl('en', 'commandSyntaxMarker'),
        localeManager.getIntl('en', 'commandSyntaxMarkers'),
        localeManager.getIntl('en', 'commandSyntaxMarket'),
        localeManager.getIntl('en', 'commandSyntaxMute'),
        localeManager.getIntl('en', 'commandSyntaxNote'),
        localeManager.getIntl('en', 'commandSyntaxNotes'),
        localeManager.getIntl('en', 'commandSyntaxOffline'),
        localeManager.getIntl('en', 'commandSyntaxOnline'),
        localeManager.getIntl('en', 'commandSyntaxPlayer'),
        localeManager.getIntl('en', 'commandSyntaxPlayers'),
        localeManager.getIntl('en', 'commandSyntaxPop'),
        localeManager.getIntl('en', 'commandSyntaxProx'),
        localeManager.getIntl('en', 'commandSyntaxRecycle'),
        localeManager.getIntl('en', 'commandSyntaxResearch'),
        localeManager.getIntl('en', 'commandSyntaxSend'),
        localeManager.getIntl('en', 'commandSyntaxSmall'),
        localeManager.getIntl('en', 'commandSyntaxStack'),
        localeManager.getIntl('en', 'commandSyntaxSteamid'),
        localeManager.getIntl('en', 'commandSyntaxTeam'),
        localeManager.getIntl('en', 'commandSyntaxTime'),
        localeManager.getIntl('en', 'commandSyntaxTimer'),
        localeManager.getIntl('en', 'commandSyntaxTimers'),
        localeManager.getIntl('en', 'commandSyntaxTranslateTo'),
        localeManager.getIntl('en', 'commandSyntaxTranslateFromTo'),
        localeManager.getIntl('en', 'commandSyntaxTTS'),
        localeManager.getIntl('en', 'commandSyntaxUnmute'),
        localeManager.getIntl('en', 'commandSyntaxUpkeep'),
        localeManager.getIntl('en', 'commandSyntaxUptime'),
        localeManager.getIntl('en', 'commandSyntaxWipe')
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