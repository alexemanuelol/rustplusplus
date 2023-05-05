/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

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
        this._genericRadiuses = [];
        this._patrolHelicopters = [];

        /* Timers */
        this.cargoShipEgressTimers = new Object();
        this.crateSmallOilRigTimer = null;
        this.crateSmallOilRigLocation = null;
        this.crateLargeOilRigTimer = null;
        this.crateLargeOilRigLocation = null;
        this.bradleyAPCRespawnTimers = new Object();

        /* Event dates */
        this.timeSinceCargoShipWasOut = null;
        this.timeSinceCH47WasOut = null;
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;
        this.timeSincePatrolHelicopterWasOnMap = null;
        this.timeSincePatrolHelicopterWasDestroyed = null;
        this.timeSinceBradleyAPCWasDestroyed = null;

        /* Checker variables */
        this.patrolHelicoptersLeft = [];

        /* Vending Machine variables */
        this.knownVendingMachines = [];

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
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterTakenDown', { location: pos.string }),
                    Constants.COLOR_PATROL_HELICOPTER_TAKEN_DOWN);

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
                        this.client.intlGet(this.rustplus.guildId, 'bradleyOrHeliDestroyed', { location: posString }),
                        Constants.COLOR_BRADLEY_OR_HELI_DESTROYED);
                }
                else {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.bradleyApcDestroyedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'bradleyDestroyed', { location: posString }),
                        Constants.COLOR_BRADLEY_DESTROYED);
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
                        this.client.intlGet(this.rustplus.guildId, 'newVendingMachine', { location: pos.string }),
                        Constants.COLOR_NEW_VENDING_MACHINE);
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
                            this.client.intlGet(this.rustplus.guildId, 'heavyScientistsCalledSmall',
                                { location: oilRigLocation.location }),
                            Constants.COLOR_HEAVY_SCIENTISTS_CALLED_SMALL,
                            this.rustplus.isFirstPoll,
                            'small_oil_rig_logo.png');

                        if (this.crateSmallOilRigTimer) {
                            this.crateSmallOilRigTimer.stop();
                        }

                        let instance = this.client.getInstance(this.rustplus.guildId);
                        this.crateSmallOilRigTimer = new Timer.timer(
                            this.notifyCrateSmallOilRigOpen.bind(this),
                            instance.serverList[this.rustplus.serverId].oilRigLockedCrateUnlockTimeMs,
                            oilRigLocation.location);
                        this.crateSmallOilRigTimer.start();

                        this.crateSmallOilRigLocation = oilRigLocation.location;
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
                            this.client.intlGet(this.rustplus.guildId, 'heavyScientistsCalledLarge',
                                { location: oilRigLocation.location }),
                            Constants.COLOR_HEAVY_SCIENTISTS_CALLED_LARGE,
                            this.rustplus.isFirstPoll,
                            'large_oil_rig_logo.png');

                        if (this.crateLargeOilRigTimer) {
                            this.crateLargeOilRigTimer.stop();
                        }

                        let instance = this.client.getInstance(this.rustplus.guildId);
                        this.crateLargeOilRigTimer = new Timer.timer(
                            this.notifyCrateLargeOilRigOpen.bind(this),
                            instance.serverList[this.rustplus.serverId].oilRigLockedCrateUnlockTimeMs,
                            oilRigLocation.location);
                        this.crateLargeOilRigTimer.start();

                        this.crateLargeOilRigLocation = oilRigLocation.location;
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
                        this.client.intlGet(this.rustplus.guildId, 'chinook47EntersMap', { location: pos.string }),
                        Constants.COLOR_CHINOOK47_ENTERS_MAP);
                }
                else {
                    this.rustplus.sendEvent(
                        this.rustplus.notificationSettings.chinook47DetectedSetting,
                        this.client.intlGet(this.rustplus.guildId, 'chinook47Located', { location: pos.string }),
                        Constants.COLOR_CHINOOK47_LOCATED);
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

            this.rustplus.cargoShipTracers[marker.id] = [{ x: marker.x, y: marker.y }];

            marker.location = pos;
            marker.onItsWayOut = false;

            /* Offset that is used to determine if CargoShip just spawned */
            let offset = 4 * Map.gridDiameter;

            /* If CargoShip is located outside the grid system + the offset */
            if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.cargoShipDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'cargoShipEntersMap', { location: pos.string }),
                    Constants.COLOR_CARGO_SHIP_ENTERS_MAP);

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
                    this.client.intlGet(this.rustplus.guildId, 'cargoShipLocated', { location: pos.string }),
                    Constants.COLOR_CARGO_SHIP_LOCATED);
            }

            this.cargoShips.push(marker);
        }

        /* CargoShip markers that have left. */
        for (let marker of leftMarkers) {
            this.rustplus.sendEvent(
                this.rustplus.notificationSettings.cargoShipLeftSetting,
                this.client.intlGet(this.rustplus.guildId, 'cargoShipLeftMap', { location: marker.location.string }),
                Constants.COLOR_CARGO_SHIP_LEFT_MAP);

            if (this.cargoShipEgressTimers[marker.id]) {
                this.cargoShipEgressTimers[marker.id].stop();
                delete this.cargoShipEgressTimers[marker.id];
            }

            this.timeSinceCargoShipWasOut = new Date();

            this.cargoShips = this.cargoShips.filter(e => e.id !== marker.id);
            delete this.rustplus.cargoShipTracers[marker.id];
        }

        /* CargoShip markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let cargoShip = this.getMarkerByTypeId(this.types.CargoShip, marker.id);

            this.rustplus.cargoShipTracers[marker.id].push({ x: marker.x, y: marker.y });

            cargoShip.x = marker.x;
            cargoShip.y = marker.y;
            cargoShip.location = pos;
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

            this.rustplus.patrolHelicopterTracers[marker.id] = [{ x: marker.x, y: marker.y }];

            marker.location = pos;

            /* Offset that is used to determine if PatrolHelicopter just spawned */
            let offset = 4 * Map.gridDiameter;

            /* If PatrolHelicopter is located outside the grid system + the offset */
            if (Map.isOutsideGridSystem(marker.x, marker.y, mapSize, offset)) {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.patrolHelicopterDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterEntersMap', {
                        location: pos.string
                    }),
                    Constants.COLOR_PATROL_HELICOPTER_ENTERS_MAP);
            }
            else {
                this.rustplus.sendEvent(
                    this.rustplus.notificationSettings.patrolHelicopterDetectedSetting,
                    this.client.intlGet(this.rustplus.guildId, 'patrolHelicopterLocatedAt', {
                        location: pos.string
                    }),
                    Constants.COLOR_PATROL_HELICOPTER_LOCATED_AT);
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
                    }),
                    Constants.COLOR_PATROL_HELICOPTER_LEFT_MAP);

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
            delete this.rustplus.patrolHelicopterTracers[marker.id];
        }

        /* PatrolHelicopter markers that still remains. */
        for (let marker of remainingMarkers) {
            let mapSize = this.rustplus.info.correctedMapSize;
            let pos = Map.getPos(marker.x, marker.y, mapSize, this.rustplus);
            let patrolHelicopter = this.getMarkerByTypeId(this.types.PatrolHelicopter, marker.id);

            this.rustplus.patrolHelicopterTracers[marker.id].push({ x: marker.x, y: marker.y });

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
            }),
            Constants.COLOR_CARGO_SHIP_ENTERS_EGRESS_STAGE);

        if (this.cargoShipEgressTimers[id]) {
            this.cargoShipEgressTimers[id].stop();
            delete this.cargoShipEgressTimers[id];
        }

        marker.onItsWayOut = true;
    }

    notifyCrateSmallOilRigOpen(args) {
        let oilRigLocation = args[0];

        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.lockedCrateOilRigUnlockedSetting,
            this.client.intlGet(this.rustplus.guildId, 'lockedCrateSmallOilRigUnlocked', {
                location: oilRigLocation
            }),
            Constants.COLOR_LOCKED_CRATE_SMALL_OILRIG_UNLOCKED,
            this.rustplus.isFirstPoll,
            'locked_crate_small_oil_rig_logo.png');

        this.crateSmallOilRigTimer.stop();
        this.crateSmallOilRigTimer = null;
        this.crateSmallOilRigLocation = null;
    }

    notifyCrateLargeOilRigOpen(args) {
        let oilRigLocation = args[0];

        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.lockedCrateOilRigUnlockedSetting,
            this.client.intlGet(this.rustplus.guildId, 'lockedCrateLargeOilRigUnlocked', {
                location: oilRigLocation
            }),
            Constants.COLOR_LOCKED_CRATE_LARGE_OILRIG_UNLOCKED,
            this.rustplus.isFirstPoll,
            'locked_crate_large_oil_rig_logo.png');

        this.crateLargeOilRigTimer.stop();
        this.crateLargeOilRigTimer = null;
        this.crateLargeOilRigLocation = null;
    }

    notifyBradleyAPCRespawn(args) {
        let explosionId = args[0];
        this.rustplus.sendEvent(
            this.rustplus.notificationSettings.bradleyApcShouldRespawnSetting,
            this.client.intlGet(this.rustplus.guildId, 'bradleyApcRespawn'),
            Constants.COLOR_BRADLEY_APC_RESPAWN);

        if (this.bradleyAPCRespawnTimers[explosionId]) {
            this.bradleyAPCRespawnTimers[explosionId].stop();
            delete this.bradleyAPCRespawnTimers[explosionId];
        }
    }

    /* Help functions */

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

    reset() {
        this.players = [];
        this.explosions = [];
        this.vendingMachines = [];
        this.ch47s = [];
        this.cargoShips = [];
        this.genericRadiuses = [];
        this.patrolHelicopters = [];

        for (const [id, timer] of Object.entries(this.cargoShipEgressTimers)) {
            timer.stop();
        }
        this.cargoShipEgressTimers = new Object();
        if (this.crateSmallOilRigTimer) {
            this.crateSmallOilRigTimer.stop();
        }
        this.crateSmallOilRigTimer = null;
        if (this.crateLargeOilRigTimer) {
            this.crateLargeOilRigTimer.stop();
        }
        this.crateLargeOilRigTimer = null;
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

        this.patrolHelicoptersLeft = [];
        this.knownVendingMachines = [];
        this.subscribedItemsId = [];
        this.foundItems = [];

        this.crateSmallOilRigLocation = null;
        this.crateLargeOilRigLocation = null;
    }
}

module.exports = MapMarkers;