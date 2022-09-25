const _ = require('lodash');
const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');

module.exports = {
    name: 'credentials',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('credentials')
            .setDescription(client.intlGet(guildId, 'commandsCredentialsDesc'))
            .addSubcommand(subcommand => subcommand
                .setName('set')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsSetDesc'))
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
            .addSubcommand(subcommand => subcommand
                .setName('clear')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsClearDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('is_set')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsIsSetDesc')));
    },

    async execute(client, interaction) {
        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case 'set': {
                setCredentials(client, interaction);
            } break;

            case 'clear': {
                clearCredentials(client, interaction);
            } break;

            case 'is_set': {
                isSetCredentials(client, interaction);
            } break;

            default: {
            } break;
        }
    },
};

async function setCredentials(client, interaction) {
    const newCredentials = new Object();
    newCredentials.fcm_credentials = {};

    newCredentials.fcm_credentials.keys = {};
    newCredentials.fcm_credentials.keys.privateKey = interaction.options.getString('keys_private_key');
    newCredentials.fcm_credentials.keys.publicKey = interaction.options.getString('keys_public_key');
    newCredentials.fcm_credentials.keys.authSecret = interaction.options.getString('keys_auth_secret');

    newCredentials.fcm_credentials.fcm = {};
    newCredentials.fcm_credentials.fcm.token = interaction.options.getString('fcm_token');
    newCredentials.fcm_credentials.fcm.pushSet = interaction.options.getString('fcm_push_set');

    newCredentials.fcm_credentials.gcm = {};
    newCredentials.fcm_credentials.gcm.token = interaction.options.getString('gcm_token');
    newCredentials.fcm_credentials.gcm.androidId = interaction.options.getString('gcm_android_id');
    newCredentials.fcm_credentials.gcm.securityToken = interaction.options.getString('gcm_security_token');
    newCredentials.fcm_credentials.gcm.appId = interaction.options.getString('gcm_app_id');

    newCredentials.owner = interaction.member.user.id;

    for (const guild of client.guilds.cache) {
        const credentials = InstanceUtils.readCredentialsFile(guild[0]);
        if (_.isEqual(newCredentials, credentials.credentials)) {
            const str = client.intlGet(interaction.guildId, 'commandsCredentialsAlreadyInUse');
            await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warning'), str);
            return;
        }
    }

    const credentials = InstanceUtils.readCredentialsFile(interaction.guildId);
    credentials.credentials = newCredentials;
    InstanceUtils.writeCredentialsFile(interaction.guildId, credentials);

    /* Start Fcm Listener */
    require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));

    const str = client.intlGet(interaction.guildId, 'commandsCredentialsSetSuccess');
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'info'), str);
}

async function clearCredentials(client, interaction) {
    if (client.currentFcmListeners[interaction.guildId]) {
        client.currentFcmListeners[interaction.guildId].destroy();
    }

    const credentials = InstanceUtils.readCredentialsFile(interaction.guildId);
    credentials.credentials = null;
    InstanceUtils.writeCredentialsFile(interaction.guildId, credentials);

    const str = client.intlGet(interaction.guildId, 'commandsCredentialsClearSuccess');
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'info'), str);
}

async function isSetCredentials(client, interaction) {
    const credentials = InstanceUtils.readCredentialsFile(interaction.guildId);
    const str = credentials.credentials === null ? client.intlGet(interaction.guildId, 'commandsCredentialsAreSet') :
        client.intlGet(interaction.guildId, 'commandsCredentialsAreNotSet');
    const isSet = (credentials.credentials === null) ? 1 : 0;
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(isSet, str));
    client.log(client.intlGet(null, 'info'), str);
}