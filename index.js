const fs = require('fs');
const RustPlus = require('rustplus.js');
const Discord = require('discord.js');
const Config = require('./config.json');
const DiscordBot = require('./structures/DiscordBot');

exports.intervalId = 0;
exports.debug = false;
exports.mapWidth = null;
exports.mapHeight = null;
exports.mapOceanMargin = null;
exports.mapMonuments = null;

/*
 *  INITIALIZE DISCORD/RUSTPLUS
 */

const client = new DiscordBot({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.build();


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
	rustplus.on(event.name, (...args) => event.execute(client, rustplus, ...args));
}


/*
 *  START INSTANCES
 */

/* Connect to the Rust server */
rustplus.connect();