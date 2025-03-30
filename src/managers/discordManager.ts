/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as discordjs from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

import { log, config, guildInstanceManager as gim, localeManager as lm } from '../../index'
import * as types from '../utils/types';
import { GuildInstance, GuildChannelIds, EventNotificationSettings } from './guildInstanceManager';
import { channelPermissions } from '../templates/channelPermissionsTemplate';
import * as discordMessages from '../discordUtils/discordMessages';

const GLOBAL_SLASH_COMMANDS_DIR = 'discordGlobalSlashCommands'
const GUILD_SLASH_COMMANDS_DIR = 'discordGuildSlashCommands'
const DISCORD_EVENTS_DIR = 'discordEvents';

export interface CommandData {
    data: discordjs.SlashCommandBuilder;
    execute: (dm: DiscordManager, interaction: discordjs.ChatInputCommandInteraction) => Promise<boolean>;
}

export class DiscordManager {
    public client: discordjs.Client;
    public globalSlashCommands: discordjs.Collection<string, CommandData>;
    public guildSlashCommands: discordjs.Collection<string, CommandData>;
    public eventListeners: { name: string; listener: (...args: unknown[]) => void }[] = [];

    public languageChangeTimeout: types.GuildId[] = [];
    public tryAgainLaterTimeout: Map<string, NodeJS.Timeout> = new Map();

    constructor() {
        const funcName = '[DiscordManager: Init]';
        log.info(`${funcName} Starting DiscordManager.`);
        this.client = new discordjs.Client({
            presence: {
                status: 'online', /* 'online', 'idle', 'dnd', 'invisible' */
                activities: [{
                    name: '/help',
                    type: discordjs.ActivityType.Listening
                }]
            },
            intents: [
                discordjs.GatewayIntentBits.Guilds,
                discordjs.GatewayIntentBits.GuildMessages,
                discordjs.GatewayIntentBits.MessageContent,
                discordjs.GatewayIntentBits.GuildMembers,
                discordjs.GatewayIntentBits.GuildVoiceStates],
            rest: {
                timeout: 60_000
            },
            allowedMentions: {
                parse: ['everyone', 'roles', 'users']
            }
        });
        this.globalSlashCommands = new discordjs.Collection();
        this.guildSlashCommands = new discordjs.Collection();
        this.eventListeners = [];

        this.loadSlashCommands();
        this.loadEvents();
    }

    private async getCommandData(language: string, type: 'global' | 'guild' = 'global'):
        Promise<discordjs.SlashCommandBuilder[]> {
        const funcName = '[DiscordManager: getCommandData]';
        const commandDir = type === 'global' ? GLOBAL_SLASH_COMMANDS_DIR : GUILD_SLASH_COMMANDS_DIR;
        const commandFiles = fs.readdirSync(path.join(__dirname, '..', commandDir))
            .filter(file => file.endsWith('.ts'));

        const commandsData = [];
        for (const file of commandFiles) {
            try {
                const { default: command } = await import(`../${commandDir}/${file}`);
                const commandData = command.getData(language);
                commandsData.push(commandData);
            }
            catch (error) {
                log.error(`${funcName} Failed to load command from '${file}', ${error}.`);
            }
        }

        return commandsData;
    }

    /* Generally to store all the commands to use elsewhere. */
    private async loadSlashCommands() {
        const funcName = '[DiscordManager: loadSlashCommands]';
        /* Global */
        const globalCommandFiles = fs.readdirSync(path.join(__dirname, '..', GLOBAL_SLASH_COMMANDS_DIR))
            .filter(file => file.endsWith('.ts'));

        for (const file of globalCommandFiles) {
            try {
                const { default: command } = await import(`../${GLOBAL_SLASH_COMMANDS_DIR}/${file}`);
                const commandData = command.getData(config.general.language);
                this.globalSlashCommands.set(commandData.name, {
                    data: commandData,
                    execute: command.execute
                });
            }
            catch (error) {
                log.error(`${funcName} Failed to load command from '${file}', ${error}`)
            }
        }

        /* Guild */
        const guildCommandFiles = fs.readdirSync(path.join(__dirname, '..', GUILD_SLASH_COMMANDS_DIR))
            .filter(file => file.endsWith('.ts'));

        for (const file of guildCommandFiles) {
            try {
                const { default: command } = await import(`../${GUILD_SLASH_COMMANDS_DIR}/${file}`);
                const commandData = command.getData(config.general.language);
                this.guildSlashCommands.set(commandData.name, {
                    data: commandData,
                    execute: command.execute
                });
            }
            catch (error) {
                log.error(`${funcName} Failed to load command from '${file}', ${error}`)
            }
        }
    }

