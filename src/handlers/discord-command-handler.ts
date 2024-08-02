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

import * as discordjs from 'discord.js';

import { log, localeManager as lm } from '../../index';
import * as discordTools from '../discordTools/discord-tools';
import * as discordMessages from '../discordTools/discord-messages';
import * as guildInstance from '../util/guild-instance';
const { RustPlus } = require('../structures/RustPlus');
const Config = require('../../config');

export async function discordCommandHandler(rustplus: typeof RustPlus, message: any): Promise<boolean> {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;

    let command = message.cleanContent;
    for (const alias of instance.commandAliases) {
        command = command.replace(alias.alias, alias.value);
    }

    const callerName = message.author.username;
    const commandLowerCase = command.toLowerCase();
    const prefix = instance.generalSettings.prefix;

    let response = null;
    if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxAfk')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxAfk')}`) {
        response = rustplus.getCommandAfk();
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxAlive')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxAlive')}`)) {
        response = rustplus.getCommandAlive(command);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxCargo')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxCargo')}`) {
        response = rustplus.getCommandCargo();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxChinook')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxChinook')}`) {
        response = rustplus.getCommandChinook();
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxConnection')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxConnections')}`)) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxConnection')} `) ||
            commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxConnections')}`))) {
        response = rustplus.getCommandConnection(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxCraft')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxCraft')}`)) {
        response = rustplus.getCommandCraft(command);
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDeath')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDeaths')}`)) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDeath')} `) ||
            commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDeaths')}`))) {
        response = lm.getIntl(language, 'commandNotPossibleDiscord');
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDecay')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDecay')}`)) {
        response = rustplus.getCommandDecay(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxDespawn')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxDespawn')}`)) {
        response = rustplus.getCommandDespawn(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxEvents')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxEvents')}`)) {
        response = rustplus.getCommandEvents(command);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxHeli')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxHeli')}`) {
        response = rustplus.getCommandHeli();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxLarge')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxLarge')}`) {
        response = rustplus.getCommandLarge();
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxLeader')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxLeader')}`)) {
        response = await rustplus.getCommandLeader(command, null);
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxMarker')} `) ||
        commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxMarkers')}`) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxMarker')} `) ||
            commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxMarkers')}`)) {
        response = lm.getIntl(language, 'commandNotPossibleDiscord');
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxMarket')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxMarket')} `)) {
        response = rustplus.getCommandMarket(command);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxMute')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxMute')}`) {
        response = rustplus.getCommandMute();
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxNote')} `) ||
        commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxNotes')}`) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxNote')} `) ||
            commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxNotes')}`)) {
        response = rustplus.getCommandNote(command);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxOffline')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxOffline')}`) {
        response = rustplus.getCommandOffline();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxOnline')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxOnline')}`) {
        response = rustplus.getCommandOnline();
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxPlayer')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxPlayers')}`)) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxPlayer')} `) ||
            commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxPlayers')}`))) {
        response = rustplus.getCommandPlayer(command);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxPop')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxPop')}`) {
        response = rustplus.getCommandPop();
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxProx')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxProx')}`)) {
        response = lm.getIntl(language, 'commandNotPossibleDiscord');
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxRecycle')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxRecycle')}`)) {
        response = rustplus.getCommandRecycle(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxResearch')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxResearch')}`)) {
        response = rustplus.getCommandResearch(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxSend')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxSend')} `)) {
        response = lm.getIntl(language, 'commandNotPossibleDiscord');
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxSmall')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxSmall')}`) {
        response = rustplus.getCommandSmall();
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxStack')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxStack')}`)) {
        response = await rustplus.getCommandStack(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxSteamid')}`) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxSteamid')}`)) {
        response = await rustplus.getCommandSteamId(command, null, null);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxTeam')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxTeam')}`) {
        response = rustplus.getCommandTeam();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxTime')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxTime')}`) {
        response = rustplus.getCommandTime();
    }
    else if ((commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTimer')} `) ||
        commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxTimers')}`) ||
        (commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTimer')} `) ||
            commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxTimers')}`)) {
        response = rustplus.getCommandTimer(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTranslateTo')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTranslateTo')} `)) {
        response = await rustplus.getCommandTranslateTo(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTranslateFromTo')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTranslateFromTo')} `)) {
        response = await rustplus.getCommandTranslateFromTo(command);
    }
    else if (commandLowerCase.startsWith(`${prefix}${lm.getIntl('en', 'commandSyntaxTTS')} `) ||
        commandLowerCase.startsWith(`${prefix}${lm.getIntl(language, 'commandSyntaxTTS')} `)) {
        response = await rustplus.getCommandTTS(command, callerName);
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxUnmute')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxUnmute')}`) {
        response = rustplus.getCommandUnmute();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxUpkeep')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxUpkeep')}`) {
        response = rustplus.getCommandUpkeep();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxUptime')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxUptime')}`) {
        response = rustplus.getCommandUptime();
    }
    else if (commandLowerCase === `${prefix}${lm.getIntl('en', 'commandSyntaxWipe')}` ||
        commandLowerCase === `${prefix}${lm.getIntl(language, 'commandSyntaxWipe')}`) {
        response = rustplus.getCommandWipe();
    }
    else {
        /* Smart Switches/ Group Switches are not currently supported through discord. */
        return false;
    }

    if (response !== null) {
        await discordMessages.sendDiscordCommandResponseMessage(rustplus, message, response);
    }

    const guild = await discordTools.getGuild(message.guild.id);
    if (guild instanceof discordjs.Guild) {
        const channel = await discordTools.getTextChannel(guild.id, message.channelId)
        if (channel instanceof discordjs.TextChannel) {
            log.info(lm.getIntl(Config.general.language, `logDiscordCommand`, {
                guild: `${guild.name} (${guild.id})`,
                channel: `${channel.name} (${channel.id})`,
                user: `${message.author.username} (${message.author.id})`,
                message: message.cleanContent
            }));
        }
    }

    return true;
}