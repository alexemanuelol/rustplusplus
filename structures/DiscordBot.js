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
        let instances = JSON.parse(fs.readFileSync(`${__dirname}/../instances/rustplusInstances.json`, 'utf8'));

        for (let guildId in instances) {
            this.createRustplusInstance(
                guildId,
                instances[guildId].server_ip,
                instances[guildId].app_port,
                instances[guildId].steam_id,
                instances[guildId].player_token);
        }
    }
}

module.exports = DiscordBot;