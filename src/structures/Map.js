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

const Fs = require('fs');
const Gm = require('gm');
const Jimp = require('jimp');
const Path = require('path');

const Constants = require('../../dist/util/constants.js');
const Client = require('../../index.ts');

class Map {
    constructor(map, rustplus) {
        this._width = map.width;
        this._height = map.height;
        Client.client.rustplusMaps[rustplus.guildId] = map.jpgImage;
        this._oceanMargin = map.oceanMargin;
        this._monuments = map.monuments;
        this._background = map.background;

        this._rustplus = rustplus;

        this._font = null;

        this._mapMarkerImageMeta = {
            map: {
                image: Path.join(__dirname, '..', '..', `maps/${this.rustplus.guildId}_map_clean.png`),
                size: null, type: null, jimp: null
            },
            player: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/player.png'), size: 20, type: 1, jimp: null
            },
            shop: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/shop.png'), size: 20, type: 3, jimp: null
            },
            chinook: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/chinook.png'), size: 50, type: 4, jimp: null
            },
            cargo: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/cargo.png'), size: 100, type: 5, jimp: null
            },
            blade: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/blade.png'), size: 25, type: 7, jimp: null
            },
            heli: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/heli.png'), size: 20, type: 8, jimp: null
            },
            tunnels: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/tunnels.png'), size: 35, type: 9, jimp: null
            },
            tunnels_link: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/tunnels_link.png'), size: 35, type: 10,
                jimp: null
            }
        }

        this._monumentInfo = {
            AbandonedMilitaryBase: {
                clean: Client.client.intlGet(rustplus.guildId, 'abandonedMilitaryBase'),
                map: Client.client.intlGet(rustplus.guildId, 'abandonedMilitaryBase').toUpperCase(),
                radius: 46
            },
            airfield_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'airfield'),
                map: Client.client.intlGet(rustplus.guildId, 'airfield').toUpperCase(),
                radius: 120
            },
            arctic_base_a: {
                clean: Client.client.intlGet(rustplus.guildId, 'arcticResearchBase'),
                map: Client.client.intlGet(rustplus.guildId, 'arcticResearchBase').toUpperCase(),
                radius: 64
            },
            bandit_camp: {
                clean: Client.client.intlGet(rustplus.guildId, 'banditCamp'),
                map: Client.client.intlGet(rustplus.guildId, 'banditCamp').toUpperCase(),
                radius: 82
            },
            dome_monument_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'theDome'),
                map: Client.client.intlGet(rustplus.guildId, 'theDome').toUpperCase(),
                radius: 50
            },
            excavator: {
                clean: Client.client.intlGet(rustplus.guildId, 'giantExcavatorPit'),
                map: Client.client.intlGet(rustplus.guildId, 'giantExcavatorPit').toUpperCase(),
                radius: 110
            },
            ferryterminal: {
                clean: Client.client.intlGet(rustplus.guildId, 'ferryTerminal'),
                map: Client.client.intlGet(rustplus.guildId, 'ferryTerminal').toUpperCase(),
                radius: 88
            },
            fishing_village_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'fishingVillage'),
                map: Client.client.intlGet(rustplus.guildId, 'fishingVillage').toUpperCase(),
                radius: 31
            },
            gas_station: {
                clean: Client.client.intlGet(rustplus.guildId, 'oxumsGasStation'),
                map: Client.client.intlGet(rustplus.guildId, 'oxumsGasStation').toUpperCase(),
                radius: 28
            },
            harbor_2_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'harbor'),
                map: Client.client.intlGet(rustplus.guildId, 'harbor').toUpperCase(),
                radius: 96
            },
            harbor_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'harbor'),
                map: Client.client.intlGet(rustplus.guildId, 'harbor').toUpperCase(),
                radius: 96
            },
            junkyard_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'junkyard'),
                map: Client.client.intlGet(rustplus.guildId, 'junkyard').toUpperCase(),
                radius: 88
            },
            large_fishing_village_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'largeFishingVillage'),
                map: Client.client.intlGet(rustplus.guildId, 'largeFishingVillage').toUpperCase(),
                radius: 40
            },
            large_oil_rig: {
                clean: Client.client.intlGet(rustplus.guildId, 'largeOilRig'),
                map: Client.client.intlGet(rustplus.guildId, 'largeOilRig').toUpperCase(),
                radius: 40
            },
            launchsite: {
                clean: Client.client.intlGet(rustplus.guildId, 'launchSite'),
                map: Client.client.intlGet(rustplus.guildId, 'launchSite').toUpperCase(),
                radius: 250
            },
            lighthouse_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'lighthouse'),
                map: Client.client.intlGet(rustplus.guildId, 'lighthouse').toUpperCase(),
                radius: 28
            },
            military_tunnels_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'militaryTunnel'),
                map: Client.client.intlGet(rustplus.guildId, 'militaryTunnel').toUpperCase(),
                radius: 122
            },
            mining_outpost_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'miningOutpost'),
                map: Client.client.intlGet(rustplus.guildId, 'miningOutpost').toUpperCase(),
                radius: 17
            },
            missile_silo_monument: {
                clean: Client.client.intlGet(rustplus.guildId, 'missileSilo'),
                map: Client.client.intlGet(rustplus.guildId, 'missileSilo').toUpperCase(),
                radius: 81
            },
            mining_quarry_hqm_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'hqmQuarry'),
                map: Client.client.intlGet(rustplus.guildId, 'hqmQuarry').toUpperCase(),
                radius: 27
            },
            mining_quarry_stone_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'stoneQuarry'),
                map: Client.client.intlGet(rustplus.guildId, 'stoneQuarry').toUpperCase(),
                radius: 35
            },
            mining_quarry_sulfur_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'sulfurQuarry'),
                map: Client.client.intlGet(rustplus.guildId, 'sulfurQuarry').toUpperCase(),
                radius: 33
            },
            oil_rig_small: {
                clean: Client.client.intlGet(rustplus.guildId, 'oilRig'),
                map: Client.client.intlGet(rustplus.guildId, 'oilRig').toUpperCase(),
                radius: 32
            },
            outpost: {
                clean: Client.client.intlGet(rustplus.guildId, 'outpost'),
                map: Client.client.intlGet(rustplus.guildId, 'outpost').toUpperCase(),
                radius: 81
            },
            power_plant_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'powerPlant'),
                map: Client.client.intlGet(rustplus.guildId, 'powerPlant').toUpperCase(),
                radius: 112
            },
            satellite_dish_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'satelliteDish'),
                map: Client.client.intlGet(rustplus.guildId, 'satelliteDish').toUpperCase(),
                radius: 78
            },
            sewer_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'sewerBranch'),
                map: Client.client.intlGet(rustplus.guildId, 'sewerBranch').toUpperCase(),
                radius: 87
            },
            stables_a: {
                clean: Client.client.intlGet(rustplus.guildId, 'ranch'),
                map: Client.client.intlGet(rustplus.guildId, 'ranch').toUpperCase(),
                radius: 35
            },
            stables_b: {
                clean: Client.client.intlGet(rustplus.guildId, 'largeBarn'),
                map: Client.client.intlGet(rustplus.guildId, 'largeBarn').toUpperCase(),
                radius: 35
            },
            supermarket: {
                clean: Client.client.intlGet(rustplus.guildId, 'abandonedSupermarket'),
                map: Client.client.intlGet(rustplus.guildId, 'abandonedSupermarket').toUpperCase(),
                radius: 19
            },
            swamp_c: {
                clean: Client.client.intlGet(rustplus.guildId, 'abandonedCabins'),
                map: Client.client.intlGet(rustplus.guildId, 'abandonedCabins').toUpperCase(),
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
                clean: Client.client.intlGet(rustplus.guildId, 'trainYard'),
                map: Client.client.intlGet(rustplus.guildId, 'trainYard').toUpperCase(),
                radius: 115
            },
            underwater_lab: {
                clean: Client.client.intlGet(rustplus.guildId, 'underwaterLab'),
                map: Client.client.intlGet(rustplus.guildId, 'underwaterLab').toUpperCase(),
                radius: 75
            },
            water_treatment_plant_display_name: {
                clean: Client.client.intlGet(rustplus.guildId, 'waterTreatmentPlant'),
                map: Client.client.intlGet(rustplus.guildId, 'waterTreatmentPlant').toUpperCase(),
                radius: 110
            }
        }

        this.resetImageAndMeta();
    }

    /* Getters and Setters */
    get width() { return this._width; }
    set width(width) { this._width = width; }
    get height() { return this._height; }
    set height(height) { this._height = height; }
    get oceanMargin() { return this._oceanMargin; }
    set oceanMargin(oceanMargin) { this._oceanMargin = oceanMargin; }
    get monuments() { return this._monuments; }
    set monuments(monuments) { this._monuments = monuments; }
    get background() { return this._background; }
    set background(background) { this._background = background; }
    get rustplus() { return this._rustplus; }
    set rustplus(rustplus) { this._rustplus = rustplus; }
    get font() { return this._font; }
    set font(font) { this._font = font; }
    get mapMarkerImageMeta() { return this._mapMarkerImageMeta; }
    set mapMarkerImageMeta(mapMarkerImageMeta) { this._mapMarkerImageMeta = mapMarkerImageMeta; }
    get monumentInfo() { return this._monumentInfo; }
    set monumentInfo(monumentInfo) { this._monumentInfo = monumentInfo; }

    /* Change checkers */
    isWidthChanged(map) { return ((this.width) !== (map.width)); }
    isHeightChanged(map) { return ((this.height) !== (map.height)); }
    isOceanMarginChanged(map) { return ((this.oceanMargin) !== (map.oceanMargin)); }
    isMonumentsChanged(map) { return ((JSON.stringify(this.monuments)) !== (JSON.stringify(map.monuments))); }
    isBackgroundChanged(map) { return ((this.background) !== (map.background)); }

    updateMap(map) {
        this.width = map.width;
        this.height = map.height;
        Client.client.rustplusMaps[this.rustplus.guildId] = map.jpgImage;
        this.oceanMargin = map.oceanMargin;
        this.monuments = map.monuments;
        this.background = map.background;

        this.resetImageAndMeta();
    }

    async resetImageAndMeta() {
        await this.writeMapClean();
        await this.setupFont();
        await this.setupMapMarkerImages();
    }

    async writeMapClean() {
        await Fs.writeFileSync(this.mapMarkerImageMeta.map.image, Client.client.rustplusMaps[this.rustplus.guildId]);
    }

    async setupFont() {
        if (this.rustplus.generalSettings.language === 'en') {
            this.font = await Jimp.loadFont(
                Path.join(__dirname, '..', 'resources/fonts/PermanentMarker.fnt'));
        }
        else {
            this.font = await Jimp.loadFont(
                Path.join(__dirname, '..', 'resources/fonts/YuGothic.fnt'));
        }
    }

    async setupMapMarkerImages() {
        for (const [marker, content] of Object.entries(this.mapMarkerImageMeta)) {
            content.jimp = await Jimp.read(content.image);
            if (marker !== 'map') {
                content.jimp.resize(content.size, content.size);
            }
        }
    }

    async mapAppendMonuments() {
        if (this.rustplus.info === null) {
            this.rustplus.log(Client.client.intlGet(null, 'warningCap'),
                Client.client.intlGet(null, 'couldNotAppendMapMonuments'));
            return;
        }

        for (let monument of this.monuments) {
            let x = monument.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.info.mapSize) + this.oceanMargin;
            let n = this.height - 2 * this.oceanMargin;
            let y = this.height - (monument.y * (n / this.rustplus.info.mapSize) + this.oceanMargin);

            try {
                if (monument.token === "train_tunnel_display_name") {
                    let size = this.mapMarkerImageMeta.tunnels.size;
                    this.mapMarkerImageMeta.map.jimp.composite(
                        this.mapMarkerImageMeta.tunnels.jimp, x - (size / 2), y - (size / 2)
                    );
                }
                else if (monument.token === "train_tunnel_link_display_name") {
                    let size = this.mapMarkerImageMeta.tunnels_link.size;
                    this.mapMarkerImageMeta.map.jimp.composite(
                        this.mapMarkerImageMeta.tunnels_link.jimp, x - (size / 2), y - (size / 2)
                    );
                }
                else {
                    /* Compensate for the text placement */
                    if (monument.token === 'DungeonBase') continue;

                    let name = (this.monumentInfo.hasOwnProperty(monument.token)) ?
                        this.monumentInfo[monument.token].map : monument.token;
                    let comp = name.length * 5;
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
        if (this.rustplus.info === null) {
            this.rustplus.log(Client.client.intlGet(null, 'warningCap'),
                Client.client.intlGet(null, 'couldNotAppendMapMarkers'));
            return;
        }

        let mapMarkers = await this.rustplus.getMapMarkersAsync();
        if (!(await this.rustplus.isResponseValid(mapMarkers))) return;

        for (let marker of mapMarkers.mapMarkers.markers) {
            let x = marker.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.info.mapSize) + this.oceanMargin;
            let n = this.height - 2 * this.oceanMargin;
            let y = this.height - (marker.y * (n / this.rustplus.info.mapSize) + this.oceanMargin);

            /* Compensate rotations */
            if (marker.type === this.rustplus.mapMarkers.types.CargoShip) {
                x -= 20;
                y -= 20;
            }

            try {
                let markerImageMeta = this.getMarkerImageMetaByType(marker.type);
                let size = this.mapMarkerImageMeta[markerImageMeta].size;

                /* Rotate */
                this.mapMarkerImageMeta[markerImageMeta].jimp.rotate(marker.rotation);

                this.mapMarkerImageMeta.map.jimp.composite(
                    this.mapMarkerImageMeta[markerImageMeta].jimp, x - (size / 2), y - (size / 2)
                );
            }
            catch (e) {
                /* Ignore */
            }
        }
    }

    async writeMap(markers, monuments) {
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

            if (this.rustplus.info === null) {
                this.rustplus.log(Client.client.intlGet(null, 'warningCap'),
                    Client.client.intlGet(null, 'couldNotAppendMapTracers'));
                return;
            }

            if (!markers) return;

            /* Tracer for CargoShip */
            image.stroke(Constants.COLOR_CARGO_TRACER, 2);
            for (const [id, coords] of Object.entries(this.rustplus.cargoShipTracers)) {
                let prev = null;
                for (const point of coords) {
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
            image.stroke(Constants.COLOR_PATROL_HELICOPTER_TRACER, 2);
            for (const [id, coords] of Object.entries(this.rustplus.patrolHelicopterTracers)) {
                let prev = null;
                for (const point of coords) {
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
            this.rustplus.log(Client.client.intlGet(null, 'warningCap'),
                Client.client.intlGet(null, 'couldNotAddStepTracers'));
        }
    }

    getMarkerImageMetaByType(type) {
        for (const [marker, content] of Object.entries(this.mapMarkerImageMeta)) {
            if (content.type === type) {
                return marker;
            }
        }
        return null;
    }

    getMonumentsByName(monumentName) {
        let matches = [];
        for (let monument of this.monuments) {
            if (monument.token === monumentName) {
                matches.push(monument);
            }
        }
        return matches;
    }

    calculateImageXY(coords) {
        const x = coords.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.info.mapSize) + this.oceanMargin;
        const n = this.height - 2 * this.oceanMargin;
        const y = this.height - (coords.y * (n / this.rustplus.info.mapSize) + this.oceanMargin);
        return { x: x, y: y };
    }

    async gmWriteAsync(image, path) {
        return new Promise(function (resolve, reject) {
            image.write(path, (err) => {
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

module.exports = Map;
