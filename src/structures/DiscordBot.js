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

const FormatJS = require('@formatjs/intl');
const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const Battlemetrics = require('../structures/Battlemetrics');
const Cctv = require('./Cctv');
const Config = require('../../config');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools');
const InstanceCleanupManager = require('../util/InstanceCleanupManager');
const SmartPollingManager = require('../util/SmartPollingManager');
const InstanceUtils = require('../util/instanceUtils.js');
const Items = require('./Items');
const LanguageManager = require('../util/LanguageManager');
const Logger = require('./Logger.js');
const PermissionHandler = require('../handlers/permissionHandler.js');
const RustLabs = require('../structures/RustLabs');
const RustPlus = require('../structures/RustPlus');
const { objectPools } = require('../util/ObjectPool');
const { memoryMonitor } = require('../util/MemoryMonitor');

class DiscordBot extends Discord.Client {
    constructor(props) {
        super(props);

        this.logger = new Logger(Path.join(__dirname, '..', '..', 'logs/discordBot.log'), 'default');

        this.commands = new Discord.Collection();
        this.fcmListeners = new Object();
        this.fcmListenersLite = new Object();
        this.instances = {};
        
        // Set up object pool monitoring
        this.setupObjectPoolMonitoring();
        
        // Set up memory monitoring
        this.setupMemoryMonitoring();
        
        // Set up Discord.js optimizations
        this.setupDiscordOptimizations();
        // Language management now handled by LanguageManager
        this.languageManager = LanguageManager;

        this.rustplusInstances = new Object();
        this.activeRustplusInstances = new Object();
        this.rustplusReconnectTimers = new Object();
        this.rustplusLiteReconnectTimers = new Object();
        this.rustplusReconnecting = new Object();
        this.rustplusMaps = new Object();

        this.uptimeBot = null;

        this.items = new Items();
        this.rustlabs = new RustLabs();
        this.cctv = new Cctv();
        this.instanceCleanupManager = new InstanceCleanupManager();
        this.smartPollingManager = new SmartPollingManager();

        this.pollingIntervalMs = Config.general.pollingIntervalMs;

        this.battlemetricsInstances = new Object();

        this.battlemetricsIntervalId = null;
        this.battlemetricsIntervalCounter = 0;

        this.voiceLeaveTimeouts = new Object();

        this.loadDiscordCommands();
        this.loadDiscordEvents();
    }

