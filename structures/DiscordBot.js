const fs = require('fs');
const { Collection, Client } = require('discord.js');
const Config = require('../config.json');
const RustPlus = require('../structures/RustPlus');
const Logger = require('./Logger.js');
const path = require('path');

class DiscordBot extends Client {
    constructor(props) {
        super(props);

        this.logger = new Logger(path.join(__dirname, '..', 'logs/discordBot.log'));

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

    readInstanceFile(guildId) {
        return JSON.parse(fs.readFileSync(`${__dirname}/../instances/${guildId}.json`, 'utf8'));
    }

    writeInstanceFile(guildId, instance) {
        fs.writeFileSync(`${__dirname}/../instances/${guildId}.json`, JSON.stringify(instance, null, 2));
    }

    createInstanceFiles() {
        /* If instances/ directory does not exist, create it */
        if (!fs.existsSync(`${__dirname}/../instances`)) {
            fs.mkdirSync(`${__dirname}/../instances`);
        }

        this.guilds.cache.forEach((guild) => {
            if (!fs.existsSync(`${__dirname}/../instances/${guild.id}.json`)) {
                fs.writeFileSync(`${__dirname}/../instances/${guild.id}.json`, JSON.stringify({
                    generalSettings: this.readGeneralSettingsTemplate(),
                    notificationSettings: this.readNotificationSettingsTemplate(),
                    rustplus: null
                }, null, 2));
            }
        });
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
        let files = fs.readdirSync(`${__dirname}/../instances`);

        files.forEach(file => {
            if (file.endsWith('.json')) {
                let guildId = file.replace('.json', '');
                let instance = this.readInstanceFile(guildId);

                if (instance.rustplus !== null) {
                    this.createRustplusInstance(
                        guildId,
                        instance.rustplus.server_ip,
                        instance.rustplus.app_port,
                        instance.rustplus.steam_id,
                        instance.rustplus.player_token,
                        instance.generalSettings.connect);
                }
            }
        });
    }
}

module.exports = DiscordBot;