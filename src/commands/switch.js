const { SlashCommandBuilder } = require('@discordjs/builders');
const DiscordTools = require('../discordTools/discordTools.js');
const Keywords = require('../util/keywords.js');
const SmartSwitchGroupHandler = require('../handlers/smartSwitchGroupHandler.js');
const { MessageEmbed } = require('discord.js');

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

        let embedChanged = false;
        let filesChanged = false;

        let rustplus = client.rustplusInstances[interaction.guildId];
        if (!rustplus) {
            let str = 'Not currently connected to a rust server.';
            await client.interactionEditReply(interaction, {
                embeds: [new MessageEmbed()
                    .setColor('#ff0040')
                    .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                ephemeral: true
            });
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
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (!Object.keys(instance.switches).includes(id)) {
                    let str = `Invalid ID: '${id}'.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (instance.switches[id].serverId !== rustplus.serverId) {
                    let str = 'The Smart Switch is not part of this Rust Server.';
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
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
                    client, interaction.guildId, rustplus.serverId, id);

                let str = `Successfully edited Smart Switch '${instance.switches[id].name}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                    ephemeral: true
                });
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
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, rustplus.serverId).includes(command)) {
                    let str = `The command '${command}' is already in use, please choose another command.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupName] = {
                    serverId: rustplus.serverId,
                    command: command,
                    switches: []
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName);

                let str = `Successfully created the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                    ephemeral: true
                });
                rustplus.log('INFO', str);
            } break;

            case 'edit_group': {
                const groupName = interaction.options.getString('group_name');
                const command = interaction.options.getString('command');

                if (!Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (command === null) {
                    let str = 'No changes were made.';
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, rustplus.serverId).includes(command)) {
                    let str = `The command '${command}' is already in use, please choose another command.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (command !== null) {
                    instance.serverList[rustplus.serverId].switchGroups[groupName].command = command;
                    embedChanged = true;
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName, true, false, false);

                let str = `Successfully edited the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                    ephemeral: true
                });
                rustplus.log('INFO', str);
            } break;

            case 'add_switch': {
                const groupName = interaction.options.getString('group_name');
                const switchId = interaction.options.getString('switch_id');

                if (!Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (!Object.keys(instance.switches).includes(switchId)) {
                    let str = `The Switch ID '${switchId}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (instance.serverList[rustplus.serverId].switchGroups[groupName].switches.includes(switchId)) {
                    let str = `The Switch ID '${switchId}' is already part of the Group '${groupName}'.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                let sw = instance.switches[switchId];

                if (sw.serverId !== rustplus.serverId) {
                    let str = `The Switch '${switchId}' is not part of this server.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupName].switches.push(switchId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName, true, false, false);

                let str = `Successfully added '${switchId}' to the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                    ephemeral: true
                });
                rustplus.log('INFO', str);
            } break;

            case 'remove_switch': {
                const groupName = interaction.options.getString('group_name');
                const switchId = interaction.options.getString('switch_id');

                if (!Object.keys(instance.serverList[rustplus.serverId].switchGroups).includes(groupName)) {
                    let str = `The Group name '${groupName}' does not exist.`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                if (!instance.serverList[rustplus.serverId].switchGroups[groupName].switches.includes(switchId)) {
                    let str = `The Switch '${switchId}' does not exist in the Group '${groupName}'`;
                    await client.interactionEditReply(interaction, {
                        embeds: [new MessageEmbed()
                            .setColor('#ff0040')
                            .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                        ephemeral: true
                    });
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupName].switches =
                    instance.serverList[rustplus.serverId].switchGroups[groupName].switches.filter(e => e !== switchId);
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordTools.sendSmartSwitchGroupMessage(interaction.guildId, groupName, true, false, false);

                let str = `Successfully removed '${switchId}' to the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, {
                    embeds: [new MessageEmbed()
                        .setColor('#ce412b')
                        .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)
                        .setFooter({ text: instance.serverList[rustplus.serverId].title })],
                    ephemeral: true
                });
                rustplus.log('INFO', str);
            } break;

            default: {
            } break;
        }
    },
};
