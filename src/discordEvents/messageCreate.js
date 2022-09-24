const DiscordCommandHandler = require('../handlers/discordCommandHandler.js');

module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        const instance = client.getInstance(message.guild.id);
        const rustplus = client.rustplusInstances[message.guild.id];

        if (message.author.bot || !rustplus || (rustplus && !rustplus.isOperational)) return;

        if (message.channelId === instance.channelId.commands) {
            await DiscordCommandHandler.discordCommandHandler(rustplus, client, message);
        }
        else if (message.channelId === instance.channelId.teamchat) {
            await rustplus.sendTeamMessageAsync(`${message.author.username}: ${message.cleanContent}`);
        }
    },
}