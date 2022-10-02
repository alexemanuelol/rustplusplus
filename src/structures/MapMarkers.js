const Constants = require('../util/constants.js');
const Map = require('../util/map.js');
const Timer = require('../util/timer');

class MapMarkers {
    constructor(mapMarkers, rustplus, client) {
        this._markers = mapMarkers.markers;

        this._rustplus = rustplus;
        this._client = client;

        this._types = {
            Player: 1,
            Explosion: 2,
            VendingMachine: 3,
            CH47: 4,
            CargoShip: 5,
            Crate: 6,
            GenericRadius: 7,
            PatrolHelicopter: 8
        }

        this._players = [];
        this._explosions = [];
        this._vendingMachines = [];
        this._ch47s = [];
        this._cargoShips = [];
        this._crates = [];
        this._genericRadiuses = [];
        this._patrolHelicopters = [];

        /* Timers */
        this.cargoShipEgressTimers = new Object();
        this.crateSmallOilRigTimers = new Object();
        this.crateLargeOilRigTimers = new Object();
        this.bradleyAPCRespawnTimers = new Object();
        this.crateDespawnTimers = new Object();
        this.crateDespawnWarningTimers = new Object();

        /* Event dates */
        this.timeSinceCargoShipWasOut = null;
        this.timeSinceCH47WasOut = null;
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;
        this.timeSincePatrolHelicopterWasOnMap = null;
        this.timeSincePatrolHelicopterWasDestroyed = null;
        this.timeSinceBradleyAPCWasDestroyed = null;
        this.timeSinceCH47DroppedCrate = null;

        /* Checker variables */
        this.patrolHelicoptersLeft = [];
        this.smallOilRigCratesLeft = [];
        this.largeOilRigCratesLeft = [];
        this.validCrateMonuments = [
            'airfield_display_name',
            'dome_monument_name',
            'excavator',
            'harbor_2_display_name',
            'harbor_display_name',
            'junkyard_display_name',
            'large_oil_rig',
            'launchsite',
            'military_tunnels_display_name',
            'oil_rig_small',
            'power_plant_display_name',
            'satellite_dish_display_name',
            'sewer_display_name',
            'train_yard_display_name',
            'water_treatment_plant_display_name'];

        /* Vending Machine variables */
        this.knownVendingMachines = [];
        this.subscribedItemsId = [];
        this.foundItems = [];

        this.updateMapMarkers(mapMarkers);
    }

    /* Getters and Setters */
    get markers() { return this._markers; }
    set markers(markers) { this._markers = markers; }
    get rustplus() { return this._rustplus; }
    set rustplus(rustplus) { this._rustplus = rustplus; }
    get client() { return this._client; }
    set client(client) { this._client = client; }
    get types() { return this._types; }
    set types(types) { this._types = types; }
    get players() { return this._players; }
    set players(players) { this._players = players; }
    get explosions() { return this._explosions; }
    set explosions(explosions) { this._explosions = explosions; }
    get vendingMachines() { return this._vendingMachines; }
    set vendingMachines(vendingMachines) { this._vendingMachines = vendingMachines; }
    get ch47s() { return this._ch47s; }
    set ch47s(ch47s) { this._ch47s = ch47s; }
    get cargoShips() { return this._cargoShips; }
    set cargoShips(cargoShips) { this._cargoShips = cargoShips; }
    get crates() { return this._crates; }
    set crates(crates) { this._crates = crates; }
    get genericRadiuses() { return this._genericRadiuses; }
    set genericRadiuses(genericRadiuses) { this._genericRadiuses = genericRadiuses; }
    get patrolHelicopters() { return this._patrolHelicopters; }
    set patrolHelicopters(patrolHelicopters) { this._patrolHelicopters = patrolHelicopters; }

    getType(type) {
        if (!Object.values(this.types).includes(type)) {
            return null;
        }

        switch (type) {
            case this.types.Player: {
                return this.players;
            } break;

            case this.types.Explosion: {
                return this.explosions;
            } break;

            case this.types.VendingMachine: {
                return this.vendingMachines;
            } break;

            case this.types.CH47: {
                return this.ch47s;
            } break;

            case this.types.CargoShip: {
                return this.cargoShips;
            } break;

            case this.types.Crate: {
                return this.crates;
            } break;

            case this.types.GenericRadius: {
                return this.genericRadiuses;
            } break;

            case this.types.PatrolHelicopter: {
                return this.patrolHelicopters;
            } break;

            default: {
                return null;
            } break;
        }
    }

    getMarkersOfType(type, markers) {
        if (!Object.values(this.types).includes(type)) {
            return [];
        }

        let markersOfType = [];
        for (let marker of markers) {
            if (marker.type === type) {
                markersOfType.push(marker);
            }
        }

        return markersOfType;
    }

    getMarkerByTypeId(type, id) {
        return this.getType(type).find(e => e.id === id);
    }

    getMarkerByTypeXY(type, x, y) {
        return this.getType(type).find(e => e.x === x && e.y === y);
    }

    isMarkerPresentByTypeId(type, id, markers = null) {
        if (markers) {
            return markers.some(e => e.id === id);
        }
        else {
            return this.getType(type).some(e => e.id === id);
        }
    }

    getNewMarkersOfTypeId(type, markers) {
        let newMarkersOfType = [];

        for (let marker of this.getMarkersOfType(type, markers)) {
            if (!this.isMarkerPresentByTypeId(type, marker.id)) {
                newMarkersOfType.push(marker);
            }
        }

        return newMarkersOfType
    }

