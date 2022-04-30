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