const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageButton, MessageActionRow } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help message'),
	async execute(client, interaction) {
		await client.interactionReply(interaction, {
			components: [new MessageActionRow()
				.addComponents(
					new MessageButton()
						.setStyle('LINK')
						.setLabel('DEVELOPER')
						.setURL('https://github.com/alexemanuelol'),
					new MessageButton()
						.setStyle('LINK')
						.setLabel('REPOSITORY')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus'),
					new MessageButton()
						.setStyle('LINK')
						.setLabel('DOCUMENTATION')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus/blob/master/docs/documentation.md'),
					new MessageButton()
						.setStyle('LINK')
						.setLabel('CREDENTIALS')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus/releases/tag/v1.0.0')
				)
			],
			ephemeral: true
		});
		client.log('INFO', 'Displaying help message.');
	},
};
