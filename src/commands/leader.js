const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools');
const { MessageEmbed } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('leader')
		.setDescription('Give or take the leadership from/to a team member.')
		.addStringOption(option =>
			option.setName('member')
				.setDescription('The name of the team member.')
				.setRequired(true)),

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

		const member = interaction.options.getString('member');

		let rustplus = client.rustplusInstances[interaction.guildId];
		if (!rustplus) {
			let str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
				ephemeral: true
			});
			client.log('WARNING', str);
			return;
		}

		if (!rustplus.generalSettings.leaderCommandEnabled) {
			let str = 'Leader command is turned OFF in settings.';
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
					.setFooter({ text: instance.serverList[rustplus.serverId].title })],
				ephemeral: true
			});
			rustplus.log('WARNING', str);
			return;
		}

		if (rustplus.team.leaderSteamId !== rustplus.playerId) {
			let player = rustplus.team.getPlayer(rustplus.playerId);
			let str = `Leader command only works if the current leader is ${player.name}.`;
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
					.setFooter({ text: instance.serverList[rustplus.serverId].title })],
				ephemeral: true
			});
			rustplus.log('WARNING', str);
			return;
		}

		let matchedPlayer = null;
		/* Look for parts of the name */
		for (let player of rustplus.team.players) {
			if (player.name.toLowerCase().includes(member.toLowerCase())) {
				matchedPlayer = player;
				break;
			}
		}

		if (matchedPlayer === null) {
			/* Find the closest name */
			for (let player of rustplus.team.players) {
				if (Str.similarity(member, player.name) >= 0.9) {
					matchedPlayer = player;
					break;
				}
			}
		}

		if (matchedPlayer === null) {
			let str = `Could not identify team member: ${member}.`;
			await client.interactionEditReply(interaction, {
				embeds: [new MessageEmbed()
					.setColor('#ff0040')
					.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
					.setFooter({ text: instance.serverList[rustplus.serverId].title })],
				ephemeral: true
			});
			rustplus.log('WARNING', str);
		}
		else {
			if (rustplus.team.leaderSteamId === matchedPlayer.steamId) {
				let str = `${matchedPlayer.name} is already team leader.`;
				await client.interactionEditReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ff0040')
						.setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
						.setFooter({ text: instance.serverList[rustplus.serverId].title })],
					ephemeral: true
				});
				rustplus.log('WARNING', str);
			}
			else {
				await rustplus.team.changeLeadership(matchedPlayer.steamId);
				let str = `Team leadership was transferred to ${matchedPlayer.name}.`;
				await client.interactionEditReply(interaction, {
					embeds: [new MessageEmbed()
						.setColor('#ce412b')
						.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
						.setFooter({ text: instance.serverList[rustplus.serverId].title })],
					ephemeral: true
				});
				rustplus.log('INFO', str);
			}
		}
	},
};