    public async registerGlobalSlashCommands() {
        const funcName = '[DiscordManager: registerGlobalSlashCommands]';
        try {
            const commandsData = await this.getCommandData(config.general.language);
            if (commandsData.length === 0) {
                log.warn(`[registerGlobalSlashCommands] No global slash commands found.`);
                return;
            }

            const rest = new discordjs.REST({ version: '10' }).setToken(config.discord.token);
            await rest.put(discordjs.Routes.applicationCommands(config.discord.clientId),
                { body: commandsData })

            log.info(`${funcName} Successfully registered/updated global slash commands.`);
        }
        catch (error) {
            log.error(`${funcName} Failed to register/update global slash commands, ${error}.`);
        }
    }

    public async registerGuildSlashCommands(guild: discordjs.Guild) {
        const funcName = '[DiscordManager: registerGuildSlashCommands]';
        const logParam = { guildId: guild.id };

        try {
            const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
            const language = gInstance.generalSettings.language;

            const commandsData = await this.getCommandData(language, 'guild');
            if (commandsData.length === 0) {
                log.warn(`${funcName} No guild slash commands found.`, logParam);
                return;
            }

            const rest = new discordjs.REST({ version: '10' }).setToken(config.discord.token);
            await rest.put(discordjs.Routes.applicationGuildCommands(config.discord.clientId, guild.id),
                { body: commandsData })

            log.info(`${funcName} Successfully registered/updated guild slash commands for '${guild.name}'.`, logParam);
        }
        catch (error) {
            log.error(`${funcName} Failed to register/update guild slash commands for guild '${guild.name}', ${error}.`,
                logParam);
        }
    }

    public async loadEvents() {
        const funcName = '[DiscordManager: loadEvents]';
        const eventFiles = fs.readdirSync(path.join(__dirname, '..', DISCORD_EVENTS_DIR))
            .filter(file => file.endsWith('.ts'));

        const events: string[] = [];
        for (const file of eventFiles) {
            try {
                const { name, execute, once = false } = await import(`../${DISCORD_EVENTS_DIR}/${file}`);

                const listener = (...args: unknown[]) => execute(this, ...args);

                if (name === 'rateLimited') {
                    this.client.rest.on(name, listener);
                }
                else if (once) {
                    this.client.once(name, listener);
                }
                else {
                    this.client.on(name, listener);
                }

                /* Store event listener in the Map for later removal. */
                this.eventListeners.push({ name, listener });

                events.push(name);
            }
            catch (error) {
                log.error(`${funcName} Failed to load event '${file}', ${error}.`)
            }
        }
        log.info(`${funcName} Successfully loaded events ${events.join(', ')}.`);
    }

    public async unloadEvents() {
        const funcName = '[DiscordManager: unloadEvents]';
        for (const { name, listener } of this.eventListeners) {
            if (name === 'rateLimited') {
                this.client.rest.off(name, listener);
            }
            else {
                this.client.off(name, listener);
            }
        }
        this.eventListeners = [];
        log.info(`${funcName} Successfully unloaded all events.`);
    }

    public async build() {
        const funcName = '[DiscordManager: build]';
        try {
            this.client.login(config.discord.token);
        }
        catch (error) {
            if (error instanceof Error) {
                log.error(`${funcName} Error when trying to login, ${error.message}`);
                log.error(`${funcName} Stack trace:\n${error.stack}`);

                if (error.message.includes('Invalid Token')) {
                    log.error(`${funcName} The bot token is invalid. Please check the token in the .env file.`);
                }
                else if (error.message.includes('Rate Limited')) {
                    log.error(`${funcName} The bot was rate-limimted. Please wait and try again later.`);
                }
                else if (error.message.includes('Unauthorized')) {
                    log.error(`${funcName} The bot token is unauthorized. Check if the token has been revoked.`);
                }
                else if (error.message.includes('Missing Access')) {
                    log.error(`${funcName} The bot is missing required permissions of intents.`);
                }
                else if (error.message.includes('Timeout')) {
                    log.error(`${funcName} There was a timeout connecting to Discord. Check your internet connection.`);
                }
                else {
                    log.error(`${funcName} An unknown error occurred during login.`);
                }
            }
            else {
                log.error(`${funcName} An unexpected error occurred during login: ${error}`);
            }
        }
    }

