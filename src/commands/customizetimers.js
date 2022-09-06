const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds');
const Timer = require('../util/timer');

module.exports = {
	data: new Builder.SlashCommandBuilder()
		.setName('customizetimers')
		.setDescription('Operations to customize In-Game timers.')
		.addSubcommand(subcommand => subcommand
			.setName('cargo_ship_egress_time')
			.setDescription(
				'Get/Set time for cargo ship egress stage timer for connected server, default: 50min (3000s).')
			.addIntegerOption(option => option
				.setName('seconds')
				.setDescription('Seconds before cargo ship enters egress stage.')
				.setRequired(false)))
		.addSubcommand(subcommand => subcommand
			.setName('bradley_apc_respawn_time')
			.setDescription(
				'Get/Set time for Bradley APC respawn timer for connected server, default: 60 min (3600s).')
			.addIntegerOption(option => option
				.setName('seconds')
				.setDescription('Seconds till Bradley APC respawns.')
				.setRequired(false)))
		.addSubcommand(subcommand => subcommand
			.setName('crate_despawn_time')
			.setDescription(
				'Get/Set time for Locked Crate despawn timer for connected server, default: 120 min (7200s).')
			.addIntegerOption(option => option
				.setName('seconds')
				.setDescription('Seconds till Locked Crate despawns.')
				.setRequired(false)))
		.addSubcommand(subcommand => subcommand
			.setName('crate_despawn_warning_time')
			.setDescription(
				'Get/Set time for warning before Locked Crate despawns for connected server, default: 20 min (1200s).')
			.addIntegerOption(option => option
				.setName('seconds')
				.setDescription('Seconds before Locked Crate despawn warning.')
				.setRequired(false)))
		.addSubcommand(subcommand => subcommand
			.setName('oil_rig_crate_unlock_time')
			.setDescription(
				'Get/Set time for Locked Crate on Oil Rig unlocks for connected server, default: 15 min (900s).')
			.addIntegerOption(option => option
				.setName('seconds')
				.setDescription('Seconds till Locked Crate on Oil Rig unlocks.')
				.setRequired(false))),

	async execute(client, interaction) {
		const instance = client.readInstanceFile(interaction.guildId);
		const rustplus = client.rustplusInstances[interaction.guildId];

		if (!await client.validatePermissions(interaction)) return;
		await interaction.deferReply({ ephemeral: true });

		if (!rustplus) {
			const str = 'Not currently connected to a rust server.';
			await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
			client.log('WARNING', str);
			return;
		}

		let str = '';
		switch (interaction.options.getSubcommand()) {
			case 'cargo_ship_egress_time': {
				str = getString(client, interaction, rustplus.serverId, 'cargoShipEgressTimeMs');
			} break;

			case 'bradley_apc_respawn_time': {
				str = getString(client, interaction, rustplus.serverId, 'bradleyApcRespawnTimeMs');
			} break;

			case 'crate_despawn_time': {
				const seconds = interaction.options.getInteger('seconds');
				if (seconds === null) {
					str = getString(client, interaction, rustplus.serverId, 'lockedCrateDespawnTimeMs');
				}
				else {
					const ms = seconds * 1000;
					if (ms <= instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs) {
						const sec = parseInt(
							instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs / 1000);
						const warning = `Time can not be lower than despawn warning time (${sec}s).`;
						await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, warning));
						client.log('WARNING', warning);
						return;
					}

					const time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			case 'crate_despawn_warning_time': {
				const seconds = interaction.options.getInteger('seconds');
				if (seconds === null) {
					str = getString(client, interaction, rustplus.serverId, 'lockedCrateDespawnWarningTimeMs');
				}
				else {
					const ms = seconds * 1000;
					if (ms >= instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs) {
						const sec = parseInt(instance.serverList[rustplus.serverId].lockedCrateDespawnTimeMs / 1000);
						const warning = `Time can not be higher than despawn time (${sec}s).`;
						await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, warning));
						client.log('WARNING', warning);
						return;
					}

					const time = Timer.secondsToFullScale(seconds);
					instance.serverList[rustplus.serverId].lockedCrateDespawnWarningTimeMs = ms;
					client.writeInstanceFile(interaction.guildId, instance);
					str = `Time was set to: ${time} (${seconds}).`;
				}
			} break;

			case 'oil_rig_crate_unlock_time': {
				str = getString(client, interaction, rustplus.serverId, 'oilRigLockedCrateUnlockTimeMs');
			} break;

			default: {
			} break;
		}

		await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
		client.log('INFO', str);
	},
};

function getString(client, interaction, serverId, setting) {
	const instance = client.readInstanceFile(interaction.guildId);
	const seconds = interaction.options.getInteger('seconds');

	if (seconds === null) {
		const ms = instance.serverList[serverId][setting];
		const sec = parseInt(ms / 1000);
		const time = Timer.secondsToFullScale(sec);
		return `Time is currently set to: ${time} (${sec}s).`;
	}
	else {
		const ms = seconds * 1000;
		const time = Timer.secondsToFullScale(seconds);
		instance.serverList[serverId][setting] = ms;
		client.writeInstanceFile(interaction.guildId, instance);
		return `Time was set to: ${time} (${seconds}).`;
	}
}