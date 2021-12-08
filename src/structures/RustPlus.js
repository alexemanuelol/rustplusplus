const fs = require('fs');
const RP = require('rustplus.js');
const Client = require('../../index.js');
const { MessageEmbed } = require('discord.js');
const Timer = require('../util/timer');
const Constants = require('../util/eventConstants.js');
const Logger = require('./Logger.js');
const path = require('path');

const CargoShip = require('../inGameEvents/cargoShip.js');
const Explosion = require('../inGameEvents/explosion.js');
const LockedCrate = require('../inGameEvents/lockedCrate.js');
const OilRig = require('../inGameEvents/oilRig.js');

class RustPlus extends RP {
    constructor(serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.serverIp = serverIp;
        this.appPort = appPort;
        this.steamId = steamId;
        this.playerToken = playerToken;

        this.logger = null;
        this.serverName = undefined;
        this.firstPoll = true;
        this.generalSettings = null;
        this.notificationSettings = null;

        this.smallOilRigLeftChecker = false;
        this.largeOilRigLeftChecker = false;

        this.guildId = null;
        this.eventChannelId = null;
        this.alertChannelId = null;
        this.commandsChannelId = null;
        this.switchesChannelId = null;

        this.interaction = null;

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

    build(connect) {
        /* Setup the logger */
        this.logger = new Logger(path.join(__dirname, '..', `logs/${this.guildId}.log`), this.guildId);

        /* Setup settings */
        let instance = Client.client.readInstanceFile(this.guildId);
        this.generalSettings = instance.generalSettings;
        this.notificationSettings = instance.notificationSettings;

        if (connect) {
            this.connect();
        }
    }

    log(text) {
        this.logger.log(text);
    }

    sendEvent(text) {
        let channel = Client.client.getChannel(this.guildId, this.eventChannelId);

        if (channel) {
            let embed = new MessageEmbed()
                .setColor('#ce412b')
                .setAuthor(text)
                .setFooter(this.serverName)
                .setTimestamp();

            channel.send({ embeds: [embed] });
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