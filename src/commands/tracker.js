const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tracker')
        .setDescription('Operations for Battlemetrics Player Tracker.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit')
                .setDescription('Edit a Battlemetrics Player Tracker.')
                .addStringOption(option =>
                    option.setName('tracker_name')
                        .setDescription('The name of the tracker.')
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
                    option.setName('tracker_name')
                        .setDescription('The name of the tracker.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('steam_id')
                        .setDescription('The steam id for the player.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_player')
                .setDescription('Remove a player from the Battlemetrics Player Tracker.')
                .addStringOption(option =>
                    option.setName('tracker_name')
                        .setDescription('The name of the tracker.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('steam_id')
                        .setDescription('The steam id for the player.')
                        .setRequired(true))),

    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        if (instance.role !== null) {
            if (!interaction.member.permissions.has('ADMINISTRATOR') &&
                !interaction.member.roles.cache.has(instance.role)) {
                let role = DiscordTools.getRole(interaction.guildId, instance.role);
                let str = `You are not part of the '${role.name}' role, therefore you can't run bot commands.`;
                await client.interactionReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ff0040')
                        .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                    ephemeral: true
                });
                client.log('WARNING', str);
                return;
            }
        }

        await interaction.deferReply({ ephemeral: true });

        const trackerName = interaction.options.getString('tracker_name');

        switch (interaction.options.getSubcommand()) {
            case 'edit': {
                if (!Object.keys(instance.trackers).includes(trackerName)) {
                    let str = `Battlemetrics Player Tracker '${trackerName}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                        ephemeral: true
                    });
                    client.log('WARNING', str);
                    return;
                }

                const newTrackerName = interaction.options.getString('new_tracker_name');

                if (trackerName === newTrackerName) {
                    let str = 'No changes were made.';
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                        ephemeral: true
                    });
                    client.log('WARNING', str);
                    return;
                }

                instance.trackers[newTrackerName] = JSON.parse(JSON.stringify(instance.trackers[trackerName]));
                delete instance.trackers[trackerName];
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendTrackerMessage(interaction.guildId, newTrackerName);

                let str = `Successfully edited Battlemetrics Player Tracker '${trackerName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
                    ephemeral: true
                });
                client.log('INFO', str);
            } break;

            case 'add_player': {
                if (!Object.keys(instance.trackers).includes(trackerName)) {
                    let str = `Battlemetrics Player Tracker '${trackerName}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                        ephemeral: true
                    });
                    client.log('WARNING', str);
                    return;
                }

                const steamId = interaction.options.getString('steam_id');

                if (instance.trackers[trackerName].players.some(e => e.id === steamId)) {
                    let str = `The player '${steamId}' already exist in '${trackerName}' tracker.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                        ephemeral: true
                    });
                    client.log('WARNING', str);
                    return;
                }

                instance.trackers[trackerName].players.push({
                    name: '-', steamId: steamId, playerId: null, status: false, time: null
                });
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendTrackerMessage(interaction.guildId, trackerName);

                /* To force search of player name via scrape */
                client.battlemetricsIntervalCounter = 0;

                let str = `Successfully added '${steamId}' to the tracker '${trackerName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
                    ephemeral: true
                });
                client.log('INFO', str);
            } break;

            case 'remove_player': {
                if (!Object.keys(instance.trackers).includes(trackerName)) {
                    let str = `Battlemetrics Player Tracker '${trackerName}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                        ephemeral: true
                    });
                    client.log('WARNING', str);
                    return;
                }

                const steamId = interaction.options.getString('steam_id');

                if (!instance.trackers[trackerName].players.some(e => e.steamId === steamId)) {
                    let str = `The player '${steamId}' already exist in '${trackerName}' tracker.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                        ephemeral: true
                    });
                    client.log('WARNING', str);
                    return;
                }

                instance.trackers[trackerName].players =
                    instance.trackers[trackerName].players.filter(e => e.steamId !== steamId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendTrackerMessage(interaction.guildId, trackerName);

                let str = `Successfully removed '${steamId}' from the tracker '${trackerName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
                    ephemeral: true
                });
                client.log('INFO', str);
            } break;

            default: {
            } break;
        }
    },
};
