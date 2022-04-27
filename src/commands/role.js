const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('role')
		.setDescription('Set/Clear a specific role that will be able to see the rustPlusPlus category content.')
		.addSubcommand(subcommand =>
			subcommand.setName('set')
				.setDescription('Set the role.')
				.addRoleOption(option =>
					option.setName('role')
						.setDescription('The role rustPlusPlus channels will be visible to.')
						.setRequired(true)))
		.addSubcommand(subcommand =>
			subcommand.setName('clear')
				.setDescription('Clear the role (to allow everyone to see the rustPlusPlus channels).')),

	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (instance.role !== null) {
			if (!interaction.member.permissions.has('ADMINISTRATOR') &&
				!interaction.member.roles.cache.has(instance.role)) {
				let role = DiscordTools.getRole(interaction.guildId, instance.role);
				let str = `You are not part of the '${role.name}' role, therefore you can't run bot commands.`;
				await client.interactionReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ff0040')
						.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
					ephemeral: true
				});
				client.log('WARNING', str);
				return;
			}
		}

		await interaction.deferReply({ ephemeral: true });

		let role = null;

		switch (interaction.options.getSubcommand()) {
			case 'set': {
				role = interaction.options.getRole('role');
				instance.role = role.id;
				client.writeInstanceFile(interaction.guildId, instance);

			} break;

			case 'clear': {
				instance.role = null;
				client.writeInstanceFile(interaction.guildId, instance);

			} break;

			default: {

			} break;
		}

		const guild = DiscordTools.getGuild(interaction.guildId);
		if (guild) {
			let category = await require('../discordTools/SetupGuildCategory')(client, guild);
			await require('../discordTools/SetupGuildChannels')(client, guild, category);
		}

		if (interaction.options.getSubcommand() === 'set') {
			let str = `rustPlusPlus role has been set to '${role.name}'.`;
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ce412b')
					.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
				ephemeral: true
			});
			client.log('INFO', str);
		}
		else {
			let str = 'rustPlusPlus role has been cleared.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ce412b')
					.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
				ephemeral: true
			});
			client.log('INFO', str);
		}
	},
};
