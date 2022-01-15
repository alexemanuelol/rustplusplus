const fs = require('fs');
const RP = require('rustplus.js');
const Client = require('../../index.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Timer = require('../util/timer');
const Constants = require('../util/eventConstants.js');
const Logger = require('./Logger.js');
const path = require('path');
const DiscordTools = require('../discordTools/discordTools.js');

const CargoShip = require('../inGameEvents/cargoShip.js');
const Explosion = require('../inGameEvents/explosion.js');
const LockedCrate = require('../inGameEvents/lockedCrate.js');
const OilRig = require('../inGameEvents/oilRig.js');

class RustPlus extends RP {
    constructor(guildId, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.guildId = guildId;

        this.logger = null;
        this.firstPoll = true;
        this.generalSettings = null;
        this.notificationSettings = null;

        this.smallOilRigLeftChecker = false;
        this.largeOilRigLeftChecker = false;

        /* Map meta */
        this.intervalId = 0;
        this.debug = false;
        this.mapWidth = null;
        this.mapHeight = null;
        this.mapOceanMargin = null;
        this.mapMonuments = null;

        /* Event Current Entities */
        this.currentCargoShipsId = [];
        this.currentExplosionsId = [];
        this.currentLockedCratesId = [];
        this.currentLockedCrateMonumentName = null;
        this.currentChinook47sId = [];
        this.currentVendingMachines = [];
        this.foundItems = [];
        this.itemsToLookForId = [];

        /* Event timers */
        this.cargoShipEgressTimer = new Timer.timer(
            CargoShip.notifyCargoShipEgress,
            Constants.CARGO_SHIP_EGRESS_TIME_MS,
            this);
        this.bradleyRespawnTimer = new Timer.timer(
            Explosion.notifyBradleyRespawn,
            Constants.BRADLEY_APC_RESPAWN_TIME_MS,
            this);
        this.lockedCrateDespawnTimer = new Timer.timer(
            () => { },
            Constants.LOCKED_CRATE_DESPAWN_TIME_MS);
        this.lockedCrateDespawnWarningTimer = new Timer.timer(
            LockedCrate.notifyLockedCrateWarningDespawn,
            Constants.LOCKED_CRATE_DESPAWN_TIME_MS - Constants.LOCKED_CRATE_DESPAWN_WARNING_TIME_MS,
            this);
        this.lockedCrateSmallOilRigTimer = new Timer.timer(
            OilRig.notifyLockedCrateSmallOpen,
            Constants.OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
            this);
        this.lockedCrateLargeOilRigTimer = new Timer.timer(
            OilRig.notifyLockedCrateLargeOpen,
            Constants.OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS,
            this);

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

    sendEvent(text, image) {
        let instance = Client.client.readInstanceFile(this.guildId);
        let channel = DiscordTools.getTextChannelById(this.guildId, instance.channelId.events);

        if (channel !== undefined) {
            let file = new MessageAttachment(`src/images/${image}`);
            let embed = new MessageEmbed()
                .setColor('#ce412b')
                .setThumbnail(`attachment://${image}`)
                .setAuthor(text)
                .setFooter(instance.serverList[`${this.server}-${this.port}`].title)
                .setTimestamp();

            channel.send({ embeds: [embed], files: [file] });
            this.log(text);
        }
    }
    
    sendChatMessage(text) {
        let instance = Client.client.readInstanceFile(this.guildId);
        let channel = DiscordTools.getTextChannelById(this.guildId, instance.channelId.events);

        if (channel !== undefined) {
            channel.send(text);
            this.log(text);
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