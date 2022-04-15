const Jimp = require("jimp");
const fs = require("fs");

const Monuments = require('../util/monuments.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

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
                image: `./src/resources/images/maps/${this.rustplus.guildId}_map_clean.png`,
                size: null, type: null, jimp: null
            },
            player: { image: './src/resources/images/markers/player.png', size: 20, type: 1, jimp: null },
            explosion: { image: './src/resources/images/markers/explosion.png', size: 30, type: 2, jimp: null },
            shop: { image: './src/resources/images/markers/shop.png', size: 20, type: 3, jimp: null },
            chinook: { image: './src/resources/images/markers/chinook.png', size: 50, type: 4, jimp: null },
            cargo: { image: './src/resources/images/markers/cargo.png', size: 100, type: 5, jimp: null },
            crate: { image: './src/resources/images/markers/crate.png', size: 25, type: 6, jimp: null },
            blade: { image: './src/resources/images/markers/blade.png', size: 25, type: 7, jimp: null },
            heli: { image: './src/resources/images/markers/heli.png', size: 20, type: 8, jimp: null },
            tunnels: { image: './src/resources/images/markers/tunnels.png', size: 35, type: 9, jimp: null }
        }

        this.writeMapClean();
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
        await this.setupFont();
        await this.setupMapMarkerImages();
    }

    async writeMapClean() {
        await fs.writeFileSync(this.mapMarkerImageMeta.map.image, this.jpgImage);
    }

    async setupFont() {
        this.font = await Jimp.loadFont("./src/resources/fonts/PermanentMarker.fnt");
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
            this.rustplus.log('WARNING', 'Could not append map monuments, rustplus info instance is not set.');
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

                    let name = (Monuments.Monument.hasOwnProperty(monument.token)) ?
                        Monuments.Monument[monument.token].map : monument.token;
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
            this.rustplus.log('WARNING', 'Could not append map markers, rustplus info instance is not set.');
            return;
        }

        let mapMarkers = await this.rustplus.getMapMarkersAsync();
        if (!(await this.rustplus.isResponseValid(mapMarkers))) return;

        for (let marker of mapMarkers.mapMarkers.markers) {
            let x = marker.x * ((this.width - 2 * this.oceanMargin) / this.rustplus.info.mapSize) + this.oceanMargin;
            let n = this.height - 2 * this.oceanMargin;
            let y = this.height - (marker.y * (n / this.rustplus.info.mapSize) + this.oceanMargin);

            /* Compensate rotations */
            if (marker.type === RustPlusTypes.MarkerType.CargoShip) {
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