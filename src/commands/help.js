const { SlashCommandBuilder } = require('@discordjs/builders');
const { ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help message'),
	async execute(client, interaction) {
		await client.interactionReply(interaction, {
			components: [new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('DEVELOPER')
						.setURL('https://github.com/alexemanuelol'),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('REPOSITORY')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus'),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('DOCUMENTATION')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus/blob/master/docs/documentation.md'),
					new ButtonBuilder()
						.setStyle(ButtonStyle.Link)
						.setLabel('CREDENTIALS')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus/releases/tag/v1.0.0')
				)
			],
			ephemeral: true
		});
		client.log('INFO', 'Displaying help message.');
	},
};
