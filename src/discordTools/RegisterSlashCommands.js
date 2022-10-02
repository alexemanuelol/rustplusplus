const Fs = require("fs");
const Path = require('path');
const Rest = require('@discordjs/rest');
const Types = require('discord-api-types/v9');

const Config = require('../../config');

module.exports = async (client, guild) => {
    const commands = [];
    const commandFiles = Fs.readdirSync(Path.join(__dirname, '..', 'commands')).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(`../commands/${file}`);
        commands.push(command.getData(client, guild.id).toJSON());
    }

    const rest = new Rest.REST({ version: '9' }).setToken(Config.discord.token);

    try {
        await rest.put(Types.Routes.applicationGuildCommands(Config.discord.clientId, guild.id), { body: commands });
    }
    catch (e) {
        client.log(
            client.intlGet(null, 'errorCap'),
            client.intlGet(null, 'couldNotRegisterSlashCommands', { guildId: guild.id }) +
            client.intlGet(null, 'makeSureApplicationsCommandsEnabled'),
            'error'
        );
        process.exit(1);
    }
    client.log(client.intlGet(null, 'infoCap'),
        client.intlGet(null, 'slashCommandsSuccessRegister', { guildId: guild.id }));
};
