module.exports = {
    name: 'interactionCreate',
    async execute(discord, rustplus, interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        /* If the command doesn't exist, return */
        if (!command) return;

        try {
            await command.execute(discord, rustplus, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};