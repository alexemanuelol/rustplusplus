/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import * as fs from 'fs';
import * as path from 'path';
import * as jimp from 'jimp';
const Gm = require('gm');

import { client, localeManager as lm } from "../../index";
import * as guildInstance from '../util/guild-instance';
import * as constants from '../util/constants';
const { RustPlus } = require('./RustPlus');
const Config = require('../../config');

export interface MapResponseData {
    width: number;
    height: number;
    jpgImage: string;
    oceanMargin: number;
    monuments: Monument[];
    background: string;
}

export interface Monument {
    token: string;
    x: number;
    y: number;
}

export interface MapMarkerImageMeta {
    map: MapMarkerImageMetaData;
    player: MapMarkerImageMetaData;
    shop: MapMarkerImageMetaData;
    chinook: MapMarkerImageMetaData;
    cargo: MapMarkerImageMetaData;
    blade: MapMarkerImageMetaData;
    heli: MapMarkerImageMetaData;
    tunnels: MapMarkerImageMetaData;
    tunnels_link: MapMarkerImageMetaData;
}

export interface MapMarkerImageMetaData {
    image: string;
    size: number | null;
    type: number | null;
    jimp: any
}

export interface MonumentInfo {
    AbandonedMilitaryBase: MonumentInfoData;
    airfield_display_name: MonumentInfoData;
    arctic_base_a: MonumentInfoData;
    bandit_camp: MonumentInfoData;
    dome_monument_name: MonumentInfoData;
    excavator: MonumentInfoData;
    ferryterminal: MonumentInfoData;
    fishing_village_display_name: MonumentInfoData;
    gas_station: MonumentInfoData;
    harbor_2_display_name: MonumentInfoData;
    harbor_display_name: MonumentInfoData;
    junkyard_display_name: MonumentInfoData;
    large_fishing_village_display_name: MonumentInfoData;
    large_oil_rig: MonumentInfoData;
    launchsite: MonumentInfoData;
    lighthouse_display_name: MonumentInfoData;
    military_tunnels_display_name: MonumentInfoData;
    mining_outpost_display_name: MonumentInfoData;
    missile_silo_monument: MonumentInfoData;
    mining_quarry_hqm_display_name: MonumentInfoData;
    mining_quarry_stone_display_name: MonumentInfoData;
    mining_quarry_sulfur_display_name: MonumentInfoData;
    oil_rig_small: MonumentInfoData;
    outpost: MonumentInfoData;
    power_plant_display_name: MonumentInfoData;
    satellite_dish_display_name: MonumentInfoData;
    sewer_display_name: MonumentInfoData;
    stables_a: MonumentInfoData;
    stables_b: MonumentInfoData;
    supermarket: MonumentInfoData;
    swamp_c: MonumentInfoData;
    train_tunnel_display_name: MonumentInfoData;
    train_tunnel_link_display_name: MonumentInfoData;
    train_yard_display_name: MonumentInfoData;
    underwater_lab: MonumentInfoData;
    water_treatment_plant_display_name: MonumentInfoData;
}

export interface MonumentInfoData {
    clean: string;
    map: string;
    radius: number;
}

export interface Point {
    x: number;
    y: number;
}

export class Map {
    private _width: number;
    private _height: number;
    private _jpgImage: string;
    private _oceanMargin: number;
    private _monuments: Monument[];
    private _background: string;

    private _rustplus: typeof RustPlus;

    private _font: any; // jimp.Font but its not working for some reason
    private _mapMarkerImageMeta: MapMarkerImageMeta;
    private _monumentInfo: MonumentInfo;

