const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const Keywords = require('../util/keywords.js');
const SmartSwitchGroupHandler = require('../handlers/smartSwitchGroupHandler.js');

module.exports = {
    data: new SlashCommandBuilder()
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
                        .addChoice('Autoturret', 'autoturret')
                        .addChoice('Boom Box', 'boombox')
                        .addChoice('Broadcaster', 'broadcaster')
                        .addChoice('Ceiling Light', 'ceiling_light')
                        .addChoice('Discofloor', 'discofloor')
                        .addChoice('Door Controller', 'door_controller')
                        .addChoice('Elevator', 'elevator')
                        .addChoice('HBHF Sensor', 'hbhf_sensor')
                        .addChoice('Heater', 'heater')
                        .addChoice('SAM site', 'samsite')
                        .addChoice('Siren Light', 'siren_light')
                        .addChoice('Smart Alarm', 'smart_alarm')
                        .addChoice('Smart Switch', 'smart_switch')
                        .addChoice('Sprinkler', 'sprinkler')
                        .addChoice('Storage Monitor', 'storage_monitor')
                        .addChoice('Christmas Lights', 'xmas_light')))
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
                .setDescription('Add a Smart Switch to a Group')
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
                .setDescription('Remove a Smart Switch from a Group')
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

        await interaction.deferReply({ ephemeral: true });

        let embedChanged = false;
        let filesChanged = false;

        let rustplus = client.rustplusInstances[interaction.guildId];
        if (!rustplus) {
            await interaction.editReply({
                content: 'No active rustplus instance.',
                ephemeral: true
            });
            client.log('WARNING', 'No active rustplus instance.');
            return;
        }

        const server = `${rustplus.server}-${rustplus.port}`;

        switch (interaction.options.getSubcommand()) {
            case 'edit_switch': {
                const id = interaction.options.getString('id');
                const name = interaction.options.getString('name');
                const command = interaction.options.getString('command');
                const image = interaction.options.getString('image');

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, server).includes(command)) {
                    await interaction.editReply({
                        content: `The command '${command}' is already in use, please choose another command.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The command '${command}' is already in use, please choose another command.`);
                    return;
                }

                if (!Object.keys(instance.switches).includes(id)) {
                    await interaction.editReply({
                        content: 'Invalid ID.',
                        ephemeral: true
                    });
                    client.log('WARNING', 'Invalid ID.');
                    return;
                }

                if (instance.switches[id].ipPort !== server) {
                    await interaction.editReply({
                        content: 'That Smart Switch is not part of this Rust Server.',
                        ephemeral: true
                    });
                    client.log('WARNING', 'That Smart Switch is not part of this Rust Server.');
                    return;
                }

                if (name !== null) {
                    instance.switches[id].name = name;
                    embedChanged = true;
                }
                if (command !== null) {
                    instance.switches[id].command = command;
                    embedChanged = true;
                }
                if (image !== null) {
                    instance.switches[id].image = `${image}.png`;
                    embedChanged = true;
                    filesChanged = true;
                }
                client.writeInstanceFile(interaction.guildId, instance);

                DiscordTools.sendSmartSwitchMessage(interaction.guildId, id, embedChanged, false, filesChanged);
                SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                    client, interaction.guildId, server, id);

                await interaction.editReply({
                    content: 'Successfully edited Smart Switch.',
                    ephemeral: true
                });
                client.log('INFO', 'Successfully edited Smart Switch.');
            } break;

            case 'create_group': {
                const groupName = interaction.options.getString('group_name');
                const command = interaction.options.getString('command');

                if (!instance.serverList[server].hasOwnProperty('switchGroups')) {
                    instance.serverList[server].switchGroups = {};
                    client.writeInstanceFile(interaction.guildId, instance);
                }

                if (Object.keys(instance.serverList[server].switchGroups).includes(groupName)) {
                    await interaction.editReply({
                        content: `The Group name '${groupName}' is already in use.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Group name '${groupName}' is already in use.`);
                    return;
                }

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, server).includes(command)) {
                    await interaction.editReply({
                        content: `The command '${command}' is already in use, please choose another command.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The command '${command}' is already in use, please choose another command.`);
                    return;
                }

                instance.serverList[server].switchGroups[groupName] = {
                    ipPort: server,
                    command: command,
                    switches: []
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName);

                await interaction.editReply({
                    content: `Successfully created the Group '${groupName}'.`,
                    ephemeral: true
                });
                client.log('INFO', `Successfully created the Group '${groupName}'.`);
            } break;

            case 'edit_group': {
                const groupName = interaction.options.getString('group_name');
                const command = interaction.options.getString('command');

                if (!Object.keys(instance.serverList[server].switchGroups).includes(groupName)) {
                    await interaction.editReply({
                        content: `The Group name '${groupName}' does not exist.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Group name '${groupName}' does not exist.`);
                    return;
                }

                if (command === null) {
                    await interaction.editReply({
                        content: 'No changes were made.',
                        ephemeral: true
                    });
                    client.log('WARNING', 'No changes were made.');
                    return;
                }

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, server).includes(command)) {
                    await interaction.editReply({
                        content: `The command '${command}' is already in use, please choose another command.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The command '${command}' is already in use, please choose another command.`);
                    return;
                }

                if (command !== null) {
                    instance.serverList[server].switchGroups[groupName].command = command;
                    embedChanged = true;
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName, true, false, false);

                await interaction.editReply({
                    content: `Successfully edited the Group '${groupName}'.`,
                    ephemeral: true
                });
                client.log('INFO', `Successfully edited the Group '${groupName}'.`);

            } break;

            case 'add_switch': {
                const groupName = interaction.options.getString('group_name');
                const switchId = interaction.options.getString('switch_id');

                if (!Object.keys(instance.serverList[server].switchGroups).includes(groupName)) {
                    await interaction.editReply({
                        content: `The Group name '${groupName}' does not exist.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Group name '${groupName}' does not exist.`);
                    return;
                }

                if (!Object.keys(instance.switches).includes(switchId)) {
                    await interaction.editReply({
                        content: `The Switch ID '${switchId}' does not exist.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Switch ID '${switchId}' does not exist.`);
                    return;
                }

                if (instance.serverList[server].switchGroups[groupName].switches.includes(switchId)) {
                    await interaction.editReply({
                        content: `The Switch ID '${switchId}' is already part of the Group '${groupName}'.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Switch ID '${switchId}' is already part of the Group '${groupName}'.`);
                    return;
                }

                let sw = instance.switches[switchId];

                if (sw.ipPort !== server) {
                    await interaction.editReply({
                        content: `The Switch '${switchId}' is not part of this server.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Switch '${switchId}' is not part of this server.`);
                    return;
                }

                instance.serverList[server].switchGroups[groupName].switches.push(switchId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName, true, false, false);

                await interaction.editReply({
                    content: `Successfully added '${switchId}' to the Group '${groupName}'.`,
                    ephemeral: true
                });
                client.log('INFO', `Successfully added '${switchId}' to the Group '${groupName}'.`);
            } break;

            case 'remove_switch': {
                const groupName = interaction.options.getString('group_name');
                const switchId = interaction.options.getString('switch_id');

                if (!Object.keys(instance.serverList[server].switchGroups).includes(groupName)) {
                    await interaction.editReply({
                        content: `The Group name '${groupName}' does not exist.`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Group name '${groupName}' does not exist.`);
                    return;
                }

                if (!instance.serverList[server].switchGroups[groupName].switches.includes(switchId)) {
                    await interaction.editReply({
                        content: `The Switch '${switchId}' does not exist in the Group '${groupName}'`,
                        ephemeral: true
                    });
                    client.log('WARNING', `The Switch '${switchId}' does not exist in the group '${groupName}'`);
                    return;
                }

                instance.serverList[server].switchGroups[groupName].switches =
                    instance.serverList[server].switchGroups[groupName].switches.filter(e => e !== switchId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName, true, false, false);

                await interaction.editReply({
                    content: `Successfully removed '${switchId}' to the Group '${groupName}'.`,
                    ephemeral: true
                });
                client.log('INFO', `Successfully removed '${switchId}' to the Group '${groupName}'.`);
            } break;

            default: {
            } break;
        }
    },
};
