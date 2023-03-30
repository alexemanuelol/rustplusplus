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

const DiscordMessages = require('../discordTools/discordMessages.js');
const Map = require('../util/map.js');

module.exports = {
    handler: async function (rustplus, client, mapMarkers) {
        /* Handle Vending Machine changes */
        await module.exports.checkChanges(rustplus, client, mapMarkers);
    },

    checkChanges: async function (rustplus, client, mapMarkers) {
        const guildId = rustplus.guildId;
        const instance = client.getInstance(guildId);
        const subscriptionList = instance.marketSubscriptionListItemIds;
        const vendingMachineType = rustplus.mapMarkers.types.VendingMachine;
        const vendingMachines = rustplus.mapMarkers.getMarkersOfType(vendingMachineType, mapMarkers.markers);

        for (const vendingMachine of vendingMachines) {
            const x = vendingMachine.x;
            const y = vendingMachine.y;
            const vId = `${x}:${y}`;
            const sellOrders = vendingMachine.sellOrders;

            for (const order of sellOrders) {
                const itemId = order.itemId.toString();
                const currencyId = order.currencyId.toString();
                const amountInStock = order.amountInStock;

                const found = rustplus.foundSubscriptionItems.find(e =>
                    e.vId === vId && e.itemId === itemId && e.currencyId === currencyId);

                if (!(subscriptionList.includes(itemId) || subscriptionList.includes(currencyId)) ||
                    amountInStock === 0) {
                    rustplus.foundSubscriptionItems = rustplus.foundSubscriptionItems.filter(e =>
                        e.vId !== vId || e.itemId !== itemId || e.currencyId !== currencyId);
                    continue;
                }

                if (found) continue;

                rustplus.foundSubscriptionItems.push({
                    vId: vId,
                    itemId: itemId,
                    currencyId: currencyId
                });

                if (rustplus.isFirstPoll || rustplus.firstPollItems.includes(itemId) ||
                    rustplus.firstPollItems.includes(currencyId)) {
                    continue;
                }

                const location = Map.getPos(x, y, rustplus.info.correctedMapSize, rustplus);
                const itemName = client.items.getName(itemId);
                const currencyName = client.items.getName(currencyId);

                const items = [];
                if (subscriptionList.includes(itemId)) items.push(itemName)
                if (subscriptionList.includes(currencyId)) items.push(currencyName)

                const str = client.intlGet(guildId, 'itemAvailableInVendingMachine', {
                    items: items.join(', '),
                    location: location.location
                });

                await DiscordMessages.sendItemAvailableInVendingMachineMessage(rustplus, str);

                if (rustplus.generalSettings.itemAvailableInVendingMachineNotifyInGame) {
                    rustplus.sendTeamMessageAsync(str);
                }
                rustplus.log(client.intlGet(null, 'infoCap'), str);
            }
        }

        for (const foundItem of rustplus.foundSubscriptionItems) {
            let stillPresent = false;
            for (const vendingMachine of vendingMachines) {
                const vId = `${vendingMachine.x}:${vendingMachine.y}`;
                if (foundItem.vId === vId) {
                    stillPresent = true;
                    break;
                }
            }

            if (!stillPresent) {
                rustplus.foundSubscriptionItems = rustplus.foundSubscriptionItems.filter(e => e.vId !== foundItem.vId);
            }
        }

        rustplus.firstPollItems = [];
    },
}