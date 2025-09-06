/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as rp from 'rustplus-ts';

import { localeManager as lm, guildInstanceManager as gim } from '../../index';
import { RustPlusInstance } from '../managers/rustPlusManager';
import {
    getDistance, getGridPos, getPos, getPosString, isOutsideGridSystem, isSameDirection, Point, Position,
    getAngleBetweenPoints
} from '../utils/map';
import { EventNotificationSettings, GuildInstance } from '../managers/guildInstanceManager';
import * as constants from '../utils/constants';
import { Timer } from '../utils/timer';

const VALID_LOCKED_CRATE_MONUMENTS: string[] = [
    'airfield_display_name',
    'dome_monument_name',
    'power_plant_display_name',
    'train_yard_display_name',
    'water_treatment_plant_display_name'
];

export enum DockingStatus {
    DOCKING = 0,
    DOCKED = 1,
    UNDOCKING = 2
}

const CARGO_SHIP_LOOT_ROUNDS = 3;
const CARGO_SHIP_LOOT_ROUNDS_SPACING_MS = 10 * 60 * 1000; /* 10 min */
const CARGO_SHIP_HARBOR_DOCKING_TIME_MS = 8 * 60 * 1000; /* 8 min */
const CARGO_SHIP_HARBOR_DOCKING_DISTANCE = 480;
const CARGO_SHIP_HARBOR_UNDOCKED_DISTANCE = 280;
const CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS = 2 * 60 * 1000; /* 2 min */
const CARGO_SHIP_LEAVE_AFTER_HARBOR_WITH_CRATES_MS = 19.5 * 60 * 1000; /* 19.5 min */
const PATROL_HELICOPTER_LEAVING_SPEED_MIN = 400;
const TRAVELLING_VENDOR_ACTIVE_TIME_MS = 30 * 60 * 1000;

export interface CargoShipMetaData {
    lockedCrateSpawnCounter: number;
    harborsDocked: Point[];
    dockingStatus: DockingStatus | null;
    isLeaving: boolean;
    prevPoint: Point | null;
    isDepartureCertain: boolean;
}

export interface PatrolHelicopterMetaData {
    prevPoint: Point | null;
    isLeaving: boolean;
}

export class RustPlusMapMarkers {
    public rpInstance: RustPlusInstance;
    public appMapMarkers: rp.AppMapMarkers;

    private firstPoll: boolean;

    public undefineds: rp.AppMarker[];
    public players: rp.AppMarker[];
    public explosions: rp.AppMarker[];
    public vendingMachines: rp.AppMarker[];
    public ch47s: rp.AppMarker[];
    public cargoShips: rp.AppMarker[];
    public crates: rp.AppMarker[];
    public genericRadii: rp.AppMarker[];
    public patrolHelicopters: rp.AppMarker[];
    public travellingVendors: rp.AppMarker[];

    public oilRigLockedCrateUnlockedTimeoutIds: { [ch47: number]: NodeJS.Timeout };
    public cargoShipEgressTimeoutIds: { [cargoShip: number]: Timer };
    public cargoShipEgressAfterHarbor1TimeoutIds: { [cargoShip: number]: Timer };
    public cargoShipEgressAfterHarbor2TimeoutIds: { [cargoShip: number]: Timer };
    public cargoShipLockedCrateSpawnIntervalIds: { [cargoShip: number]: NodeJS.Timeout };
    public cargoShipUndockingNotificationTimeoutIds: { [cargoShip: number]: NodeJS.Timeout };
    public travellingVendorLeavingNotificationTimeoutIds: { [travellingVendor: number]: NodeJS.Timeout };

    public timeSinceSmallOilRigWasTriggered: Date | null;
    public timeSinceLargeOilRigWasTriggered: Date | null;

    public knownVendingMachines: Point[];
    public oilRigCh47s: number[];
    public ch47LockedCrateNotified: number[];
    public cargoShipMetaData: { [cargoShip: number]: CargoShipMetaData };
    public patrolHelicopterMetaData: { [cargoShip: number]: PatrolHelicopterMetaData };

    constructor(rpInstance: RustPlusInstance, appMapMarkers: rp.AppMapMarkers) {
        this.rpInstance = rpInstance;
        this.appMapMarkers = appMapMarkers;

        this.firstPoll = true;

        this.undefineds = [];
        this.players = [];
        this.explosions = [];
        this.vendingMachines = [];
        this.ch47s = [];
        this.cargoShips = [];
        this.crates = [];
        this.genericRadii = [];
        this.patrolHelicopters = [];
        this.travellingVendors = [];

        /* Timeout Ids */
        this.oilRigLockedCrateUnlockedTimeoutIds = {};
        this.cargoShipEgressTimeoutIds = {};
        this.cargoShipEgressAfterHarbor2TimeoutIds = {}
        this.cargoShipEgressAfterHarbor1TimeoutIds = {}
        this.cargoShipLockedCrateSpawnIntervalIds = {};
        this.cargoShipUndockingNotificationTimeoutIds = {};
        this.travellingVendorLeavingNotificationTimeoutIds = {};

        /* Event dates */
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;

        this.knownVendingMachines = [];
        this.oilRigCh47s = [];
        this.ch47LockedCrateNotified = [];
        this.cargoShipMetaData = {};
        this.patrolHelicopterMetaData = {};
    }


