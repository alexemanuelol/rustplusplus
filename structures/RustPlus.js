const fs = require('fs');
const RP = require('rustplus.js');
const Timer = require('../util/timer');
const CargoShip = require('../inGameEvents/cargoShip.js');
const Constants = require('../util/eventConstants.js');

class RustPlus extends RP {
    constructor(serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        /* Map meta */
        this.intervalId = 0;
        this.debug = false;
        this.mapWidth = null;
        this.mapHeight = null;
        this.mapOceanMargin = null;
        this.mapMonuments = null;

        /* Event Current Entities */
        this.currentCargoShipsId = [];
        console.log("TIME: " + Constants.CARGO_SHIP_EGRESS_TIME_MS)

        /* Event timers */
        this.cargoShipEgressTimer = new Timer.timer(
            CargoShip.notifyCargoShipEgress,
            Constants.CARGO_SHIP_EGRESS_TIME_MS);

        /* Load rustplus events */
        this.loadEvents();
    }

    loadEvents() {
        /* Dynamically retrieve the rustplus event files */
        const eventFiles = fs.readdirSync(`${__dirname}/../rustplusEvents`).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../rustplusEvents/${file}`);
            this.on(event.name, (...args) => event.execute(this, ...args));
        }
    }

    build() {
        this.connect();
    }

    getTimeLeftOfTimer(timer) {
        /* Returns the time left of a timer. If timer is not running, null will be returned. */
        if (timer.getStateRunning()) {
            return Timer.secondsToFullScale(timer.getTimeLeft() / 1000);
        }
        return null;
    }
}

module.exports = RustPlus;