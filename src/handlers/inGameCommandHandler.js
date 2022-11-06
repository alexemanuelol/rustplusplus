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

const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const SmartSwitchHandler = require('./smartSwitchHandler.js');

module.exports = {
    inGameCommandHandler: async function (rustplus, client, message) {
        const command = message.broadcast.teamMessage.message.message;
        const callerSteamId = message.broadcast.teamMessage.message.steamId.toString();
        const callerName = message.broadcast.teamMessage.message.name;
        const commandLowerCase = message.broadcast.teamMessage.message.message.toLowerCase();
        const prefix = rustplus.generalSettings.prefix;


        if (!rustplus.isOperational) {
            return false;
        }
        else if (!rustplus.generalSettings.inGameCommandsEnabled) {
            return false;
        }
        else if (commandLowerCase === `${prefix}afk`) {
            rustplus.printCommandOutput(rustplus.getCommandAfk());
        }
        else if (commandLowerCase.startsWith(`${prefix}alive`)) {
            rustplus.printCommandOutput(rustplus.getCommandAlive(command));
        }
        else if (commandLowerCase === `${prefix}bradley`) {
            rustplus.printCommandOutput(rustplus.getCommandBradley());
        }
        else if (commandLowerCase === `${prefix}cargo`) {
            rustplus.printCommandOutput(rustplus.getCommandCargo());
        }
        else if (commandLowerCase === `${prefix}chinook`) {
            rustplus.printCommandOutput(rustplus.getCommandChinook());
        }
        else if (commandLowerCase.startsWith(`${prefix}connection `) || commandLowerCase === `${prefix}connections`) {
            rustplus.printCommandOutput(rustplus.getCommandConnection(command));
        }
        else if (commandLowerCase === `${prefix}crate`) {
            rustplus.printCommandOutput(rustplus.getCommandCrate());
        }
        else if (commandLowerCase === `${prefix}heli`) {
            rustplus.printCommandOutput(rustplus.getCommandHeli());
        }
        else if (commandLowerCase === `${prefix}large`) {
            rustplus.printCommandOutput(rustplus.getCommandLarge());
        }
        else if (commandLowerCase.startsWith(`${prefix}leader`)) {
            rustplus.printCommandOutput(await rustplus.getCommandLeader(command, callerSteamId));
        }
        else if (commandLowerCase.startsWith(`${prefix}marker `) || commandLowerCase === `${prefix}markers`) {
            rustplus.printCommandOutput(await rustplus.getCommandMarker(command, callerSteamId));
        }
        else if (commandLowerCase === `${prefix}mute`) {
            rustplus.printCommandOutput(rustplus.getCommandMute());
        }
        else if (commandLowerCase.startsWith(`${prefix}note `) || commandLowerCase === `${prefix}notes`) {
            rustplus.printCommandOutput(rustplus.getCommandNote(command));
        }
        else if (commandLowerCase === `${prefix}offline`) {
            rustplus.printCommandOutput(rustplus.getCommandOffline());
        }
        else if (commandLowerCase === `${prefix}online`) {
            rustplus.printCommandOutput(rustplus.getCommandOnline());
        }
        else if (commandLowerCase.startsWith(`${prefix}player`)) {
            rustplus.printCommandOutput(rustplus.getCommandPlayer(command));
        }
        else if (commandLowerCase === `${prefix}pop`) {
            rustplus.printCommandOutput(rustplus.getCommandPop());
        }
        else if (commandLowerCase.startsWith(`${prefix}prox`)) {
            rustplus.printCommandOutput(await rustplus.getCommandProx(command, callerSteamId));
        }
        else if (commandLowerCase.startsWith(`${prefix}send `)) {
            rustplus.printCommandOutput(await rustplus.getCommandSend(command, callerName));
        }
        else if (commandLowerCase === `${prefix}small`) {
            rustplus.printCommandOutput(rustplus.getCommandSmall());
        }
        else if (commandLowerCase === `${prefix}time`) {
            rustplus.printCommandOutput(rustplus.getCommandTime());
        }
        else if (commandLowerCase.startsWith(`${prefix}timer `) || commandLowerCase === `${prefix}timers`) {
            rustplus.printCommandOutput(rustplus.getCommandTimer(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}tr `)) {
            rustplus.printCommandOutput(await rustplus.getCommandTranslateTo(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}trf `)) {
            rustplus.printCommandOutput(await rustplus.getCommandTranslateFromTo(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}tts `)) {
            rustplus.printCommandOutput(await rustplus.getCommandTTS(command, callerName));
        }
        else if (commandLowerCase === `${prefix}unmute`) {
            rustplus.printCommandOutput(rustplus.getCommandUnmute());
        }
        else if (commandLowerCase === `${prefix}upkeep`) {
            rustplus.printCommandOutput(rustplus.getCommandUpkeep());
        }
        else if (commandLowerCase === `${prefix}wipe`) {
            rustplus.printCommandOutput(rustplus.getCommandWipe());
        }
        else {
            /* Maybe a custom command? */

            if (await SmartSwitchHandler.smartSwitchCommandHandler(rustplus, client, command)) {
                return true;
            }

            if (await SmartSwitchGroupHandler.smartSwitchGroupCommandHandler(rustplus, client, command)) {
                return true;
            }

            return false;
        }

        return true;
    },
};
