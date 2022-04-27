const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('lodash');
const DiscordTools = require('../discordTools/discordTools.js');
const { MessageEmbed } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credentials')
        .setDescription('Set/Clear the FCM Credentials for the user account.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set the FCM Credentials.')
                .addStringOption(option => option
                    .setName('keys_private_key')
                    .setDescription('Keys Private Key.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('keys_public_key')
                    .setDescription('Keys Public Key.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('keys_auth_secret')
                    .setDescription('Keys Auth Secret.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('fcm_token')
                    .setDescription('FCM Token.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('fcm_push_set')
                    .setDescription('FCM Push Set.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('gcm_token')
                    .setDescription('GCM Token.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('gcm_android_id')
                    .setDescription('GCM Android ID.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('gcm_security_token')
                    .setDescription('GCM Security Token.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('gcm_app_id')
                    .setDescription('GCM App ID.')
                    .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Clear the FCM Credentials.')),
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

        switch (interaction.options.getSubcommand()) {
            case 'set': {
                setCredentials(client, interaction);
            } break;

            case 'clear': {
                clearCredentials(client, interaction);
            } break;

            default: {
            } break;
        }
    },
};

async function setCredentials(client, interaction) {
    let credentials = new Object();
    credentials.fcm_credentials = {};

    credentials.fcm_credentials.keys = {};
    credentials.fcm_credentials.keys.privateKey = interaction.options.getString('keys_private_key');
    credentials.fcm_credentials.keys.publicKey = interaction.options.getString('keys_public_key');
    credentials.fcm_credentials.keys.authSecret = interaction.options.getString('keys_auth_secret');

    credentials.fcm_credentials.fcm = {};
    credentials.fcm_credentials.fcm.token = interaction.options.getString('fcm_token');
    credentials.fcm_credentials.fcm.pushSet = interaction.options.getString('fcm_push_set');

    credentials.fcm_credentials.gcm = {};
    credentials.fcm_credentials.gcm.token = interaction.options.getString('gcm_token');
    credentials.fcm_credentials.gcm.androidId = interaction.options.getString('gcm_android_id');
    credentials.fcm_credentials.gcm.securityToken = interaction.options.getString('gcm_security_token');
    credentials.fcm_credentials.gcm.appId = interaction.options.getString('gcm_app_id');

    credentials.owner = interaction.member.user.id;

    for (let guild of client.guilds.cache) {
        let instance = client.readCredentialsFile(guild[0]);
        if (_.isEqual(credentials, instance.credentials)) {
            let str = 'Credentials are already used for another discord server!';
            await client.interactionEditReply(interaction, {
                embeds: [new MessageEmbed()
                    .setColor('#ff0040')
                    .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
                ephemeral: true
            });
            client.log('WARNING', str);
            return;
        }
    }

    let instance = client.readCredentialsFile(interaction.guildId);
    instance.credentials = credentials;
    client.writeCredentialsFile(interaction.guildId, instance);

    /* Start Fcm Listener */
    require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));

    let str = 'Credentials were set successfully!';
    await client.interactionEditReply(interaction, {
        embeds: [new MessageEmbed()
            .setColor('#ce412b')
            .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
        ephemeral: true
    });
    client.log('INFO', str);
}

async function clearCredentials(client, interaction) {
    if (client.currentFcmListeners[interaction.guildId]) {
        client.currentFcmListeners[interaction.guildId].destroy();
    }

    let instance = client.readCredentialsFile(interaction.guildId);
    instance.credentials = null;
    client.writeCredentialsFile(interaction.guildId, instance);

    let str = 'Credentials were cleared successfully!';
    await client.interactionEditReply(interaction, {
        embeds: [new MessageEmbed()
            .setColor('#ce412b')
            .setDescription(`\`\`\`diff\n+ ${str}\n\`\`\``)],
        ephemeral: true
    });
    client.log('INFO', str);
}