    getLeftMarkersOfTypeId(type, markers) {
        let leftMarkersOfType = this.getType(type).slice();

        for (let marker of this.getMarkersOfType(type, markers)) {
            if (this.isMarkerPresentByTypeId(type, marker.id)) {
                leftMarkersOfType = leftMarkersOfType.filter(e => e.id !== marker.id);
            }
        }

        return leftMarkersOfType;
    }

    getRemainingMarkersOfTypeId(type, markers) {
        let remainingMarkersOfType = [];

        for (let marker of markers) {
            if (this.isMarkerPresentByTypeId(type, marker.id)) {
                remainingMarkersOfType.push(marker);
            }
        }

        return remainingMarkersOfType;
    }

    isMarkerPresentByTypeXY(type, x, y, markers = null) {
        if (markers) {
            return markers.some(e => e.x === x && e.y === y);
        }
        else {
            return this.getType(type).some(e => e.x === x && e.y === y);
        }
    }

    getNewMarkersOfTypeXY(type, markers) {
        let newMarkersOfType = [];

        for (let marker of this.getMarkersOfType(type, markers)) {
            if (!this.isMarkerPresentByTypeXY(type, marker.x, marker.y)) {
                newMarkersOfType.push(marker);
            }
        }

        return newMarkersOfType;
    }

    getLeftMarkersOfTypeXY(type, markers) {
        let leftMarkersOfType = this.getType(type).slice();

        for (let marker of this.getMarkersOfType(type, markers)) {
            if (this.isMarkerPresentByTypeXY(type, marker.x, marker.y)) {
                leftMarkersOfType = leftMarkersOfType.filter(e => e.x !== marker.x) || e.y !== marker.y;
            }
        }

        return leftMarkersOfType;
    }

    getRemainingMarkersOfTypeXY(type, markers) {
        let remainingMarkersOfType = [];

        for (let marker of markers) {
            if (this.isMarkerPresentByTypeXY(type, marker.x, marker.y)) {
                remainingMarkersOfType.push(marker);
            }
        }

        return remainingMarkersOfType;
    }




    /* Update event map markers */

    updateMapMarkers(mapMarkers) {
        this.updatePlayers(mapMarkers);
        this.updateCargoShips(mapMarkers);
        this.updatePatrolHelicopters(mapMarkers);
        this.updateExplosions(mapMarkers);
        this.updateCrates(mapMarkers);
        this.updateCH47s(mapMarkers);
        this.updateVendingMachines(mapMarkers);
        this.updateGenericRadiuses(mapMarkers);
    }

    updatePlayers(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.Player, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.Player, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.Player, mapMarkers.markers);

        /* Player markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;

            this.players.push(marker);
        }

        /* Player markers that have left. */
        for (let marker of leftMarkers) {
            this.players = this.players.filter(e => e.id !== marker.id);
        }

        /* Player markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let player = this.getMarkerByTypeId(this.types.Player, marker.id);

            player.x = marker.x;
            player.y = marker.y;
            player.location = pos;
        }
    }

    updateExplosions(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.Explosion, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.Explosion, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.Explosion, mapMarkers.markers);

        /* Explosion markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;

            let isExplosionMarkerHeli = false;
            if (this.patrolHelicoptersLeft.length !== 0) {
                for (let heli of this.patrolHelicoptersLeft) {
                    if (Map.getDistance(marker.x, marker.y, heli.x, heli.y) <=
                        Constants.PATROL_HELI_DOWNED_RADIUS) {
                        isExplosionMarkerHeli = true;
                        this.patrolHelicopters = this.patrolHelicopters.filter(e => e.id !== heli.id);
                        this.patrolHelicoptersLeft = this.patrolHelicoptersLeft.filter(e => e.id !== heli.id);
                    }
                }
            }

            if (isExplosionMarkerHeli) {
                /* PatrolHelicopter just got downed */
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.patrolHelicopterDestroyedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterTakenDown', { location: pos.string }));

