const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = async function (rustplus, client, message) {
    await DiscordMessages.sendTeamChatMessage(rustplus.guildId, message);
}