const fs = require('fs');
const { Collection, Client } = require('discord.js');
const Config = require('../config.json');
const RustPlus = require('../structures/RustPlus');

class DiscordBot extends Client {
    constructor(props) {
        super(props);

        /* Create a Collection for all the commands */
        this.commands = new Collection();

        /* An object that contains all guild ids with channel ids */
        this.guildsAndChannels = new Object();

        /* An object that contains all the rustplus instances */
        this.rustplusInstances = new Object();

        this.loadCommands();
        this.loadEvents();
    }

    loadCommands() {
        /* Dynamically retrieve the command files */
        const commandFiles = fs.readdirSync(`${__dirname}/../commands`).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/${file}`);
            /* Set a new item in the Collection with the key as the command name and
               the value as the exported module */
            this.commands.set(command.data.name, command);
        }
    }

    loadEvents() {
        /* Dynamically retrieve the discord event files */
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
        /* Login to Discord with token */
        this.login(Config.discord.token);
    }

    registerSlashCommands() {
        this.guilds.cache.forEach((guild) => {
            require('../util/RegisterSlashCommands')(guild.id);
        });
    }

    setupGuildChannels() {
        this.guilds.cache.forEach((guild) => {
            require('../util/SetupGuildChannels')(this, guild);
        });
    }

    createRustplusInstancesFromConfig() {
        let instances = JSON.parse(fs.readFileSync(`${__dirname}/../rustplusInstances.json`, 'utf8'));

        for (let guildId in instances) {
            let rustplus = new RustPlus(
                instances[guildId].server_ip,
                instances[guildId].app_port,
                instances[guildId].steam_id,
                instances[guildId].player_token
            );

            /* Add guild ID to the rustplus instance */
            rustplus.guildId = guildId;

            /* Connect */
            rustplus.build();
        }
    }
}

module.exports = DiscordBot;