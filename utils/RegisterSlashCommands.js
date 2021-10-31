const fs = require("fs");
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const Config = require('../config.json');

module.exports = (guildId) => {
    const commands = [];
    const commandFiles = fs.readdirSync(`${__dirname}/../commands`).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '9' }).setToken(Config.discord.token);

    rest.put(Routes.applicationGuildCommands(Config.discord.clientId, guildId), { body: commands })
        .then(() => console.log(`Successfully registered application commands for guild: ${guildId}.`))
        .catch(console.error);
};