                this.timeSincePatrolHelicopterWasDestroyed = new Date();
                this.timeSincePatrolHelicopterWasOnMap = new Date();
            }
            else {
                /* Bradley APC just got destroyed */
                let atLaunch = this.isBradleyExplosionAtLaunchSite(marker.x, marker.y);
                let posString = (atLaunch) ? this.client.intlGet(this.rustplus.guildId, 'launchSite') : pos.string;

                if (this.rustplus.isFirstPoll) {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.bradleyApcDestroyedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'bradleyOrHeliDestroyed', { location: posString }));
                }
                else {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.bradleyApcDestroyedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'bradleyDestroyed', { location: posString }));
                }

                let instance = this.client.getInstance(this.rustplus.guildId);
                if (!this.rustplus.isFirstPoll) {
                    this.bradleyAPCRespawnTimers[marker.id] = new Timer.timer(
                        this.notifyBradleyAPCRespawn.bind(this),
                        instance.serverList[this.rustplus.serverId].bradleyApcRespawnTimeMs,
                        marker.id);
                    this.bradleyAPCRespawnTimers[marker.id].start();
                }

                this.timeSinceBradleyAPCWasDestroyed = new Date();
            }

            this.explosions.push(marker);
        }

        /* Explosion markers that have left. */
        for (let marker of leftMarkers) {
            /* Unused */

            this.explosions = this.explosions.filter(e => e.id !== marker.id);
        }

        /* Explosion markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let explosion = this.getMarkerByTypeId(this.types.Explosion, marker.id);

            explosion.x = marker.x;
            explosion.y = marker.y;
            explosion.location = pos;
        }
    }

    updateVendingMachines(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeXY(this.types.VendingMachine, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeXY(this.types.VendingMachine, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeXY(this.types.VendingMachine, mapMarkers.markers);

        /* VendingMachine markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;

            if (!this.rustplus.isFirstPoll) {
                if (!this.knownVendingMachines.some(e => e.x === marker.x && e.y === marker.y)) {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.vendingMachineDetectedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'newVendingMachine', { location: pos.string }));
                }
            }

            this.knownVendingMachines.push({ x: marker.x, y: marker.y });
            this.vendingMachines.push(marker);
        }

        /* VendingMachine markers that have left. */
        for (let marker of leftMarkers) {
            this.vendingMachines = this.vendingMachines.filter(e => e.x !== marker.x) || e.y !== marker.y;
        }

        /* VendingMachine markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let vendingMachine = this.getMarkerByTypeXY(this.types.VendingMachine, marker.x, marker.y);

            vendingMachine.id = marker.id;
            vendingMachine.location = pos;
        }

        let vendingMachines = this.getMarkersOfType(this.types.VendingMachine, mapMarkers.markers);
        for (let vendingMachine of vendingMachines) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(vendingMachine.x, vendingMachine.y, mapSize, this.rustplus);

            for (let order of vendingMachine.sellOrders) {
                if (this.subscribedItemsId.includes(order.itemId) ||
                    this.subscribedItemsId.includes(order.currencyId)) {
                    if (!this.isAlreadyInFoundItems(vendingMachine.x, vendingMachine.y, order)) {
                        if (order.amountInStock >= 1) {
                            this.addToFoundItems(vendingMachine.x, vendingMachine.y, order);

                            let item = '';
                            if (this.subscribedItemsId.includes(order.itemId) &&
                                this.subscribedItemsId.includes(order.currencyId)) {
                                item = this.client.items.getName(order.itemId) +
                                    ` ${this.client.intlGet(this.rustplus.guildId, 'and')} `;
                                item += this.client.items.getName(order.currencyId);
                            }
                            else if (this.subscribedItemsId.includes(order.itemId)) {
                                item = this.client.items.getName(order.itemId);
                            }
                            else if (this.subscribedItemsId.includes(order.currencyId)) {
                                item = this.client.items.getName(order.currencyId);
                            }

                            this.rustplus.sendEvent(
                                this.rustplus.notificationSettings.vendingMachineDetectedSetting,
                                this.client.intlGet(this.rustplus.guildId, 'itemFoundInVendingMachine', {
                                    item: item,
                                    location: pos.string
                                }));
                        }
                    }
                }
            }
        }
    }

    updateCH47s(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.CH47, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.CH47, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.CH47, mapMarkers.markers);

        /* CH47 markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;

            let smallOilRig = [], largeOilRig = [];
            for (let monument of this.rustplus.map.monuments) {
                if (monument.token === 'oil_rig_small') {
                    smallOilRig.push({ x: monument.x, y: monument.y })
                }
                else if (monument.token === 'large_oil_rig') {
                    largeOilRig.push({ x: monument.x, y: monument.y })
                }
            }

            let found = false;
            if (!this.rustplus.isFirstPoll) {
                for (let oilRig of smallOilRig) {
                    if (Map.getDistance(marker.x, marker.y, oilRig.x, oilRig.y) <=
                        Constants.OIL_RIG_CHINOOK_47_MAX_SPAWN_DISTANCE) {
                        found = true;
                        let oilRigLocation = Map.getPos(oilRig.x, oilRig.y, mapSize, this.rustplus);
                        marker.ch47Type = 'smallOilRig';

                        this.rustplus.sendEvent(
                            this.rustplus.notificationSettings.heavyScientistCalledSetting,
                            this.client.intlGet(this.rustplus.guildId, 'heavyScientistsCalledSmall', {
                                location: oilRigLocation.location
                            }), this.rustplus.isFirstPoll, 'small_oil_rig_logo.png');

                        let crateId = this.getOilRigCrateId(oilRig.x, oilRig.y, mapMarkers);

                        if (crateId !== null) {
                            let instance = this.client.getInstance(this.rustplus.guildId);
                            this.crateSmallOilRigTimers[crateId] = new Timer.timer(
                                this.notifyCrateSmallOilRigOpen.bind(this),
                                instance.serverList[this.rustplus.serverId].oilRigLockedCrateUnlockTimeMs,
                                oilRigLocation.location,
                                crateId);
                            this.crateSmallOilRigTimers[crateId].start();
                        }

                        this.timeSinceSmallOilRigWasTriggered = new Date();
                        break;
                    }
                }
            }

            if (!found && !this.rustplus.isFirstPoll) {
                for (let oilRig of largeOilRig) {
                    if (Map.getDistance(marker.x, marker.y, oilRig.x, oilRig.y) <=
                        Constants.OIL_RIG_CHINOOK_47_MAX_SPAWN_DISTANCE) {
                        found = true;
                        let oilRigLocation = Map.getPos(oilRig.x, oilRig.y, mapSize, this.rustplus);
                        marker.ch47Type = 'largeOilRig';


                        this.rustplus.sendEvent(
                            this.rustplus.notificationSettings.heavyScientistCalledSetting,
                            this.client.intlGet(this.rustplus.guildId, 'heavyScientistsCalledLarge', {
                                location: oilRigLocation.location
                            }), this.rustplus.isFirstPoll, 'large_oil_rig_logo.png');

                        let crateId = this.getOilRigCrateId(oilRig.x, oilRig.y, mapMarkers);

                        if (crateId !== null) {
                            let instance = this.client.getInstance(this.rustplus.guildId);
                            this.crateLargeOilRigTimers[crateId] = new Timer.timer(
                                this.notifyCrateLargeOilRigOpen.bind(this),
                                instance.serverList[this.rustplus.serverId].oilRigLockedCrateUnlockTimeMs,
                                oilRigLocation.location,
                                crateId);
                            this.crateLargeOilRigTimers[crateId].start();
                        }

                        this.timeSinceLargeOilRigWasTriggered = new Date();
                        break;
                    }
                }
            }

            if (!found) {
                /* Offset that is used to determine if CH47 just spawned */
                let offset = 4 * Map.gridDiameter;

                /* If CH47 is located outside the grid system + the offset */
                if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.chinook47DetectedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'chinook47EntersMap', { location: pos.string }));
                }
                else {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.chinook47DetectedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'chinook47Located', { location: pos.string }));
                }
                marker.ch47Type = 'crate';
            }

            this.ch47s.push(marker);
        }

        /* CH47 markers that have left. */
        for (let marker of leftMarkers) {
            if (marker.ch47Type === 'crate') {
                this.timeSinceCH47WasOut = new Date();
                this.rustplus.log(this.client.intlGet(null, 'eventCap'),
                    this.client.intlGet(null, 'chinook47LeftMap', { location: marker.location.string }));
            }

            this.ch47s = this.ch47s.filter(e => e.id !== marker.id);
        }

        /* CH47 markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let ch47 = this.getMarkerByTypeId(this.types.CH47, marker.id);

            ch47.x = marker.x;
            ch47.y = marker.y;
            ch47.location = pos;
        }
    }

    updateCargoShips(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.CargoShip, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.CargoShip, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.CargoShip, mapMarkers.markers);

        /* CargoShip markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;
            marker.crates = [];
            marker.crateCounter = 1;
            marker.onItsWayOut = false;

            /* Offset that is used to determine if CargoShip just spawned */
            let offset = 4 * Map.gridDiameter;

            /* If CargoShip is located outside the grid system + the offset */
            if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.cargoShipDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'cargoShipEntersMap', { location: pos.string }));

                let instance = this.client.getInstance(this.rustplus.guildId);
                this.cargoShipEgressTimers[marker.id] = new Timer.timer(
                    this.notifyCargoShipEgress.bind(this),
                    instance.serverList[this.rustplus.serverId].cargoShipEgressTimeMs,
                    marker.id);
                this.cargoShipEgressTimers[marker.id].start();
            }
            else {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.cargoShipDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'cargoShipLocated', { location: pos.string }));
            }

            this.cargoShips.push(marker);
        }

        /* CargoShip markers that have left. */
        for (let marker of leftMarkers) {
            /* Remove Crates that are associated with the CargoShip */
            for (let crateId of marker.crates) {
                if (this.crates.some(e => e.id === crateId)) {
                    this.crates = this.crates.filter(e => e.id !== crateId);
                }
            }

            this.rustplus.sendEvent(
                this.rustplus.notificationSettings.cargoShipLeftSetting,
                this.client.intlGet(this.rustplus.guildId, 'cargoShipLeftMap', {
                    location: marker.location.string
                }));

            if (this.cargoShipEgressTimers[marker.id]) {
                this.cargoShipEgressTimers[marker.id].stop();
                delete this.cargoShipEgressTimers[marker.id];
            }

            this.timeSinceCargoShipWasOut = new Date();

            this.cargoShips = this.cargoShips.filter(e => e.id !== marker.id);
        }

        /* CargoShip markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let cargoShip = this.getMarkerByTypeId(this.types.CargoShip, marker.id);

            cargoShip.x = marker.x;
            cargoShip.y = marker.y;
            cargoShip.location = pos;
        }
    }

    updateCrates(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.Crate, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.Crate, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.Crate, mapMarkers.markers);

        let oilRigLeft = false;

        /* Crate markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;

            let closestMonument = this.getClosestMonument(marker.x, marker.y);
            let distance = Map.getDistance(marker.x, marker.y, closestMonument.x, closestMonument.y);

            if (this.isCrateOnCargoShip(marker.x, marker.y, mapMarkers)) {
                let cargoShipId = this.getCargoShipId(marker.x, marker.y, mapMarkers);

                marker.crateType = 'cargoShip';
                marker.cargoShipId = cargoShipId;

                let crates = '';
                let cargoShip = this.getMarkerByTypeId(this.types.CargoShip, cargoShipId);
                if (cargoShip) {
                    cargoShip.crates.push(marker.id);
                    let crateNumber = cargoShip.crateCounter;
                    cargoShip.crateCounter += 1;
                    marker.crateNumber = crateNumber;
                    crates = `(${crateNumber}/3)`;
                }

                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.lockedCrateSpawnCargoShipSetting,
                    this.client.intlGet(this.rustplus.guildId, 'lockedCrateSpawnCargo', {
                        crateNumber: crates,
                        location: pos.string
                    }),
                    this.rustplus.isFirstPoll);
            }
            else if (closestMonument.token === 'oil_rig_small' && distance <
                this.rustplus.map.monumentInfo[closestMonument.token].radius) {
                if (this.smallOilRigCratesLeft.some(e => e.crateType === 'oil_rig_small' &&
                    Map.getDistance(e.x, e.y, marker.x, marker.y) < Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS)) {
                    /* Refresh of Crate at Small Oil Rig, Scenario 1 */
                    let oilRig = this.rustplus.map.monumentInfo['oil_rig_small'].clean;
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateOilRigRefreshedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateRefreshOnSmall', {
                            rig: oilRig,
                            location: pos.location
                        }),
                        this.rustplus.isFirstPoll,
                        'locked_crate_small_oil_rig_logo.png');

                    for (let crate of this.smallOilRigCratesLeft) {
                        if (crate.crateType === 'oil_rig_small' &&
                            Map.getDistance(crate.x, crate.y, marker.x, marker.y) <
                            Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                            this.crates = this.crates.filter(e => e.id !== crate.id);
                            leftMarkers = leftMarkers.filter(e => e.id !== crate.id);
                        }
                    }
                }
                else {
                    let refreshed = false;
                    for (let crate of this.crates) {
                        if (crate.crateType === 'oil_rig_small' &&
                            Map.getDistance(crate.x, crate.y, marker.x, marker.y) <
                            Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                            /* Refresh of Crate at Small Oil Rig, Scenario 2 */
                            let oilRig = this.rustplus.map.monumentInfo['oil_rig_small'].clean;
                            this.rustplus.sendEvent(
                                this.rustplus.notificationSettings.lockedCrateOilRigRefreshedSetting,
                                this.client.intlGet(this.rustplus.guildId, 'lockedCrateRefreshOnSmall', {
                                    rig: oilRig,
                                    location: pos.location
                                }),
                                this.rustplus.isFirstPoll,
                                'locked_crate_small_oil_rig_logo.png');
                            refreshed = true;
                        }
                    }

                    if (!refreshed && !this.rustplus.isFirstPoll) {
                        let oilRig = this.rustplus.map.monumentInfo['oil_rig_small'].clean;
                        this.rustplus.sendEvent(
                            this.rustplus.notificationSettings.lockedCrateRespawnOilRigSetting,
                            this.client.intlGet(this.rustplus.guildId, 'lockedCrateRespawnedOnSmall', {
                                rig: oilRig,
                                location: pos.location
                            }),
                            this.rustplus.isFirstPoll,
                            'locked_crate_small_oil_rig_logo.png');
                    }
                }

                marker.crateType = 'oil_rig_small';
            }
            else if (closestMonument.token === 'large_oil_rig' && distance <
                this.rustplus.map.monumentInfo[closestMonument.token].radius) {
                if (this.largeOilRigCratesLeft.some(e => e.crateType === 'large_oil_rig' &&
                    Map.getDistance(e.x, e.y, marker.x, marker.y) < Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS)) {
                    /* Refresh of Crate at Large Oil Rig, Scenario 1 */
                    let oilRig = this.rustplus.map.monumentInfo['large_oil_rig'].clean;
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateOilRigRefreshedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateRefreshOnLarge', {
                            rig: oilRig,
                            location: pos.location
                        }),
                        this.rustplus.isFirstPoll,
                        'locked_crate_large_oil_rig_logo.png');

                    for (let crate of this.largeOilRigCratesLeft) {
                        if (crate.crateType === 'large_oil_rig' &&
                            Map.getDistance(crate.x, crate.y, marker.x, marker.y) <
                            Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                            this.crates = this.crates.filter(e => e.id !== crate.id);
                            leftMarkers = leftMarkers.filter(e => e.id !== crate.id);
                        }
                    }
                }
                else {
                    let refreshed = false;
                    for (let crate of this.crates) {
                        if (crate.crateType === 'large_oil_rig' &&
                            Map.getDistance(crate.x, crate.y, marker.x, marker.y) <
                            Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS) {
                            /* Refresh of Crate at Large Oil Rig, Scenario 2 */
                            let oilRig = this.rustplus.map.monumentInfo['large_oil_rig'].clean;
                            this.rustplus.sendEvent(
                                this.rustplus.notificationSettings.lockedCrateOilRigRefreshedSetting,
                                this.client.intlGet(this.rustplus.guildId, 'lockedCrateRefreshOnLarge', {
                                    rig: oilRig,
                                    location: pos.location
                                }),
                                this.rustplus.isFirstPoll,
                                'locked_crate_large_oil_rig_logo.png');
                            refreshed = true;
                        }
                    }

                    if (!refreshed && !this.rustplus.isFirstPoll) {
                        let oilRig = this.rustplus.map.monumentInfo['large_oil_rig'].clean;
                        this.rustplus.sendEvent(
                            this.rustplus.notificationSettings.lockedCrateRespawnOilRigSetting,
                            this.client.intlGet(this.rustplus.guildId, 'lockedCrateRespawnedOnLarge', {
                                rig: oilRig,
                                location: pos.location
                            }),
                            this.rustplus.isFirstPoll,
                            'locked_crate_large_oil_rig_logo.png');
                    }
                }

                marker.crateType = 'large_oil_rig';
            }
            else if (!(closestMonument.token in this.rustplus.map.monumentInfo) ||
                distance > this.rustplus.map.monumentInfo[closestMonument.token].radius) {
                if (!Map.isOutsideGridSystem(marker.x, marker.y, mapSize)) {
                    if (!this.rustplus.isFirstPoll) {
                        this.rustplus.sendEvent(
                            this.rustplus.notificationSettings.lockedCrateDroppedAtMonumentSetting,
                            this.client.intlGet(this.rustplus.guildId, 'lockedCrateDroppedAt', {
                                location: pos.string
                            }));
                    }
                    else {
                        this.rustplus.sendEvent(
                            this.rustplus.notificationSettings.lockedCrateDroppedAtMonumentSetting,
                            this.client.intlGet(this.rustplus.guildId, 'lockedCrateLocatedAt', {
                                location: pos.string
                            }));
                    }

                    marker.crateType = 'grid';
                }
                else {
                    /* Crate is located outside the grid system, might be an invalid Crate */
                    marker.crateType = 'invalid';
                }
            }
            else {
                let name = (this.rustplus.map.monumentInfo.hasOwnProperty(closestMonument.token)) ?
                    this.rustplus.map.monumentInfo[closestMonument.token].clean : closestMonument.token;

                if (!this.rustplus.isFirstPoll) {
                    this.timeSinceCH47DroppedCrate = new Date();

                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateDroppedAtMonumentSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateDroppedByChinook47', {
                            location: name
                        }));

                    let instance = this.client.getInstance(this.rustplus.guildId);
                    this.crateDespawnTimers[marker.id] = new Timer.timer(
                        () => { },
                        instance.serverList[this.rustplus.serverId].lockedCrateDespawnTimeMs);
                    this.crateDespawnTimers[marker.id].start();

                    this.crateDespawnWarningTimers[marker.id] = new Timer.timer(
                        this.notifyCrateWarningDespawn.bind(this),
                        instance.serverList[this.rustplus.serverId].lockedCrateDespawnTimeMs -
                        instance.serverList[this.rustplus.serverId].lockedCrateDespawnWarningTimeMs,
                        name);
                    this.crateDespawnWarningTimers[marker.id].start();
                }
                else {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateDroppedAtMonumentSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateLocatedAt', {
                            location: name
                        }));
                }

                marker.crateType = name;
            }

            /* Reset Crate Left Entities arrays */
            this.smallOilRigCratesLeft = [];
            this.largeOilRigCratesLeft = [];

            this.crates.push(marker);
        }

        /* Crate markers that have left. */
        for (let marker of leftMarkers) {
            if (marker.crateType === 'cargoShip') {
                let cargoShipId = marker.cargoShipId;
                let cargoShip = this.getMarkerByTypeId(this.types.CargoShip, cargoShipId);

                cargoShip.crates = cargoShip.crates.filter(e => e !== marker.id);
                let crateNumber = marker.crateNumber;
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.lockedCrateLeftCargoShipSetting,
                    this.client.intlGet(this.rustplus.guildId, 'lockedCrateCargoShipLooted', {
                        crateNumber: `(${crateNumber}/3)`,
                        location: marker.location.string
                    }));
            }
            else if (marker.crateType === 'grid') {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.lockedCrateMonumentLeftSetting,
                    this.client.intlGet(this.rustplus.guildId, 'lockedCrateLootedOrDespawned', {
                        location: marker.location.string
                    }));
            }
            else if (marker.crateType === 'invalid') {
                /* Invalid Locked Crate, we don't care */
            }
            else if (marker.crateType === 'oil_rig_small') {
                if (this.crateSmallOilRigTimers[marker.id]) {
                    this.crateSmallOilRigTimers[marker.id].stop();
                    delete this.crateSmallOilRigTimers[marker.id];
                }

                if (marker.fakeLeft === true) {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateLootedOilRigSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateSmallLooted', {
                            location: marker.location.location
                        }),
                        this.rustplus.isFirstPoll,
                        'locked_crate_small_oil_rig_logo.png');
                }
                else {
                    let refreshed = false;
                    for (let crate of this.crates) {
                        if (crate.crateType === marker.crateType &&
                            Map.getDistance(crate.x, crate.y, marker.x, marker.y) <
                            Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS &&
                            crate.id !== marker.id) {
                            /* Refresh of Crate at Small Oil Rig, Scenario 2 */
                            refreshed = true;
                        }
                    }

                    if (!refreshed) {
                        let crate = this.getMarkerByTypeId(this.types.Crate, marker.id);

                        /* Scenario 1 */
                        this.smallOilRigCratesLeft.push({
                            id: marker.id,
                            x: marker.x,
                            y: marker.y,
                            location: marker.location,
                            crateType: marker.crateType
                        });

                        /* Add fakeLeft, in case it actually was looted rather than refreshed */
                        crate.fakeLeft = true;

                        /* Oil Rig crate left, call new poll sooner */
                        oilRigLeft = true;
                        continue;
                    }
                }
            }
            else if (marker.crateType === 'large_oil_rig') {
                if (this.crateLargeOilRigTimers[marker.id]) {
                    this.crateLargeOilRigTimers[marker.id].stop();
                    delete this.crateLargeOilRigTimers[marker.id];
                }

                if (marker.fakeLeft === true) {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateLootedOilRigSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateLargeLooted', {
                            location: marker.location.location
                        }),
                        this.rustplus.isFirstPoll,
                        'locked_crate_large_oil_rig_logo.png');
                }
                else {
                    let refreshed = false;
                    for (let crate of this.crates) {
                        if (crate.crateType === marker.crateType &&
                            Map.getDistance(crate.x, crate.y, marker.x, marker.y) <
                            Constants.LOCKED_CRATE_OIL_RIG_REFRESH_RADIUS &&
                            crate.id !== marker.id) {
                            /* Refresh of Crate at Large Oil Rig, Scenario 2 */
                            refreshed = true;
                        }
                    }

                    if (!refreshed) {
                        let crate = this.getMarkerByTypeId(this.types.Crate, marker.id);

                        /* Scenario 1 */
                        this.largeOilRigCratesLeft.push({
                            id: marker.id,
                            x: marker.x,
                            y: marker.y,
                            location: marker.location,
                            crateType: marker.crateType
                        });

                        /* Add fakeLeft, in case it actually was looted rather than refreshed */
                        crate.fakeLeft = true;

                        /* Oil Rig crate left, call new poll sooner */
                        oilRigLeft = true;
                        continue;
                    }
                }
            }
            else {
                let timeLeft = null;
                let despawnOffset = 5 * 60 * 1000; /* 5 minutes offset value */

                if (this.crateDespawnWarningTimers[marker.id]) {
                    timeLeft = this.crateDespawnTimers[marker.id].getTimeLeft();
                }
                else {
                    timeLeft = despawnOffset;
                }

                if (timeLeft > despawnOffset) {
                    /* The timer have reset, which might indicate that the Crate despawned. */
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateMonumentLeftSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateLooted', {
                            location: marker.crateType
                        }));
                }
                else {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.lockedCrateMonumentLeftSetting,
                        this.client.intlGet(this.rustplus.guildId, 'lockedCrateDespawned', {
                            location: marker.crateType
                        }));
                }

                if (this.crateDespawnTimers[marker.id]) {
                    this.crateDespawnTimers[marker.id].stop();
                    delete this.crateDespawnTimers[marker.id];
                }
                if (this.crateDespawnWarningTimers[marker.id]) {
                    this.crateDespawnWarningTimers[marker.id].stop();
                    delete this.crateDespawnWarningTimers[marker.id];
                }
            }

            this.crates = this.crates.filter(e => e.id !== marker.id);
        }

        /* Crate markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let crate = this.getMarkerByTypeId(this.types.Crate, marker.id);

            crate.x = marker.x;
            crate.y = marker.y;
            crate.location = pos;
        }

        if (oilRigLeft) {
            setTimeout(async () => {
                let mapMarkers = await this.rustplus.getMapMarkersAsync();
                if (!(await this.rustplus.isResponseValid(mapMarkers))) return;
                this.updateCrates(mapMarkers.mapMarkers);
            }, 2000);
        }
    }

    updateGenericRadiuses(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.GenericRadius, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.GenericRadius, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.GenericRadius, mapMarkers.markers);

        /* GenericRadius markers that are new. */
        for (let marker of newMarkers) {
            this.genericRadiuses.push(marker);
        }

        /* GenericRadius markers that have left. */
        for (let marker of leftMarkers) {
            this.genericRadiuses = this.genericRadiuses.filter(e => e.id !== marker.id);
        }

        /* GenericRadius markers that still remains. */
        for (let marker of remainingMarkers) {
            let genericRadius = this.getMarkerByTypeId(this.types.GenericRadius, marker.id);

            genericRadius.x = marker.x;
            genericRadius.y = marker.y;
        }
    }

    updatePatrolHelicopters(mapMarkers) {
        let newMarkers = this.getNewMarkersOfTypeId(this.types.PatrolHelicopter, mapMarkers.markers);
        let leftMarkers = this.getLeftMarkersOfTypeId(this.types.PatrolHelicopter, mapMarkers.markers);
        let remainingMarkers = this.getRemainingMarkersOfTypeId(this.types.PatrolHelicopter, mapMarkers.markers);

        /* PatrolHelicopter markers that are new. */
        for (let marker of newMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);

            marker.location = pos;

            /* Offset that is used to determine if PatrolHelicopter just spawned */
            let offset = 4 * Map.gridDiameter;

            /* If PatrolHelicopter is located outside the grid system + the offset */
            if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.patrolHelicopterDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterEntersMap', {
                        location: pos.string
                    }));
            }
            else {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.patrolHelicopterDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterLocatedAt', {
                        location: pos.string
                    }));
            }

            this.patrolHelicopters.push(marker);
        }

        /* PatrolHelicopter markers that have left. */
        for (let marker of leftMarkers) {
            if (marker.fakeLeft && marker.stage === 1) {
                let patrolHelicopter = this.getMarkerByTypeId(this.types.PatrolHelicopter, marker.id);

                /* Add fakeLeft, in case it left the map rather than got downed */
                patrolHelicopter.fakeLeft = true;
                patrolHelicopter.stage = 2;
                continue;
            }
            else if (marker.fakeLeft && marker.stage === 2) {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.patrolHelicopterLeftSetting,
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterLeftMap', {
                        location: marker.location.string
                    }));

                this.timeSincePatrolHelicopterWasOnMap = new Date();
            }
            else {
                let patrolHelicopter = this.getMarkerByTypeId(this.types.PatrolHelicopter, marker.id);

                this.patrolHelicoptersLeft.push({
                    id: marker.id,
                    location: marker.location,
                    x: marker.x,
                    y: marker.y
                });

                /* Add fakeLeft, in case it left the map rather than got downed */
                patrolHelicopter.fakeLeft = true;
                patrolHelicopter.stage = 1;
                continue;
            }

            this.patrolHelicopters = this.patrolHelicopters.filter(e => e.id !== marker.id);
        }

        /* PatrolHelicopter markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let patrolHelicopter = this.getMarkerByTypeId(this.types.PatrolHelicopter, marker.id);

            patrolHelicopter.x = marker.x;
            patrolHelicopter.y = marker.y;
            patrolHelicopter.location = pos;
        }
    }



    /* Timer notification functions */

    notifyCargoShipEgress(args) {
        let id = args[0];
        let marker = this.getMarkerByTypeId(this.types.CargoShip, id);

        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.cargoShipEgressSetting,
            this.client.intlGet(this.rustplus.guildId, 'cargoShipEntersEgressStage', {
                location: marker.location.string
            }));

        if (this.cargoShipEgressTimers[id]) {
            this.cargoShipEgressTimers[id].stop();
            delete this.cargoShipEgressTimers[id];
        }

        marker.onItsWayOut = true;
    }

    notifyCrateSmallOilRigOpen(args) {
        let oilRigLocation = args[0];
        let crateId = args[1];

        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.lockedCrateOilRigUnlockedSetting,
            this.client.intlGet(this.rustplus.guildId, 'lockedCrateSmallOilRigUnlocked', {
                location: oilRigLocation
            }),
            this.rustplus.isFirstPoll,
            'locked_crate_small_oil_rig_logo.png');

        if (this.crateSmallOilRigTimers[crateId]) {
            this.crateSmallOilRigTimers[crateId].stop();
            delete this.crateSmallOilRigTimers[crateId];
        }
    }

    notifyCrateLargeOilRigOpen(args) {
        let oilRigLocation = args[0];
        let crateId = args[1];

        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.lockedCrateOilRigUnlockedSetting,
            this.client.intlGet(this.rustplus.guildId, 'lockedCrateLargeOilRigUnlocked', {
                location: oilRigLocation
            }),
            this.rustplus.isFirstPoll,
            'locked_crate_large_oil_rig_logo.png');

        if (this.crateLargeOilRigTimers[crateId]) {
            this.crateLargeOilRigTimers[crateId].stop();
            delete this.crateLargeOilRigTimers[crateId];
        }
    }

    notifyBradleyAPCRespawn(args) {
        let explosionId = args[0];
        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.bradleyApcShouldRespawnSetting,
            this.client.intlGet(this.rustplus.guildId, 'bradleyApcRespawn'));

        if (this.bradleyAPCRespawnTimers[explosionId]) {
            this.bradleyAPCRespawnTimers[explosionId].stop();
            delete this.bradleyAPCRespawnTimers[explosionId];
        }
    }

    notifyCrateWarningDespawn(args) {
        let name = args[0];
        let instance = this.client.getInstance(this.rustplus.guildId);
        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.lockedCrateMonumentDespawnWarningSetting,
            this.client.intlGet(this.rustplus.guildId, 'lockedCrateDespawnsIn', {
                location: name,
                minutes: instance.serverList[this.rustplus.serverId].lockedCrateDespawnWarningTimeMs / (60 * 1000)
            }));
    }

    /* Help functions */

    getOilRigCrateId(oilRigX, oilRigY, mapMarkers) {
        for (let marker of mapMarkers.markers) {
            if (marker.type === this.types.Crate) {
                if (Map.getDistance(oilRigX, oilRigY, marker.x, marker.y) < 100) {
                    return marker.id;
                }
            }
        }

        return null;
    }

    isBradleyExplosionAtLaunchSite(x, y) {
        /* Check where the explosion marker is located, if near Launch Site, return true */
        for (let monument of this.rustplus.map.monuments) {
            if (monument.token === 'launchsite') {
                return (Map.getDistance(x, y, monument.x, monument.y) <=
                    this.rustplus.map.monumentInfo['launchsite'].radius);
            }
        }
        return false;
    }

    getClosestMonument(x, y) {
        let minDistance = 1000000;
        let closestMonument = null;
        for (let monument of this.rustplus.map.monuments) {
            let distance = Map.getDistance(x, y, monument.x, monument.y);
            if (distance < minDistance && this.validCrateMonuments.includes(monument.token)) {
                minDistance = distance;
                closestMonument = monument;
            }
        }

        return closestMonument;
    }

    isCrateOnCargoShip(x, y, mapMarkers) {
        for (let marker of mapMarkers.markers) {
            if (marker.type === this.types.CargoShip) {
                if (Map.getDistance(x, y, marker.x, marker.y) <= Constants.LOCKED_CRATE_CARGO_SHIP_RADIUS) {
                    return true;
                }
            }
        }
        return false;
    }

    getCargoShipId(x, y, mapMarkers) {
        for (let marker of mapMarkers.markers) {
            if (marker.type === this.types.CargoShip) {
                if (Map.getDistance(x, y, marker.x, marker.y) <= Constants.LOCKED_CRATE_CARGO_SHIP_RADIUS) {
                    return marker.id;
                }
            }
        }

        return null;
    }

    isAlreadyInFoundItems(x, y, order) {
        return this.foundItems.some(e =>
            e.x === x &&
            e.y === y &&
            e.itemId === order.itemId &&
            e.quantity === order.quantity &&
            e.currencyId === order.currencyId &&
            e.costPerItem === order.costPerItem);
    }

    addToFoundItems(x, y, order) {
        this.foundItems.push({
            x: x,
            y: y,
            itemId: order.itemId,
            quantity: order.quantity,
            currencyId: order.currencyId,
            costPerItem: order.costPerItem
        });
    }

    addItemToSubscribeTo(id) {
        if (!this.subscribedItemsId.includes(id)) {
            this.subscribedItemsId.push(id);
        }
    }

    removeItemFromSubscription(id) {
        this.subscribedItemsId = this.subscribedItemsId.filter(e => e !== id);
    }

    reset() {
        this.players = [];
        this.explosions = [];
        this.vendingMachines = [];
        this.ch47s = [];
        this.cargoShips = [];
        this.crates = [];
        this.genericRadiuses = [];
        this.patrolHelicopters = [];

        for (const [id, timer] of Object.entries(this.cargoShipEgressTimers)) {
            timer.stop();
        }
        this.cargoShipEgressTimers = new Object();
        for (const [id, timer] of Object.entries(this.crateSmallOilRigTimers)) {
            timer.stop();
        }
        this.crateSmallOilRigTimers = new Object();
        for (const [id, timer] of Object.entries(this.crateLargeOilRigTimers)) {
            timer.stop();
        }
        this.crateLargeOilRigTimers = new Object();
        for (const [id, timer] of Object.entries(this.bradleyAPCRespawnTimers)) {
            timer.stop();
        }
        this.bradleyAPCRespawnTimers = new Object();
        for (const [id, timer] of Object.entries(this.crateDespawnTimers)) {
            timer.stop();
        }
        this.crateDespawnTimers = new Object();
        for (const [id, timer] of Object.entries(this.crateDespawnWarningTimers)) {
            timer.stop();
        }
        this.crateDespawnWarningTimers = new Object();

        this.timeSinceCargoShipWasOut = null;
        this.timeSinceCH47WasOut = null;
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;
        this.timeSincePatrolHelicopterWasOnMap = null;
        this.timeSincePatrolHelicopterWasDestroyed = null;
        this.timeSinceBradleyAPCWasDestroyed = null;
        this.timeSinceCH47DroppedCrate = null;

        this.patrolHelicoptersLeft = [];
        this.smallOilRigCratesLeft = [];
        this.largeOilRigCratesLeft = [];
        this.knownVendingMachines = [];
        this.subscribedItemsId = [];
        this.foundItems = [];
    }
}

module.exports = MapMarkers;