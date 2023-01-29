const Fs = require('fs');
const Path = require('path');

class Cctv {
    constructor() {
        this._cctvs = JSON.parse(Fs.readFileSync(
            Path.join(__dirname, '..', 'util/cctv.json'), 'utf8'));
    }

    /* Getters and Setters */
    get cctvs() { return this._cctvs; }
    set cctvs(cctvs) { this._cctvs = cctvs; }

    cctvExist(monument) { return (monument in this.cctvs) ? true : false; }

    isDynamic(monument) {
        if (!this.cctvExist(monument)) return undefined;
        return this.cctvs[monument].dynamic;
    }

    getCodes(monument) {
        if (!this.cctvExist(monument)) return undefined;
        return this.cctvs[monument].codes;
    }
    
}

module.exports = Cctv;