
const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');

const Groq = require("groq-sdk");

module.exports = {
	name: 'ai',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('ai')
			.setDescription('Ask an AI Rust Bot a question')
			.addStringOption(option => option
				.setName('query')
				.setDescription('Your rust related question')
				.setRequired(true));
	},

	async execute(client, interaction) {
		const guildId = interaction.guildId;
		const instance = client.getInstance(guildId);
		const rustplus = client.rustplusInstances[guildId];
		const verifyId = Math.floor(100000 + Math.random() * 900000);

		client.logInteraction(interaction, verifyId, 'slashCommand');

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		const aiQuery = interaction.options.getString('query');

		if (aiQuery !== null) {
			const aiResponse = await rustplus.askAiBot(aiQuery);
			client.log(client.intlGet(null, 'aiCap'),  aiResponse);
			await DiscordMessages.sendAiMessage(interaction, aiResponse);
		}
	}
};
