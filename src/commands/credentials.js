/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const _ = require('lodash');
const Builder = require('@discordjs/builders');

const Config = require('../../config');
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
        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case 'add': {
                addCredentials(client, interaction, verifyId);
            } break;

            case 'remove': {
                removeCredentials(client, interaction, verifyId);
            } break;

            case 'show': {
                showCredentials(client, interaction, verifyId);
            } break;

            case 'set_hoster': {
                setHosterCredentials(client, interaction, verifyId);
            } break;

            default: {
            } break;
        }
    },
};

async function addCredentials(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const credentials = InstanceUtils.readCredentialsFile(guildId);
    const steamId = interaction.options.getString('steam_id');
    const isHoster = interaction.options.getBoolean('host') || Object.keys(credentials).length === 1;

    if (Object.keys(credentials) !== 1 && isHoster) {
        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            const str = client.intlGet(interaction.guildId, 'missingPermission');
            client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }
    }

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

    const prevHoster = credentials.hoster;
    if (isHoster) credentials.hoster = steamId;

    InstanceUtils.writeCredentialsFile(guildId, credentials);

    /* Start Fcm Listener */
    if (isHoster) {
        require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));
        if (prevHoster !== null) {
            require('../util/FcmListenerLite')(client, DiscordTools.getGuild(interaction.guildId), prevHoster);
        }
    }
    else {
        require('../util/FcmListenerLite')(client, DiscordTools.getGuild(interaction.guildId), steamId);

        const rustplus = client.rustplusInstances[guildId];
        if (rustplus && rustplus.team.leaderSteamId === steamId) {
            rustplus.updateLeaderRustPlusLiteInstance();
        }
    }

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `add, ${steamId}, ` +
            `${credentials[steamId].discordUserId}, ` +
            `${isHoster}, ` +
            `${credentials[steamId].fcm_credentials.keys.privateKey}, ` +
            `${credentials[steamId].fcm_credentials.keys.publicKey}, ` +
            `${credentials[steamId].fcm_credentials.keys.authSecret}, ` +
            `${credentials[steamId].fcm_credentials.fcm.token}, ` +
            `${credentials[steamId].fcm_credentials.fcm.pushSet}, ` +
            `${credentials[steamId].fcm_credentials.gcm.token}, ` +
            `${credentials[steamId].fcm_credentials.gcm.androidId}, ` +
            `${credentials[steamId].fcm_credentials.gcm.securityToken}, ` +
            `${credentials[steamId].fcm_credentials.gcm.appId}`
    }));

    const str = client.intlGet(interaction.guildId, 'credentialsAddedSuccessfully', { steamId: steamId });
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function removeCredentials(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const credentials = InstanceUtils.readCredentialsFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (steamId && (steamId in credentials) && credentials[steamId].discordUserId !== interaction.member.user.id) {
        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            const str = client.intlGet(interaction.guildId, 'missingPermission');
            client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }
    }

    if (!steamId) {
        for (const credential of Object.keys(credentials)) {
            if (credential === 'hoster') continue;

            if (credentials[credential].discordUserId === interaction.member.user.id) {
                steamId = credential;
                break;
            }
        }
    }

    if (!(steamId in credentials)) {
        const str = client.intlGet(guildId, 'credentialsDoNotExist', {
            steamId: steamId ? steamId : client.intlGet(guildId, 'unknown')
        });
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    if (steamId === credentials.hoster) {
        if (client.fcmListeners[guildId]) {
            client.fcmListeners[guildId].destroy();
        }
        delete client.fcmListeners[guildId];
        credentials.hoster = null;
    }
    else {
        if (client.fcmListenersLite[guildId][steamId]) {
            client.fcmListenersLite[guildId][steamId].destroy();
        }
        delete client.fcmListenersLite[guildId][steamId];
    }

    delete credentials[steamId];
    InstanceUtils.writeCredentialsFile(guildId, credentials);

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `remove, ${steamId}`
    }));

    const str = client.intlGet(guildId, 'credentialsRemovedSuccessfully', { steamId: steamId });
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function showCredentials(client, interaction, verifyId) {
    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `show`
    }));

    await DiscordMessages.sendCredentialsShowMessage(interaction);
}

async function setHosterCredentials(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const credentials = InstanceUtils.readCredentialsFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
        const str = client.intlGet(interaction.guildId, 'missingPermission');
        client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    if (!steamId) {
        steamId = Object.keys(credentials).find(e => credentials[e] &&
            credentials[e].discordUserId === interaction.member.user.id);
    }

    if (!(steamId in credentials)) {
        const str = client.intlGet(guildId, 'credentialsDoNotExist', {
            steamId: steamId ? steamId : client.intlGet(guildId, 'unknown')
        });
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    const prevHoster = credentials.hoster;
    credentials.hoster = steamId;
    InstanceUtils.writeCredentialsFile(guildId, credentials);

    const instance = client.getInstance(guildId);
    const rustplus = client.rustplusInstances[guildId];
    if (rustplus) {
        instance.activeServer = null;
        client.setInstance(guildId, instance);
        client.resetRustplusVariables(guildId);
        rustplus.disconnect();
        delete client.rustplusInstances[guildId];
        await DiscordMessages.sendServerMessage(guildId, rustplus.serverId);
    }

    require('../util/FcmListener')(client, DiscordTools.getGuild(interaction.guildId));
    if (prevHoster !== null) {
        require('../util/FcmListenerLite')(client, DiscordTools.getGuild(interaction.guildId), prevHoster);
    }

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `setHoster, ${steamId}`
    }));

    const str = client.intlGet(guildId, 'credentialsSetHosterSuccessfully', { steamId: steamId });
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}
