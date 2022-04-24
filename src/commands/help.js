const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Display help message'),
	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (instance.role !== null) {
			if (!interaction.member.permissions.has('ADMINISTRATOR') &&
				!interaction.member.roles.cache.has(instance.role)) {
				let role = DiscordTools.getRole(interaction.guildId, instance.role);
				await interaction.reply({
					content: `You are not part of the \`${role.name}\` role, therefore you can't run bot commands.`,
					ephemeral: true
				});
				client.log('INFO',
					`You are not part of the '${role.name}' role, therefore you can't run bot commands.`);
				return;
			}
		}

		await interaction.reply({
			content: 'HAH! No help for you! >:)',
			ephemeral: true
		});
		client.log('INFO', 'HAH! No help for you! >:)');
	},
};
