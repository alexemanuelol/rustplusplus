const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help message'),
	async execute(client, interaction) {
		await client.interactionReply(interaction, {
			components: [new Discord.ActionRowBuilder()
				.addComponents(
					new Discord.ButtonBuilder()
						.setStyle(Discord.ButtonStyle.Link)
						.setLabel('DEVELOPER')
						.setURL('https://github.com/alexemanuelol'),
					new Discord.ButtonBuilder()
						.setStyle(Discord.ButtonStyle.Link)
						.setLabel('REPOSITORY')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus'),
					new Discord.ButtonBuilder()
						.setStyle(Discord.ButtonStyle.Link)
						.setLabel('DOCUMENTATION')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus/blob/master/docs/documentation.md'),
					new Discord.ButtonBuilder()
						.setStyle(Discord.ButtonStyle.Link)
						.setLabel('CREDENTIALS')
						.setURL('https://github.com/alexemanuelol/rustPlusPlus/releases/tag/v1.0.0')
				)
			],
			ephemeral: true
		});
		client.log('INFO', 'Displaying help message.');
	},
};