    constructor(rustplus: typeof RustPlus, map: MapResponseData) {
        const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
        const language = instance.generalSettings.language;

        this._width = map.width;
        this._height = map.height;
        this._jpgImage = map.jpgImage;
        this._oceanMargin = map.oceanMargin;
        this._monuments = map.monuments;
        this._background = map.background;

        this._rustplus = rustplus;

        this._font = null;
        this._mapMarkerImageMeta = {
            map: {
                image: path.join(__dirname, '..', '..', `maps/${this.rustplus.guildId}_map_clean.png`),
                size: null, type: null, jimp: null
            },
            player: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/player.png'), size: 20, type: 1, jimp: null
            },
            shop: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/shop.png'), size: 20, type: 3, jimp: null
            },
            chinook: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/chinook.png'), size: 50, type: 4, jimp: null
            },
            cargo: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/cargo.png'), size: 100, type: 5, jimp: null
            },
            blade: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/blade.png'), size: 25, type: 7, jimp: null
            },
            heli: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/heli.png'), size: 20, type: 8, jimp: null
            },
            tunnels: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/tunnels.png'), size: 35, type: 9, jimp: null
            },
            tunnels_link: {
                image:
                    path.join(__dirname, '..', 'resources/images/markers/tunnels_link.png'), size: 35, type: 10,
                jimp: null
            }
        }
        this._monumentInfo = {
            AbandonedMilitaryBase: {
                clean: lm.getIntl(language, 'abandonedMilitaryBase'),
                map: lm.getIntl(language, 'abandonedMilitaryBase').toUpperCase(),
                radius: 46
            },
            airfield_display_name: {
                clean: lm.getIntl(language, 'airfield'),
                map: lm.getIntl(language, 'airfield').toUpperCase(),
                radius: 120
            },
            arctic_base_a: {
                clean: lm.getIntl(language, 'arcticResearchBase'),
                map: lm.getIntl(language, 'arcticResearchBase').toUpperCase(),
                radius: 64
            },
            bandit_camp: {
                clean: lm.getIntl(language, 'banditCamp'),
                map: lm.getIntl(language, 'banditCamp').toUpperCase(),
                radius: 82
            },
            dome_monument_name: {
                clean: lm.getIntl(language, 'theDome'),
                map: lm.getIntl(language, 'theDome').toUpperCase(),
                radius: 50
            },
            excavator: {
                clean: lm.getIntl(language, 'giantExcavatorPit'),
                map: lm.getIntl(language, 'giantExcavatorPit').toUpperCase(),
                radius: 110
            },
            ferryterminal: {
                clean: lm.getIntl(language, 'ferryTerminal'),
                map: lm.getIntl(language, 'ferryTerminal').toUpperCase(),
                radius: 88
            },
            fishing_village_display_name: {
                clean: lm.getIntl(language, 'fishingVillage'),
                map: lm.getIntl(language, 'fishingVillage').toUpperCase(),
                radius: 31
            },
            gas_station: {
                clean: lm.getIntl(language, 'oxumsGasStation'),
                map: lm.getIntl(language, 'oxumsGasStation').toUpperCase(),
                radius: 28
            },
            harbor_2_display_name: {
                clean: lm.getIntl(language, 'harbor'),
                map: lm.getIntl(language, 'harbor').toUpperCase(),
                radius: 96
            },
            harbor_display_name: {
                clean: lm.getIntl(language, 'harbor'),
                map: lm.getIntl(language, 'harbor').toUpperCase(),
                radius: 96
            },
            junkyard_display_name: {
                clean: lm.getIntl(language, 'junkyard'),
                map: lm.getIntl(language, 'junkyard').toUpperCase(),
                radius: 88
            },
            large_fishing_village_display_name: {
                clean: lm.getIntl(language, 'largeFishingVillage'),
                map: lm.getIntl(language, 'largeFishingVillage').toUpperCase(),
                radius: 40
            },
            large_oil_rig: {
                clean: lm.getIntl(language, 'largeOilRig'),
                map: lm.getIntl(language, 'largeOilRig').toUpperCase(),
                radius: 40
            },
            launchsite: {
                clean: lm.getIntl(language, 'launchSite'),
                map: lm.getIntl(language, 'launchSite').toUpperCase(),
                radius: 250
            },
            lighthouse_display_name: {
                clean: lm.getIntl(language, 'lighthouse'),
                map: lm.getIntl(language, 'lighthouse').toUpperCase(),
                radius: 28
            },
            military_tunnels_display_name: {
                clean: lm.getIntl(language, 'militaryTunnel'),
                map: lm.getIntl(language, 'militaryTunnel').toUpperCase(),
                radius: 122
            },
            mining_outpost_display_name: {
                clean: lm.getIntl(language, 'miningOutpost'),
                map: lm.getIntl(language, 'miningOutpost').toUpperCase(),
                radius: 17
            },
            missile_silo_monument: {
                clean: lm.getIntl(language, 'missileSilo'),
                map: lm.getIntl(language, 'missileSilo').toUpperCase(),
                radius: 81
            },
            mining_quarry_hqm_display_name: {
                clean: lm.getIntl(language, 'hqmQuarry'),
                map: lm.getIntl(language, 'hqmQuarry').toUpperCase(),
                radius: 27
            },
            mining_quarry_stone_display_name: {
                clean: lm.getIntl(language, 'stoneQuarry'),
                map: lm.getIntl(language, 'stoneQuarry').toUpperCase(),
                radius: 35
            },
            mining_quarry_sulfur_display_name: {
                clean: lm.getIntl(language, 'sulfurQuarry'),
                map: lm.getIntl(language, 'sulfurQuarry').toUpperCase(),
                radius: 33
            },
            oil_rig_small: {
                clean: lm.getIntl(language, 'oilRig'),
                map: lm.getIntl(language, 'oilRig').toUpperCase(),
                radius: 32
            },
            outpost: {
                clean: lm.getIntl(language, 'outpost'),
                map: lm.getIntl(language, 'outpost').toUpperCase(),
                radius: 81
            },
            power_plant_display_name: {
                clean: lm.getIntl(language, 'powerPlant'),
                map: lm.getIntl(language, 'powerPlant').toUpperCase(),
                radius: 112
            },
            satellite_dish_display_name: {
                clean: lm.getIntl(language, 'satelliteDish'),
                map: lm.getIntl(language, 'satelliteDish').toUpperCase(),
                radius: 78
            },
            sewer_display_name: {
                clean: lm.getIntl(language, 'sewerBranch'),
                map: lm.getIntl(language, 'sewerBranch').toUpperCase(),
                radius: 87
            },
            stables_a: {
                clean: lm.getIntl(language, 'ranch'),
                map: lm.getIntl(language, 'ranch').toUpperCase(),
                radius: 35
            },
            stables_b: {
                clean: lm.getIntl(language, 'largeBarn'),
                map: lm.getIntl(language, 'largeBarn').toUpperCase(),
                radius: 35
            },
            supermarket: {
                clean: lm.getIntl(language, 'abandonedSupermarket'),
                map: lm.getIntl(language, 'abandonedSupermarket').toUpperCase(),
                radius: 19
            },
            swamp_c: {
                clean: lm.getIntl(language, 'abandonedCabins'),
                map: lm.getIntl(language, 'abandonedCabins').toUpperCase(),
                radius: 42
            },
            train_tunnel_display_name: {
                clean: '',
                map: '',
                radius: 0
            },
            train_tunnel_link_display_name: {
                clean: '',
                map: '',
                radius: 0
            },
            train_yard_display_name: {
                clean: lm.getIntl(language, 'trainYard'),
                map: lm.getIntl(language, 'trainYard').toUpperCase(),
                radius: 115
            },
            underwater_lab: {
                clean: lm.getIntl(language, 'underwaterLab'),
                map: lm.getIntl(language, 'underwaterLab').toUpperCase(),
                radius: 75
            },
            water_treatment_plant_display_name: {
                clean: lm.getIntl(language, 'waterTreatmentPlant'),
                map: lm.getIntl(language, 'waterTreatmentPlant').toUpperCase(),
                radius: 110
            }
        }

        client.rustplusMaps[rustplus.guildId] = map.jpgImage;
        this.resetImageAndMeta();
    }

    /* Getters and Setters */
    get width(): number { return this._width; }
    set width(width: number) { this._width = width; }
    get height(): number { return this._height; }
    set height(height: number) { this._height = height; }
    get jpgImage(): string { return this._jpgImage; }
    set jpgImage(jpgImage: string) { this._jpgImage = jpgImage; }
    get oceanMargin(): number { return this._oceanMargin; }
    set oceanMargin(oceanMargin: number) { this._oceanMargin = oceanMargin; }
    get monuments(): Monument[] { return this._monuments; }
    set monuments(monuments: Monument[]) { this._monuments = monuments; }
    get background(): string { return this._background; }
    set background(background: string) { this._background = background; }
    get rustplus(): typeof RustPlus { return this._rustplus; }
    set rustplus(rustplus: typeof RustPlus) { this._rustplus = rustplus; }
    get font(): any { return this._font; }
    set font(font: any) { this._font = font; }
    get mapMarkerImageMeta(): MapMarkerImageMeta { return this._mapMarkerImageMeta; }
    set mapMarkerImageMeta(mapMarkerImageMeta: MapMarkerImageMeta) { this._mapMarkerImageMeta = mapMarkerImageMeta; }
    get monumentInfo(): MonumentInfo { return this._monumentInfo; }
    set monumentInfo(monumentInfo: MonumentInfo) { this._monumentInfo = monumentInfo; }

    /* Change checkers */
    isWidthChanged(map: MapResponseData): boolean { return this.width !== map.width; }
    isHeightChanged(map: MapResponseData): boolean { return this.height !== map.height; }
    isJpgImageChanged(map: MapResponseData): boolean { return this.jpgImage !== map.jpgImage; }
    isOceanMarginChanged(map: MapResponseData): boolean { return this.oceanMargin !== map.oceanMargin; }
    isMonumentsChanged(map: MapResponseData): boolean {
        return JSON.stringify(this.monuments) !== JSON.stringify(map.monuments);
    }
    isBackgroundChanged(map: MapResponseData): boolean { return this.background !== map.background; }

    updateMap(map: MapResponseData) {
        this.width = map.width;
        this.height = map.height;
        this.jpgImage = map.jpgImage;
        this.oceanMargin = map.oceanMargin;
        this.monuments = map.monuments;
        this.background = map.background;

        client.rustplusMaps[this.rustplus.guildId] = map.jpgImage;
        this.resetImageAndMeta();
    }

    async resetImageAndMeta() {
        this.writeMapClean();
        await this.setupFont();
        await this.setupMapMarkerImages();
    }

    writeMapClean() {
        fs.writeFileSync(this.mapMarkerImageMeta.map.image, client.rustplusMaps[this.rustplus.guildId]);
    }

    async setupFont() {
        const instance = guildInstance.readGuildInstanceFile(this.rustplus.guildId);
        const language = instance.generalSettings.language;

        if (language === 'en') {
            this.font = await jimp.loadFont(
                path.join(__dirname, '..', 'resources/fonts/PermanentMarker.fnt'));
        }
        else {
            this.font = await jimp.loadFont(
                path.join(__dirname, '..', 'resources/fonts/YuGothic.fnt'));
        }
    }

    async setupMapMarkerImages() {
        for (const [marker, content] of Object.entries(this.mapMarkerImageMeta)) {
            content.jimp = await jimp.read(content.image);
            if (marker !== 'map') {
                content.jimp.resize(content.size, content.size);
            }
        }
    }

    async mapAppendMonuments() {
        if (this.rustplus.rpInfo === null) {
            this.rustplus.warn(lm.getIntl(Config.general.language, 'couldNotAppendMapMonuments'));
            return;
        }

        for (let monument of this.monuments) {
            const x = monument.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.rpInfo.mapSize) +
                this.oceanMargin;
            const n = this.height - 2 * this.oceanMargin;
            const y = this.height - (monument.y * (n / this.rustplus.rpInfo.mapSize) + this.oceanMargin);

            try {
                if (monument.token === "train_tunnel_display_name") {
                    const size = this.mapMarkerImageMeta.tunnels.size as number;
                    this.mapMarkerImageMeta.map.jimp.composite(
                        this.mapMarkerImageMeta.tunnels.jimp, x - (size / 2), y - (size / 2)
                    );
                }
                else if (monument.token === "train_tunnel_link_display_name") {
                    const size = this.mapMarkerImageMeta.tunnels_link.size as number;
                    this.mapMarkerImageMeta.map.jimp.composite(
                        this.mapMarkerImageMeta.tunnels_link.jimp, x - (size / 2), y - (size / 2)
                    );
                }
                else {
                    /* Compensate for the text placement */
                    if (monument.token === 'DungeonBase') continue;

                    const name = (this.monumentInfo.hasOwnProperty(monument.token)) ?
                        this.monumentInfo[monument.token as keyof MonumentInfo].map : monument.token;
                    const comp = name.length * 5;
                    this.mapMarkerImageMeta.map.jimp.print(
                        this.font, x - comp, y - 10, name);
                }
            }
            catch (e) {
                /* Ignore */
            }
        }
    }

    async mapAppendMarkers() {
        if (this.rustplus.rpInfo === null) {
            this.rustplus.warn(lm.getIntl(Config.general.language, 'couldNotAppendMapMarkers'));
            return;
        }

        const mapMarkers = await this.rustplus.getMapMarkersAsync();
        if (!(await this.rustplus.isResponseValid(mapMarkers))) return;

        for (const marker of mapMarkers.mapMarkers.markers) {
            let x = marker.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.rpInfo.mapSize) + this.oceanMargin;
            const n = this.height - 2 * this.oceanMargin;
            let y = this.height - (marker.y * (n / this.rustplus.rpInfo.mapSize) + this.oceanMargin);

            /* Compensate rotations */
            if (marker.type === this.rustplus.mapMarkers.types.CargoShip) {
                x -= 20;
                y -= 20;
            }

            try {
                const markerImageMeta = this.getMarkerImageMetaByType(marker.type);
                const size = this.mapMarkerImageMeta[markerImageMeta as keyof MapMarkerImageMeta].size as number;

                /* Rotate */
                this.mapMarkerImageMeta[markerImageMeta as keyof MapMarkerImageMeta].jimp.rotate(marker.rotation);

                this.mapMarkerImageMeta.map.jimp.composite(
                    this.mapMarkerImageMeta[markerImageMeta as keyof MapMarkerImageMeta].jimp,
                    x - (size / 2), y - (size / 2)
                );
            }
            catch (e) {
                /* Ignore */
            }
        }
    }

    async writeMap(markers: boolean, monuments: boolean) {
        await this.resetImageAndMeta();

        if (markers) {
            await this.mapAppendMarkers();
        }
        if (monuments) {
            await this.mapAppendMonuments();
        }

        await this.mapMarkerImageMeta.map.jimp.writeAsync(
            this.mapMarkerImageMeta.map.image.replace('clean.png', 'full.png'));

        try {
            const image = Gm(this.mapMarkerImageMeta.map.image.replace('clean.png', 'full.png'));

            if (this.rustplus.rpInfo === null) {
                this.rustplus.warn(lm.getIntl(Config.general.language, 'couldNotAppendMapTracers'));
                return;
            }

            if (!markers) return;

            /* Tracer for CargoShip */
            image.stroke(constants.COLOR_CARGO_TRACER, 2);
            for (const [id, coords] of Object.entries(this.rustplus.cargoShipTracers)) {
                let prev = null;
                for (const point of coords as Point[]) {
                    if (prev === null) {
                        prev = point;
                        continue;
                    }
                    const point1 = this.calculateImageXY(prev);
                    const point2 = this.calculateImageXY(point);
                    image.drawLine(point1.x, point1.y, point2.x, point2.y);
                    prev = point;
                }
            }

            /* Tracer for Patrol Helicopter */
            image.stroke(constants.COLOR_PATROL_HELICOPTER_TRACER, 2);
            for (const [id, coords] of Object.entries(this.rustplus.patrolHelicopterTracers)) {
                let prev = null;
                for (const point of coords as Point[]) {
                    if (prev === null) {
                        prev = point;
                        continue;
                    }
                    const point1 = this.calculateImageXY(prev);
                    const point2 = this.calculateImageXY(point);
                    image.drawLine(point1.x, point1.y, point2.x, point2.y);
                    prev = point;
                }
            }

            await this.gmWriteAsync(image, this.mapMarkerImageMeta.map.image.replace('clean.png', 'full.png'));
        }
        catch (error) {
            this.rustplus.warn(lm.getIntl(Config.general.language, 'couldNotAddStepTracers'));
        }
    }

    getMarkerImageMetaByType(type: number): keyof MapMarkerImageMeta | null {
        for (const [marker, content] of Object.entries(this.mapMarkerImageMeta)) {
            if (content.type === type) {
                return marker as keyof MapMarkerImageMeta;
            }
        }
        return null;
    }

    getMonumentsByName(monumentName: string): Monument[] {
        let matches = [];
        for (const monument of this.monuments) {
            if (monument.token === monumentName) {
                matches.push(monument);
            }
        }
        return matches;
    }

    calculateImageXY(coords: Point): Point {
        const x = coords.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.rpInfo.mapSize) + this.oceanMargin;
        const n = this.height - 2 * this.oceanMargin;
        const y = this.height - (coords.y * (n / this.rustplus.rpInfo.mapSize) + this.oceanMargin);
        return { x: x, y: y };
    }

    async gmWriteAsync(image: any, path: string): Promise<void> {
        return new Promise(function (resolve, reject) {
            image.write(path, (err: any) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve()
                }
            })
        });
    }
}