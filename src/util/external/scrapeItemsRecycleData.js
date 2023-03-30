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

/*
 * Purpose of this script is to scrape Rustlabs website and obtain all items and their recycle information.
 */

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');

const RUSTLABS_ITEMS_RECYCLER = 'https://rustlabs.com/entity/recycler';


async function scrape(url) {
    try {
        return await Axios.get(url);
    }
    catch (e) {
        return {};
    }
}

async function generateRecycleObject() {
    const items = JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', 'items.json'), 'utf8'));
    const itemsRecycleData = new Object();
    const response = await scrape(RUSTLABS_ITEMS_RECYCLER);

    if (response.status !== 200) {
        console.error(`Failed to get: ${RUSTLABS_ITEMS_RECYCLER}`);
        return;
    }

    const regex = /<tr>\n?<td(.|\n)*?<\/tr>/gm
    const matches = response.data.matchAll(regex);

    for (const match of matches) {
        const nameRegex = /<td class="item-cell">\n?<img class.*?src=.*\/(.*?)\.png"/gm
        const nameMatches = match[0].matchAll(nameRegex);
        let itemName = null;
        for (const nameMatch of nameMatches) {
            itemName = nameMatch[1];
            break;
        }
        itemName = itemName.replace('&amp;', '&').replace('%20', ' ');

        const itemId = Object.keys(items).find(e => items[e].shortname === itemName);
        if (!itemId) continue;

        const content = new Object();
        content.id = itemId;
        content.recycle = [];

        const recycledItemsAreaRegex = /<td data-value="((.|\n)*?)<\/td>/gm
        let recycledItemsAreaMatch = [...match[0].matchAll(recycledItemsAreaRegex)];
        recycledItemsAreaMatch = recycledItemsAreaMatch[1][1];

        const recycledItemRegex = /<a href=".*?<img class.*?src="\/\/rustlabs.com\/img\/.*?\/(.*?)\.png".*?text-in-icon">(.*?)<\/span><\/a>/gm
        const recycledItemMatches = recycledItemsAreaMatch.matchAll(recycledItemRegex);

        for (const recycledItemMatch of recycledItemMatches) {
            const name = recycledItemMatch[1].replace('&amp;', '&').replace('%20', ' ');
            let probability = 1;
            let quantity = 0;

            if (recycledItemMatch[2] === '') {
                quantity = 1;
            }
            else {
                quantity = recycledItemMatch[2];
                quantity = quantity.replace('×', '').replace(',', '');

                if (quantity.includes('%')) {
                    probability = `0.${quantity.replace('%', '')}`;
                    quantity = 1;
                }
            }

            content.recycle.push({
                name: name,
                probability: parseFloat(probability),
                quantity: parseFloat(quantity)
            });
        }

        itemsRecycleData[itemName] = content;
    }

    return itemsRecycleData;
}

function convertToIdBased(itemsRecycleData) {
    const items = JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', 'items.json'), 'utf8'));
    const converted = new Object();
    for (const [itemName, content] of Object.entries(itemsRecycleData)) {
        const newContent = [];
        for (const recycleItem of content.recycle) {
            const itemId = Object.keys(items).find(e => items[e].shortname === recycleItem.name);
            if (!itemId) continue;

            newContent.push({
                id: itemId,
                probability: recycleItem.probability,
                quantity: recycleItem.quantity
            });
        }

        converted[content.id] = newContent;
    }

    return converted;
}

async function main() {
    let itemsRecycleData = await generateRecycleObject();
    itemsRecycleData = convertToIdBased(itemsRecycleData);
    Fs.writeFileSync(`${__dirname}/itemRecycleData.json`, JSON.stringify(itemsRecycleData, null, 2));
}

main()