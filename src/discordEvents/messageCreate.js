module.exports = {
    name: 'messageCreate',
    async execute(client, message) {
        const instance = client.readInstanceFile(message.guild.id);
        const channelId = instance.channelId.teamchat;
        const rustplus = client.rustplusInstances[message.guild.id];

        if (message.channelId !== channelId || message.author.bot ||
            !rustplus || (rustplus && !rustplus.isOperational)) {
            return;
        }

        await rustplus.sendTeamMessageAsync(`${message.author.username}: ${message.cleanContent}`);
    },
}