const Discord = require('discord.js');
const Config = require('./config.json');
const DiscordBot = require('./structures/DiscordBot');
const RustPlus = require('./structures/RustPlus');

exports.intervalId = 0;
exports.debug = false;
exports.mapWidth = null;
exports.mapHeight = null;
exports.mapOceanMargin = null;
exports.mapMonuments = null;


const client = new DiscordBot({ intents: [Discord.Intents.FLAGS.GUILDS] });

client.build();


const rustplus = new RustPlus(
	Config.rustplus.serverIp,
	Config.rustplus.appPort,
	Config.rustplus.steamId,
	Config.rustplus.playerToken);

rustplus.build();