    public async setupGuild(guild: discordjs.Guild) {
        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        let rolesChanged = false;

        /* Check if any roles are missing. */
        const validRoleIds: types.RoleId[] = [];
        const validAdminIds: types.RoleId[] = [];
        for (const roleId of gInstance.roleIds) {
            const role = await this.getRole(guild.id, roleId);
            if (role) {
                validRoleIds.push(roleId);
            }
            else {
                rolesChanged = true;
            }
        }
        for (const adminId of gInstance.adminIds) {
            const role = await this.getRole(guild.id, adminId);
            if (role) {
                validAdminIds.push(adminId);
            }
            else {
                rolesChanged = true;
            }
        }
        gInstance.roleIds = validRoleIds;
        gInstance.adminIds = validAdminIds;
        gim.updateGuildInstance(guild.id);

        /* Setup category, channels and settings. */
        await this.setupGuildCategory(guild, rolesChanged);
        await this.setupGuildChannels(guild, rolesChanged);
        await this.setupGuildSettingsChannel(guild, false);
    }

    public async setupGuildCategory(guild: discordjs.Guild, enforceChannelPermissions: boolean = false) {
        const funcName = '[DiscordManager: setupGuildCategory]';
        const logParam = { guildId: guild.id };

        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        const categoryPermissions = this.getChannelPermissions(guild, 'category');

        let category = undefined;
        if (gInstance.guildChannelIds.category !== null) {
            category = await this.getChannel(guild.id, gInstance.guildChannelIds.category);

            if (!category) {
                log.warn(`${funcName} Failed to get category '${gInstance.guildChannelIds.category}'.`, logParam);
            }
        }

        if (!category) {
            /* category does not exist or we failed to get it, so create it. */
            category = await this.createChannel(guild.id, config.discord.username,
                discordjs.ChannelType.GuildCategory, categoryPermissions);

            if (!category) {
                log.error(`${funcName} Failed to create category '${gInstance.guildChannelIds.category}'.`, logParam);
            }
        }

        if (category) {
            if (config.discord.enforceChannelPermissions || enforceChannelPermissions) {
                await this.setChannelPermissions(guild.id, category.id, 'category');
            }
        }

        gInstance.guildChannelIds.category = category ? category.id : null;
        gim.updateGuildInstance(guild.id);
    }

    public async setupGuildChannels(guild: discordjs.Guild, enforceChannelPermissions: boolean = false) {
        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        const channels = gInstance.guildChannelIds;

        for (const [channelName] of Object.entries(channels)) {
            if (channelName === 'category') continue;
            await this.setupGuildChannel(guild, channelName as keyof GuildChannelIds, enforceChannelPermissions);
        }
        gim.updateGuildInstance(guild.id);
    }

    public async setupGuildChannel(guild: discordjs.Guild, channelName: keyof GuildChannelIds,
        enforceChannelPermissions: boolean = false) {
        const funcName = '[DiscordManager: setupGuildChannel]';
        const logParam = { guildId: guild.id };

        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        const channelDisplayName = lm.getIntl(gInstance.generalSettings.language,
            `guildChannelDisplayName-${channelName}`)
        const categoryId = gInstance.guildChannelIds.category ?? undefined;
        const channelPermissions = this.getChannelPermissions(guild, channelName);

        let channel = undefined;
        if (gInstance.guildChannelIds[channelName] !== null) {
            channel = await this.getChannel(guild.id, gInstance.guildChannelIds[channelName]);

            if (!channel) {
                log.warn(`${funcName} Failed to get channel '${gInstance.guildChannelIds[channelName]}'.`, logParam);
            }
        }

        if (!channel) {
            /* channel does not exist or we failed to get it, so create it. */
            channel = await this.createChannel(guild.id, channelDisplayName,
                discordjs.ChannelType.GuildText, channelPermissions, categoryId);

            if (!channel) {
                log.error(`${funcName} Failed to create channel '${gInstance.guildChannelIds[channelName]}'.`,
                    logParam);
            }
        }

        if (channel && (config.discord.enforceChannelPermissions || enforceChannelPermissions)) {
            await this.setChannelPermissions(guild.id, channel.id, channelName);
            if ('parentId' in channel && channel.parentId === null && categoryId) {
                await (channel as discordjs.TextChannel | discordjs.VoiceChannel).setParent(categoryId);
            }
        }

        gInstance.guildChannelIds[channelName] = channel ? channel.id : null;
    }

