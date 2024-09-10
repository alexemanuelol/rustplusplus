/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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
const { startNewAuthTokenListener } = require('../util/AuthTokenListener.js');
const Constants = require('../util/constants');

module.exports = {
    name: 'authtoken',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('authtoken')
            .setDescription('Set/Remove Authentication Token.')
            .addSubcommand(subcommand => subcommand
                .setName('add')
                .setDescription('Add Authentication Token.')
                .addStringOption(option => option
                    .setName('token')
                    .setDescription('Authentication Token.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription('Steam ID.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('issued_date')
                    .setDescription('Issued date of the Authentication Token.')
                    .setRequired(true))
                .addStringOption(option => option
                    .setName('expire_date')
                    .setDescription('Expire date of the Authentication Token.')
                    .setRequired(true))
                .addBooleanOption(option => option
                    .setName('hoster')
                    .setDescription('Host the bot')
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('remove')
                .setDescription('Remove Authentication Token.')
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription('The SteamId of the Authentication Token to be removed.')
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('show')
                .setDescription('Show the currently registered authentication token users.'))
            .addSubcommand(subcommand => subcommand
                .setName('set_hoster')
                .setDescription('Set the main hoster.')
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription('The SteamId of the new hoster.')
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('start_listener')
                .setDescription(`Start a ${parseInt(Constants.AUTH_TOKEN_LISTENER_SESSION_MS / (60 * 1000))} ` +
                    `min listening session.`)
                .addStringOption(option => option
                    .setName('steam_id')
                    .setDescription('The SteamId of the Authentication Token to start listening to.')
                    .setRequired(false)));
    },

    async execute(client, interaction) {
        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        switch (interaction.options.getSubcommand()) {
            case 'add': {
                addAuthToken(client, interaction, verifyId);
            } break;

            case 'remove': {
                removeAuthToken(client, interaction, verifyId);
            } break;

            case 'show': {
                showAuthTokenUsers(client, interaction, verifyId);
            } break;

            case 'set_hoster': {
                setHoster(client, interaction, verifyId);
            } break;

            case 'start_listener': {
                startListener(client, interaction, verifyId);
            } break;

            default: {
            } break;
        }
    },
};

async function addAuthToken(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const authTokens = InstanceUtils.readAuthTokensFile(guildId);
    const steamId = interaction.options.getString('steam_id');
    const isHoster = interaction.options.getBoolean('host') || Object.keys(authTokens).length === 1;

    if (Object.keys(authTokens) !== 1 && isHoster) {
        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            const str = client.intlGet(interaction.guildId, 'missingPermission');
            client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }
    }

    if (steamId in authTokens) {
        const str = `Authentication Token for steamId: ${steamId} is already registered.`;
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    authTokens[steamId] = new Object();
    authTokens[steamId].auth_token = interaction.options.getString('token');
    authTokens[steamId].issued_date = interaction.options.getString('issued_date');
    authTokens[steamId].expire_date = interaction.options.getString('expire_date');
    authTokens[steamId].discordUserId = interaction.member.user.id;

    if (isHoster) authTokens.hoster = steamId;

    InstanceUtils.writeAuthTokensFile(guildId, authTokens);

    if (!isHoster) {
        const rustplus = client.rustplusInstances[guildId];
        if (rustplus && rustplus.team.leaderSteamId === steamId) {
            rustplus.updateLeaderRustPlusLiteInstance();
        }
    }

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `add, ${steamId}, ` +
            `${authTokens[steamId].discordUserId}, ` +
            `${isHoster}, ` +
            `${authTokens[steamId].token}, ` +
            `${authTokens[steamId].issued_date}, ` +
            `${authTokens[steamId].expire_date}`
    }));

    const str = `Authentication Token were added successfully for steamId: ${steamId}.`
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function removeAuthToken(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const authTokens = InstanceUtils.readAuthTokensFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (steamId && (steamId in authTokens) && authTokens[steamId].discordUserId !== interaction.member.user.id) {
        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            const str = client.intlGet(interaction.guildId, 'missingPermission');
            client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }
    }

    if (!steamId) {
        for (const authToken of Object.keys(authTokens)) {
            if (authToken === 'hoster') continue;

            if (authTokens[authToken].discordUserId === interaction.member.user.id) {
                steamId = authToken;
                break;
            }
        }
    }

    if (!(steamId in authTokens)) {
        const str = `Authentication Token for steamId: ${steamId} does not exist.`;
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    if (client.authTokenListenerIntervalIds[guildId] &&
        client.authTokenListenerIntervalIds[guildId][steamId]) {
        clearInterval(client.authTokenListenerIntervalIds[guildId][steamId]);
        delete client.authTokenListenerIntervalIds[guildId][steamId];
    }

    if (client.authTokenListenerSessionIds[guildId] &&
        client.authTokenListenerSessionIds[guildId][steamId]) {
        clearInterval(client.authTokenListenerSessionIds[guildId][steamId]);
        delete client.authTokenListenerSessionIds[guildId][steamId];
    }

    if (client.authTokenReadNotifications[guildId] &&
        client.authTokenReadNotifications[guildId][steamId]) {
        delete client.authTokenReadNotifications[guildId][steamId];
    }

    if (steamId === authTokens.hoster) {
        authTokens.hoster = null;
    }

    delete authTokens[steamId];
    InstanceUtils.writeAuthTokensFile(guildId, authTokens);

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `remove, ${steamId}`
    }));

    const str = `Authentication Token for steamId: ${steamId} was removed successfully.`;
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function showAuthTokenUsers(client, interaction, verifyId) {
    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `show`
    }));

    await DiscordMessages.sendAuthTokensShowMessage(interaction);
}

