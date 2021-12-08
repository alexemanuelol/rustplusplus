const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('setnotification')
		.setDescription('Set a singular notification setting.')
		.addSubcommand(subcommand => subcommand
			.setName('cargoship-detected')
			.setDescription('When Cargo Ship is detected, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('cargoship-left')
			.setDescription('When Cargo Ship left the map, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('cargoship-egress')
			.setDescription('When Cargo Ship enters egress stage, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('bradley-apc-destroyed')
			.setDescription('When Bradley APC gets destroyed, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('bradley-apc-should-respawn')
			.setDescription('When Bradley APC should respawn, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('patrol-helicopter-downed')
			.setDescription('When Patrol Helicopter gets downed, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-spawn-cargoship')
			.setDescription('When a Locked Crate spawns on Cargo Ship, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-respawn-oil-rig')
			.setDescription('When a Locked Crate respawns at Oil Rig, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-dropped-at-monument')
			.setDescription('When a Locked Crate gets dropped at a monument, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-left-cargoship')
			.setDescription('When a Locked Crate disappears from Cargo Ship, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-looted-oil-rig')
			.setDescription('When a Locked Crate gets looted at Oil Rig, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-monument-left')
			.setDescription('When a Locked Crate disappears from a monument, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-despawn-warning')
			.setDescription('When a Locked Crate at a monument is about to despawn, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('locked-crate-oil-rig-unlocked')
			.setDescription('When a Locked Crate at Oil Rig is unlocked, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('heavy-scientist-called')
			.setDescription('When Heavy Scientists are called to Oil Rig, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('chinook-47-detected')
			.setDescription('When a Chinook 47 enters the map, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.')))
		.addSubcommand(subcommand => subcommand
			.setName('vending-machine-detected')
			.setDescription('When a new Vending Machine is detected, send a notification.')
			.addBooleanOption(option => option
				.setName('discord')
				.setDescription('Set event notification in Discord.'))
			.addBooleanOption(option => option
				.setName('ingame')
				.setDescription('Set event notification in-game.'))),
	async execute(client, interaction) {
		let subcommand = interaction.options.getSubcommand();
		let optionDiscord = interaction.options.getBoolean('discord');
		let optionInGame = interaction.options.getBoolean('ingame');

		let eventNotification = null;
		switch (subcommand) {
			case 'cargoship-detected':
				eventNotification = 'cargoShipDetected';
				break;
			case 'cargoship-left':
				eventNotification = 'cargoShipLeft';
				break;
			case 'cargoship-egress':
				eventNotification = 'cargoShipEgress';
				break;
			case 'bradley-apc-destroyed':
				eventNotification = 'bradleyApcDestroyed';
				break;
			case 'bradley-apc-should-respawn':
				eventNotification = 'bradleyApcShouldRespawn';
				break;
			case 'patrol-helicopter-downed':
				eventNotification = 'patrolHelicopterDowned';
				break;
			case 'locked-crate-spawn-cargoship':
				eventNotification = 'lockedCrateSpawnCargoShip';
				break;
			case 'locked-crate-respawn-oil-rig':
				eventNotification = 'lockedCrateRespawnOilRig';
				break;
			case 'locked-crate-dropped-at-monument':
				eventNotification = 'lockedCrateDroppedAtMonument';
				break;
			case 'locked-crate-left-cargoship':
				eventNotification = 'lockedCrateLeftCargoShip';
				break;
			case 'locked-crate-looted-oil-rig':
				eventNotification = 'lockedCrateLootedOilRig';
				break;
			case 'locked-crate-monument-left':
				eventNotification = 'lockedCrateMonumentLeft';
				break;
			case 'locked-crate-despawn-warning':
				eventNotification = 'lockedCrateMonumentDespawnWarning';
				break;
			case 'locked-crate-oil-rig-unlocked':
				eventNotification = 'lockedCrateOilRigUnlocked';
				break;
			case 'heavy-scientist-called':
				eventNotification = 'heavyScientistCalled';
				break;
			case 'chinook-47-detected':
				eventNotification = 'chinook47Detected';
				break;
			case 'vending-machine-detected':
				eventNotification = 'vendingMachineDetected';
				break;
			default:
				break;
		}

		let instance = client.readInstanceFile(interaction.guildId);
		if (client.rustplusInstances.hasOwnProperty(interaction.guildId)) {
			if (optionDiscord !== null) {
				client.rustplusInstances[interaction.guildId].notificationSettings[eventNotification].discord =
					optionDiscord;
			}
			if (optionInGame !== null) {
				client.rustplusInstances[interaction.guildId].notificationSettings[eventNotification].inGame =
					optionInGame;
			}
		}
		if (optionDiscord !== null) {
			instance.notificationSettings[eventNotification].discord = optionDiscord;
		}
		if (optionInGame !== null) {
			instance.notificationSettings[eventNotification].inGame = optionInGame;
		}
		client.writeInstanceFile(interaction.guildId, instance);

		await interaction.reply('Notification Settings Updated!');
	},
};
