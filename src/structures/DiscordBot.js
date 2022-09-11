const Fs = require('fs');
const Discord = require('discord.js');
const Path = require('path');

const Config = require('../../config.json');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools');
const Items = require('./Items');
const Logger = require('./Logger.js');
const RustPlus = require('../structures/RustPlus');

class DiscordBot extends Discord.Client {
    constructor(props) {
        super(props);

        this.logger = new Logger(Path.join(__dirname, '..', 'logs/discordBot.log'), 'default');

        this.commands = new Discord.Collection();
        this.rustplusInstances = new Object();
        this.currentFcmListeners = new Object();

        this.items = new Items();

        this.pollingIntervalMs = Config.general.pollingIntervalMs;

        this.battlemetricsOnlinePlayers = new Object();
        this.battlemetricsIntervalId = null;
        this.battlemetricsIntervalCounter = 0;

        this.loadDiscordCommands();
        this.loadDiscordEvents();
    }

    loadDiscordCommands() {
        const commandFiles = Fs.readdirSync(Path.join(__dirname, '..', 'commands'))
            .filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            this.commands.set(command.data.name, command);
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

    build() {
        this.login(Config.discord.token).catch(error => {
            switch (error.code) {
                case 502: {
                    this.log('ERROR', `Bad Gateway: ${JSON.stringify(error)}`, 'error');
                } break;

                case 503: {
                    this.log('ERROR', `Service Unavailable: ${JSON.stringify(error)}`, 'error');
                } break;

                default: {
                    this.log('ERROR', `${JSON.stringify(error)}`, 'error');
                } break;
            }
        });
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

    async setupGuild(guild) {
        require('../util/CreateInstanceFile')(this, guild);
        require('../util/CreateCredentialsFile')(this, guild);

        await require('../discordTools/RegisterSlashCommands')(this, guild);

        let category = await require('../discordTools/SetupGuildCategory')(this, guild);
        await require('../discordTools/SetupGuildChannels')(this, guild, category);

        require('../util/FcmListener')(this, guild);
        await require('../discordTools/SetupSettingsMenu')(this, guild);
    }

    readInstanceFile(guildId) {
        return JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', `instances/${guildId}.json`), 'utf8'));
    }

    writeInstanceFile(guildId, instance) {
        Fs.writeFileSync(Path.join(__dirname, '..', `instances/${guildId}.json`), JSON.stringify(instance, null, 2));
    }

    readCredentialsFile(guildId) {
        return JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', `credentials/${guildId}.json`), 'utf8'));
    }

    writeCredentialsFile(guildId, credentials) {
        Fs.writeFileSync(Path.join(__dirname, '..', `credentials/${guildId}.json`),
            JSON.stringify(credentials, null, 2));
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

        rustplus.build();

        return rustplus;
    }

    createRustplusInstancesFromConfig() {
        let files = Fs.readdirSync(Path.join(__dirname, '..', 'instances'));

        files.forEach(file => {
            if (file.endsWith('.json')) {
                let guildId = file.replace('.json', '');
                let instance = this.readInstanceFile(guildId);

                for (const [key, value] of Object.entries(instance.serverList)) {
                    if (value.active) {
                        this.createRustplusInstance(
                            guildId,
                            value.serverIp,
                            value.appPort,
                            value.steamId,
                            value.playerToken);
                        break;
                    }
                }
            }
        });
    }

    findAvailableTrackerId(guildId) {
        const instance = this.readInstanceFile(guildId);

        while (true) {
            const randomNumber = Math.floor(Math.random() * 1000);
            if (!instance.trackers.hasOwnProperty(randomNumber)) {
                return randomNumber;
            }
        }
    }

    findAvailableGroupId(guildId, serverId) {
        const instance = this.readInstanceFile(guildId);

        while (true) {
            const randomNumber = Math.floor(Math.random() * 1000);
            if (!instance.serverList[serverId].switchGroups.hasOwnProperty(randomNumber)) {
                return randomNumber;
            }
        }
    }

    async interactionReply(interaction, content) {
        try {
            return await interaction.reply(content);
        }
        catch (e) {
            this.log('ERROR', `Interaction reply failed: ${e}`, 'error');
        }

        return undefined;
    }

    async interactionEditReply(interaction, content) {
        try {
            return await interaction.editReply(content);
        }
        catch (e) {
            this.log('ERROR', `Interaction edit reply failed: ${e}`, 'error');
        }

        return undefined;
    }

    async interactionUpdate(interaction, content) {
        try {
            return await interaction.update(content);
        }
        catch (e) {
            this.log('ERROR', `Interaction update failed: ${e}`, 'error');
        }

        return undefined;
    }

    async messageEdit(message, content) {
        try {
            return await message.edit(content);
        }
        catch (e) {
            console.log(message)
            this.log('ERROR', `Message edit failed: ${e}`, 'error');
        }

        return undefined;
    }

    async messageSend(channel, content) {
        try {
            return await channel.send(content);
        }
        catch (e) {
            this.log('ERROR', `Message send failed: ${e}`, 'error');
        }

        return undefined;
    }

    async validatePermissions(interaction) {
        const instance = this.readInstanceFile(interaction.guildId);

        /* If role isn't setup yet, validate as true */
        if (instance.role === null) return true;

        if (!interaction.member.permissions.has('ADMINISTRATOR') &&
            !interaction.member.roles.cache.has(instance.role)) {
            let role = DiscordTools.getRole(interaction.guildId, instance.role);
            let str = `You are not part of the '${role.name}' role, therefore you can't run bot commands.`;
            await this.interactionReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            this.log('WARNING', str);
            return false;
        }
        return true;
    }
}

module.exports = DiscordBot;
