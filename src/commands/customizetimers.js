const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools');
const { MessageEmbed } = require('discord.js');
const Timer = require('../util/timer');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('customizetimers')
		.setDescription('Operations to customize In-Game timers.')
		.addSubcommand(subcommand =>
			subcommand
				.setName('cargo_ship_egress_time')
				.setDescription(
					'Get/Set time for cargo ship egress stage timer for connected server, default: 50min (3000s).')
				.addIntegerOption(option =>
					option
						.setName('seconds')
						.setDescription('Seconds before cargo ship enters egress stage.')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('bradley_apc_respawn_time')
				.setDescription(
					'Get/Set time for Bradley APC respawn timer for connected server, default: 60 min (3600s).')
				.addIntegerOption(option =>
					option
						.setName('seconds')
						.setDescription('Seconds till Bradley APC respawns.')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('crate_despawn_time')
				.setDescription(
					'Get/Set time for Locked Crate despawn timer for connected server, default: 120 min (7200s).')
				.addIntegerOption(option =>
					option
						.setName('seconds')
						.setDescription('Seconds till Locked Crate despawns.')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('crate_despawn_warning_time')
				.setDescription(
					'Get/Set time for warning before Locked Crate despawns for connected server, default: 20 min (1200s).')
				.addIntegerOption(option =>
					option
						.setName('seconds')
						.setDescription('Seconds before Locked Crate despawn warning.')
						.setRequired(false)))
		.addSubcommand(subcommand =>
			subcommand
				.setName('oil_rig_crate_unlock_time')
				.setDescription(
					'Get/Set time for Locked Crate on Oil Rig unlocks for connected server, default: 15 min (900s).')
				.addIntegerOption(option =>
					option
						.setName('seconds')
						.setDescription('Seconds till Locked Crate on Oil Rig unlocks.')
						.setRequired(false))),

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

		let seconds = interaction.options.getInteger('seconds');

		let str = '';
		switch (interaction.options.getSubcommand()) {
			case 'cargo_ship_egress_time': {
				if (seconds === null) {
					let ms = instance.serverList[rustplus.serverId].cargoShipEgressTimeMs;
					let sec = parseInt(ms / 1000);
					let time = Timer.secondsToFullScale(sec);
					str = `Time is currently set to: ${time} (${sec}s).`;
				}
				else {
					let ms = seconds * 1000;
					let time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].cargoShipEgressTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			case 'bradley_apc_respawn_time': {
				if (seconds === null) {
					let ms = instance.serverList[rustplus.serverId].bradleyApcRespawnTimeMs;
					let sec = parseInt(ms / 1000);
					let time = Timer.secondsToFullScale(sec);
					str = `Time is currently set to: ${time} (${sec}s).`;
				}
				else {
					let ms = seconds * 1000;
					let time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].bradleyApcRespawnTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			case 'crate_despawn_time': {
				if (seconds === null) {
					let ms = instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs;
					let sec = parseInt(ms / 1000);
					let time = Timer.secondsToFullScale(sec);
					str = `Time is currently set to: ${time} (${sec}s).`;
				}
				else {
					let ms = seconds * 1000;
					if (ms <= instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs) {
						let sec = instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs / 1000;
						sec = parseInt(sec);
						let warning = `Time can not be lower than despawn warning time (${sec}s).`;
						await client.interactionEditReply(interaction, {
							embeds: [new MessageEmbed()
								.setColor('#ff0040')
								.setDescription(`\`\`\`diff\n- ${warning}\n\`\`\``)],
							ephemeral: true
						});
						client.log('WARNING', warning);
						return;
					}

					let time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			case 'crate_despawn_warning_time': {
				if (seconds === null) {
					let ms = instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs;
					let sec = parseInt(ms / 1000);
					let time = Timer.secondsToFullScale(sec);
					str = `Time is currently set to: ${time} (${sec}s).`;
				}
				else {
					let ms = seconds * 1000;
					if (ms >= instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs) {
						let sec = instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs / 1000;
						sec = parseInt(sec);
						let warning = `Time can not be higher than despawn time (${sec}s).`;
						await client.interactionEditReply(interaction, {
							embeds: [new MessageEmbed()
								.setColor('#ff0040')
								.setDescription(`\`\`\`diff\n- ${warning}\n\`\`\``)],
							ephemeral: true
						});
						client.log('WARNING', warning);
						return;
					}

					let time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			case 'oil_rig_crate_unlock_time': {
				if (seconds === null) {
					let ms = instance.serverList[rustplus.serverId].oilRigLockedCrateUnlockTimeMs;
					let sec = parseInt(ms / 1000);
					let time = Timer.secondsToFullScale(sec);
					str = `Time is currently set to: ${time} (${sec}s).`;
				}
				else {
					let ms = seconds * 1000;
					let time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].oilRigLockedCrateUnlockTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			default: {
			} break;
		}

		await client.interactionEditReply(interaction, {
			embeds: [new MessageEmbed()
				.setColor('#ce412b')
				.setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
			ephemeral: true
		});
		client.log('INFO', str);
	},
};
