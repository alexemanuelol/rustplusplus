module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        if (interaction.isButton()) {
            require('../handlers/buttonHandler')(client, interaction);
        }
        else if (interaction.isSelectMenu()) {
            require('../handlers/selectMenuHandler')(client, interaction);
        }
        else if (interaction.isCommand) {
            const command = interaction.client.commands.get(interaction.commandName);

            /* If the command doesn't exist, return */
            if (!command) {
                return;
            }

            try {
                await command.execute(client, interaction);
            } catch (error) {
                client.log('ERROR', error, 'error');

                await interaction.reply({
                    content: 'There was an error while executing this command!',
                    ephemeral: true
                });
            }
        }
        else {
            client.log('ERROR', 'Unknown Interaction...', 'error')
            interaction.deferUpdate();
        }
    },
};