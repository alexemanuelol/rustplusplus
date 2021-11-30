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

    readInstancesFile() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../instances/instances.json`, 'utf8'));
    }

    writeInstancesFile(instances) {
        fs.writeFileSync(`${__dirname}/../instances/instances.json`, JSON.stringify(instances, null, 2));
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

        let instances = this.readInstancesFile();

        this.guilds.cache.forEach((guild) => {
            if (!instances.hasOwnProperty(guild.id)) {
                instances[guild.id] = {
                    generalSettings: this.readGeneralSettingsTemplate(),
                    notificationSettings: this.readNotificationSettingsTemplate(),
                    rustplus: null
                };
            }
        });

        this.writeInstancesFile(instances);
    }

    readNotificationSettingsTemplate() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../templates/notificationSettingsTemplate.json`, 'utf8'));
    }

    readGeneralSettingsTemplate() {
        return JSON.parse(fs.readFileSync(`${__dirname}/../templates/generalSettingsTemplate.json`, 'utf8'));
    }

    createRustplusInstance(guildId, serverIp, appPort, steamId, playerToken, connect) {
        let rustplus = new RustPlus(serverIp, appPort, steamId, playerToken);

        /* Add rustplus instance to Object */
        this.rustplusInstances[guildId] = rustplus;

        rustplus.guildId = guildId;

        rustplus.eventChannelId = this.guildsAndChannelsIds[guildId]['events'];
        rustplus.alertChannelId = this.guildsAndChannelsIds[guildId]['alerts'];
        rustplus.commandsChannelId = this.guildsAndChannelsIds[guildId]['commands'];
        rustplus.switchesChannelId = this.guildsAndChannelsIds[guildId]['switches'];

        rustplus.build(connect);

        return rustplus;
    }

    createRustplusInstancesFromConfig() {
        let instances = this.readInstancesFile();

        for (let instance in instances) {
            if (instances[instance].rustplus !== null) {
                this.createRustplusInstance(
                    instance,
                    instances[instance].rustplus.server_ip,
                    instances[instance].rustplus.app_port,
                    instances[instance].rustplus.steam_id,
                    instances[instance].rustplus.player_token,
                    instances[instance].generalSettings.connect);
            }
        }
    }
}

module.exports = DiscordBot;