    public async setupGuildSettingsChannel(guild: discordjs.Guild, update: boolean = true, create: boolean = false) {
        const funcName = '[DiscordManager: setupGuildSettingsChannel]';
        const logParam = { guildId: guild.id };

        /* If all settings messages are null, then send all settings messages. */
        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        if (Object.values(gInstance.settingsMessages).every(value => value === null)) {
            create = true;
        }

        if (!('settings' in gInstance.guildChannelIds)) {
            log.warn(`${funcName} Could not find settings channel.`, logParam);
            return;
        }

        if (!update && !create) return;

        /* General Settings */
        await discordMessages.sendSettingGeneralSettingsHeaderMessage(this, guild.id, update, create);
        await discordMessages.sendSettingLanguageMessage(this, guild.id, update, create);
        await discordMessages.sendSettingVoiceGenderMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatFunctionalityEnabledMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatBotUnmutedMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatTrademarkMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatCommandPrefixMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatCommandsEnabledMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatCommandResponseDelayMessage(this, guild.id, update, create);
        await discordMessages.sendSettingLeaderCommandMessage(this, guild.id, update, create);
        await discordMessages.sendSettingInGameChatNotifySmartSwitchChangedFromDiscordMessage(this, guild.id, update,
            create);
        await discordMessages.sendSettingInGameChatNotifyMessage(this, guild.id, update, create);
        await discordMessages.sendSettingMapWipeNotifyEveryoneMessage(this, guild.id, update, create);
        await discordMessages.sendSettingFcmAlarmNotifyMessage(this, guild.id, update, create);
        await discordMessages.sendSettingFcmAlarmPluginNotifyMessage(this, guild.id, update, create);

        /* Event Notification Settings */
        await discordMessages.sendSettingEventNotificationSettingsHeaderMessage(this, guild.id, update, create);
        for (const setting of Object.keys(gInstance.eventNotificationSettings) as
            Array<keyof EventNotificationSettings>) {
            await discordMessages.sendSettingEventNotificationSettingMessage(this, guild.id, setting, update, create);
        }

        gim.updateGuildInstance(guild.id);
    }

