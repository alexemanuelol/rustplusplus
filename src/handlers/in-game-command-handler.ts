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

import { localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import { smartAlarmCommandHandler } from './smart-alarm-handler';
import { smartSwitchCommandHandler } from './smart-switch-handler';
import { smartSwitchGroupCommandHandler } from './smart-switch-group-handler';
const { RustPlus } = require('../structures/RustPlus');

export async function inGameCommandHandler(rustplus: typeof RustPlus, message: any): Promise<boolean> {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    let command = message.broadcast.teamMessage.message.message;
    for (const alias of instance.commandAliases) {
        command = command.replace(alias.alias, alias.value);
    }

    const callerSteamId = message.broadcast.teamMessage.message.steamId.toString();
    const callerName = message.broadcast.teamMessage.message.name;
    const commandLowerCase = command.toLowerCase();
    const prefix = instance.generalSettings.prefix;

    if (!rustplus.isOperational) {
        return false;
    }
    else if (!rustplus.generalSettings.inGameCommandsEnabled) {
        return false;
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxAfk')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxAfk')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandAfk());
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxAlive')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxAlive')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandAlive(command));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxCargo')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxCargo')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandCargo());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxChinook')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxChinook')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandChinook());
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxConnection')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxConnections')}`)) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxConnection')} `) ||
            commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxConnections')}`))) {
        rustplus.sendInGameMessage(rustplus.getCommandConnection(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxCraft')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxCraft')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandCraft(command));
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDeath')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDeaths')}`)) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDeath')} `) ||
            commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDeaths')}`))) {
        rustplus.sendInGameMessage(await rustplus.getCommandDeath(command, callerSteamId));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDecay')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDecay')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandDecay(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDespawn')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDespawn')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandDespawn(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxEvents')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxEvents')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandEvents(command));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxHeli')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxHeli')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandHeli());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxLarge')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxLarge')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandLarge());
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxLeader')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxLeader')}`)) {
        rustplus.sendInGameMessage(await rustplus.getCommandLeader(command, callerSteamId));
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxMarker')} `) ||
        commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxMarkers')}`) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxMarker')} `) ||
            commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxMarkers')}`)) {
        rustplus.sendInGameMessage(await rustplus.getCommandMarker(command, callerSteamId));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxMarket')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxMarket')} `)) {
        rustplus.sendInGameMessage(rustplus.getCommandMarket(command));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxMute')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxMute')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandMute());
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxNote')} `) ||
        commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxNotes')}`) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxNote')} `) ||
            commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxNotes')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandNote(command));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxOffline')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxOffline')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandOffline());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxOnline')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxOnline')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandOnline());
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxPlayer')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxPlayers')}`)) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxPlayer')} `) ||
            commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxPlayers')}`))) {
        rustplus.sendInGameMessage(rustplus.getCommandPlayer(command));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxPop')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxPop')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandPop());
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxProx')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxProx')}`)) {
        rustplus.sendInGameMessage(await rustplus.getCommandProx(command, callerSteamId));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxRecycle')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxRecycle')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandRecycle(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxResearch')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxResearch')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandResearch(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxSend')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxSend')} `)) {
        rustplus.sendInGameMessage(await rustplus.getCommandSend(command, callerName));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxSmall')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxSmall')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandSmall());
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxStack')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxStack')}`)) {
        rustplus.sendInGameMessage(await rustplus.getCommandStack(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxSteamid')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxSteamid')}`)) {
        rustplus.sendInGameMessage(await rustplus.getCommandSteamId(command, callerSteamId, callerName));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxTeam')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxTeam')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandTeam());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxTime')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxTime')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandTime());
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTimer')} `) ||
        commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxTimers')}`) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTimer')} `) ||
            commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxTimers')}`)) {
        rustplus.sendInGameMessage(rustplus.getCommandTimer(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTranslateTo')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTranslateTo')} `)) {
        rustplus.sendInGameMessage(await rustplus.getCommandTranslateTo(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTranslateFromTo')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTranslateFromTo')} `)) {
        rustplus.sendInGameMessage(await rustplus.getCommandTranslateFromTo(command));
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTTS')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTTS')} `)) {
        rustplus.sendInGameMessage(await rustplus.getCommandTTS(command, callerName));
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxUnmute')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxUnmute')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandUnmute());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxUpkeep')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxUpkeep')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandUpkeep());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxUptime')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxUptime')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandUptime());
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxWipe')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxWipe')}`) {
        rustplus.sendInGameMessage(rustplus.getCommandWipe());
    }
    else {
        /* Maybe a custom command? */

        if (smartAlarmCommandHandler(rustplus, command)) {
            rustplus.logInGameCommand('Smart Alarm', message);
            return true;
        }

        if (await smartSwitchCommandHandler(rustplus, command)) {
            rustplus.logInGameCommand('Smart Switch', message);
            return true;
        }

        if (await smartSwitchGroupCommandHandler(rustplus, command)) {
            rustplus.logInGameCommand('Smart Switch Group', message);
            return true;
        }

        return false;
    }

    rustplus.logInGameCommand('Default', message);

    return true;
}