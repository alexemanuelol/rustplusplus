const Items = require('./../util/items.js');
const MapCalc = require('./../util/mapCalculations.js');
const RustPlusTypes = require('../util/rustplusTypes.js');

var currentVendingMachines = [];
var foundItems = [];

var itemsToLookForId = [];

module.exports = {
    checkEvent: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        for (let marker of mapMarkers.response.mapMarkers.markers) {
            if (marker.type === RustPlusTypes.MarkerType.VendingMachine) {
                /* Check if new Vending Machine is detected */
                module.exports.checkNewVendingMachineDetected(marker, info);

                /* Go through sellOrders to see if it includes items that we are looking for */
                module.exports.checkItemsFromSellOrders(marker, info);
            }
        }
    },

    checkNewVendingMachineDetected: function (marker, info) {
        if (!currentVendingMachines.some(e => e.x === marker.x && e.y === marker.y)) {
            currentVendingMachines.push({ x: marker.x, y: marker.y });

            let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize);

            console.log(`New Vending Machine located at ${gridLocation}`);
        }
    },

    checkItemsFromSellOrders: function (marker, info) {
        for (let order of marker.sellOrders) {
            /* if itemId or currencyId is in itemsToLookForId */
            if (itemsToLookForId.includes(order.itemId) || itemsToLookForId.includes(order.currencyId)) {
                if (!module.exports.isAlreadyInFoundItems(marker.x, marker.y, order)) {
                    if (order.amountInStock >= 1) {
                        /* Add to the array of found items */
                        module.exports.addToFoundItems(marker.x, marker.y, order);

                        let item = '';
                        if (itemsToLookForId.includes(order.itemId) && itemsToLookForId.includes(order.currencyId)) {
                            item = Items.getName(order.itemId) + ' and ';
                            item += Items.getName(order.currencyId);
                        }
                        else if (itemsToLookForId.includes(order.itemId)) {
                            item = Items.getName(order.itemId);
                        }
                        else if (itemsToLookForId.includes(order.currencyId)) {
                            item = Items.getName(order.currencyId);
                        }

                        let gridLocation = MapCalc.getGridPos(marker.x, marker.y, info.response.info.mapSize);

                        console.log(`${item} was found in a Vending Machine at ${gridLocation}`);
                    }
                }
            }
        }
    },

    isAlreadyInFoundItems: function (x, y, order) {
        return foundItems.some(e => e.x === x && e.y === y &&
            e.itemId === order.itemId && e.quantity === order.quantity &&
            e.currencyId === order.currencyId && e.costPerItem === order.costPerItem)
    },

    addToFoundItems: function (x, y, order) {
        foundItems.push({
            x: x, y: y, itemId: order.itemId, quantity: order.quantity,
            currencyId: order.currencyId, costPerItem: order.costPerItem
        });
    },

    clearVendingMachines: function () {
        currentVendingMachines = [];
    },

    clearFoundItems: function () {
        foundItems = [];
    },

    addItemToLookFor: function (id) {
        if (!itemsToLookForId.includes(id)) {
            itemsToLookForId.push(id);
        }
    },

    removeItemToLookFor: function (id) {
        itemsToLookForId = itemsToLookForId.filter(e => e !== id);
    },

    getItemsToLookFor: function () {
        return itemsToLookForId;
    },

    clearItemsToLookFor: function () {
        itemsToLookForId = [];
    },
}