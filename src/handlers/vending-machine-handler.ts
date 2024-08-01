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

import { client, localeManager as lm } from '../../index';
import * as guildInstance from '../util/guild-instance';
import * as discordMessages from '../discordTools/discord-messages';
import { getPos } from '../util/map';
const { RustPlus } = require('../structures/RustPlus');

export async function vendingMachineHandler(rustplus: typeof RustPlus, mapMarkers: any) {
    const guildId = rustplus.guildId;
    const instance = guildInstance.readGuildInstanceFile(guildId);
    const language = instance.generalSettings.language;
    const subscriptionList = instance.marketSubscriptionList;
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

            for (const orderType of ['all', 'buy', 'sell']) {
                const found = rustplus.foundSubscriptionItems[orderType].find((e: any) =>
                    e.vId === vId && e.itemId === itemId && e.currencyId === currencyId);

                const allCond = orderType === 'all' && (!(subscriptionList[orderType].includes(itemId) ||
                    subscriptionList[orderType].includes(currencyId)) || amountInStock === 0);
                const buyCond = orderType === 'buy' && (!subscriptionList[orderType].includes(currencyId) ||
                    amountInStock === 0);
                const sellCond = orderType === 'sell' && (!subscriptionList[orderType].includes(itemId) ||
                    amountInStock === 0);

                if (allCond || buyCond || sellCond) {
                    rustplus.foundSubscriptionItems[orderType] = rustplus.foundSubscriptionItems[orderType]
                        .filter((e: any) => e.vId !== vId || e.itemId !== itemId || e.currencyId !== currencyId);
                    continue;
                }

                if (found) continue;

                rustplus.foundSubscriptionItems[orderType].push({
                    vId: vId,
                    itemId: itemId,
                    currencyId: currencyId
                });

                if (rustplus.isFirstPoll || rustplus.firstPollItems[orderType].includes(itemId) ||
                    rustplus.firstPollItems[orderType].includes(currencyId)) {
                    continue;
                }

                const location = getPos(rustplus.generalSettings.language, x, y,
                    rustplus.sInfo.correctedMapSize, rustplus.map.monuments, rustplus.map.monumentInfo);
                const itemName = client.items.getName(itemId);
                const currencyName = client.items.getName(currencyId);

                const items = [];
                if (subscriptionList[orderType as keyof guildInstance.MarketSubscriptionList].includes(itemId)) {
                    items.push(itemName)
                }

                if (subscriptionList[orderType as keyof guildInstance.MarketSubscriptionList].includes(currencyId)) {
                    items.push(currencyName)
                }

                const str = lm.getIntl(language, 'itemAvailableInVendingMachine', {
                    items: items.join(', '),
                    location: location.location
                });

                await discordMessages.sendItemAvailableInVendingMachineMessage(rustplus, str);

                if (rustplus.generalSettings.itemAvailableInVendingMachineNotifyInGame) {
                    rustplus.sendInGameMessage(str);
                }
                rustplus.info(str);
            }
        }
    }

    for (const orderType of ['all', 'buy', 'sell']) {
        for (const foundItem of rustplus.foundSubscriptionItems[orderType]) {
            let stillPresent = false;
            for (const vendingMachine of vendingMachines) {
                const vId = `${vendingMachine.x}:${vendingMachine.y}`;
                if (foundItem.vId === vId) {
                    stillPresent = true;
                    break;
                }
            }

            if (!stillPresent) {
                rustplus.foundSubscriptionItems[orderType] = rustplus.foundSubscriptionItems[orderType]
                    .filter((e: any) => e.vId !== foundItem.vId);
            }
        }
    }

    rustplus.firstPollItems = { all: [], buy: [], sell: [] };
}