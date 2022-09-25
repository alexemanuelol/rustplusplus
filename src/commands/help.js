const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

const DiscordButtons = require('../discordTools/discordButtons.js');

module.exports = {
	name: 'help',

	getData(client, guildId) {
		return new Builder.SlashCommandBuilder()
			.setName('help')
			.setDescription(client.intlGet(guildId, 'commandsHelpDesc'));
	},

	async execute(client, interaction) {
		await client.interactionReply(interaction, {
			components: [new Discord.ActionRowBuilder()
				.addComponents(
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'DEVELOPER',
						url: 'https://github.com/alexemanuelol'
					}),
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'REPOSITORY',
						url: 'https://github.com/alexemanuelol/rustPlusPlus'
					}),
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'DOCUMENTATION',
						url: 'https://github.com/alexemanuelol/rustPlusPlus/blob/master/docs/documentation.md'
					}),
					DiscordButtons.getButton({
						style: Discord.ButtonStyle.Link,
						label: 'CREDENTIALS',
						url: 'https://github.com/alexemanuelol/rustPlusPlus/releases/tag/v1.0.0'
					})
				)
			],
			ephemeral: true
		});
		client.log(client.intlGet(interaction.guildId, 'info'),
			client.intlGet(interaction.guildId, 'commandsHelpDesc'));
	},
};