    /**
     * Update methods
     */

    public updateMapMarkers(appMapMarkers: rp.AppMapMarkers) {
        this.updateUndefineds(appMapMarkers);
        this.updatePlayers(appMapMarkers);
        this.updateExplosions(appMapMarkers);
        this.updateVendingMachines(appMapMarkers);
        this.updateCh47s(appMapMarkers);
        this.updateCargoShips(appMapMarkers);
        this.updateCrates(appMapMarkers);
        this.updateGenericRadii(appMapMarkers);
        this.updatePatrolHelicopters(appMapMarkers);
        this.updateTravellingVendors(appMapMarkers);

        this.firstPoll = false;
        this.appMapMarkers = appMapMarkers;
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateUndefineds(mapMarkers: rp.AppMapMarkers) {
        /* Not used */
    }

    private updatePlayers(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.Player;
        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        /* Markers that are new. */
        for (const marker of newMarkers) {
            this.players.push(marker);
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            this.players = this.players.filter(e => e.id !== marker.id);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const player = this.players.find(e => e.id === marker.id) as rp.AppMarker;
            Object.assign(player, marker);
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateExplosions(mapMarkers: rp.AppMapMarkers) {
        /* No longer used in Rust+ */
    }

    private updateVendingMachines(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.VendingMachine;
        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        /* Markers that are new. */
        for (const marker of newMarkers) {
            if (!this.firstPoll && !this.knownVendingMachines.some(e => e.x === marker.x && e.y === marker.y)) {
                const location = getPos(marker.x, marker.y, this.rpInstance);
                if (location) {
                    const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
                    const language = gInstance.generalSettings.language;
                    const locationString = getPosString(location, this.rpInstance, false, true);
                    this.rpInstance.sendEventNotification('vendingMachineSpawned',
                        lm.getIntl(language, 'inGameEvent-vendingMachineSpawned', { location: locationString }));
                }
            }

            this.knownVendingMachines.push({ x: marker.x, y: marker.y });
            this.vendingMachines.push(marker);
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            this.vendingMachines = this.vendingMachines.filter(e => e.x !== marker.x || e.y !== marker.y);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const vendingMachine = this.vendingMachines.find(e => e.x === marker.x && e.y === marker.y) as rp.AppMarker;
            Object.assign(vendingMachine, marker);
        }
    }

    private updateCh47s(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.CH47;
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        if (!this.rpInstance.rpMap || !this.rpInstance.rpInfo) return;

        const mapSize = this.rpInstance.rpInfo.appInfo.mapSize;

        /* Markers that are new. */
        for (const marker of newMarkers) {
            const point = { x: marker.x, y: marker.y };
            const radius = constants.OIL_RIG_CHINOOK_47_MAX_SPAWN_DISTANCE;

            const smallOilRig = this.rpInstance.rpMap.getMonumentPointIfInside(point, 'oil_rig_small', radius);
            const largeOilRig = this.rpInstance.rpMap.getMonumentPointIfInside(point, 'large_oil_rig', radius);
            if (smallOilRig || largeOilRig) {
                this.oilRigCh47s.push(marker.id);
                const oilRigPoint = (smallOilRig ? smallOilRig : largeOilRig) as Point;
                const oilRigTokenName = smallOilRig ? 'oil_rig_small' : 'large_oil_rig';
                const oilRigName = lm.getIntl(language, `monumentName-${oilRigTokenName}`);

                const oilRigPos = getPos(oilRigPoint.x, oilRigPoint.y, this.rpInstance);
                if (oilRigPos) {
                    const oilRigPosString = getPosString(oilRigPos, this.rpInstance, false, false);
                    const eventText = lm.getIntl(language, 'inGameEvent-ch47HeavyScientistsCalled', {
                        rig: oilRigName,
                        location: oilRigPosString
                    });
                    if (!this.firstPoll) this.rpInstance.sendEventNotification('ch47HeavyScientistsCalled', eventText);

                    this.oilRigLockedCrateUnlockedTimeoutIds[marker.id] = setTimeout(
                        this.notifyOilRigLockedCrateUnlocked.bind(this),
                        gInstance.serverInfoMap[this.rpInstance.serverId].oilRigLockedCrateUnlockTimeMs,
                        marker.id, oilRigName, oilRigPosString
                    );

                    const now = new Date()
                    this.timeSinceSmallOilRigWasTriggered = smallOilRig ? now : this.timeSinceSmallOilRigWasTriggered;
                    this.timeSinceLargeOilRigWasTriggered = largeOilRig ? now : this.timeSinceLargeOilRigWasTriggered;
                }
            }
            else {
                const ch47Pos = getPos(marker.x, marker.y, this.rpInstance);
                if (ch47Pos) {
                    const ch47PosString = getPosString(ch47Pos, this.rpInstance, false, true);
                    const phrase = 'inGameEvent-ch47Spawned' + (this.firstPoll ? '-located' :
                        (isOutsideGridSystem(marker.x, marker.y, mapSize) ? '-enters' : ''));
                    const eventText = lm.getIntl(language, phrase, { location: ch47PosString });
                    this.rpInstance.sendEventNotification('ch47Spawned', eventText);
                }
            }

            this.ch47s.push(marker);
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            if (this.oilRigCh47s.includes(marker.id)) {
                this.oilRigCh47s = this.oilRigCh47s.filter(e => e !== marker.id);
                continue;
            }

            const ch47Pos = getPos(marker.x, marker.y, this.rpInstance);
            if (ch47Pos) {
                const ch47PosString = getPosString(ch47Pos, this.rpInstance, false, true);
                const phrase = 'inGameEvent-ch47Despawned' +
                    (!isOutsideGridSystem(marker.x, marker.y, mapSize) ? '-destroyed' : '');
                const eventText = lm.getIntl(language, phrase, { location: ch47PosString });
                this.rpInstance.sendEventNotification('ch47Despawned', eventText);
            }

            this.ch47LockedCrateNotified = this.ch47LockedCrateNotified.filter(e => e !== marker.id);
            this.ch47s = this.ch47s.filter(e => e.id !== marker.id);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const ch47 = this.ch47s.find(e => e.id === marker.id) as rp.AppMarker;
            if (this.oilRigCh47s.includes(marker.id)) {
                Object.assign(ch47, marker);
                continue;
            }

            const minDistanceInside = 100;
            const maxDifference = 2;

            const prevClosestMonument = this.rpInstance.rpMap.getClosestMonument({ x: ch47.x, y: ch47.y });
            const closestMonument = this.rpInstance.rpMap.getClosestMonument({ x: marker.x, y: marker.y });
            const prevDistance = getDistance(ch47.x, ch47.y, prevClosestMonument.x, prevClosestMonument.y);
            const distance = getDistance(marker.x, marker.y, closestMonument.x, closestMonument.y);

            const difference = Math.abs(prevDistance - distance);
            const validMonument = VALID_LOCKED_CRATE_MONUMENTS.includes(closestMonument.token);
            const notified = this.ch47LockedCrateNotified.includes(marker.id);

            if (prevClosestMonument.token === closestMonument.token && validMonument && !notified &&
                distance <= minDistanceInside && difference <= maxDifference) {
                const monumentName = lm.getIntl(language, `monumentName-${closestMonument.token}`);
                const gridPos = getGridPos(closestMonument.x, closestMonument.y, mapSize) as string;
                const eventText = lm.getIntl(language, 'inGameEvent-ch47MaybeDroppedLockedCrate', {
                    monument: monumentName,
                    grid: gridPos
                });
                this.rpInstance.sendEventNotification('ch47MaybeDroppedLockedCrate', eventText);
                this.ch47LockedCrateNotified.push(marker.id);
            }
            else if (prevClosestMonument.token !== closestMonument.token && notified) {
                this.ch47LockedCrateNotified = this.ch47LockedCrateNotified.filter(e => e !== marker.id);
            }

            Object.assign(ch47, marker);
        }
    }

    private updateCargoShips(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.CargoShip;
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        if (!this.rpInstance.rpMap || !this.rpInstance.rpInfo) return;

        const mapSize = this.rpInstance.rpInfo.appInfo.mapSize;
        const numberOfGrids = Math.floor(mapSize / constants.GRID_DIAMETER);
        const gridDiameter = mapSize / numberOfGrids;

        /* Markers that are new. */
        for (const marker of newMarkers) {
            this.cargoShipMetaData[marker.id] = {
                lockedCrateSpawnCounter: 0,
                harborsDocked: [],
                dockingStatus: null,
                isLeaving: false,
                prevPoint: null,
                isDepartureCertain: true
            };

            const offset = 4 * gridDiameter;
            const isOutside = isOutsideGridSystem(marker.x, marker.y, mapSize, offset);

            const cargoShipPos = getPos(marker.x, marker.y, this.rpInstance) as Position;
            const cargoShipPosString = getPosString(cargoShipPos, this.rpInstance, false, true);

            const phrase = 'inGameEvent-cargoShipSpawned' + (this.firstPoll ? '-located' :
                (isOutside ? '-enters' : ''));
            const eventText = lm.getIntl(language, phrase, { location: cargoShipPosString });
            this.rpInstance.sendEventNotification('cargoShipSpawned', eventText);

            /* Needs to be added before notifying about spawned locked crate */
            this.cargoShips.push(marker);

            if (!this.firstPoll) {
                this.cargoShipEgressTimeoutIds[marker.id] = new Timer(
                    this.notifyCargoShipEgress.bind(this, marker.id),
                    gInstance.serverInfoMap[this.rpInstance.serverId].cargoShipEgressTimeMs
                );
                (this.cargoShipEgressTimeoutIds[marker.id] as Timer).start();

                this.notifyCargoShipLockedCrateSpawn(marker.id);
                this.cargoShipLockedCrateSpawnIntervalIds[marker.id] = setInterval(
                    this.notifyCargoShipLockedCrateSpawn.bind(this, marker.id),
                    CARGO_SHIP_LOOT_ROUNDS_SPACING_MS
                );
            }
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            const cargoShipPos = getPos(marker.x, marker.y, this.rpInstance) as Position;
            const cargoShipPosString = getPosString(cargoShipPos, this.rpInstance, false, true);

            const phrase = 'inGameEvent-cargoShipDespawned';
            const eventText = lm.getIntl(language, phrase, { location: cargoShipPosString });
            this.rpInstance.sendEventNotification('cargoShipDespawned', eventText);

            if (Object.hasOwn(this.cargoShipEgressTimeoutIds, marker.id)) {
                this.cargoShipEgressTimeoutIds[marker.id]?.stop();
                delete this.cargoShipEgressTimeoutIds[marker.id];
            }
            if (Object.hasOwn(this.cargoShipEgressAfterHarbor1TimeoutIds, marker.id)) {
                this.cargoShipEgressAfterHarbor1TimeoutIds[marker.id]?.stop();
                delete this.cargoShipEgressAfterHarbor1TimeoutIds[marker.id];
            }
            if (Object.hasOwn(this.cargoShipEgressAfterHarbor2TimeoutIds, marker.id)) {
                this.cargoShipEgressAfterHarbor2TimeoutIds[marker.id]?.stop();
                delete this.cargoShipEgressAfterHarbor2TimeoutIds[marker.id];
            }
            if (Object.hasOwn(this.cargoShipLockedCrateSpawnIntervalIds, marker.id)) {
                clearInterval(this.cargoShipLockedCrateSpawnIntervalIds[marker.id] ?? undefined);
                delete this.cargoShipLockedCrateSpawnIntervalIds[marker.id];
            }
            if (Object.hasOwn(this.cargoShipUndockingNotificationTimeoutIds, marker.id)) {
                clearTimeout(this.cargoShipUndockingNotificationTimeoutIds[marker.id]);
                delete this.cargoShipUndockingNotificationTimeoutIds[marker.id];
            }

            delete this.cargoShipMetaData[marker.id];
            this.cargoShips = this.cargoShips.filter(e => e.id !== marker.id);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const cargoShip = this.cargoShips.find(e => e.id === marker.id) as rp.AppMarker;

            const harbor = this.rpInstance.rpMap.getClosestHarbor({ x: marker.x, y: marker.y });
            if (!harbor) {
                /* No harbor seem to exist on the map, continue */
                Object.assign(cargoShip, marker);
                continue;
            }

            const prevDist = getDistance(cargoShip.x, cargoShip.y, harbor.x, harbor.y);
            const currDist = getDistance(marker.x, marker.y, harbor.x, harbor.y);
            const harborAlreadyDocked = this.cargoShipMetaData[marker.id].harborsDocked.some(e =>
                e.x === harbor.x && e.y === harbor.y);
            const hasDockingStatus = this.cargoShipMetaData[marker.id].dockingStatus !== null;
            const allHarborsDocked = this.cargoShipMetaData[marker.id].harborsDocked.length ===
                this.rpInstance.rpMap.getNumberOfHarbors();
            const isStandingStill = cargoShip.x === marker.x && cargoShip.y === marker.y;
            const isLeaving = this.cargoShipMetaData[marker.id].isLeaving;
            const harborName = lm.getIntl(language, `monumentName-${harbor.token}`);
            const harborGridPos = getGridPos(harbor.x, harbor.y, mapSize);
            const prevPoint = this.cargoShipMetaData[marker.id].prevPoint;
            const isSameDir = prevPoint && isSameDirection(
                { x: prevPoint.x, y: prevPoint.y },
                { x: cargoShip.x, y: cargoShip.y },
                { x: marker.x, y: marker.y });
            const hasEgressTimer = Object.hasOwn(this.cargoShipEgressTimeoutIds, marker.id);
            const isOutside = isOutsideGridSystem(marker.x, marker.y, mapSize, 4 * gridDiameter);

            const startHarborApproach =
                prevDist > CARGO_SHIP_HARBOR_DOCKING_DISTANCE &&
                currDist <= CARGO_SHIP_HARBOR_DOCKING_DISTANCE &&
                !hasDockingStatus && !harborAlreadyDocked && !allHarborsDocked;

            const justDocked =
                (hasDockingStatus && this.cargoShipMetaData[marker.id].dockingStatus === DockingStatus.DOCKING &&
                    isStandingStill) || (!hasDockingStatus && isStandingStill);

            const startHarborDeparture =
                hasDockingStatus && this.cargoShipMetaData[marker.id].dockingStatus === DockingStatus.DOCKED &&
                !isStandingStill;

            const justUndocked =
                prevDist < CARGO_SHIP_HARBOR_UNDOCKED_DISTANCE &&
                currDist >= CARGO_SHIP_HARBOR_UNDOCKED_DISTANCE &&
                hasDockingStatus && (this.cargoShipMetaData[marker.id].dockingStatus === DockingStatus.DOCKING ||
                    this.cargoShipMetaData[marker.id].dockingStatus === DockingStatus.UNDOCKING);

            const startLeavingMap = !isLeaving && isSameDir && !hasEgressTimer && isOutside;

            if (startHarborApproach) {
                this.cargoShipMetaData[marker.id].dockingStatus = DockingStatus.DOCKING;

                const eventText = lm.getIntl(language, 'inGameEvent-cargoShipDocking', {
                    location: harborName,
                    grid: harborGridPos as string
                });
                this.rpInstance.sendEventNotification('cargoShipDocking', eventText);
            }
            else if (justDocked) {
                this.cargoShipMetaData[marker.id].dockingStatus = DockingStatus.DOCKED;
                this.cargoShipMetaData[marker.id].harborsDocked.push({ x: harbor.x, y: harbor.y });

                const eventText = lm.getIntl(language, 'inGameEvent-cargoShipDocked', {
                    location: harborName,
                    grid: harborGridPos as string
                });
                this.rpInstance.sendEventNotification('cargoShipDocked', eventText);

                /* Notify 1 min (+10 seconds) before undocking */
                this.cargoShipUndockingNotificationTimeoutIds[marker.id] = setTimeout(
                    this.notifyCargoShipUndockingSoon.bind(this, marker.id, mapSize),
                    CARGO_SHIP_HARBOR_DOCKING_TIME_MS - (60 * 1000 + 10 * 1000)
                );
            }
            else if (startHarborDeparture) {
                this.cargoShipMetaData[marker.id].dockingStatus = DockingStatus.UNDOCKING;

                const eventText = lm.getIntl(language, 'inGameEvent-cargoShipUndocking', {
                    location: harborName,
                    grid: harborGridPos as string
                });
                this.rpInstance.sendEventNotification('cargoShipUndocking', eventText);

                if (Object.hasOwn(this.cargoShipUndockingNotificationTimeoutIds, marker.id)) {
                    clearTimeout(this.cargoShipUndockingNotificationTimeoutIds[marker.id]);
                    delete this.cargoShipUndockingNotificationTimeoutIds[marker.id];
                }
            }
            else if (justUndocked) {
                if (Object.hasOwn(this.cargoShipEgressTimeoutIds, marker.id) && allHarborsDocked &&
                    this.cargoShipMetaData[marker.id].dockingStatus === DockingStatus.UNDOCKING) {
                    const timeLeftMs = this.cargoShipEgressTimeoutIds[marker.id].getTimeLeftMs();

                    if (timeLeftMs < CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS) {
                        this.cargoShipEgressTimeoutIds[marker.id]?.stop();

                        this.cargoShipEgressAfterHarbor1TimeoutIds[marker.id] = new Timer(
                            this.notifyCargoShipEgressAfterHarbor.bind(this, marker.id, true),
                            CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS
                        );
                        (this.cargoShipEgressAfterHarbor1TimeoutIds[marker.id] as Timer).start();
                    }

                    if (timeLeftMs < CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS ||
                        (timeLeftMs >= CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS &&
                            timeLeftMs < CARGO_SHIP_LEAVE_AFTER_HARBOR_WITH_CRATES_MS)) {
                        this.cargoShipEgressAfterHarbor2TimeoutIds[marker.id] = new Timer(
                            this.notifyCargoShipEgressAfterHarbor.bind(this, marker.id, false),
                            CARGO_SHIP_LEAVE_AFTER_HARBOR_WITH_CRATES_MS
                        );
                        (this.cargoShipEgressAfterHarbor2TimeoutIds[marker.id] as Timer).start();

                        this.cargoShipMetaData[marker.id].isDepartureCertain = false;
                    }

                    const timeLeftMin = Math.floor((timeLeftMs / 1000) / 60).toFixed(1);

                    let phrase = '';
                    const param: { [key: string]: string } = {};
                    if (timeLeftMs < CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS) {
                        phrase = 'inGameEvent-cargoShipLeaving-soon';
                        param['first'] = '2';
                        param['second'] = '19.5';
                    }
                    else if (timeLeftMs >= CARGO_SHIP_LEAVE_AFTER_HARBOR_NO_CRATES_MS &&
                        timeLeftMs < CARGO_SHIP_LEAVE_AFTER_HARBOR_WITH_CRATES_MS) {
                        phrase = 'inGameEvent-cargoShipLeaving-soon';
                        param['first'] = `${timeLeftMin}`;
                        param['second'] = '19.5';
                    }
                    else {
                        phrase = 'inGameEvent-cargoShipLeaving-inTime';
                        param['min'] = `${timeLeftMin}`;
                    }

                    const eventText = lm.getIntl(language, phrase, param);
                    this.rpInstance.sendEventNotification('cargoShipLeaving', eventText);
                }

                this.cargoShipMetaData[marker.id].dockingStatus = null;
            }
            else if (startLeavingMap) {
                this.cargoShipMetaData[marker.id].isLeaving = true;

                const cargoShipPos = getPos(marker.x, marker.y, this.rpInstance);
                if (cargoShipPos) {
                    const cargoShipPosString = getPosString(cargoShipPos, this.rpInstance, false, false);
                    const phrase = 'inGameEvent-cargoShipLeaving';
                    const eventText = lm.getIntl(language, phrase, { location: cargoShipPosString });
                    this.rpInstance.sendEventNotification('cargoShipLeaving', eventText);
                }
            }

            this.cargoShipMetaData[marker.id].prevPoint = { x: cargoShip.x, y: cargoShip.y };
            Object.assign(cargoShip, marker);
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateCrates(mapMarkers: rp.AppMapMarkers) {
        /* No longer used in Rust+ */
    }

    private updateGenericRadii(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.GenericRadius;
        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        /* Markers that are new. */
        for (const marker of newMarkers) {
            this.genericRadii.push(marker);
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            this.genericRadii = this.genericRadii.filter(e => e.id !== marker.id);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const genericRadius = this.genericRadii.find(e => e.id === marker.id) as rp.AppMarker;
            Object.assign(genericRadius, marker);
        }
    }

    private updatePatrolHelicopters(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.PatrolHelicopter;
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        if (!this.rpInstance.rpMap || !this.rpInstance.rpInfo) return;

        const mapSize = this.rpInstance.rpInfo.appInfo.mapSize;
        const numberOfGrids = Math.floor(mapSize / constants.GRID_DIAMETER);
        const gridDiameter = mapSize / numberOfGrids;

        /* Markers that are new. */
        for (const marker of newMarkers) {
            this.patrolHelicopterMetaData[marker.id] = {
                prevPoint: null,
                isLeaving: false
            }

            const offset = 4 * gridDiameter;
            const isOutside = isOutsideGridSystem(marker.x, marker.y, mapSize, offset);

            const patrolHelicopterPos = getPos(marker.x, marker.y, this.rpInstance) as Position;
            const patrolHelicopterPosString = getPosString(patrolHelicopterPos, this.rpInstance, false, true);

            const phrase = 'inGameEvent-patrolHelicopterSpawned' + (this.firstPoll ? '-located' :
                (isOutside ? '-enters' : ''));
            const eventText = lm.getIntl(language, phrase, { location: patrolHelicopterPosString });
            this.rpInstance.sendEventNotification('patrolHelicopterSpawned', eventText);

            this.patrolHelicopters.push(marker);
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            const isOutside = isOutsideGridSystem(marker.x, marker.y, mapSize);
            const phrase = 'inGameEvent-patrolHelicopter' + (isOutside ? 'Despawned' : 'Destroyed');
            const settingsKey = 'patrolHelicopter' + (isOutside ? 'Despawned' : 'Destroyed');

            const patrolHelicopterPos = getPos(marker.x, marker.y, this.rpInstance);
            if (patrolHelicopterPos) {
                const patrolHelicopterPosString = getPosString(patrolHelicopterPos, this.rpInstance, false, true);
                const eventText = lm.getIntl(language, phrase, { location: patrolHelicopterPosString });
                this.rpInstance.sendEventNotification(settingsKey as keyof EventNotificationSettings, eventText);
            }

            delete this.patrolHelicopterMetaData[marker.id];
            this.patrolHelicopters = this.patrolHelicopters.filter(e => e.id !== marker.id);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const patrolHelicopter = this.patrolHelicopters.find(e => e.id === marker.id) as rp.AppMarker;

            if (this.patrolHelicopterMetaData[marker.id].prevPoint !== null) {
                const prevPoint = this.patrolHelicopterMetaData[marker.id].prevPoint as Point;
                const prevDist = getDistance(prevPoint.x, prevPoint.y, patrolHelicopter.x, patrolHelicopter.y);
                const currDist = getDistance(patrolHelicopter.x, patrolHelicopter.y, marker.x, marker.y);
                const isLeaving = this.patrolHelicopterMetaData[marker.id].isLeaving;
                const isSameDir = isSameDirection(prevPoint,
                    { x: patrolHelicopter.x, y: patrolHelicopter.y },
                    { x: marker.x, y: marker.y }
                );

                const startLeavingMap =
                    prevDist >= PATROL_HELICOPTER_LEAVING_SPEED_MIN &&
                    currDist >= PATROL_HELICOPTER_LEAVING_SPEED_MIN &&
                    isSameDir && !isLeaving;

                if (startLeavingMap) {
                    this.patrolHelicopterMetaData[marker.id].isLeaving = true;

                    const patrolHelicopterPos = getPos(marker.x, marker.y, this.rpInstance);
                    if (patrolHelicopterPos) {
                        const patrolHelicopterPosString = getPosString(
                            patrolHelicopterPos, this.rpInstance, false, true);
                        const direction = getAngleBetweenPoints(prevPoint.x, prevPoint.y, marker.x, marker.y);
                        const eventText = lm.getIntl(language, 'inGameEvent-patrolHelicopterLeaving', {
                            location: patrolHelicopterPosString,
                            direction: `${direction}`
                        });
                        this.rpInstance.sendEventNotification('cargoShipDocking', eventText);
                    }
                }
            }

            this.patrolHelicopterMetaData[marker.id].prevPoint = { x: patrolHelicopter.x, y: patrolHelicopter.y };
            Object.assign(patrolHelicopter, marker);
        }
    }

    private updateTravellingVendors(mapMarkers: rp.AppMapMarkers) {
        const type = rp.AppMarkerType.TravellingVendor;
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        /* Markers that are new. */
        for (const marker of newMarkers) {
            const travellingVendorPos = getPos(marker.x, marker.y, this.rpInstance) as Position;
            const travellingVendorPosString = getPosString(travellingVendorPos, this.rpInstance, false, true);

            const phrase = 'inGameEvent-travellingVendorSpawned' + (this.firstPoll ? '-located' : '');
            const eventText = lm.getIntl(language, phrase, { location: travellingVendorPosString });
            this.rpInstance.sendEventNotification('travellingVendorSpawned', eventText);

            /* Notify 5 min before leaving */
            this.travellingVendorLeavingNotificationTimeoutIds[marker.id] = setTimeout(
                this.notifyTravellingVendorLeavingSoon.bind(this, marker.id),
                TRAVELLING_VENDOR_ACTIVE_TIME_MS - (5 * 60 * 1000)
            );

            this.travellingVendors.push(marker);
        }

        /* Markers that have left. */
        for (const marker of leftMarkers) {
            const travellingVendorPos = getPos(marker.x, marker.y, this.rpInstance) as Position;
            const travellingVendorPosString = getPosString(travellingVendorPos, this.rpInstance, false, true);

            const phrase = 'inGameEvent-travellingVendorDespawned';
            const eventText = lm.getIntl(language, phrase, { location: travellingVendorPosString });
            this.rpInstance.sendEventNotification('travellingVendorDespawned', eventText);

            if (Object.hasOwn(this.travellingVendorLeavingNotificationTimeoutIds, marker.id)) {
                clearTimeout(this.travellingVendorLeavingNotificationTimeoutIds[marker.id]);
                delete this.travellingVendorLeavingNotificationTimeoutIds[marker.id];
            }

            this.travellingVendors = this.travellingVendors.filter(e => e.id !== marker.id);
        }

        /* Markers that still remains. */
        for (const marker of remainingMarkers) {
            const travellingVendor = this.travellingVendors.find(e => e.id === marker.id) as rp.AppMarker;
            Object.assign(travellingVendor, marker);
        }
    }


    /**
     * Helper methods
     */

    private getMarkers(type: rp.AppMarkerType): rp.AppMarker[] {
        switch (type) {
            case rp.AppMarkerType.Undefined: return this.undefineds;
            case rp.AppMarkerType.Player: return this.players;
            case rp.AppMarkerType.Explosion: return this.explosions;
            case rp.AppMarkerType.VendingMachine: return this.vendingMachines;
            case rp.AppMarkerType.CH47: return this.ch47s;
            case rp.AppMarkerType.CargoShip: return this.cargoShips;
            case rp.AppMarkerType.Crate: return this.crates;
            case rp.AppMarkerType.GenericRadius: return this.genericRadii;
            case rp.AppMarkerType.PatrolHelicopter: return this.patrolHelicopters;
            case rp.AppMarkerType.TravellingVendor: return this.travellingVendors;
        }
    }

    private getMarkersOfType(type: rp.AppMarkerType, markers: rp.AppMarker[]) {
        const markersOfType: rp.AppMarker[] = [];
        for (const marker of markers) {
            if (marker.type === type) {
                markersOfType.push(marker);
            }
        }
        return markersOfType;
    }

    private getMarkersOfTypeById(type: rp.AppMarkerType, id: number): rp.AppMarker {
        return this.getMarkers(type).find(e => e.id === id) as rp.AppMarker;
    }

    private getNewMarkersById(type: rp.AppMarkerType, markers: rp.AppMarker[]) {
        const newMarkers: rp.AppMarker[] = [];
        for (const marker of this.getMarkersOfType(type, markers)) {
            if (!this.getMarkers(type).some(e => e.id === marker.id)) {
                newMarkers.push(marker);
            }
        }
        return newMarkers;
    }

    private getLeftMarkersById(type: rp.AppMarkerType, markers: rp.AppMarker[]) {
        let leftMarkers: rp.AppMarker[] = this.getMarkers(type).slice();
        for (const marker of this.getMarkersOfType(type, markers)) {
            if (this.getMarkers(type).some(e => e.id === marker.id)) {
                leftMarkers = leftMarkers.filter(e => e.id !== marker.id);
            }
        }
        return leftMarkers;
    }

    private getRemainingMarkersById(type: rp.AppMarkerType, markers: rp.AppMarker[]) {
        const remainingMarkers: rp.AppMarker[] = [];
        for (const marker of this.getMarkersOfType(type, markers)) {
            if (this.getMarkers(type).some(e => e.id === marker.id)) {
                remainingMarkers.push(marker);
            }
        }
        return remainingMarkers;
    }

    /**
     * Timeout notification methods
     */

    private notifyOilRigLockedCrateUnlocked(ch47: number, oilRigName: string, location: string) {
        clearTimeout(this.oilRigLockedCrateUnlockedTimeoutIds[ch47]);
        delete this.oilRigLockedCrateUnlockedTimeoutIds[ch47];

        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const eventText = lm.getIntl(language, 'inGameEvent-ch47OilRigLockedCrateUnlocked', {
            rig: oilRigName,
            location: location
        });
        this.rpInstance.sendEventNotification('ch47OilRigLockedCrateUnlocked', eventText);
    }

    private notifyCargoShipEgress(cargoShipId: number) {
        this.cargoShipEgressTimeoutIds[cargoShipId]?.stop();

        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        if (!this.rpInstance.rpMap || !this.rpInstance.rpInfo) return;

        const allHarborsDocked = this.cargoShipMetaData[cargoShipId].harborsDocked.length ===
            this.rpInstance.rpMap.getNumberOfHarbors();
        const hasDockingStatus = this.cargoShipMetaData[cargoShipId].dockingStatus !== null;

        if (allHarborsDocked && !hasDockingStatus) {
            const cargoShip = this.cargoShips.find(e => e.id === cargoShipId);
            if (!cargoShip) return;

            const cargoShipPos = getPos(cargoShip.x, cargoShip.y, this.rpInstance);
            if (cargoShipPos) {
                const isDepartureCertain = this.cargoShipMetaData[cargoShipId].isDepartureCertain;
                const cargoShipPosString = getPosString(cargoShipPos, this.rpInstance, false, true);
                const phrase = 'inGameEvent-cargoShipLeaving' + (isDepartureCertain ? '' : '-maybe');
                const eventText = lm.getIntl(language, phrase, { location: cargoShipPosString });
                this.rpInstance.sendEventNotification('cargoShipLeaving', eventText);
            }
        }
    }

    private notifyCargoShipEgressAfterHarbor(cargoShipId: number, firstTimer: boolean) {
        if (firstTimer) {
            this.cargoShipEgressAfterHarbor1TimeoutIds[cargoShipId]?.stop();
        }
        else {
            this.cargoShipEgressAfterHarbor2TimeoutIds[cargoShipId]?.stop();
        }

        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        if (!this.rpInstance.rpMap || !this.rpInstance.rpInfo) return;

        const cargoShip = this.cargoShips.find(e => e.id === cargoShipId);
        if (!cargoShip) return;

        const cargoShipPos = getPos(cargoShip.x, cargoShip.y, this.rpInstance);
        if (cargoShipPos) {
            const cargoShipPosString = getPosString(cargoShipPos, this.rpInstance, false, true);
            const phrase = 'inGameEvent-cargoShipLeaving' + (firstTimer ? '-noLockedCratesLeft' : '');
            const eventText = lm.getIntl(language, phrase, { location: cargoShipPosString });
            this.rpInstance.sendEventNotification('cargoShipLeaving', eventText);
        }
    }

    private notifyCargoShipLockedCrateSpawn(cargoShipId: number) {
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        this.cargoShipMetaData[cargoShipId].lockedCrateSpawnCounter++;

        const cargoShip = this.cargoShips.find(e => e.id === cargoShipId);
        if (!cargoShip) return;

        const cargoShipPos = getPos(cargoShip.x, cargoShip.y, this.rpInstance);
        if (cargoShipPos) {
            const cargoShipPosString = getPosString(cargoShipPos, this.rpInstance, false, true);
            const phrase = 'inGameEvent-cargoShipLockedCrateSpawned';
            const eventText = lm.getIntl(language, phrase, { location: cargoShipPosString });
            this.rpInstance.sendEventNotification('cargoShipLockedCrateSpawned', eventText);
        }

        if (this.cargoShipMetaData[cargoShipId].lockedCrateSpawnCounter === CARGO_SHIP_LOOT_ROUNDS) {
            clearInterval(this.cargoShipLockedCrateSpawnIntervalIds[cargoShipId]);
            delete this.cargoShipLockedCrateSpawnIntervalIds[cargoShipId];
        }
    }

    private notifyCargoShipUndockingSoon(cargoShipId: number, mapSize: number) {
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const cargoShip = this.cargoShips.find(e => e.id === cargoShipId);
        if (!cargoShip) return;

        const harbor = this.rpInstance.rpMap?.getClosestHarbor({ x: cargoShip.x, y: cargoShip.y });
        if (!harbor) return;

        const harborName = lm.getIntl(language, `monumentName-${harbor.token}`);
        const harborGridPos = getGridPos(harbor.x, harbor.y, mapSize);

        const eventText = lm.getIntl(language, 'inGameEvent-cargoShipUndocking-soon', {
            location: harborName,
            grid: harborGridPos as string
        });
        this.rpInstance.sendEventNotification('cargoShipUndocking', eventText);

        if (Object.hasOwn(this.cargoShipUndockingNotificationTimeoutIds, cargoShipId)) {
            clearTimeout(this.cargoShipUndockingNotificationTimeoutIds[cargoShipId]);
            delete this.cargoShipUndockingNotificationTimeoutIds[cargoShipId];
        }
    }

    private notifyTravellingVendorLeavingSoon(travellingVendorId: number) {
        const gInstance = gim.getGuildInstance(this.rpInstance.guildId) as GuildInstance;
        const language = gInstance.generalSettings.language;

        const travellingVendor = this.travellingVendors.find(e => e.id === travellingVendorId);
        if (!travellingVendor) return;

        const travellingVendorPos = getPos(travellingVendor.x, travellingVendor.y, this.rpInstance);
        if (travellingVendorPos) {
            const travellingVendorPosString = getPosString(travellingVendorPos, this.rpInstance, false, true);
            const phrase = 'inGameEvent-travellingVendorDespawned-soon';
            const eventText = lm.getIntl(language, phrase, { location: travellingVendorPosString });
            this.rpInstance.sendEventNotification('travellingVendorDespawned', eventText);
        }

        if (Object.hasOwn(this.travellingVendorLeavingNotificationTimeoutIds, travellingVendorId)) {
            clearTimeout(this.travellingVendorLeavingNotificationTimeoutIds[travellingVendorId]);
            delete this.travellingVendorLeavingNotificationTimeoutIds[travellingVendorId];
        }
    }
}