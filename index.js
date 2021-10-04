const fs = require('fs');
const RustPlus = require('rustplus.js');
const { Client, Collection, Intents } = require('discord.js');
const Config = require('./config.json');

/*
 *  DISCORD
 */

/* Create a new client instance */
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });

/* Create a Collection for all the commands */
client.commands = new Collection();

/* Dynamically retrieve the command files */
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	/* Set a new item in the Collection with the key as the command name and the value as the exported module */
	client.commands.set(command.data.name, command);
}

/* Dynamically retrieve the discord event files */
const discordEventFiles = fs.readdirSync('./discordEvents').filter(file => file.endsWith('.js'));
for (const file of discordEventFiles) {
	const event = require(`./discordEvents/${file}`);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}

/* Login to Discord with your client's token */
client.login(Config.discord.token);


/*
 *  RUSTPLUS
 */

/* Create a new rustplus instance */
const rustplus = new RustPlus(
	Config.rustplus.serverIp,
	Config.rustplus.appPort,
	Config.rustplus.steamId,
	Config.rustplus.playerToken);

/* Dynamically retrieve the rustplus event files */
const rustplusEventFiles = fs.readdirSync('./rustplusEvents').filter(file => file.endsWith('.js'));
for (const file of rustplusEventFiles) {
	const event = require(`./rustplusEvents/${file}`);
	rustplus.on(event.name, (...args) => event.execute(...args));
}

rustplus.connect();