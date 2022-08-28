const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Keywords = require('../util/keywords.js');
const SmartSwitchGroupHandler = require('../handlers/smartSwitchGroupHandler.js');

module.exports = {
    data: new Builder.SlashCommandBuilder()
        .setName('switch')
        .setDescription('Operations on Smart Switches.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit_switch')
                .setDescription('Edit the properties of a Smart Switch.')
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the Smart Switch.')
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('Rename the Smart Switch.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('command')
                        .setDescription('Set the custom command for the Smart Switch.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('image')
                        .setDescription('Set the image that best represent the Smart Switch.')
                        .setRequired(false)
                        .addChoices(
                            {
                                name: 'Autoturret',
                                value: 'autoturret'
                            },
                            {
                                name: 'Boom Box',
                                value: 'boombox'
                            },
                            {
                                name: 'Broadcaster',
                                value: 'broadcaster'
                            },
                            {
                                name: 'Ceiling Light',
                                value: 'ceiling_light'
                            },
                            {
                                name: 'Discofloor',
                                value: 'discofloor'
                            },
                            {
                                name: 'Door Controller',
                                value: 'door_controller'
                            },
                            {
                                name: 'Elevator',
                                value: 'elevator'
                            },
                            {
                                name: 'HBHF Sensor',
                                value: 'hbhf_sensor'
                            },
                            {
                                name: 'Heater',
                                value: 'heater'
                            },
                            {
                                name: 'SAM site',
                                value: 'samsite'
                            },
                            {
                                name: 'Siren Light',
                                value: 'siren_light'
                            },
                            {
                                name: 'Smart Alarm',
                                value: 'smart_alarm'
                            },
                            {
                                name: 'Smart Switch',
                                value: 'smart_switch'
                            },
                            {
                                name: 'Sprinkler',
                                value: 'sprinkler'
                            },
                            {
                                name: 'Storage Monitor',
                                value: 'storage_monitor'
                            },
                            {
                                name: 'Christmas Lights',
                                value: 'xmas_light'
                            })))
        .addSubcommand(subcommand =>
            subcommand
                .setName('create_group')
                .setDescription('Create a Smart Switch Group.')
                .addStringOption(option =>
                    option
                        .setName('group_name')
                        .setDescription('The name of the Group to be created.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('command')
                        .setDescription('Set the custom command for the Group.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('edit_group')
                .setDescription('Edit the properties of a Group.')
                .addStringOption(option =>
                    option
                        .setName('group_name')
                        .setDescription('The name of the Group.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('command')
                        .setDescription('Set the custom command for the Group.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add_switch')
                .setDescription('Add a Smart Switch to a Group.')
                .addStringOption(option =>
                    option
                        .setName('group_name')
                        .setDescription('The name of the Group.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('switch_id')
                        .setDescription('The Smart Switch ID.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove_switch')
                .setDescription('Remove a Smart Switch from a Group.')
                .addStringOption(option =>
                    option
                        .setName('group_name')
                        .setDescription('The name of the Group.')
                        .setRequired(true))
                .addStringOption(option =>
                    option
                        .setName('switch_id')
                        .setDescription('The Smart Switch ID.')
                        .setRequired(true))),

    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        if (!await client.validatePermissions(interaction)) return;

        await interaction.deferReply({ ephemeral: true });

        let embedChanged = false;
        let filesChanged = false;

        let rustplus = client.rustplusInstances[interaction.guildId];
        if (!rustplus || (rustplus && !rustplus.ready)) {
            let str = 'Not currently connected to a rust server.';
            await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log('WARNING', str);
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case 'edit_switch': {
                const id = interaction.options.getString('id');
                const name = interaction.options.getString('name');
                const command = interaction.options.getString('command');
                const image = interaction.options.getString('image');

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, rustplus.serverId).includes(command)) {
                    let str = `The command '${command}' is already in use, please choose another command.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (!Object.keys(instance.switches).includes(id)) {
                    let str = `Invalid ID: '${id}'.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (instance.switches[id].serverId !== rustplus.serverId) {
                    let str = 'The Smart Switch is not part of this Rust Server.';
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (name !== null) {
                    instance.switches[id].name = name;
                }
                if (command !== null) {
                    instance.switches[id].command = command;
                }
                if (image !== null) {
                    instance.switches[id].image = `${image}.png`;
                }
                client.writeInstanceFile(interaction.guildId, instance);

                DiscordMessages.sendSmartSwitchMessage(interaction.guildId, id);
                SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                    client, interaction.guildId, rustplus.serverId, id);

                let str = `Successfully edited Smart Switch '${instance.switches[id].name}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            case 'create_group': {
                const groupName = interaction.options.getString('group_name');
                const command = interaction.options.getString('command');

                if (!instance.serverList[rustplus.serverId].hasOwnProperty('switchGroups')) {
                    instance.serverList[rustplus.serverId].switchGroups = {};
                    client.writeInstanceFile(interaction.guildId, instance);
                }

                if (Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' is already in use.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, rustplus.serverId).includes(command)) {
                    let str = `The command '${command}' is already in use, please choose another command.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupName] = {
                    serverId: rustplus.serverId,
                    command: command,
                    switches: [],
                    messageId: null
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, groupName);

                let str = `Successfully created the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            case 'edit_group': {
                const groupName = interaction.options.getString('group_name');
                const command = interaction.options.getString('command');

                if (!Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (command === null) {
                    let str = 'No changes were made.';
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, rustplus.serverId).includes(command)) {
                    let str = `The command '${command}' is already in use, please choose another command.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (command !== null) {
                    instance.serverList[rustplus.serverId].switchGroups[groupName].command = command;
                    embedChanged = true;
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, groupName);

                let str = `Successfully edited the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            case 'add_switch': {
                const groupName = interaction.options.getString('group_name');
                const switchId = interaction.options.getString('switch_id');

                if (!Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (!Object.keys(instance.switches).includes(switchId)) {
                    let str = `The Switch ID '${switchId}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (instance.serverList[rustplus.serverId].switchGroups[groupName].switches.includes(switchId)) {
                    let str = `The Switch ID '${switchId}' is already part of the Group '${groupName}'.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                let sw = instance.switches[switchId];

                if (sw.serverId !== rustplus.serverId) {
                    let str = `The Switch '${switchId}' is not part of this server.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupName].switches.push(switchId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, groupName);

                let str = `Successfully added '${switchId}' to the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            case 'remove_switch': {
                const groupName = interaction.options.getString('group_name');
                const switchId = interaction.options.getString('switch_id');

                if (!Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' does not exist.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (!instance.serverList[rustplus.serverId].switchGroups[groupName].switches.includes(switchId)) {
                    let str = `The Switch '${switchId}' does not exist in the Group '${groupName}'`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupName].switches =
                    instance.serverList[rustplus.serverId].switchGroups[groupName].switches.filter(e => e !== switchId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, groupName);

                let str = `Successfully removed '${switchId}' to the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            default: {
            } break;
        }
    },
};
