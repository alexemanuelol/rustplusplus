const fs = require('fs');
const RustPlus = require('rustplus.js');
const Discord = require('discord.js');
const Config = require('./config.json');

exports.intervalId = 0;
exports.debug = false;
exports.mapWidth = null;
exports.mapHeight = null;
exports.mapOceanMargin = null;

/*
 *  INITIALIZE DISCORD/RUSTPLUS
 */

/* Create a new client instance */
const client = new Discord.Client({ intents: [Discord.Intents.FLAGS.GUILDS] });

/* Create a Collection for all the commands */
client.commands = new Discord.Collection();

/* Create a new rustplus instance */
const rustplus = new RustPlus(
	Config.rustplus.serverIp,
	Config.rustplus.appPort,
	Config.rustplus.steamId,
	Config.rustplus.playerToken);


/*
 *  REGISTER COMMANDS
 */

/* Dynamically retrieve the command files */
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	/* Set a new item in the Collection with the key as the command name and the value as the exported module */
	client.commands.set(command.data.name, command);
}


/*
 *  REGISTER DISCORD/RUSTPLUS EVENT HANDLERS
 */

/* Dynamically retrieve the discord event files */
const discordEventFiles = fs.readdirSync('./discordEvents').filter(file => file.endsWith('.js'));
for (const file of discordEventFiles) {
	const event = require(`./discordEvents/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(client, rustplus, ...args));
	}
}

/* Dynamically retrieve the rustplus event files */
const rustplusEventFiles = fs.readdirSync('./rustplusEvents').filter(file => file.endsWith('.js'));
for (const file of rustplusEventFiles) {
	const event = require(`./rustplusEvents/${file}`);
	rustplus.on(event.name, (...args) => event.execute(client, rustplus, ...args));
}


/*
 *  START INSTANCES
 */

/* Login to Discord with your client's token */
client.login(Config.discord.token);

/* Connect to the Rust server */
rustplus.connect();