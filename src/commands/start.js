const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Starts the configured rustplus instance'),
	async execute(client, interaction) {
		if (!client.rustplusInstances.hasOwnProperty(interaction.guildId)) {
			await interaction.reply({
				content: `:x: There is no rustplus instance configured, use the /setup command`,
				ephemeral: true
			});
			client.log('There is no rustplus instance configured, use the /setup command');
			return;
		}

		let instance = client.readInstanceFile(interaction.guildId);
		instance.generalSettings.connect = true;
		client.writeInstanceFile(interaction.guildId, instance);

		/* Reply with a temporary 'thinking ...' */
		await interaction.deferReply({ ephemeral: true });

		client.rustplusInstances[interaction.guildId].interaction = interaction;
		client.rustplusInstances[interaction.guildId].disconnect();
		client.rustplusInstances[interaction.guildId].connect();
	},
};
