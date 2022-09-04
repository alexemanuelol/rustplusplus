const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Keywords = require('../util/keywords.js');
const SmartSwitchGroupHandler = require('../handlers/smartSwitchGroupHandler.js');

module.exports = {
    data: new Builder.SlashCommandBuilder()
        .setName('switch')
        .setDescription('Operations on Smart Switches.')
        .addSubcommand(subcommand => subcommand
            .setName('edit_switch')
            .setDescription('Edit the properties of a Smart Switch.')
            .addStringOption(option => option
                .setName('id')
                .setDescription('The ID of the Smart Switch.')
                .setRequired(true))
            .addStringOption(option => option
                .setName('image')
                .setDescription('Set the image that best represent the Smart Switch.')
                .setRequired(true)
                .addChoices(
                    { name: 'Autoturret', value: 'autoturret' },
                    { name: 'Boom Box', value: 'boombox' },
                    { name: 'Broadcaster', value: 'broadcaster' },
                    { name: 'Ceiling Light', value: 'ceiling_light' },
                    { name: 'Discofloor', value: 'discofloor' },
                    { name: 'Door Controller', value: 'door_controller' },
                    { name: 'Elevator', value: 'elevator' },
                    { name: 'HBHF Sensor', value: 'hbhf_sensor' },
                    { name: 'Heater', value: 'heater' },
                    { name: 'SAM site', value: 'samsite' },
                    { name: 'Siren Light', value: 'siren_light' },
                    { name: 'Smart Alarm', value: 'smart_alarm' },
                    { name: 'Smart Switch', value: 'smart_switch' },
                    { name: 'Sprinkler', value: 'sprinkler' },
                    { name: 'Storage Monitor', value: 'storage_monitor' },
                    { name: 'Christmas Lights', value: 'xmas_light' })))
        .addSubcommand(subcommand => subcommand
            .setName('create_group')
            .setDescription('Create a Smart Switch Group.')
            .addStringOption(option => option
                .setName('group_name')
                .setDescription('The name of the Group to be created.')
                .setRequired(true))
            .addStringOption(option => option
                .setName('command')
                .setDescription('Set the custom command for the Group.')
                .setRequired(true))),

    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        if (!await client.validatePermissions(interaction)) return;

        await interaction.deferReply({ ephemeral: true });

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
                const image = interaction.options.getString('image');

                const device = InstanceUtils.getSmartDevice(interaction.guildId, id);
                if (device === null) {
                    let str = `Invalid ID: '${id}'.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                if (image !== null) {
                    instance.serverList[rustplus.serverId].switches[id].image = `${image}.png`;
                }
                client.writeInstanceFile(interaction.guildId, instance);

                DiscordMessages.sendSmartSwitchMessage(interaction.guildId, rustplus.serverId, id);
                SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                    client, interaction.guildId, rustplus.serverId, id);

                let str = `Successfully edited Smart Switch ` +
                    `'${instance.serverList[rustplus.serverId].switches[id].name}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            case 'create_group': {
                const groupName = interaction.options.getString('group_name');
                const command = interaction.options.getString('command');

                const groupId = client.findAvailableGroupId(interaction.guildId, rustplus.serverId);

                if (Keywords.getListOfUsedKeywords(client, interaction.guildId, rustplus.serverId).includes(command)) {
                    let str = `The command '${command}' is already in use, please choose another command.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                    return;
                }

                instance.serverList[rustplus.serverId].switchGroups[groupId] = {
                    name: groupName,
                    serverId: rustplus.serverId,
                    command: command,
                    switches: [],
                    messageId: null
                }
                client.writeInstanceFile(interaction.guildId, instance);

                await DiscordMessages.sendSmartSwitchGroupMessage(interaction.guildId, rustplus.serverId, groupId);

                let str = `Successfully created the Group '${groupName}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[rustplus.serverId].title));
                rustplus.log('INFO', str);
            } break;

            default: {
            } break;
        }
    },
};
