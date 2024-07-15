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

import * as utils from '../util/utils';

export interface Item {
    name: string;
    shortname: string;
    description: string;
}

export interface ItemsData {
    [id: string]: Item;
}

export class Items {
    items: ItemsData;
    itemNames: string[];

    constructor() {
        const filePath = path.join(__dirname, '..', 'staticFiles', 'items.json');
        this.items = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        this.itemNames = Object.values(this.items).map(item => item.name);
    }

    addItem(id: string, content: Item): void {
        this.items[id] = content;
        this.itemNames = Object.values(this.items).map(item => item.name); // Update item names
    }

    removeItem(id: string): void {
        delete this.items[id];
        this.itemNames = Object.values(this.items).map(item => item.name); // Update item names
    }

    itemExist(id: string): boolean {
        return id in this.items;
    }

    getShortName(id: string): string | null {
        if (!this.itemExist(id)) return null;
        return this.items[id].shortname;
    }

    getName(id: string): string | null {
        if (!this.itemExist(id)) return null;
        return this.items[id].name;
    }

    getDescription(id: string): string | null {
        if (!this.itemExist(id)) return null;
        return this.items[id].description;
    }

    getIdByName(name: string): string | null {
        const item = Object.keys(this.items).find(id => this.items[id].name === name);
        return item ? item : null;
    }

    getClosestItemIdByName(name: string): string | null {
        const closestName = utils.findClosestString(name, this.itemNames);
        if (closestName !== null) {
            const id = Object.entries(this.items).find(([_, value]) => value.name === closestName);
            return id ? id[0] : null;
        }
        return null;
    }
}