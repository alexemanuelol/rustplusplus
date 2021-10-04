const fs = require('fs');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Config = require('./config.json');

const commands = []
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(Config.discord.token);

rest.put(Routes.applicationGuildCommands(Config.discord.clientId, Config.discord.guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
