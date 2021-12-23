const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Setup a RustPlus instance for the guild')
        .addStringOption(option => option
            .setName('server_ip')
            .setDescription('The IP address of the Rust Server')
            .setRequired(true))
        .addStringOption(option => option
            .setName('app_port')
            .setDescription('The Rust+ port for the Rust Server')
            .setRequired(true))
        .addStringOption(option => option
            .setName('steam_id')
            .setDescription('The Steam ID of the user that is setting up the bot')
            .setRequired(true))
        .addStringOption(option => option
            .setName('player_token')
            .setDescription('The Player Token for the Rust Server')
            .setRequired(true)),
    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        /* Get the options from the command */
        let server_ip = interaction.options.getString('server_ip');
        let app_port = interaction.options.getString('app_port');
        let steam_id = interaction.options.getString('steam_id');
        let player_token = interaction.options.getString('player_token');

        /* Validate server_ip and app_port */
        if (!checkIpAddressValid(client, interaction, server_ip) ||
            !checkPortValid(client, interaction, app_port))
            return;

        /* Reply with a temporary 'thinking ...' */
        await interaction.deferReply({ ephemeral: true });

        /* Disconnect previous instance is any */
        if (client.rustplusInstances.hasOwnProperty(interaction.guildId)) {
            client.rustplusInstances[interaction.guildId].disconnect();
        }

        /* Create the rustplus instance */
        let rustplus = client.createRustplusInstance(
            interaction.guildId,
            server_ip,
            app_port,
            steam_id,
            player_token,
            instance.generalSettings.connect
        );

        /* Store the interaction in the RustPlus instance temporarily */
        rustplus.interaction = interaction;
    },
};

async function checkIpAddressValid(client, interaction, ip) {
    let regex = new RegExp('^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$');
    if (!regex.test(ip)) {
        await interaction.reply({
            content: `:x: Invalid Server IP Address: ${ip}`,
            ephemeral: true
        });
        client.log(`Invalid Server IP Address: ${ip}`);
        return false;
    }
    return true;
}

async function checkPortValid(client, interaction, port) {
    if (!(port >= 1 && port <= 65535)) {
        await interaction.reply({
            content: `:x: Invalid Server App Port: ${port}`,
            ephemeral: true
        });
        client.log(`Invalid Server App Port: ${port}`);
        return false;
    }
    return true;
}