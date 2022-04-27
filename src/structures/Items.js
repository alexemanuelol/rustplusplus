const fs = require('fs');
const Str = require('../util/string.js');

class Items {
    constructor() {
        this._items = JSON.parse(fs.readFileSync(`${__dirname}/../util/items.json`, 'utf8'));
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

    getClosestItemIdByName(name, similarity = 0.9) {
        return Object.keys(this.items).find(id =>
            Str.similarity(this.items[id].name.toLowerCase(), name.toLowerCase()) >= similarity);
    }
}

module.exports = Items;