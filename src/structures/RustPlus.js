const fs = require('fs');
const RP = require('rustplus.js');
const Client = require('../../index.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Timer = require('../util/timer');
const Logger = require('./Logger.js');
const path = require('path');
const DiscordTools = require('../discordTools/discordTools.js');

class RustPlus extends RP {
    constructor(guildId, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);
        this.oldsendTeamMessage = this.sendTeamMessage;
        this.sendTeamMessage = function (message) {
            let generalSettings = this.generalSettings || { botchatprefix: "On" };

            this.oldsendTeamMessage(`${generalSettings.botchatprefix == "On" ? `rustPlusPlus | ` : ""} ${message}`);
        }
        this.guildId = guildId;

        this.logger = null;
        this.firstPoll = true;
        this.generalSettings = null;
        this.notificationSettings = null;

        /* Map meta */
        this.intervalId = 0;
        this.debug = false;
        this.mapWidth = null;
        this.mapHeight = null;
        this.mapOceanMargin = null;
        this.mapMonuments = null;

        /* Event active entities */
        this.activeCargoShips = new Object();
        this.activeChinook47s = new Object();
        this.activeLockedCrates = new Object();
        this.activePatrolHelicopters = new Object();
        this.activeExplosions = new Object();
        this.patrolHelicoptersLeft = [];
        this.smallOilRigLockedCratesLeft = [];
        this.largeOilRigLockedCratesLeft = [];
        this.activeVendingMachines = [];
        this.foundItems = [];
        this.itemsToLookForId = [];

        /* Event timers */
        this.cargoShipEgressTimers = new Object();
        this.lockedCrateSmallOilRigTimers = new Object();
        this.lockedCrateLargeOilRigTimers = new Object();
        this.lockedCrateDespawnTimers = new Object();
        this.lockedCrateDespawnWarningTimers = new Object();
        this.bradleyRespawnTimers = new Object();
        this.timers = new Object();

        /* Event dates */
        this.timeSinceCargoWasOut = null;
        this.timeSinceBradleyWasDestroyed = null;
        this.timeSinceHeliWasDestroyed = null;
        this.timeSinceHeliWasOnMap = null;
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;

        /* Time variables */
        this.passedFirstSunriseOrSunset = false;
        this.startTime = null;
        this.previousTime = null;
        this.startTimeObject = new Object();
        this.timeTillDay = new Object();
        this.timeTillNight = new Object();

        /* Load rustplus events */
        this.loadEvents();
    }

    loadEvents() {
        /* Dynamically retrieve the rustplus event files */
        const eventFiles = fs.readdirSync(`${__dirname}/../rustplusEvents`).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../rustplusEvents/${file}`);
            this.on(event.name, (...args) => event.execute(this, Client.client, ...args));
        }
    }

    build() {
        /* Setup the logger */
        this.logger = new Logger(path.join(__dirname, '..', `logs/${this.guildId}.log`), this.guildId);

        /* Setup settings */
        let instance = Client.client.readInstanceFile(this.guildId);
        this.generalSettings = instance.generalSettings;
        this.notificationSettings = instance.notificationSettings;

        this.connect();
    }

    log(text) {
        this.logger.log(text);
    }

    sendEvent(setting, text, firstPoll = false, image = null) {
        let img = (image !== null) ? image : setting.image;

        if (!firstPoll && setting.discord) {
            this.sendDiscordEvent(text, img)
        }
        if (!firstPoll && setting.inGame) {
            this.sendTeamMessage(`Event: ${text}`);
        }
        this.log(text);
    }

    sendDiscordEvent(text, image) {
        let instance = Client.client.readInstanceFile(this.guildId);
        let channel = DiscordTools.getTextChannelById(this.guildId, instance.channelId.events);

        if (channel !== undefined) {
            let file = new MessageAttachment(`src/images/${image}`);
            let embed = new MessageEmbed()
                .setColor('#ce412b')
                .setThumbnail(`attachment://${image}`)
                .setTitle(text)
                .setFooter(instance.serverList[`${this.server}-${this.port}`].title)
                .setTimestamp();

            channel.send({ embeds: [embed], files: [file] });
        }
    }

    getTimeLeftOfTimer(timer) {
        /* Returns the time left of a timer. If timer is not running, null will be returned. */
        if (timer.getStateRunning()) {
            return Timer.secondsToFullScale(timer.getTimeLeft() / 1000);
        }
        return null;
    }

    addItemToLookFor(id) {
        if (!this.itemsToLookForId.includes(id)) {
            this.itemsToLookForId.push(id);
        }
    }

    removeItemToLookFor(id) {
        this.itemsToLookForId = this.itemsToLookForId.filter(e => e !== id);
    }
}

module.exports = RustPlus;