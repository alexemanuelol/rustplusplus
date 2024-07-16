const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	name: 'restart',

	getData(client, guildId) {
		return new SlashCommandBuilder()
			.setName('restart')
			.setDescription('Перезапускает процесс Node.js');
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;

		const verifyId = Math.floor(100000 + Math.random() * 900000);
		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const str = client.intlGet(guildId, 'restartingProcess');
		await client.interactionEditReply(interaction, {
			embeds: [client.discordEmbeds.getActionInfoEmbed(0, str)]
		});
		client.log(client.intlGet(null, 'infoCap'), str);

		// Завершение процесса Node.js
		process.exit(0);
	},
};
