const Fs = require('fs');
const Jimp = require('jimp');
const Path = require('path');

const Client = require('../../index.ts');

class Map {
    constructor(map, rustplus) {
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
                image: Path.join(__dirname, '..', `resources/images/maps/${this.rustplus.guildId}_map_clean.png`),
                size: null, type: null, jimp: null
            },
            player: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/player.png'), size: 20, type: 1, jimp: null
            },
            explosion: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/explosion.png'), size: 30, type: 2, jimp: null
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
            crate: {
                image:
                    Path.join(__dirname, '..', 'resources/images/markers/crate.png'), size: 25, type: 6, jimp: null
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
    get jpgImage() { return this._jpgImage; }
    set jpgImage(jpgImage) { this._jpgImage = jpgImage; }
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
    isJpgImageChanged(map) { return ((JSON.stringify(this.jpgImage)) !== (JSON.stringify(map.jpgImage))); }
    isOceanMarginChanged(map) { return ((this.oceanMargin) !== (map.oceanMargin)); }
    isMonumentsChanged(map) { return ((JSON.stringify(this.monuments)) !== (JSON.stringify(map.monuments))); }
    isBackgroundChanged(map) { return ((this.background) !== (map.background)); }

    updateMap(map) {
        this.width = map.width;
        this.height = map.height;
        this.jpgImage = map.jpgImage;
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
        await Fs.writeFileSync(this.mapMarkerImageMeta.map.image, this.jpgImage);
    }

    async setupFont() {
        this.font = await Jimp.loadFont(
            Path.join(__dirname, '..', 'resources/fonts/PermanentMarker.fnt'));
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

        let oceanMarginOffset = this.oceanMargin * (1 / 2);

        await this.mapMarkerImageMeta.map.jimp.crop(
            oceanMarginOffset,
            oceanMarginOffset,
            this.width - (oceanMarginOffset * 2),
            this.height - (oceanMarginOffset * 2));

        await this.mapMarkerImageMeta.map.jimp.writeAsync(
            this.mapMarkerImageMeta.map.image.replace('clean.png', 'full.png'));
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
}

module.exports = Map;