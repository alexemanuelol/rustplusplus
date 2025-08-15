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
import { getDistance, getGridPos, getPos, getPosString, isOutsideGridSystem } from '../utils/map';
import { GuildInstance } from '../managers/guildInstanceManager';
import { Point } from './rustPlusMap';
import * as constants from '../utils/constants';

const VALID_LOCKED_CRATE_MONUMENTS: string[] = [
    'airfield_display_name',
    'dome_monument_name',
    'power_plant_display_name',
    'train_yard_display_name',
    'water_treatment_plant_display_name'
];

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

    public timeSinceSmallOilRigWasTriggered: Date | null;
    public timeSinceLargeOilRigWasTriggered: Date | null;

    public knownVendingMachines: Point[];
    public oilRigCh47s: number[];
    public ch47LockedCrateNotified: number[];

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

        /* Event dates */
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;

        this.knownVendingMachines = [];
        this.oilRigCh47s = [];
        this.ch47LockedCrateNotified = [];

        this.updateMapMarkers(appMapMarkers);
        this.firstPoll = false;
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
            const player = this.players.find(e => e.id === marker.id);
            if (player) Object.assign(player, marker);
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
            const vendingMachine = this.vendingMachines.find(e => e.x === marker.x && e.y === marker.y);
            if (vendingMachine) Object.assign(vendingMachine, marker);
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
                const mapSize = this.rpInstance.rpInfo.appInfo.mapSize;
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
            const mapSize = this.rpInstance.rpInfo.appInfo.mapSize;
            if (ch47Pos) {
                const ch47PosString = getPosString(ch47Pos, this.rpInstance, false, true);
                const phrase = 'inGameEvent-ch47Despawned' +
                    (!isOutsideGridSystem(marker.x, marker.y, mapSize) ? '-destroyed' : '');
                const eventText = lm.getIntl(language, phrase, { location: ch47PosString });
                this.rpInstance.sendEventNotification('ch47Despawned', eventText);
            }

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
                const mapSize = this.rpInstance.rpInfo.appInfo.mapSize;
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

            if (ch47) Object.assign(ch47, marker);
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateCargoShips(mapMarkers: rp.AppMapMarkers) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateCrates(mapMarkers: rp.AppMapMarkers) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateGenericRadii(mapMarkers: rp.AppMapMarkers) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updatePatrolHelicopters(mapMarkers: rp.AppMapMarkers) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateTravellingVendors(mapMarkers: rp.AppMapMarkers) {

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
}