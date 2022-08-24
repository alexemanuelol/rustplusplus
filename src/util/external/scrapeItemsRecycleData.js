/*
 * Purpose of this script is to scrape Rustlabs website and obtain all items and their recycle information.
 * Upon completing this, I found the page 'https://rustlabs.com/entity/recycler' that basically display every items
 * recycle output. But at this point Im too lazy to change to regex so Ill just leave it since I probably won't
 * run this code that often. ¯\_(ツ)_/¯
 */

const Axios = require('axios');
const Fs = require('fs');

const RUSTLABS_ITEMS_URL = 'https://rustlabs.com/group=itemlist';
const RUSTLABS_ITEM_SEARCH_URL = 'https://rustlabs.com/item/';


async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function scrape(url) {
    try {
        return await Axios.get(url);
    }
    catch (e) {
        return {};
    }
}

async function getArrayOfItemNames() {
    const response = await scrape(RUSTLABS_ITEMS_URL);

    if (response.status !== 200) {
        console.error(`Failed to get: ${RUSTLABS_ITEMS_URL}`);
        return null;
    }

    let items = [];
    let regex = /<a href="\/item\/(.+?)"/g
    let matches = response.data.matchAll(regex);


    for (let match of matches) {
        items.push(match[1]);
    }

    return items;
}

async function getItemsRecycleData(items) {
    let amountOfItems = items.length;

    let itemsRecycleData = new Object();
    let itemCounter = 1;
    for (let itemName of items) {
        itemName = itemName.replace('&amp;', '&');
        console.log(`Processing item: (${itemCounter}/${amountOfItems}) ${itemName}`);
        itemCounter += 1;

        let response = await scrape(`${RUSTLABS_ITEM_SEARCH_URL}${itemName}`);

        if (response.status !== 200) {
            console.error(`Failed with code: ${response.status}\nItem: ${itemName}`);
            console.log(response)
            return false;
        }

        let content = new Object();

        /* Obtain item ID */
        let itemIdRegex = /<td>Identifier<\/td>[\s\S]<td>(.+?)<\/td>/gm
        let data = itemIdRegex.exec(response.data);
        if (data.length !== 2) {
            console.error(`Failed when trying to obtain item '${itemName}' ID.`);
            return false;
        }
        content.id = data[1];
        content.recycle = [];

        /* Get recycle information if any */
        let recycleSectionRegex = /Recycler<\/a><\/td>[\s\S]<td class="no-padding">[\s\S](<span.+?)[\s\S]<\/td>/gm
        data = recycleSectionRegex.exec(response.data);
        if (data !== null && data.length !== 2) {
            console.error(`Failed when trying to obtain recycle section of item '${itemName}'.`);
            return false;
        }

        if (data !== null) {
            let recycleItemsRegex = /<a href="\/item\/(.+?)".*?text-in-icon">(.*?)<\/span><\/a>/gm
            let matches = data[1].matchAll(recycleItemsRegex);

            for (let match of matches) {
                let name = match[1];
                let probability = 1;
                let quantity = 0;

                if (match[2] === '') {
                    quantity = 1;
                }
                else {
                    quantity = match[2];
                    quantity = quantity.replace('×', '').replace(',', '')

                    if (quantity.includes('%')) {
                        probability = `0.${quantity.replace('%', '')}`
                        quantity = 1;
                    }
                }

                content.recycle.push({
                    name: name,
                    probability: parseFloat(probability),
                    quantity: parseFloat(quantity)
                });
            }
        }

        itemsRecycleData[itemName] = content;
        await sleep(1000);
    }

    return itemsRecycleData;
}

function convertToIdBased(itemsRecycleData) {
    let converted = new Object();

    for (const [itemName, content] of Object.entries(itemsRecycleData)) {
        let id = itemsRecycleData[itemName].id;

        let newContent = [];
        for (let recycleItem of content.recycle) {
            if (!Object.keys(itemsRecycleData).includes(recycleItem.name)) continue;
            newContent.push({
                id: itemsRecycleData[recycleItem.name].id,
                probability: recycleItem.probability,
                quantity: recycleItem.quantity
            });
        }

        converted[id] = newContent;
    }

    return converted;
}

async function main() {
    if (!Fs.existsSync(`${__dirname}/itemsRecycleDataScrape.json`)) {
        let items = await getArrayOfItemNames();
        if (items === null) {
            console.error('Failed to get array of item names.');
            return;
        }

        let data = await getItemsRecycleData(items);
        if (data === false) {
            console.error('Failed to obtain item recycle data');
            return;
        }

        Fs.writeFileSync(`${__dirname}/itemsRecycleDataScrape.json`, JSON.stringify(data, null, 2));
    }

    let itemsRecycleData = JSON.parse(Fs.readFileSync(`${__dirname}/itemsRecycleDataScrape.json`, 'utf8'));
    itemsRecycleData = convertToIdBased(itemsRecycleData);

    Fs.writeFileSync(`${__dirname}/itemsRecycleData.json`, JSON.stringify(itemsRecycleData, null, 2));
}

main()