    public logInteraction(interaction: discordjs.Interaction, status: 'Initiated' | 'Completed') {
        const funcName = '[DiscordManager: logInteraction]';
        const logParam = { guildId: interaction.guildId };

        const type = interaction.type;
        const channelId = interaction.channelId;
        const user = interaction.user;
        const interactionId = interaction.id;

        const defaultLogging = `${funcName} ${status} - ${discordjs.InteractionType[type]} (${type}), Channel: ` +
            `${channelId}, User: ${user.username} (${user.id}), Interaction ID: ${interactionId}`;

        let extendedLogging = '';
        if (interaction.isChatInputCommand()) {
            const commandName = interaction.commandName;
            const options = interaction.options;
            extendedLogging = `Command: ${commandName}`;

            const subcommandGroup = options.getSubcommandGroup(false);
            const subcommand = options.getSubcommand(false);

            if (subcommandGroup) {
                extendedLogging += `, Subcommand Group: ${subcommandGroup}`;
            }

            if (subcommand) {
                extendedLogging += `, Subcommand: ${subcommand}`;
            }

            if (options.data.length > 0) {
                extendedLogging += `, Options: `;
                let optionsFound = false;

                /* Recursive function to extract options at any level */
                function extractAllOptions(optionsArray: readonly discordjs.CommandInteractionOption[]): void {
                    for (const item of optionsArray) {
                        /* If this item has options, recursively process them */
                        if (item.options && Array.isArray(item.options)) {
                            extractAllOptions(item.options);
                        }

                        /* Check if this is an actual option with a value (not a subcommand container) */
                        if (item.value !== undefined) {
                            optionsFound = true;
                            extendedLogging += `[${item.name}]: ${item.value}, `;
                        }
                    }
                }

                /* Start the recursive extraction */
                extractAllOptions(options.data);

                /* Only trim if we found options */
                if (optionsFound) {
                    extendedLogging = extendedLogging.slice(0, -2); /* Remove trailing comma and space */
                }
                else {
                    extendedLogging = extendedLogging.slice(0, -9); /* Remove ", Options: " */
                }
            }
        }
        else if (interaction.isUserContextMenuCommand()) {
            extendedLogging = `User Context Menu Command: ${interaction.commandName}`;
            const targetUser = interaction.targetUser;
            extendedLogging += `, Target User: ${targetUser.username} (${targetUser.id})`;
        }
        else if (interaction.isMessageContextMenuCommand()) {
            extendedLogging = `Message Context Menu Command: ${interaction.commandName}`;
            const targetMessage = interaction.targetMessage;
            extendedLogging += `, Target Message: ${targetMessage.content} (ID: ${targetMessage.id})`;
        }
        else if (interaction.isButton()) {
            extendedLogging = `Button Interaction: Button ID: ${interaction.customId}`;
        }
        else if (interaction.isAnySelectMenu()) {
            extendedLogging = `Select Menu Interaction: Select Menu ID: ${interaction.customId}`;

            const selectedOptions = interaction.values;
            if (selectedOptions.length > 0) {
                extendedLogging += `, Selected Options: `;
                for (const option of selectedOptions) {
                    extendedLogging += `${option}, `;
                }
                extendedLogging = extendedLogging.slice(0, -2);
            }
        }
        else if (interaction.isModalSubmit()) {
            extendedLogging = `Modal Submit Interaction: Modal ID: ${interaction.customId}`;

            const fields = interaction.fields.fields;
            if (fields.size > 0) {
                extendedLogging += `, Field Values: `;
                for (const [key, field] of Array.from(fields.entries())) {
                    const displayValue = field.value.length > 50 ? `${field.value.substring(0, 50)}...` : field.value;
                    extendedLogging += `[${key}]: ${displayValue}, `;
                }
                extendedLogging = extendedLogging.slice(0, -2);
            }
        }
        else {
            /* Do nothing for unsupported interaction types. */
        }

        log.info(`${defaultLogging} ${extendedLogging}`, logParam);
    }

    public validPermissions(interaction: discordjs.Interaction, adminRequired: boolean = false): boolean {
        if (!interaction.guild || !interaction.member) return false;
        const member = interaction.member as discordjs.GuildMember;

        if (this.isAdministrator(interaction)) return true;
        if (adminRequired) return false;

        const gInstance = gim.getGuildInstance(interaction.guild.id);
        if (!gInstance || (gInstance && !('roleIds' in gInstance))) return false;

        if (gInstance.roleIds.length === 0) return true;

        return member.roles.cache.some(role => gInstance.roleIds.includes(role.id));
    }

    public isAdministrator(interaction: discordjs.Interaction): boolean {
        if (!interaction.guild || !interaction.member) return false;
        const member = interaction.member as discordjs.GuildMember;

        if (member.permissions.has(discordjs.PermissionsBitField.Flags.Administrator)) return true;

        const gInstance = gim.getGuildInstance(interaction.guild.id);
        if (!gInstance || (gInstance && !('adminIds' in gInstance))) return false;

        return member.roles.cache.some(role => gInstance.adminIds.includes(role.id));
    }

