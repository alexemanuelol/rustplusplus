const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    discordCommandHandler: async function (rustplus, client, message) {
        const command = message.cleanContent;
        const callerName = message.author.username;
        const commandLowerCase = command.toLowerCase();
        const prefix = rustplus.generalSettings.prefix;

        let response = null;
        if (commandLowerCase === `${prefix}afk`) {
            response = rustplus.getCommandAfk();
        }
        else if (commandLowerCase.startsWith(`${prefix}alive`)) {
            response = rustplus.getCommandAlive(command);
        }
        else if (commandLowerCase === `${prefix}bradley`) {
            response = rustplus.getCommandBradley();
        }
        else if (commandLowerCase === `${prefix}cargo`) {
            response = rustplus.getCommandCargo();
        }
        else if (commandLowerCase === `${prefix}chinook`) {
            response = rustplus.getCommandChinook();
        }
        else if (commandLowerCase === `${prefix}crate`) {
            response = rustplus.getCommandCrate();
        }
        else if (commandLowerCase === `${prefix}heli`) {
            response = rustplus.getCommandHeli();
        }
        else if (commandLowerCase === `${prefix}large`) {
            response = rustplus.getCommandLarge();
        }
        else if (commandLowerCase.startsWith(`${prefix}leader `)) {
            response = await rustplus.getCommandLeader(command, null);
        }
        else if (commandLowerCase.startsWith(`${prefix}marker `)) {
            response = 'Command is not possible through discord.';
        }
        else if (commandLowerCase === `${prefix}mute`) {
            response = rustplus.getCommandMute();
        }
        else if (commandLowerCase.startsWith(`${prefix}note`)) {
            response = rustplus.getCommandNote(command);
        }
        else if (commandLowerCase === `${prefix}offline`) {
            response = rustplus.getCommandOffline();
        }
        else if (commandLowerCase === `${prefix}online`) {
            response = rustplus.getCommandOnline();
        }
        else if (commandLowerCase.startsWith(`${prefix}player`)) {
            response = rustplus.getCommandPlayer(command);
        }
        else if (commandLowerCase === `${prefix}pop`) {
            response = rustplus.getCommandPop();
        }
        else if (commandLowerCase.startsWith(`${prefix}prox`)) {
            response = 'Command is not possible through discord.';
        }
        else if (commandLowerCase === `${prefix}small`) {
            response = rustplus.getCommandSmall();
        }
        else if (commandLowerCase === `${prefix}time`) {
            response = rustplus.getCommandTime();
        }
        else if (commandLowerCase.startsWith(`${prefix}timer `)) {
            response = rustplus.getCommandTimer(command);
        }
        else if (commandLowerCase.startsWith(`${prefix}tr `)) {
            response = await rustplus.getCommandTranslateTo(command);
        }
        else if (commandLowerCase.startsWith(`${prefix}trf `)) {
            response = await rustplus.getCommandTranslateFromTo(command);
        }
        else if (commandLowerCase.startsWith(`${prefix}tts `)) {
            response = await rustplus.getCommandTTS(command, callerName);
        }
        else if (commandLowerCase === `${prefix}unmute`) {
            response = rustplus.getCommandUnmute();
        }
        else if (commandLowerCase === `${prefix}upkeep`) {
            response = rustplus.getCommandUpkeep();
        }
        else if (commandLowerCase === `${prefix}wipe`) {
            response = rustplus.getCommandWipe();
        }
        else {
            /* Smart Switches/ Group Switches are not currently supported through discord. */
            return false;
        }

        if (response !== null) {
            DiscordMessages.sendDiscordCommandResponseMessage(rustplus, client, message, response);
        }

        return true;
    },
};