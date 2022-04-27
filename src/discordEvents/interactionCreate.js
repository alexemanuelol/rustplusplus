module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        /* Check so that the interaction comes from valid channels */
        if (!Object.values(instance.channelId).includes(interaction.channelId) && !interaction.isCommand) {
            client.log('WARNING', 'Interaction from an invalild channel.')
            if (interaction.isButton()) {
                try {
                    interaction.deferUpdate();
                }
                catch (e) {
                    client.log('ERROR', 'Could not defer interaction.', 'error');
                }
            }
        }

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

                let str = 'There was an error while executing this command!';
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ff0040')
                        .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                    ephemeral: true
                });
                client.log('ERROR', str, 'error');
            }
        }
        else {
            client.log('ERROR', 'Unknown Interaction...', 'error')
            if (interaction.isButton()) {
                try {
                    interaction.deferUpdate();
                }
                catch (e) {
                    client.log('ERROR', 'Could not defer interaction.', 'error');
                }
            }
        }
    },
};