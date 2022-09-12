const Fs = require('fs');
const Path = require('path');

const Fuse = require('fuse.js')

class Items {
    constructor() {
        this._items = JSON.parse(Fs.readFileSync(
            Path.join(__dirname, '..', 'util/items.json'), 'utf8'));

        const flattenedItems = Object.keys(this.items).map(id => ({ id, ...this.items[id] }));
        this._fuse = new Fuse(flattenedItems, {
            keys: [{
                name: 'name',
                weight: 0.7,
            }, {
                name: 'shortname',
                weight: 0.3,
            }]
        });
    }

    /* Getters and Setters */
    get items() { return this._items; }
    set items(items) { this._items = items; }
    get fuse() { return this._fuse; }
    set fuse(fuse) { this._fuse = fuse; }

    addItem(id, content) { this.items[id] = content; }
    removeItem(id) { delete this.items[id]; }
    itemExist(id) { return (id in this.items) ? true : false; }

    getShortName(id) {
        if (!this.itemExist(id)) return undefined;
        return this.items[id].shortname;
    }

    getName(id) {
        if (!this.itemExist(id)) return undefined;
        return this.items[id].name;
    }

    getDescription(id) {
        if (!this.itemExist(id)) return undefined;
        return this.items[id].description;
    }

    getIdByName(name) {
        return Object.keys(this.items).find(id => this.items[id].name === name);
    }

    getClosestItemIdByName(name) {
        const result = this.fuse.search(name)[0];
        if (result) {
            return this.fuse.search(name)[0].item.id;
        }
        return undefined;
    }
}

module.exports = Items;