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

const ItemRecycleInformation = require('./itemRecycleData.json');

module.exports = {
    calculate: function (items) {
        /* Merged all stacks with the same IDs */
        let mergedItems = [];
        for (let item of items) {
            let found = mergedItems.find(e => e.itemId === item.itemId && e.itemIsBlueprint === item.itemIsBlueprint);
            if (found === undefined) {
                mergedItems.push(item);
            }
            else {
                found.quantity += item.quantity;
            }
        }
        items = mergedItems.slice();

        /* Calculate the recycling */
        while (true) {
            let noMoreIterations = true;

            let expandedItems = [];
            for (let item of items) {
                /* If the item isn't included in recycle information object, move on to next item. */
                if (!Object.keys(ItemRecycleInformation).includes(item.itemId.toString())) {
                    expandedItems.push(item);
                    continue;
                }

                /* Can the item be recycled further? */
                if (ItemRecycleInformation[item.itemId].length > 0 && item.itemIsBlueprint !== true) {
                    noMoreIterations = false;
                    for (let recycleItem of ItemRecycleInformation[item.itemId]) {
                        for (let i = 0; i < item.quantity; i++) {
                            if (recycleItem.probability < 1 && Math.random() * 1 > recycleItem.probability) continue;

                            let found = expandedItems.find(e => e.itemId === recycleItem.id);
                            if (found === undefined) {
                                expandedItems.push({
                                    itemId: recycleItem.id,
                                    quantity: recycleItem.quantity,
                                    itemIsBlueprint: false
                                });
                            }
                            else {
                                found.quantity += recycleItem.quantity;
                            }
                        }
                    }
                }
                else {
                    let found = expandedItems.find(e => e.itemId === item.itemId &&
                        e.itemIsBlueprint === item.itemIsBlueprint);
                    if (found === undefined) {
                        expandedItems.push(item);
                    }
                    else {
                        found.quantity += item.quantity;
                    }
                }
            }

            items = expandedItems.slice();

            if (noMoreIterations) {
                break;
            }
        }

        return items;
    },
}