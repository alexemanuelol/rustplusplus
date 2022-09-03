const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    data: new Builder.SlashCommandBuilder()
        .setName('tracker')
        .setDescription('Operations for Battlemetrics Player Tracker.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a Battlemetrics Player Tracker.')
                .addStringOption(option =>
                    option.setName('tracker_id')
                        .setDescription('The ID of the tracker.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('new_tracker_name')
                        .setDescription('The new name for the tracker.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add_player')
                .setDescription('Add a player to the Battlemetrics Player Tracker.')
                .addStringOption(option =>
                    option.setName('tracker_id')
                        .setDescription('The ID of the tracker.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('steam_id')
                        .setDescription('The steam ID for the player.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_player')
                .setDescription('Remove a player from the Battlemetrics Player Tracker.')
                .addStringOption(option =>
                    option.setName('tracker_id')
                        .setDescription('The ID of the tracker.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('steam_id')
                        .setDescription('The steam ID for the player.')
                        .setRequired(true))),

    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        if (!await client.validatePermissions(interaction)) return;

        await interaction.deferReply({ ephemeral: true });

        const trackerId = interaction.options.getString('tracker_id');

        switch (interaction.options.getSubcommand()) {
            case 'edit': {
                if (!Object.keys(instance.trackers).includes(trackerId)) {
                    let str = `Battlemetrics Player Tracker '${trackerId}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    client.log('WARNING', str);
                    return;
                }

                const newTrackerName = interaction.options.getString('new_tracker_name');

                if (instance.trackers[trackerId].name === newTrackerName) {
                    let str = 'No changes were made.';
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    client.log('WARNING', str);
                    return;
                }

                instance.trackers[trackerId].name = newTrackerName;
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendTrackerMessage(interaction.guildId, trackerId);

                let str = `Successfully edited Battlemetrics Player Tracker '${trackerId}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
                client.log('INFO', str);
            } break;

            case 'add_player': {
                if (!Object.keys(instance.trackers).includes(trackerId)) {
                    let str = `Battlemetrics Player Tracker '${trackerId}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    client.log('WARNING', str);
                    return;
                }

                const steamId = interaction.options.getString('steam_id');

                if (instance.trackers[trackerId].players.some(e => e.id === steamId)) {
                    let str = `The player '${steamId}' already exist in '${trackerId}' tracker.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    client.log('WARNING', str);
                    return;
                }

                instance.trackers[trackerId].players.push({
                    name: '-', steamId: steamId, playerId: null, status: false, time: null
                });
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendTrackerMessage(interaction.guildId, trackerId);

                /* To force search of player name via scrape */
                client.battlemetricsIntervalCounter = 0;

                let str = `Successfully added '${steamId}' to the tracker '${trackerId}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
                client.log('INFO', str);
            } break;

            case 'remove_player': {
                if (!Object.keys(instance.trackers).includes(trackerId)) {
                    let str = `Battlemetrics Player Tracker '${trackerId}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    client.log('WARNING', str);
                    return;
                }

                const steamId = interaction.options.getString('steam_id');

                if (!instance.trackers[trackerId].players.some(e => e.steamId === steamId)) {
                    let str = `The player '${steamId}' already exist in '${trackerId}' tracker.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    client.log('WARNING', str);
                    return;
                }

                instance.trackers[trackerId].players =
                    instance.trackers[trackerId].players.filter(e => e.steamId !== steamId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendTrackerMessage(interaction.guildId, trackerId);

                let str = `Successfully removed '${steamId}' from the tracker '${trackerId}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
                client.log('INFO', str);
            } break;

            default: {
            } break;
        }
    },
};
