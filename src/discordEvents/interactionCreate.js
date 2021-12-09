module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        if (interaction.isButton()) {
            require('../handlers/buttonHandler')(client, interaction);
            return;
        }

        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        /* If the command doesn't exist, return */
        if (!command) return;

        try {
            await command.execute(client, interaction);
        } catch (error) {
            client.log(error);
            console.log(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};