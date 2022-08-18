const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const { EmbedBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reset')
		.setDescription('Reset Discord channels.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('discord')
				.setDescription('Reset discord channels.')),
	async execute(client, interaction) {
		let instance = client.readInstanceFile(interaction.guildId);

		if (!await client.validatePermissions(interaction)) return;

		await interaction.deferReply({ ephemeral: true });

		switch (interaction.options.getSubcommand()) {
			case 'discord': {
				const guild = DiscordTools.getGuild(interaction.guildId);

				instance.firstTime = true;
				client.writeInstanceFile(interaction.guildId, instance);

				let category = await require('../discordTools/SetupGuildCategory')(client, guild);
				await require('../discordTools/SetupGuildChannels')(client, guild, category);

				await require('../discordTools/SetupServerList')(client, guild);
				await require('../discordTools/SetupSettingsMenu')(client, guild);
				await require('../discordTools/SetupTrackers')(client, guild);

				instance = client.readInstanceFile(interaction.guildId);
				instance.informationMessageId.map = null;
				instance.informationMessageId.server = null;
				instance.informationMessageId.event = null;
				instance.informationMessageId.team = null;
				client.writeInstanceFile(interaction.guildId, instance);

				await DiscordTools.clearTextChannel(guild.id, instance.channelId.information, 100);

				let rustplus = client.rustplusInstances[guild.id];
				if (rustplus && rustplus.ready) {
					await rustplus.map.writeMap(false, true);

					let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.information);

					if (!channel) {
						client.log('ERROR', 'Invalid guild or channel.', 'error');
					}
					else {
						instance = client.readInstanceFile(guild.id);

						let file = new AttachmentBuilder(`src/resources/images/maps/${guild.id}_map_full.png`);
						let msg = await client.messageSend(channel, { files: [file] });
						instance.informationMessageId.map = msg.id;
						client.writeInstanceFile(guild.id, instance);
					}
				}

				let str = 'Successfully reset Discord.';
				await client.interactionEditReply(interaction, {
					embeds: [new EmbedBuilder()
						.setColor('#ce412b')
						.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
					ephemeral: true
				});
				client.log('INFO', str);
			} break;

			default: {
			} break;
		}
	},
};
