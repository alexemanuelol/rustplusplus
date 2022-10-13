const _ = require('lodash');
const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');

module.exports = {
    name: 'credentials',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('credentials')
            .setDescription(client.intlGet(guildId, 'commandsCredentialsDesc'))
            .addSubcommand(subcommand => subcommand
                .setName('add')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsAddDesc'))
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
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription('Steam ID.')
                    .setRequired(true))
                .addBooleanOption(option => option
                    .setName('host')
                    .setDescription('Host the bot')
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('remove')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsRemoveDesc'))
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription(client.intlGet(guildId, 'commandsCredentialsRemoveSteamIdDesc'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('show')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsShowDesc')))
            .addSubcommand(subcommand => subcommand
                .setName('set_hoster')
                .setDescription(client.intlGet(guildId, 'commandsCredentialsSetHosterDesc'))
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription(client.intlGet(guildId, 'commandsCredentialsSetHosterSteamIdDesc'))
                    .setRequired(false)));
    },

    async execute(client, interaction) {
        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case 'add': {
                addCredentials(client, interaction);
            } break;

            case 'remove': {
                removeCredentials(client, interaction);
            } break;

            case 'show': {
                showCredentials(client, interaction);
            } break;

            case 'set_hoster': {
                setHosterCredentials(client, interaction);
            } break;

            default: {
            } break;
        }
    },
};

async function addCredentials(client, interaction) {
    const guildId = interaction.guildId;
    const credentials = InstanceUtils.readCredentialsFile(guildId);
    const steamId = interaction.options.getString('steam_id');
    const isHoster = interaction.options.getBoolean('host') || Object.keys(credentials).length === 1;

    if (steamId in credentials) {
        const str = client.intlGet(guildId, 'credentialsAlreadyRegistered', { steamId: steamId });
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    credentials[steamId] = new Object();
    credentials[steamId].fcm_credentials = new Object();

    credentials[steamId].fcm_credentials.keys = new Object();
    credentials[steamId].fcm_credentials.keys.privateKey = interaction.options.getString('keys_private_key');
    credentials[steamId].fcm_credentials.keys.publicKey = interaction.options.getString('keys_public_key');
    credentials[steamId].fcm_credentials.keys.authSecret = interaction.options.getString('keys_auth_secret');

    credentials[steamId].fcm_credentials.fcm = new Object();
    credentials[steamId].fcm_credentials.fcm.token = interaction.options.getString('fcm_token');
    credentials[steamId].fcm_credentials.fcm.pushSet = interaction.options.getString('fcm_push_set');

    credentials[steamId].fcm_credentials.gcm = new Object();
    credentials[steamId].fcm_credentials.gcm.token = interaction.options.getString('gcm_token');
    credentials[steamId].fcm_credentials.gcm.androidId = interaction.options.getString('gcm_android_id');
    credentials[steamId].fcm_credentials.gcm.securityToken = interaction.options.getString('gcm_security_token');
    credentials[steamId].fcm_credentials.gcm.appId = interaction.options.getString('gcm_app_id');

    credentials[steamId].discordUserId = interaction.member.user.id;

    if (isHoster) credentials.hoster = steamId;

    InstanceUtils.writeCredentialsFile(guildId, credentials);

    /* Start Fcm Listener */
    if (isHoster) {
        require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));
    }
    else {
        /* TODO:
            - Make none hosters a fcm listener of their own that only listen to server pair
            - Start rustplus instance for it with one command: leader
        */
    }

    const str = client.intlGet(interaction.guildId, 'credentialsAddedSuccessfully');
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function removeCredentials(client, interaction) {
    const guildId = interaction.guildId;
    const credentials = InstanceUtils.readCredentialsFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (!steamId) {
        steamId = Object.keys(credentials).find(e => credentials[e].discordUserId === interaction.member.user.id);
    }

    if (!(steamId in credentials)) {
        const str = client.intlGet(guildId, 'credentialsDoNotExist', {
            steamId: steamId ? steamId : client.intlGet(guildId, 'unknown')
        });
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    if (steamId === credentials.hoster && client.currentFcmListeners[guildId]) {
        client.currentFcmListeners[guildId].destroy();
        credentials.hoster = null;
    }

    delete credentials[steamId];
    InstanceUtils.writeCredentialsFile(guildId, credentials);

    const str = client.intlGet(guildId, 'credentialsRemovedSuccessfully', { steamId: steamId });
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function showCredentials(client, interaction) {
    await DiscordMessages.sendCredentialsShowMessage(interaction);
}

async function setHosterCredentials(client, interaction) {
    const guildId = interaction.guildId;
    const credentials = InstanceUtils.readCredentialsFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (!steamId) {
        steamId = Object.keys(credentials).find(e => credentials[e].discordUserId === interaction.member.user.id);
    }

    if (!(steamId in credentials)) {
        const str = client.intlGet(guildId, 'credentialsDoNotExist', {
            steamId: steamId ? steamId : client.intlGet(guildId, 'unknown')
        });
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    credentials.hoster = steamId;
    InstanceUtils.writeCredentialsFile(guildId, credentials);

    require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));

    const str = client.intlGet(guildId, 'credentialsSetHosterSuccessfully', { steamId: steamId });
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}