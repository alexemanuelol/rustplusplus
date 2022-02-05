const { SlashCommandBuilder } = require('@discordjs/builders');
const _ = require('lodash');
const DiscordTools = require('../discordTools/discordTools.js');

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
        let instance = null;

        switch (interaction.options.getSubcommand()) {
            case 'set':
                let keysPrivateKey = interaction.options.getString('keys_private_key');
                let keysPublicKey = interaction.options.getString('keys_public_key');
                let keysAuthSecret = interaction.options.getString('keys_auth_secret');
                let fcmToken = interaction.options.getString('fcm_token');
                let fcmPushSet = interaction.options.getString('fcm_push_set');
                let gcmToken = interaction.options.getString('gcm_token');
                let gcmAndroidId = interaction.options.getString('gcm_android_id');
                let gcmSecurityToken = interaction.options.getString('gcm_security_token');
                let gcmAppId = interaction.options.getString('gcm_app_id');

                let credentials = new Object();
                credentials.fcm_credentials = {};

                credentials.fcm_credentials.keys = {};
                credentials.fcm_credentials.keys.privateKey = keysPrivateKey;
                credentials.fcm_credentials.keys.publicKey = keysPublicKey;
                credentials.fcm_credentials.keys.authSecret = keysAuthSecret;

                credentials.fcm_credentials.fcm = {};
                credentials.fcm_credentials.fcm.token = fcmToken;
                credentials.fcm_credentials.fcm.pushSet = fcmPushSet;

                credentials.fcm_credentials.gcm = {};
                credentials.fcm_credentials.gcm.token = gcmToken;
                credentials.fcm_credentials.gcm.androidId = gcmAndroidId;
                credentials.fcm_credentials.gcm.securityToken = gcmSecurityToken;
                credentials.fcm_credentials.gcm.appId = gcmAppId;

                for (let guild of client.guilds.cache) {
                    let guildId = guild[0]

                    instance = client.readInstanceFile(guildId);
                    if (_.isEqual(credentials, instance.credentials)) {
                        interaction.reply({
                            content: 'Credentials are already used for another guild server!',
                            ephemeral: true
                        });
                        client.log('Credentials are already used for another guild server!');
                        return;
                    }
                }

                instance = client.readInstanceFile(interaction.guildId);
                instance.credentials = credentials;
                client.writeInstanceFile(interaction.guildId, instance);

                /* Start Fcm Listener */
                require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));

                interaction.reply({
                    content: 'Credentials were set successfully!',
                    ephemeral: true
                });
                client.log('Credentials were set successfully!');
                break;

            case 'clear':
                if (client.currentFcmListeners[interaction.guildId]) {
                    client.currentFcmListeners[interaction.guildId].destroy();
                }

                instance = client.readInstanceFile(interaction.guildId);
                instance.credentials = null;
                client.writeInstanceFile(interaction.guildId, instance);

                interaction.reply({
                    content: 'Credentials were cleared successfully!',
                    ephemeral: true
                });
                client.log('Credentials were cleared successfully!');
                break;

            default:
                break;
        }
    },
};