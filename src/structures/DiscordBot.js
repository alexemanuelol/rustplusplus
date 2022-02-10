const fs = require('fs');
const { Collection, Client } = require('discord.js');
const Config = require('../../config.json');
const RustPlus = require('../structures/RustPlus');
const Logger = require('./Logger.js');
const path = require('path');

class DiscordBot extends Client {
    constructor(props) {
        super(props);

        this.logger = new Logger(path.join(__dirname, '..', 'logs/discordBot.log'), 'default');

        this.commands = new Collection();
        this.rustplusInstances = new Object();
        this.currentFcmListeners = new Object();
        this.serverListMessages = new Object();
        this.informationMessages = new Object();

        this.pollingIntervalMs = Config.general.pollingIntervalMs;

        this.loadCommands();
        this.loadEvents();
    }

    loadCommands() {
        const commandFiles = fs.readdirSync(`${__dirname}/../commands`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            this.commands.set(command.data.name, command);
        }
    }

    loadEvents() {
        const discordEventFiles = fs.readdirSync(`${__dirname}/../discordEvents`).filter(file => file.endsWith('.js'));
        for (const file of discordEventFiles) {
            const event = require(`../discordEvents/${file}`);
            if (event.once) {
                this.once(event.name, (...args) => event.execute(...args));
            } else {
                this.on(event.name, (...args) => event.execute(this, ...args));
            }
        }
    }

    build() {
        this.login(Config.discord.token);
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

    registerSlashCommands() {
        this.guilds.cache.forEach((guild) => {
            require('../discordTools/RegisterSlashCommands')(this, guild);
        });
    }

    createInstanceFiles() {
        this.guilds.cache.forEach((guild) => {
            require('../util/CreateInstanceFile')(this, guild);
        });
    }

    setupGuildChannels() {
        this.guilds.cache.forEach((guild) => {
            require('../discordTools/SetupGuildChannels')(this, guild);
        });
    }

    setupFcmListeners() {
        this.guilds.cache.forEach((guild) => {
            require('../util/FcmListener')(this, guild);
        });
    }

    setupServerLists() {
        this.guilds.cache.forEach((guild) => {
            require('../discordTools/SetupServerList')(this, guild);
        });
    }

    setupSettingsMenus() {
        this.guilds.cache.forEach((guild) => {
            require('../discordTools/SetupSettingsMenu')(this, guild);
        })
    }

    readInstanceFile(guildId) {
        return JSON.parse(fs.readFileSync(`${__dirname}/../instances/${guildId}.json`, 'utf8'));
    }

    writeInstanceFile(guildId, instance) {
        fs.writeFileSync(`${__dirname}/../instances/${guildId}.json`, JSON.stringify(instance, null, 2));
    }

    readNotificationSettingsTemplate() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../templates/notificationSettingsTemplate.json`, 'utf8'));
    }

    readGeneralSettingsTemplate() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../templates/generalSettingsTemplate.json`, 'utf8'));
    }

    createRustplusInstance(guildId, serverIp, appPort, steamId, playerToken) {
        let rustplus = new RustPlus(guildId, serverIp, appPort, steamId, playerToken);

        /* Add rustplus instance to Object */
        this.rustplusInstances[guildId] = rustplus;

        rustplus.build();

        return rustplus;
    }

    createRustplusInstancesFromConfig() {
        let files = fs.readdirSync(`${__dirname}/../instances`);

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
}

module.exports = DiscordBot;