async function setHoster(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const authTokens = InstanceUtils.readAuthTokensFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
        const str = client.intlGet(interaction.guildId, 'missingPermission');
        client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    if (!steamId) {
        steamId = Object.keys(authTokens).find(e => authTokens[e] &&
            authTokens[e].discordUserId === interaction.member.user.id);
    }

    if (!(steamId in authTokens)) {
        const str = `Authentication Token for steamId: ${steamId} does not exist.`;
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    authTokens.hoster = steamId;
    InstanceUtils.writeAuthTokensFile(guildId, authTokens);

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

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `setHoster, ${steamId}`
    }));

    const str = `Authentication Token hoster was successfully set to steamId: ${steamId}.`;
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}

async function startListener(client, interaction, verifyId) {
    const guildId = interaction.guildId;
    const authTokens = InstanceUtils.readAuthTokensFile(guildId);
    let steamId = interaction.options.getString('steam_id');

    if (steamId && (steamId in authTokens) && authTokens[steamId].discordUserId !== interaction.member.user.id) {
        if (Config.discord.needAdminPrivileges && !client.isAdministrator(interaction)) {
            const str = client.intlGet(interaction.guildId, 'missingPermission');
            client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }
    }

    if (!steamId) {
        for (const authToken of Object.keys(authTokens)) {
            if (authToken === 'hoster') continue;

            if (authTokens[authToken].discordUserId === interaction.member.user.id) {
                steamId = authToken;
                break;
            }
        }

        if (!steamId) {
            const str = `Authentication Token could not find a steamId to start listening.`;
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }
    }

    if (!(steamId in authTokens)) {
        const str = `Authentication Token for steamId: ${steamId} does not exist.`;
        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
        client.log(client.intlGet(null, 'warningCap'), str);
        return;
    }

    /* Create instance for guild if does not exist. */
    if (!(client.authTokenListenerIntervalIds[guildId])) {
        client.authTokenListenerIntervalIds[guildId] = new Object();
    }
    if (!(client.authTokenListenerSessionIds[guildId])) {
        client.authTokenListenerSessionIds[guildId] = new Object();
    }
    if (!(client.authTokenReadNotifications[guildId])) {
        client.authTokenReadNotifications[guildId] = new Object();
    }

    /* Clear previous interval, session, and read notifications. */
    if (client.authTokenListenerIntervalIds[guildId][steamId]) {
        clearInterval(client.authTokenListenerIntervalIds[guildId][steamId]);
        delete client.authTokenListenerIntervalIds[guildId][steamId];
    }
    if (client.authTokenListenerSessionIds[guildId][steamId]) {
        clearTimeout(client.authTokenListenerSessionIds[guildId][steamId]);
        delete client.authTokenListenerSessionIds[guildId][steamId];
    }
    if (client.authTokenReadNotifications[guildId][steamId]) {
        client.authTokenReadNotifications[guildId][steamId].length = 0; /* Clear the array. */
    }
    else {
        client.authTokenReadNotifications[guildId][steamId] = [];
    }

    /* Set timeout for session cancellation. */
    setTimeout(() => {
        if (client.authTokenListenerIntervalIds[guildId][steamId]) {
            clearInterval(client.authTokenListenerIntervalIds[guildId][steamId]);
            delete client.authTokenListenerIntervalIds[guildId][steamId];
            const str = `Authentication Token listening session for steamId: ${steamId} just stopped.`;
            client.log(client.intlGet(null, 'infoCap'), str);
        }
    }, Constants.AUTH_TOKEN_LISTENER_SESSION_MS);

    /* Initiate auth token listener. */
    await startNewAuthTokenListener(client, guildId, steamId);

    client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
        id: `${verifyId}`,
        value: `start_listener, ${interaction.options.getSubcommand()} ${steamId}`
    }));

    const time = parseInt(Constants.AUTH_TOKEN_LISTENER_SESSION_MS / (60 * 1000));
    const str = `Authentication Token listening session (${time} min) for steamId: ${steamId} started successfully.`;
    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str));
    client.log(client.intlGet(null, 'infoCap'), str);
}