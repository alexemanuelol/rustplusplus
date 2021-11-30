const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('stop')
		.setDescription('Stops the current rustplus instance'),
	async execute(client, interaction) {
		if (!client.rustplusInstances.hasOwnProperty(interaction.guildId)) {
			await interaction.reply({
				content: `:x: There is no rustplus instance configured, use the /setup command`,
				ephemeral: true
			});
			client.log('There is no rustplus instance configured, use the /setup command');
			return;
		}

		let instances = client.readInstancesFile();
		instances[interaction.guildId].generalSettings.connect = false;
		client.writeInstancesFile(instances);

		/* Reply with a temporary 'thinking ...' */
		await interaction.deferReply({ ephemeral: true });

		client.rustplusInstances[interaction.guildId].interaction = interaction;

		client.rustplusInstances[interaction.guildId].disconnect();
	},
};
