const fs = require('fs');
const { Collection, Client } = require('discord.js');
const Config = require('../config.json');
const RustPlus = require('../structures/RustPlus');
const Logger = require('./Logger.js');
const path = require('path');

class DiscordBot extends Client {
    constructor(props) {
        super(props);

        this.logger = new Logger(path.join(__dirname, '..', 'Logs/discordBot.log'));

        this.commands = new Collection();
        this.guildsAndChannelsIds = new Object();
        this.rustplusInstances = new Object();

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

    log(text) {
        this.logger.log(text);
    }

    registerSlashCommands() {
        this.guilds.cache.forEach((guild) => {
            require('../util/RegisterSlashCommands')(this, guild);
        });
    }

    setupGuildChannels() {
        this.guilds.cache.forEach((guild) => {
            require('../util/SetupGuildChannels')(this, guild);
        });
    }

    getChannel(guildId, channelId) {
        let guild = this.guilds.cache.get(guildId);
        if (guild) {
            let channel = guild.channels.cache.get(channelId);
            if (!channel) {
                this.log(`No channel with ID: ${channelId}`);
            }
            return channel;
        }
        else {
            this.log(`No guild with ID: ${guildId}`);
        }
        return guild;
    }

    createInstancesFile() {
        /* If instances/ directory does not exist, create it */
        if (!fs.existsSync(`${__dirname}/../instances`)) {
            fs.mkdirSync(`${__dirname}/../instances`);
        }

        /* If instances.json does not exist, create it */
        if (!fs.existsSync(`${__dirname}/../instances/instances.json`)) {
            fs.writeFileSync(`${__dirname}/../instances/instances.json`, JSON.stringify({}, null, 2));
        }

        let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));

        this.guilds.cache.forEach((guild) => {
            if (!instances.hasOwnProperty(guild.id)) {
                instances[guild.id] = { settings: this.readTemplateSettings(), rustplus: null };
            }
        });

        fs.writeFileSync(`${__dirname}/../instances/instances.json`, JSON.stringify(instances, null, 2));
    }

    readSettingsFromFile(guildId) {
        let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));

        return instances[guildId].settings;
    }

    writeSettingsToFile(guildId, settings) {
        if (settings !== null) {
            let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));

            instances[guildId].settings = settings;

            fs.writeFileSync(`${__dirname}/../instances/instances.json`, JSON.stringify(instances, null, 2));
        }
    }

    readTemplateSettings() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../templates/settingsTemplate.json`, 'utf8'));
    }

    createRustplusInstance(guildId, serverIp, appPort, steamId, playerToken) {
        let rustplus = new RustPlus(serverIp, appPort, steamId, playerToken);

        rustplus.guildId = guildId;

        rustplus.eventChannelId = this.guildsAndChannelsIds[guildId]['events'];
        rustplus.alertChannelId = this.guildsAndChannelsIds[guildId]['alerts'];
        rustplus.commandsChannelId = this.guildsAndChannelsIds[guildId]['commands'];
        rustplus.switchesChannelId = this.guildsAndChannelsIds[guildId]['switches'];

        rustplus.build();

        return rustplus;
    }

    createRustplusInstancesFromConfig() {
        let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));

        for (let instance in instances) {
            if (instances[instance].rustplus !== null) {
                this.createRustplusInstance(
                    instance,
                    instances[instance].rustplus.server_ip,
                    instances[instance].rustplus.app_port,
                    instances[instance].rustplus.steam_id,
                    instances[instance].rustplus.player_token);
            }
        }
    }
}

module.exports = DiscordBot;