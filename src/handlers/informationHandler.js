const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    handler: async function (rustplus) {
        if (rustplus.informationIntervalCounter === 0) {
            await DiscordMessages.sendUpdateServerInformationMessage(rustplus);
            await DiscordMessages.sendUpdateEventInformationMessage(rustplus);
            await DiscordMessages.sendUpdateTeamInformationMessage(rustplus);
        }

        if (rustplus.informationIntervalCounter === 5) {
            rustplus.informationIntervalCounter = 0;
        }
        else {
            rustplus.informationIntervalCounter += 1;
        }
    },
}