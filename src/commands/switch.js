const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const InstanceUtils = require('../util/instanceUtils.js');
const SmartSwitchGroupHandler = require('../handlers/smartSwitchGroupHandler.js');

module.exports = {
    data: new Builder.SlashCommandBuilder()
        .setName('switch')
        .setDescription('Operations on Smart Switches.')
        .addSubcommand(subcommand => subcommand
            .setName('edit')
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
                    { name: 'Christmas Lights', value: 'xmas_light' }))),

    async execute(client, interaction) {
        const instance = client.readInstanceFile(interaction.guildId);
        const rustplus = client.rustplusInstances[interaction.guildId];

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case 'edit': {
                const entityId = interaction.options.getString('id');
                const image = interaction.options.getString('image');

                const device = InstanceUtils.getSmartDevice(interaction.guildId, entityId);
                if (device === null) {
                    let str = `Invalid ID: '${entityId}'.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[device.serverId].title));
                    client.log('WARNING', str);
                    return;
                }

                const entity = instance.serverList[device.serverId].switches[entityId];

                if (image !== null) instance.serverList[device.serverId].switches[entityId].image = `${image}.png`;
                client.writeInstanceFile(interaction.guildId, instance);

                if (rustplus && rustplus.serverId === device.serverId) {
                    DiscordMessages.sendSmartSwitchMessage(interaction.guildId, device.serverId, entityId);
                    SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                        client, interaction.guildId, device.serverId, entityId);
                }

                let str = `Successfully edited Smart Switch '${entity.name}'.`;
                await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                    instance.serverList[device.serverId].title));
                client.log('INFO', str);
            } break;

            default: {
            } break;
        }
    },
};