    public async handleInteractionReply<T extends discordjs.Interaction>(interaction: T, content:
        discordjs.InteractionReplyOptions | discordjs.InteractionEditReplyOptions | discordjs.InteractionUpdateOptions,
        action: 'reply' | 'editReply' | 'update'): Promise<boolean> {
        const funcName = '[DiscordManager: handleInteractionReply]';
        const logParam = { guildId: interaction.guildId };

        try {
            if (interaction.isCommand() && action === 'reply') {
                await (interaction as discordjs.CommandInteraction).reply(
                    content as discordjs.InteractionReplyOptions
                );
            }
            else if (interaction.isCommand() && action === 'editReply') {
                await (interaction as discordjs.CommandInteraction).editReply(
                    content as discordjs.InteractionEditReplyOptions
                );
            }
            else if (interaction.isButton() && action === 'update') {
                await (interaction as discordjs.ButtonInteraction).update(
                    content as discordjs.InteractionUpdateOptions
                );
            }
            else if (interaction.isStringSelectMenu() && action === 'update') {
                await (interaction as discordjs.StringSelectMenuInteraction).update(
                    content as discordjs.InteractionUpdateOptions
                );
            }
            return true;
        }
        catch (error) {
            log.warn(`${funcName} Failed to handle interaction reply '${action}', ${error}.`, logParam);
        }

        return false;
    }

    public async handleMessage<T extends discordjs.Message | discordjs.TextChannel | discordjs.User>(medium: T, content:
        discordjs.MessageCreateOptions | discordjs.MessageEditOptions | discordjs.MessageReplyOptions,
        action: 'send' | 'edit' | 'reply'): Promise<discordjs.Message | undefined> {
        const funcName = '[DiscordManager: handleMessage]';
        const logParam: { [key: string]: string } = {};

        try {
            if (action === 'send' && (medium instanceof discordjs.TextChannel || medium instanceof discordjs.User)) {
                logParam['guildId'] = (medium as discordjs.TextChannel).guildId;
                return await medium.send(content as discordjs.MessageCreateOptions);
            }
            else if (action === 'reply' && medium instanceof discordjs.Message) {
                return await medium.reply(content as discordjs.MessageReplyOptions);
            }
            else if (action === 'edit' && medium instanceof discordjs.Message) {
                return await medium.edit(content as discordjs.MessageEditOptions);
            }
        }
        catch (error) {
            log.warn(`${funcName} Failed to handle message '${action}', ${error}`, logParam);
        }

        return undefined;
    }

    public async sendUpdateMessage(guildId: types.GuildId, content:
        discordjs.MessageCreateOptions | discordjs.MessageEditOptions, channelId: types.ChannelId | null,
        messageId: types.MessageId | null = null, interaction: discordjs.Interaction | null = null):
        Promise<discordjs.Message | undefined> {
        const funcName = '[DiscordManager: sendUpdateMessage]';
        if (interaction) {
            await this.handleInteractionReply(interaction, content as discordjs.InteractionUpdateOptions, 'update');
            return undefined;
        }

        if (!channelId) return undefined;

        const message = messageId ? await this.getMessage(guildId, channelId, messageId) : undefined;
        if (message) {
            return await this.handleMessage(message, content as discordjs.MessageEditOptions, 'edit');
        }

        const channel = await this.getChannel(guildId, channelId);
        if (channel instanceof discordjs.TextChannel) {
            return await this.handleMessage(channel, content as discordjs.MessageCreateOptions, 'send');
        }
        else {
            log.warn(`${funcName} Could not get channel '${channelId}'.`);
            return undefined;
        }
    }


    /* Helper functions */

