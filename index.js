const Discord = require('discord.js');
const DiscordBot = require('./structures/DiscordBot');

const client = new DiscordBot({ intents: [Discord.Intents.FLAGS.GUILDS] });
client.build();

exports.client = client;