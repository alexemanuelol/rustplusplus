const Fs = require('fs');

const Str = require('../util/string.js');
const Fuse = require('fuse.js')

class Items {
    constructor() {
        this._items = JSON.parse(Fs.readFileSync(`${__dirname}/../util/items.json`, 'utf8'));
        const flattenedItems = Object.keys(this.items).map(id => ({ id, ...this.items[id] }));
        this._fuse = new Fuse(flattenedItems, {
            keys: [{
                name: 'name',
                weight: 0.7,
            }, {
                name: 'shortname',
                weight: 0.3,
            }]
        })

    }

    /* Getters and Setters */
    get items() { return this._items; }
    set items(items) { this._items = items; }

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
        return this._fuse.search(name)[0].id;
    }
}

module.exports = Items;