    loadDiscordCommands() {
        const commandFiles = Fs.readdirSync(Path.join(__dirname, '..', 'commands'))
            .filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            this.commands.set(command.name, command);
        }
    }

    loadDiscordEvents() {
        const eventFiles = Fs.readdirSync(Path.join(__dirname, '..', 'discordEvents'))
            .filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../discordEvents/${file}`);

            if (event.name === 'rateLimited') {
                this.rest.on(event.name, (...args) => event.execute(this, ...args));
            }
            else if (event.once) {
                this.once(event.name, (...args) => event.execute(this, ...args));
            }
            else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    getGuildLanguage(guildId) {
        try {
            const instance = InstanceUtils.readInstanceFile(guildId);
            return instance.generalSettings.language || 'en';
        } catch (error) {
            return 'en';
        }
    }

    getBotLanguage() {
        return Config.general.language || 'en';
    }

    loadGuildsIntl() {
        // Pre-load language data for all guilds to ensure intl is ready
        for (const guild of this.guilds.cache) {
            const guildId = guild[0];
            const language = this.getGuildLanguage(guildId);
            // Ensure the language is loaded in the LanguageManager
            this.languageManager.getIntl(language);
        }
    }

    intlGet(guildId, id, variables = {}) {
        let language;
        
        if (guildId === 'en') {
            language = 'en';
        } else if (guildId && guildId !== 'en') {
            language = this.getGuildLanguage(guildId);
        } else {
            language = this.getBotLanguage();
        }

        const intl = this.languageManager.getIntl(language);
        const enMessages = this.languageManager.getMessages('en');
        
        if (!intl) {
            console.error(`Failed to get intl for language: ${language}`);
            return id; // Return the ID as fallback
        }

        return intl.formatMessage({
            id: id,
            defaultMessage: enMessages ? enMessages[id] : id
        }, variables);
    }

    build() {
        // Start the instance cleanup manager
        this.instanceCleanupManager.start(this);
        
        this.login(Config.discord.token).catch(error => {
            switch (error.code) {
                case 502: {
                    this.log(this.intlGet(null, 'errorCap'),
                        this.intlGet(null, 'badGateway', { error: JSON.stringify(error) }), 'error')
                } break;

                case 503: {
                    this.log(this.intlGet(null, 'errorCap'),
                        this.intlGet(null, 'serviceUnavailable', { error: JSON.stringify(error) }), 'error')
                } break;

                default: {
                    this.log(this.intlGet(null, 'errorCap'), `${JSON.stringify(error)}`, 'error');
                } break;
            }
        });
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

    logInteraction(interaction, verifyId, type) {
        const channel = DiscordTools.getTextChannelById(interaction.guildId, interaction.channelId);
        const args = new Object();
        args['guild'] = `${interaction.member.guild.name} (${interaction.member.guild.id})`;
        args['channel'] = `${channel.name} (${interaction.channelId})`;
        args['user'] = `${interaction.user.username} (${interaction.user.id})`;
        args[(type === 'slashCommand') ? 'command' : 'customid'] = (type === 'slashCommand') ?
            `${interaction.commandName}` : `${interaction.customId}`;
        args['id'] = `${verifyId}`;

        this.log(this.intlGet(null, 'infoCap'), this.intlGet(null, `${type}Interaction`, args));
    }

    async setupGuild(guild) {
        const instance = this.getInstance(guild.id);
        const firstTime = instance.firstTime;

        await require('../discordTools/RegisterSlashCommands')(this, guild);

        let category = await require('../discordTools/SetupGuildCategory')(this, guild);
        await require('../discordTools/SetupGuildChannels')(this, guild, category);
        if (firstTime) {
            const perms = PermissionHandler.getPermissionsRemoved(this, guild);
            try {
                await category.permissionOverwrites.set(perms);
            }
            catch (e) {
                /* Ignore */
            }
        }
        else {
            await PermissionHandler.resetPermissionsAllChannels(this, guild);
        }

        require('../util/FcmListener')(this, guild);
        const credentials = InstanceUtils.readCredentialsFile(guild.id);
        for (const steamId of Object.keys(credentials)) {
            if (steamId !== credentials.hoster && steamId !== 'hoster') {
                require('../util/FcmListenerLite')(this, guild, steamId);
            }
        }

        await require('../discordTools/SetupSettingsMenu')(this, guild);

        if (firstTime) await PermissionHandler.resetPermissionsAllChannels(this, guild);

        this.resetRustplusVariables(guild.id);
    }

    async syncCredentialsWithUsers(guild) {
        const credentials = InstanceUtils.readCredentialsFile(guild.id);

        const members = await guild.members.fetch();
        const memberIds = [];
        for (const member of members) {
            memberIds.push(member[0]);
        }

        const steamIdRemoveCredentials = [];
        for (const [steamId, content] of Object.entries(credentials)) {
            if (steamId === 'hoster') continue;

            if (!(memberIds.includes(content.discord_user_id))) {
                steamIdRemoveCredentials.push(steamId);
            }
        }

        for (const steamId of steamIdRemoveCredentials) {
            if (steamId === credentials.hoster) {
                if (this.fcmListeners[guild.id]) {
                    this.fcmListeners[guild.id].destroy();
                }
                delete this.fcmListeners[guild.id];
                credentials.hoster = null;
            }
            else {
                if (this.fcmListenersLite[guild.id][steamId]) {
                    this.fcmListenersLite[guild.id][steamId].destroy();
                }
                delete this.fcmListenersLite[guild.id][steamId];
            }

            delete credentials[steamId];
        }

        InstanceUtils.writeCredentialsFile(guild.id, credentials);
    }

    getInstance(guildId) {
        return this.instances[guildId];
    }

    setInstance(guildId, instance) {
        this.instances[guildId] = instance;
        InstanceUtils.writeInstanceFile(guildId, instance);
    }

    readNotificationSettingsTemplate() {
        return JSON.parse(Fs.readFileSync(
            Path.join(__dirname, '..', 'templates/notificationSettingsTemplate.json'), 'utf8'));
    }

    readGeneralSettingsTemplate() {
        return JSON.parse(Fs.readFileSync(
            Path.join(__dirname, '..', 'templates/generalSettingsTemplate.json'), 'utf8'));
    }

    createRustplusInstance(guildId, serverIp, appPort, steamId, playerToken) {
        let rustplus = new RustPlus(guildId, serverIp, appPort, steamId, playerToken);

        /* Add rustplus instance to Object */
        this.rustplusInstances[guildId] = rustplus;
        this.activeRustplusInstances[guildId] = true;
        
        // Track activity for cleanup manager
        this.instanceCleanupManager.updateActivity(guildId);

        rustplus.build();

        return rustplus;
    }

    createRustplusInstancesFromConfig() {
        const files = Fs.readdirSync(Path.join(__dirname, '..', '..', 'instances'));

        files.forEach(file => {
            if (!file.endsWith('.json')) return;

            const guildId = file.replace('.json', '');
            const instance = this.getInstance(guildId);
            if (!instance) return;

            if (instance.activeServer !== null && instance.serverList.hasOwnProperty(instance.activeServer)) {
                this.createRustplusInstance(
                    guildId,
                    instance.serverList[instance.activeServer].serverIp,
                    instance.serverList[instance.activeServer].appPort,
                    instance.serverList[instance.activeServer].steamId,
                    instance.serverList[instance.activeServer].playerToken);
            }
        });
    }

    resetRustplusVariables(guildId) {
        this.activeRustplusInstances[guildId] = false;
        this.rustplusReconnecting[guildId] = false;
        delete this.rustplusMaps[guildId];

        if (this.rustplusReconnectTimers[guildId]) {
            clearTimeout(this.rustplusReconnectTimers[guildId]);
            this.rustplusReconnectTimers[guildId] = null;
        }
        if (this.rustplusLiteReconnectTimers[guildId]) {
            clearTimeout(this.rustplusLiteReconnectTimers[guildId]);
            this.rustplusLiteReconnectTimers[guildId] = null;
        }
    }

    isJpgImageChanged(guildId, map) {
        return ((JSON.stringify(this.rustplusMaps[guildId])) !== (JSON.stringify(map.jpgImage)));
    }

    findAvailableTrackerId(guildId) {
        const instance = this.getInstance(guildId);

        while (true) {
            const randomNumber = Math.floor(Math.random() * 1000);
            if (!instance.trackers.hasOwnProperty(randomNumber)) {
                return randomNumber;
            }
        }
    }

    findAvailableGroupId(guildId, serverId) {
        const instance = this.getInstance(guildId);

        while (true) {
            const randomNumber = Math.floor(Math.random() * 1000);
            if (!instance.serverList[serverId].switchGroups.hasOwnProperty(randomNumber)) {
                return randomNumber;
            }
        }
    }

    /**
     *  Check if Battlemetrics instances are missing/not required/need update.
     */
    async updateBattlemetricsInstances() {
        const activeInstances = [];

        /* Check for instances that are missing or need update. */
        for (const guild of this.guilds.cache) {
            const guildId = guild[0];
            const instance = this.getInstance(guildId);
            const activeServer = instance.activeServer;
            if (activeServer !== null && instance.serverList.hasOwnProperty(activeServer)) {
                if (instance.serverList[activeServer].battlemetricsId !== null) {
                    /* A Battlemetrics ID exist. */
                    const battlemetricsId = instance.serverList[activeServer].battlemetricsId;
                    if (!activeInstances.includes(battlemetricsId)) {
                        activeInstances.push(battlemetricsId);
                        if (this.battlemetricsInstances.hasOwnProperty(battlemetricsId)) {
                            /* Update */
                            await this.battlemetricsInstances[battlemetricsId].evaluation();
                        }
                        else {
                            /* Add */
                            const bmInstance = new Battlemetrics(battlemetricsId);
                            await bmInstance.setup();
                            this.battlemetricsInstances[battlemetricsId] = bmInstance;
                        }
                    }
                }
                else {
                    /* Battlemetrics ID is missing, try with server name. */
                    const name = instance.serverList[activeServer].title;
                    const bmInstance = new Battlemetrics(null, name);
                    await bmInstance.setup();
                    if (bmInstance.lastUpdateSuccessful) {
                        /* Found an Id, is it a new Id? */
                        instance.serverList[activeServer].battlemetricsId = bmInstance.id;
                        this.setInstance(guildId, instance);

                        if (this.battlemetricsInstances.hasOwnProperty(bmInstance.id)) {
                            if (!activeInstances.includes(bmInstance.id)) {
                                activeInstances.push(bmInstance.id);
                                await this.battlemetricsInstances[bmInstance.id].evaluation(bmInstance.data);
                            }
                        }
                        else {
                            activeInstances.push(bmInstance.id);
                            this.battlemetricsInstances[bmInstance.id] = bmInstance;
                        }
                    }
                }
            }

            for (const [trackerId, content] of Object.entries(instance.trackers)) {
                if (!activeInstances.includes(content.battlemetricsId)) {
                    activeInstances.push(content.battlemetricsId);
                    if (this.battlemetricsInstances.hasOwnProperty(content.battlemetricsId)) {
                        /* Update */
                        await this.battlemetricsInstances[content.battlemetricsId].evaluation();
                    }
                    else {
                        /* Add */
                        const bmInstance = new Battlemetrics(content.battlemetricsId);
                        await bmInstance.setup();
                        this.battlemetricsInstances[content.battlemetricsId] = bmInstance;
                    }
                }
            }
        }

        /* Find instances that are no longer required and delete them. */
        const remove = Object.keys(this.battlemetricsInstances).filter(e => !activeInstances.includes(e));
        for (const id of remove) {
            delete this.battlemetricsInstances[id];
        }
    }

    async interactionReply(interaction, content) {
        try {
            return await interaction.reply(content);
        }
        catch (e) {
            this.log(this.intlGet(null, 'errorCap'),
                this.intlGet(null, 'interactionReplyFailed', { error: e }), 'error');
        }

        return undefined;
    }

    async interactionEditReply(interaction, content) {
        try {
            return await interaction.editReply(content);
        }
        catch (e) {
            this.log(this.intlGet(null, 'errorCap'),
                this.intlGet(null, 'interactionEditReplyFailed', { error: e }), 'error');
        }

        return undefined;
    }

    async interactionUpdate(interaction, content) {
        try {
            return await interaction.update(content);
        }
        catch (e) {
            this.log(this.intlGet(null, 'errorCap'),
                this.intlGet(null, 'interactionUpdateFailed', { error: e }), 'error');
        }

        return undefined;
    }

    async messageEdit(message, content) {
        try {
            return await message.edit(content);
        }
        catch (e) {
            this.log(this.intlGet(null, 'errorCap'),
                this.intlGet(null, 'messageEditFailed', { error: e }), 'error');
        }

        return undefined;
    }

    async messageSend(channel, content) {
        try {
            return await channel.send(content);
        }
        catch (e) {
            this.log(this.intlGet(null, 'errorCap'),
                this.intlGet(null, 'messageSendFailed', { error: e }), 'error');
        }

        return undefined;
    }

    async messageReply(message, content) {
        try {
            return await message.reply(content);
        }
        catch (e) {
            this.log(this.intlGet(null, 'errorCap'),
                this.intlGet(null, 'messageReplyFailed', { error: e }), 'error');
        }

        return undefined;
    }

    async validatePermissions(interaction) {
        const instance = this.getInstance(interaction.guildId);

        if (instance.blacklist['discordIds'].includes(interaction.user.id) &&
            !interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return false;
        }

        /* If role isn't setup yet, validate as true */
        if (instance.role === null) return true;

        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator) &&
            !interaction.member.roles.cache.has(instance.role)) {
            let role = DiscordTools.getRole(interaction.guildId, instance.role);
            const str = this.intlGet(interaction.guildId, 'notPartOfRole', { role: role.name });
            await this.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            this.log(this.intlGet(null, 'warningCap'), str);
            return false;
        }
        return true;
    }

    isAdministrator(interaction) {
        return interaction.member.permissions.has(Discord.PermissionFlagsBits.Administrator);
    }

    /**
     * Set up object pool monitoring and periodic cleanup
     */
    setupObjectPoolMonitoring() {
        // Log pool statistics every 5 minutes
        setInterval(() => {
            const stats = objectPools.getStats();
            this.log('Object Pool Stats', `Position Pool: ${stats.position.active}/${stats.position.total}, ` +
                `Notification Pool: ${stats.notification.active}/${stats.notification.total}, ` +
                `Vending Order Pool: ${stats.vendingOrder.active}/${stats.vendingOrder.total}, ` +
                `Team Change Pool: ${stats.teamChange.active}/${stats.teamChange.total}`);
        }, 5 * 60 * 1000);

        // Clean up pools every 10 minutes
        setInterval(() => {
            objectPools.cleanup();
            this.log('Object Pool Cleanup', 'Performed periodic cleanup of object pools');
        }, 10 * 60 * 1000);
    }

    /**
     * Clean up all object pools
     */
    cleanupObjectPools() {
        objectPools.cleanup();
        this.log('Object Pool Cleanup', 'Manual cleanup of object pools completed');
    }

    /**
     * Set up memory monitoring
     */
    setupMemoryMonitoring() {
        // Set logger for memory monitor
        memoryMonitor.setLogger(this);
        
        // Start memory monitoring with 2-minute intervals
        memoryMonitor.startMonitoring(2 * 60 * 1000);
        
        // Log memory summary every 15 minutes
        setInterval(() => {
            const summary = memoryMonitor.getSummary();
            if (summary) {
                const avgMB = (summary.averageHeapUsed / 1024 / 1024).toFixed(2);
                const maxMB = (summary.maxHeapUsed / 1024 / 1024).toFixed(2);
                const utilization = summary.averageUtilization.toFixed(1);
                
                this.log('Memory Summary', 
                    `Avg: ${avgMB}MB, Max: ${maxMB}MB, Utilization: ${utilization}%, Samples: ${summary.samples}`);
                
                // Log Discord optimization stats
                this.logDiscordStats();
            }
        }, 15 * 60 * 1000);
    }

    /**
     * Get current memory statistics
     * @returns {Object} Memory statistics
     */
    getMemoryStats() {
        return memoryMonitor.getCurrentStats();
    }

    /**
     * Force garbage collection
     * @returns {boolean} True if GC was triggered
     */
    forceGarbageCollection() {
        const result = memoryMonitor.forceGc();
        if (result) {
            this.log('Memory Management', 'Manual garbage collection triggered');
        } else {
            this.log('Memory Management', 'Garbage collection not available (run with --expose-gc)', 'warn');
        }
        return result;
    }

    setupDiscordOptimizations() {
        // Set up periodic cache cleanup
        setInterval(() => {
            this.performCacheCleanup();
        }, 600000); // Every 10 minutes

        // Set up connection optimization
        this.setupConnectionOptimizations();

        // Log optimization setup
        this.log('Discord Optimization', 'Discord.js optimizations initialized', 'info');
    }

    performCacheCleanup() {
        let cleanedItems = 0;

        // Clean up message cache more aggressively
        this.guilds.cache.forEach(guild => {
            guild.channels.cache.forEach(channel => {
                if (channel.messages && channel.messages.cache.size > 25) {
                    const messagesToDelete = channel.messages.cache.size - 25;
                    const oldMessages = channel.messages.cache
                        .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
                        .first(messagesToDelete);
                    
                    oldMessages.forEach(message => {
                        channel.messages.cache.delete(message.id);
                        cleanedItems++;
                    });
                }
            });

            // Clean up member cache for inactive members
            if (guild.members.cache.size > 50) {
                const membersToRemove = guild.members.cache.size - 50;
                const inactiveMembers = guild.members.cache
                    .filter(member => member.id !== this.user.id && !member.user.bot)
                    .sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0))
                    .first(membersToRemove);
                
                inactiveMembers.forEach(member => {
                    guild.members.cache.delete(member.id);
                    cleanedItems++;
                });
            }
        });

        // Clean up user cache
        if (this.users.cache.size > 100) {
            const usersToRemove = this.users.cache.size - 100;
            const inactiveUsers = this.users.cache
                .filter(user => user.id !== this.user.id && !user.bot)
                .first(usersToRemove);
            
            inactiveUsers.forEach(user => {
                this.users.cache.delete(user.id);
                cleanedItems++;
            });
        }

        if (cleanedItems > 0) {
            this.log('Discord Optimization', `Cleaned up ${cleanedItems} cached items`, 'info');
        }
    }

    setupConnectionOptimizations() {
        // Optimize WebSocket connection
        this.on('ready', () => {
            // Set presence to reduce memory usage
            this.user.setPresence({
                activities: [{
                    name: 'Rust servers',
                    type: Discord.ActivityType.Watching
                }],
                status: 'online'
            });
        });

        // Handle rate limits more efficiently
        this.rest.on('rateLimited', (rateLimitInfo) => {
            this.log('Discord Optimization', `Rate limited: ${rateLimitInfo.route} for ${rateLimitInfo.timeout}ms`, 'warn');
        });

        // Optimize guild member chunk handling
        this.on('guildMemberChunk', (members, guild) => {
            // Immediately clean up if we have too many cached members
            if (guild.members.cache.size > 200) {
                const excess = guild.members.cache.size - 200;
                const toRemove = guild.members.cache
                    .filter(member => member.id !== this.user.id)
                    .random(excess);
                
                toRemove.forEach(member => {
                    guild.members.cache.delete(member.id);
                });
            }
        });
    }

    getDiscordOptimizationStats() {
        const stats = {
            guilds: this.guilds.cache.size,
            users: this.users.cache.size,
            channels: 0,
            messages: 0,
            members: 0
        };

        this.guilds.cache.forEach(guild => {
            stats.channels += guild.channels.cache.size;
            stats.members += guild.members.cache.size;
            
            guild.channels.cache.forEach(channel => {
                if (channel.messages) {
                    stats.messages += channel.messages.cache.size;
                }
            });
        });

        return stats;
    }

    logDiscordStats() {
        const stats = this.getDiscordOptimizationStats();
        this.log('Discord Optimization', 
            `Cache Stats - Guilds: ${stats.guilds}, Users: ${stats.users}, ` +
            `Channels: ${stats.channels}, Messages: ${stats.messages}, Members: ${stats.members}`, 
            'info');
    }
}

module.exports = DiscordBot;