    public async getGuild(guildId: types.GuildId): Promise<discordjs.Guild | undefined> {
        const funcName = '[DiscordManager: getGuild]';
        const logParam = { guildId: guildId };

        try {
            if (!config.discord.useCache) {
                await this.client.guilds.fetch();
            }

            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) {
                log.warn(`${funcName} Guild not found.`, logParam);
                return undefined;
            }

            return guild;
        }
        catch (error) {
            log.warn(`${funcName} Could not fetch guild, ${error}.`, logParam);
            return undefined;
        }
    }

    public async getChannel(guildId: types.GuildId, channelId: types.ChannelId):
        Promise<discordjs.GuildBasedChannel | undefined> {
        const funcName = '[DiscordManager: getChannel]';
        const logParam = { guildId: guildId };

        const guild = await this.getGuild(guildId);

        if (!guild) {
            log.warn(`${funcName} Could not find guild.`, logParam);
            return undefined;
        }

        try {
            if (!config.discord.useCache) {
                await guild.channels.fetch();
            }

            const channel = guild.channels.cache.get(channelId);
            if (!channel) {
                log.warn(`${funcName} Channel not found '${channelId}'.`, logParam);
                return undefined;
            }

            return channel;
        }
        catch (error) {
            log.warn(`${funcName} Could not fetch channel '${channelId}', ${error}.`, logParam);
            return undefined;
        }
    }

    public async getMessage(guildId: types.GuildId, channelId: types.ChannelId, messageId: types.MessageId):
        Promise<discordjs.Message | undefined> {
        const funcName = '[DiscordManager: getMessage]';
        const logParam = { guildId: guildId };

        const channel = await this.getChannel(guildId, channelId);

        if (!channel) {
            log.warn(`${funcName} Could not find channel '${channelId}'.`, logParam);
            return undefined;
        }

        try {
            const message = await (channel as discordjs.TextChannel).messages.fetch(messageId);

            if (!message) {
                log.warn(`${funcName} Message not found '${messageId}'.`, logParam);
                return undefined;
            }

            return message;
        }
        catch (error) {
            log.warn(`${funcName} Could not fetch message '${messageId}', ${error}`, logParam);
            return undefined;
        }
    }

    public async getMember(guildId: types.GuildId, memberId: types.UserId):
        Promise<discordjs.GuildMember | undefined> {
        const funcName = '[DiscordManager: getMember]';
        const logParam = { guildId: guildId };

        const guild = await this.getGuild(guildId);

        if (!guild) {
            log.warn(`${funcName} Could not find guild.`, logParam);
            return undefined;
        }

        try {
            const member = await guild.members.fetch(memberId);

            if (!member) {
                log.warn(`${funcName} Member not found '${memberId}'.`, logParam);
                return undefined;
            }

            return member;
        }
        catch (error) {
            log.warn(`${funcName} Could not fetch member '${memberId}', ${error}.`, logParam);
            return undefined;
        }
    }

    public async getUser(userId: types.UserId): Promise<discordjs.User | undefined> {
        const funcName = '[DiscordManager: getUser]';
        const user = this.client.users.fetch(userId).catch(() => undefined);

        if (!user) {
            log.warn(`${funcName} Could not find user '${userId}'.`);
            return undefined;
        }

        return user;
    }

    public async getRole(guildId: types.GuildId, roleId: types.RoleId):
        Promise<discordjs.Role | undefined> {
        const funcName = '[DiscordManager: getRole]';
        const logParam = { guildId: guildId };

        const guild = await this.getGuild(guildId);

        if (!guild) {
            log.warn(`${funcName} Could not find guild.`, logParam);
            return undefined;
        }

        try {
            const role = await guild.roles.fetch(roleId);

            if (!role) {
                log.warn(`${funcName} Role not found '${roleId}'.`, logParam);
                return undefined;
            }

            return role;
        }
        catch (error) {
            log.warn(`${funcName} Could not fetch role '${roleId}', ${error}.`, logParam);
            return undefined;
        }
    }

    public async deleteMessage(guildId: types.GuildId, channelId: types.ChannelId, messageId: types.MessageId):
        Promise<boolean> {
        const funcName = '[DiscordManager: deleteMessage]';
        const logParam = { guildId: guildId };

        const message = await this.getMessage(guildId, channelId, messageId);

        if (!message) {
            log.warn(`${funcName} Could not find message '${messageId}'.`, logParam);
            return false;
        }

        try {
            await message.delete();
            return true;
        }
        catch (error) {
            log.warn(`${funcName} Could not delete message '${messageId}', ${error}.`, logParam);
            return false;
        }
    }

    public async createChannel(guildId: types.GuildId, name: string,
        type: discordjs.ChannelType.GuildText | discordjs.ChannelType.GuildVoice | discordjs.ChannelType.GuildCategory,
        permissionOverwrites: discordjs.OverwriteResolvable[] = [], parentId: string | undefined = undefined):
        Promise<discordjs.GuildChannel | undefined> {
        const funcName = '[DiscordManager: createChannel]';
        const logParam = { guildId: guildId };

        const guild = await this.getGuild(guildId);

        if (!guild) {
            log.warn(`${funcName} Could not find guild.`, logParam);
            return undefined;
        }

        try {
            const channel = await guild.channels.create({
                name: name,
                type: type,
                permissionOverwrites: permissionOverwrites,
                parent: type !== discordjs.ChannelType.GuildCategory ? parentId : undefined
            });

            log.info(`${funcName} Created ${discordjs.ChannelType[type]} '${name}'.`, logParam);

            return channel as discordjs.TextChannel | discordjs.VoiceChannel | discordjs.CategoryChannel;
        }
        catch (error) {
            log.warn(`${funcName} Could not create channel '${name}', ${error}.`, logParam);
            return undefined;
        }
    }

    public async deleteChannel(guildId: types.GuildId, channelId: types.ChannelId): Promise<boolean> {
        const funcName = '[DiscordManager: deleteChannel]';
        const logParam = { guildId: guildId };

        const channel = await this.getChannel(guildId, channelId);

        if (!channel) {
            log.warn(`${funcName} Could not find channel '${channelId}'.`, logParam);
            return false;
        }

        try {
            await channel.delete();
            return true;
        }
        catch (error) {
            log.warn(`${funcName} Could not delete channel '${channelId}', ${error}.`, logParam);
            return false;
        }
    }

    public async setChannelPermissions(guildId: types.GuildId, channelId: types.ChannelId,
        channelName: keyof GuildChannelIds): Promise<boolean> {
        const funcName = '[DiscordManager: setChannelPermissions]';
        const logParam = { guildId: guildId };

        const guild = await this.getGuild(guildId);
        const channel = await this.getChannel(guildId, channelId);

        if (!guild || !channel) {
            log.warn(`${funcName} Could not find guild or channel '${channelId}'.`, logParam);
            return false;
        }

        const permissions = this.getChannelPermissions(guild, channelName);
        const permissionChannel = channel as discordjs.TextChannel | discordjs.VoiceChannel | discordjs.CategoryChannel;
        await permissionChannel.permissionOverwrites.set(permissions);

        return true;
    }

    public async renameChannel(guildId: types.GuildId, channelId: types.ChannelId, newName: string): Promise<boolean> {
        const funcName = '[DiscordManager: renameChannel]';
        const logParam = { guildId: guildId };

        const channel = await this.getChannel(guildId, channelId);

        if (!channel) {
            log.warn(`${funcName} Could not find channel '${channelId}'.`, logParam);
            return false;
        }

        await channel.setName(newName);

        return true;
    }

    public async removeChannelRolePermissions(guildId: types.GuildId, channelId: types.ChannelId, roleId: types.RoleId):
        Promise<boolean> {
        const funcName = '[DiscordManager: removeChannelRolePermissions]';
        const logParam = { guildId: guildId };

        const channel = await this.getChannel(guildId, channelId);

        if (!channel) {
            log.warn(`${funcName} Could not find channel '${channelId}'.`, logParam);
            return false;
        }

        const permissionChannel = channel as discordjs.TextChannel | discordjs.VoiceChannel | discordjs.CategoryChannel;
        await permissionChannel.permissionOverwrites.delete(roleId);

        return true;
    }


    /* Permission helper functions */

    private getChannelPermissions(guild: discordjs.Guild, channelName: keyof GuildChannelIds):
        discordjs.OverwriteData[] {
        const gInstance = gim.getGuildInstance(guild.id) as GuildInstance;
        const adminIds = gInstance.adminIds;
        const roleIds = gInstance.roleIds;
        const permissions: discordjs.OverwriteData[] = []

        /* everyone permissions. */
        if (roleIds.length === 0) {
            permissions.push({
                id: guild.roles.everyone.id,
                allow: channelPermissions[channelName].everyone.allow,
                deny: channelPermissions[channelName].everyone.deny
            });
        }
        else {
            permissions.push({
                id: guild.roles.everyone.id,
                allow: channelPermissions[channelName].everyoneWhenRolesSet.allow,
                deny: channelPermissions[channelName].everyoneWhenRolesSet.deny
            });
        }

        /* roles permissions */
        for (const roleId of roleIds) {
            permissions.push({
                id: roleId,
                allow: channelPermissions[channelName].roles.allow,
                deny: channelPermissions[channelName].roles.deny
            });
        }

        /* admins permissions */
        for (const adminId of adminIds) {
            permissions.push({
                id: adminId,
                allow: channelPermissions[channelName].admins.allow,
                deny: channelPermissions[channelName].admins.deny
            });
        }

        return permissions;
    }
}