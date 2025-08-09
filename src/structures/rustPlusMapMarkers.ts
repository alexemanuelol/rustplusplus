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

import { RustPlusInstance } from '../managers/rustPlusManager';

export class RustPlusMapMarkers {
    public rpInstance: RustPlusInstance;
    public appMapMarkers: rp.AppMapMarkers;

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

    constructor(rpInstance: RustPlusInstance, appMapMarkers: rp.AppMapMarkers) {
        this.rpInstance = rpInstance;
        this.appMapMarkers = appMapMarkers;

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

        this.updateMapMarkers(appMapMarkers, false);
    }


    /**
     * Update methods
     */

    public updateMapMarkers(appMapMarkers: rp.AppMapMarkers, notify: boolean = true) {
        this.updateUndefineds(appMapMarkers, notify);
        this.updatePlayers(appMapMarkers, notify);
        this.updateExplosions(appMapMarkers, notify);
        this.updateVendingMachines(appMapMarkers, notify);
        this.updateCh47s(appMapMarkers, notify);
        this.updateCargoShips(appMapMarkers, notify);
        this.updateCrates(appMapMarkers, notify);
        this.updateGenericRadii(appMapMarkers, notify);
        this.updatePatrolHelicopters(appMapMarkers, notify);
        this.updateTravellingVendors(appMapMarkers, notify);

        this.appMapMarkers = appMapMarkers;
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateUndefineds(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {
        /* Not used */
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updatePlayers(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {
        const type = rp.AppMarkerType.Player;
        const newMarkers = this.getNewMarkersById(type, mapMarkers.markers);
        const leftMarkers = this.getLeftMarkersById(type, mapMarkers.markers);
        const remainingMarkers = this.getRemainingMarkersById(type, mapMarkers.markers);

        /* Markers that are new. */
        for (const marker of newMarkers) {
            this.players.push(marker);
        }

        /* Player markers that have left. */
        for (const marker of leftMarkers) {
            this.players = this.players.filter(e => e.id !== marker.id);
        }

        /* Player markers that still remains. */
        for (const marker of remainingMarkers) {
            const player = this.getMarkersOfTypeById(type, marker.id);

            player.x = marker.x;
            player.y = marker.y;
        }
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateExplosions(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {
        /* No longer used in Rust+ */
    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateVendingMachines(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateCh47s(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateCargoShips(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateCrates(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateGenericRadii(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updatePatrolHelicopters(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

    }

    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    private updateTravellingVendors(mapMarkers: rp.AppMapMarkers, notify: boolean = true) {

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

}