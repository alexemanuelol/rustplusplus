/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

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

const Axios = require('axios');
const Fs = require('fs');
const Path = require('path');

const Utils = require('../util/utils.js');


/* Constants */

const SLEEP_TIMEOUT_MS = 2000;

const RUSTLABS_ALL_ITEMS_URL = 'https://wiki.rustclash.com/group=itemlist';
const RUSTLABS_ITEM_URL = 'https://wiki.rustclash.com/item/';

const RUSTLABS_ALL_LOOT_CONTAINERS_URL = 'https://wiki.rustclash.com/group=containers';
const RUSTLABS_ENTITY_URL = 'https://wiki.rustclash.com/entity/';

const RUSTLABS_ALL_BUILDING_BLOCKS_URL = 'https://wiki.rustclash.com/group=building-blocks';
const RUSTLABS_BUILDING_BLOCK_URL = 'https://wiki.rustclash.com/building/';

const RUSTLABS_ALL_OTHER_URL = 'https://wiki.rustclash.com/group=else';
const RUSTLABS_OTHER_URL = 'https://wiki.rustclash.com/entity/';


const RUSTLABS_ALL_ITEMS_REGEX = /<a\shref="\/item\/(.*?)"\sclass.*?img\ssrc=.*?img\/.*?\/(.*?)\.png"\salt="(.*?)"/gm
const RUSTLABS_ITEM_RECYCLE_AREA_REGEX = /Recycler<\/th>(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_RECYCLE_ROW_REGEX = /<td class="left">(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_RECYCLE_ITEM_REGEX = /\/entity\/(.*?)"/gm
const RUSTLABS_ITEM_RECYCLE_ITEM_EFFICIENCY_REGEX = /<td\sdata-value="(.*?)">.*?%<\/td>/gm
const RUSTLABS_ITEM_RECYCLE_OUTPUT_ITEMS_REGEX = /<a\shref.*?img\/.*?\/(.*?)\.png.*?alt="(.*?)".*?text-in-icon">(.*?)<\/span><\/a>/gm

const RUSTLABS_ITEM_CRAFT_AREA_REGEX = /data-name="craft"\sclass="tab-page(\n|.)*?<\/thead(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_CRAFT_INGREDIENTS_REGEX =
    /<a\shref.*?img\/.*?\/(.*?)\.png.*?alt="(.*?)".*?text-in-icon">(.*?)<\/span><\/a>/gm
const RUSTLABS_ITEM_CRAFT_TIME_REGEX = /^\s*<td\sdata-value="(.*?)">(.*?)<\/td>/gm

const RUSTLABS_ITEM_RESEARCH_AREA_REGEX =
    /data-name="blueprint"\sclass="tab-page(\n|.)*?<table\sclass(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_RESEARCH_ROW_REGEX = /<td\sclass="item-cell">(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_RESEARCH_TYPE_REGEX =
    /<td\sclass="item-cell">(\n|.)*?<img\sclass=""\ssrc="(\n|.)*?img\/(\n|.)*?\/(.*?)\.png/gm
const RUSTLABS_ITEM_RESEARCH_SCRAP_REGEX = /\/scrap\.png(\n|.)*?class="text-in-icon">(.*?)<\/span>/gm
const RUSTLABS_ITEM_RESEARCH_TOTAL_SCRAP_REGEX = /<td\sclass="no-padding"\sdata-value="(.*?)">/gm

const RUSTLABS_ITEM_DURABILITY_AREA_REGEX1 = /<tr\sdata-group="(.*?)"\sdata-group2="(.*?)">(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_DURABILITY_AREA_REGEX2 = /<tr\sdata-group="(.*?)">(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_DURABILITY_TOOL_REGEX = /<img\sclass=""\ssrc=".*?\/img\/.*?\/(.*?)\.png"\salt="(.*?)">/gm
const RUSTLABS_ITEM_DURABILITY_CAPTION_IN_TOOL_REGEX = /caption-in-item-name">(.*?)</gm
const RUSTLABS_ITEM_DURABILITY_QUANTITY_REGEX = /<td\sclass="no-padding"\sdata-value="(\d{1,7})">(.{1,10})<\/td>/gm
const RUSTLABS_ITEM_DURABILITY_QUANTITY_APPROX_REGEX = /Approximate\sQuantity">(.*?)</gm
const RUSTLABS_ITEM_DURABILITY_QUANTITY_GUNS_REGEX =
    /<img\ssrc=".*?\/img\/.*?\/(.*?)\.png"\salt="(.*?)"\sclass="icon-in-text">(.*?)</gm
const RUSTLABS_ITEM_DURABILITY_TIME_REGEX = /<td\sdata-value="(.*?)">(.*?sec|.*?min)<\/td>/gm
const RUSTLABS_ITEM_DURABILITY_FUEL_AMOUNT_REGEX = /alt="Fuel\sAmount">(.*?)<\/td>/gm
const RUSTLABS_ITEM_DURABILITY_SULFUR_AMOUNT_REGEX = /alt="Sulfur\sAmount">(.*?)<\/td>/gm

const RUSTLABS_ITEM_SMELTING_AREA_REGEX1 =
    /data-name="smelting"\sclass="tab-page(\n|.)*?<table\sclass(\n|.)*?<thead><tr>\n<th>Process(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_SMELTING_AREA_REGEX2 = /<tbody>(\n|.)*?<\/tbody>/gm
const RUSTLABS_ITEM_SMELTING_AREA_REGEX3 = /<tr>(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_SMELTING_REGEX1 =
    /<a\shref="\/item\/(\n|.)*?img\/.*?\/(.*?)\.png"\salt="(.*?)"(\n|.)*?<\/a><a\shref="\/item\/(\n|.)*?img\/.*?\/wood\.png"(\n|.)*?text-in-icon">(.*?)<\/span(\n|.)*?<a\shref="\/item\/(\n|.)*?img\/.*?\/(.*?)\.png"\salt="(.*?)"(\n|.)*?text-in-icon">(.*?)<(\n|.)*?<td>(.*?sec|.*?min)</gm
const RUSTLABS_ITEM_SMELTING_REGEX2 = /<a\shref="\/item\/(\n|.)*?img\/.*?\/(.*?)\.png"\salt="(.*?)"(\n|.)*?<a\shref="\/item\/(\n|.)*?img\/.*?\/(.*?)\.png"\salt="(.*?)"(\n|.)*?text-in-icon">(.*?)<\/span(\n|.)*?<td>(.*?sec|.*?min)</gm

const RUSTLABS_ITEM_DESPAWN_REGEX = /<td>Despawn\stime<\/td>(\n|.)*?<td>(.*?)<\/td>/gm

const RUSTLABS_ITEM_STACK_REGEX = /<td>Stack\sSize<\/td>(\n|.)*?<td>(.*?)<\/td>/gm

const RUSTLABS_ITEM_DECAY_REGEX1 =
    /<td>Decay<\/td>(\n|.){1,3}?<td>(.*?)<\/td>(\n|.)*?<td>HP<\/td>(\n|.){1,3}?<td>(.*?)<\/td>/gm
const RUSTLABS_ITEM_DECAY_REGEX2 =
    /<td>Decay\stime\soutside<\/td>(\n|.){1,3}?<td>(.*?)<\/td>(\n|.)*?<td>Decay\stime\sinside<\/td>(\n|.){1,3}?<td>(.*?)<\/td>(\n|.)*?<td>HP<\/td>(\n|.){1,3}?<td>(.*?)<\/td>/gm
const RUSTLABS_ITEM_DECAY_REGEX3 =
    /<td>Decay\stime\soutside<\/td>(\n|.){1,3}?<td>(.*?)<\/td>(\n|.)*?<td>Decay\stime\sunderwater<\/td>(\n|.){1,3}?<td>(.*?)<\/td>(\n|.)*?<td>HP<\/td>(\n|.){1,3}?<td>(.*?)<\/td>/gm
const RUSTLABS_ITEM_DECAY_REGEX4 =
    /<td>Decay\stime\soutside<\/td>(\n|.){1,3}?<td>(.*?)<\/td>(\n|.)*?<td>HP<\/td>(\n|.){1,3}?<td>(.*?)<\/td>/gm

const RUSTLABS_ITEM_UPKEEP_AREA_REGEX = /<td>Upkeep<\/td>(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_UPKEEP_REGEX =
    /img\ssrc=".*?\/img\/.*?\/(.*?)\.png"\salt="(.*?)"(\n|.)*?class="icon-in-text">(.*?)</gm

const RUSTLABS_ALL_BUILDING_BLOCKS_REGEX = /\/building\/(.*?)">(.*?)</gm

const RUSTLABS_ALL_OTHER_REGEX = /\/entity\/(.*?)">(.*?)</gm


/* Global variables */

const ITEMS = JSON.parse(Fs.readFileSync(Path.join(__dirname, '..', 'staticFiles', 'items.json'), 'utf8'));

const rustlabsLootContainers = new Object();
const rustlabsBuildingBlocks = new Object();
const rustlabsOther = new Object();

const rustlabsCraftData = new Object();
const rustlabsResearchData = new Object();
const rustlabsRecycleData = new Object();
const rustlabsDurabilityData = new Object();
rustlabsDurabilityData['items'] = new Object();
rustlabsDurabilityData['buildingBlocks'] = new Object();
rustlabsDurabilityData['other'] = new Object();
const rustlabsSmeltingData = new Object();
const rustlabsDespawnData = new Object();
const rustlabsStackData = new Object();
const rustlabsDecayData = new Object();
rustlabsDecayData['items'] = new Object();
rustlabsDecayData['buildingBlocks'] = new Object();
rustlabsDecayData['other'] = new Object();
const rustlabsUpkeepData = new Object();
rustlabsUpkeepData['items'] = new Object();
rustlabsUpkeepData['buildingBlocks'] = new Object();
rustlabsUpkeepData['other'] = new Object();

async function scrape(url) {
    try {
        return await Axios.get(url);
    }
    catch (e) {
        return {};
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function exit(url = null) {
    if (url !== null) {
        console.error(`Failed to get: ${url}. Exiting...`);
    }
    else {
        console.error('Something went wrong. Exiting...');
    }
    process.exit(1);
}

function parseTime(time) {
    let totalSeconds = 0;
    let seconds = 0;
    let minutes = 0;
    let hours = 0;
    let matches = null;
    let hoursFound = false;

    matches = [...time.matchAll(/(\d+|\d+\.\d+) hours/gm)];
    if (matches.length === 1) {
        hoursFound = true;
        hours = parseFloat(matches[0][1]);
    }

    matches = [...time.matchAll(/(\d+|\d+\.\d+) hour/gm)];
    if (matches.length === 1 && !hoursFound) {
        hours = parseFloat(matches[0][1]);
    }

    matches = [...time.matchAll(/(\d+|\d+\.\d+) min/gm)];
    if (matches.length === 1) {
        minutes = parseFloat(matches[0][1]);
    }

    matches = [...time.matchAll(/(\d+|\d+\.\d+) sec/gm)];
    if (matches.length === 1) {
        seconds = parseFloat(matches[0][1]);
    }

    totalSeconds = seconds + (minutes * 60) + (hours * 60 * 60);

    return totalSeconds;
}

async function processAll() {
    await processAllItems();
    await processAllLootContainers();
    await processAllBuildingBlocks();
    await processAllOther();
}

async function processAllItems() {
    const rustlabsItemNames = [];
    const response = await scrape(RUSTLABS_ALL_ITEMS_URL);

    if (response.status !== 200) exit(RUSTLABS_ALL_ITEMS_URL);

    const matches = response.data.matchAll(RUSTLABS_ALL_ITEMS_REGEX);
    for (const match of matches) {
        if (match.length !== 4) exit();

        rustlabsItemNames.push([
            Utils.decodeHtml(match[1]).replace('%20', ' '),
            Utils.decodeHtml(match[2]).replace('%20', ' '),
            Utils.decodeHtml(match[3]).replace('%20', ' ')
        ]);
    }

    rustlabsItemNames.sort();
    const rustlabsNumberOfItems = rustlabsItemNames.length;

    let counter = 1;
    for (const item of rustlabsItemNames) {
        const rustlabsName = item[0];
        const shortname = item[1];
        const name = item[2];

        console.log(`Item ${name} (${counter}/${rustlabsNumberOfItems})`);
        counter += 1;

        const itemUrl = `${RUSTLABS_ITEM_URL}${rustlabsName}`;
        const itemResponse = await scrape(itemUrl);
        if (itemResponse.status !== 200) exit(itemUrl);

        const data = itemResponse.data;

        processItemCraft(rustlabsName, shortname, name, data);
        processItemResearch(rustlabsName, shortname, name, data);
        processItemRecycle(rustlabsName, shortname, name, data);
        processItemDurability(rustlabsName, shortname, name, data);
        processItemSmelting(rustlabsName, shortname, name, data);
        processItemDespawn(rustlabsName, shortname, name, data);
        processItemStack(rustlabsName, shortname, name, data);
        processItemDecay(rustlabsName, shortname, name, data);
        processItemUpkeep(rustlabsName, shortname, name, data);

        await sleep(SLEEP_TIMEOUT_MS);
    }
}

async function processAllLootContainers() {

}

async function processAllBuildingBlocks() {
    const rustlabsBuildingBlockNames = [];
    const response = await scrape(RUSTLABS_ALL_BUILDING_BLOCKS_URL);

    if (response.status !== 200) exit(RUSTLABS_ALL_BUILDING_BLOCKS_URL);

    const matches = response.data.matchAll(RUSTLABS_ALL_BUILDING_BLOCKS_REGEX);
    for (const match of matches) {
        if (match.length !== 3) exit();

        rustlabsBuildingBlockNames.push([
            Utils.decodeHtml(match[1]).replace('%20', ' '),
            Utils.decodeHtml(match[2]).replace('%20', ' ')
        ]);
    }

    rustlabsBuildingBlockNames.sort();
    const rustlabsNumberOfBuildingBlocks = rustlabsBuildingBlockNames.length;

    let counter = 1;
    for (const buildingBlock of rustlabsBuildingBlockNames) {
        const rustlabsName = buildingBlock[0];
        const name = buildingBlock[1];

        rustlabsBuildingBlocks[name] = rustlabsName;

        console.log(`Building Block ${name} (${counter}/${rustlabsNumberOfBuildingBlocks})`);
        counter += 1;

        const itemUrl = `${RUSTLABS_BUILDING_BLOCK_URL}${rustlabsName}`;
        const itemResponse = await scrape(itemUrl);
        if (itemResponse.status !== 200) exit(itemUrl);

        const data = itemResponse.data;

        processItemDurability(rustlabsName, null, name, data, 'buildingBlocks');
        processItemDecay(rustlabsName, null, name, data, 'buildingBlocks');
        processItemUpkeep(rustlabsName, null, name, data, 'buildingBlocks');

        await sleep(SLEEP_TIMEOUT_MS);
    }
}

async function processAllOther() {
    const rustlabsOtherNames = [];

    const response = await scrape(RUSTLABS_ALL_OTHER_URL);

    if (response.status !== 200) exit(RUSTLABS_ALL_OTHER_URL);

    const matches = response.data.matchAll(RUSTLABS_ALL_OTHER_REGEX);
    for (const match of matches) {
        if (match.length !== 3) exit();

        rustlabsOtherNames.push([
            Utils.decodeHtml(match[1]).replace('%20', ' '),
            Utils.decodeHtml(match[2]).replace('%20', ' ')
        ]);
    }

    rustlabsOtherNames.sort();
    const rustlabsNumberOfOther = rustlabsOtherNames.length;

    let counter = 1;
    for (const other of rustlabsOtherNames) {
        const rustlabsName = other[0];
        const name = other[1];

        rustlabsOther[name] = rustlabsName;

        console.log(`Other ${name} (${counter}/${rustlabsNumberOfOther})`);
        counter += 1;

        const itemUrl = `${RUSTLABS_OTHER_URL}${rustlabsName}`;
        const itemResponse = await scrape(itemUrl);
        if (itemResponse.status !== 200) exit(itemUrl);

        const data = itemResponse.data;

        processItemDurability(rustlabsName, null, name, data, 'other');
        processItemDecay(rustlabsName, null, name, data, 'other');
        processItemUpkeep(rustlabsName, null, name, data, 'other');

        await sleep(SLEEP_TIMEOUT_MS);
    }
}

function processItemCraft(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    data = data.match(RUSTLABS_ITEM_CRAFT_AREA_REGEX);
    if (data === null || data.length !== 1) {
        console.log('  - No craft data found.');
        return;
    }
    data = data[0];

    const content = new Object();
    content['ingredients'] = [];
    content['workbench'] = null;
    content['time'] = null;
    content['timeString'] = null;

    const ingredientsMatches = data.matchAll(RUSTLABS_ITEM_CRAFT_INGREDIENTS_REGEX);

    for (const match of ingredientsMatches) {
        if (match.length !== 4) exit();

        const shortnameSub = match[1];
        const nameSub = Utils.decodeHtml(match[2]);
        let quantity = match[3];
        const id = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortnameSub && ITEMS[e].name === nameSub);
        if (id === undefined) exit();

        if (shortnameSub.includes('workbench')) {
            content['workbench'] = id;
            continue;
        }

        quantity = quantity === '' ? 1 : quantity.replace('×', '').replace(/,/g, '');

        content['ingredients'].push({
            id: id,
            quantity: parseFloat(quantity)
        });
    }

    const timeMatches = data.matchAll(RUSTLABS_ITEM_CRAFT_TIME_REGEX)
    for (const match of timeMatches) {
        if (match.length !== 3) exit();

        content['time'] = parseFloat(match[1]);
        content['timeString'] = match[2];
        break;
    }

    rustlabsCraftData[itemId] = content;
}

function processItemResearch(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    data = data.match(RUSTLABS_ITEM_RESEARCH_AREA_REGEX);
    if (data === null || data.length !== 1) {
        console.log('  - No research data found.');
        return;
    }
    data = data[0];

    const content = new Object();
    content['researchTable'] = null;
    content['workbench'] = null;

    let alreadyWorkbench = false;
    const rows = data.matchAll(RUSTLABS_ITEM_RESEARCH_ROW_REGEX);
    for (const row of rows) {
        if (row.length !== 2) exit();
        const rowData = row[0];

        let type = null;
        const typeMatches = rowData.matchAll(RUSTLABS_ITEM_RESEARCH_TYPE_REGEX);
        for (const match of typeMatches) {
            if (match.length !== 5) exit();
            type = match[4];
            break;
        }

        let scrap = null;
        const scrapMatches = rowData.matchAll(RUSTLABS_ITEM_RESEARCH_SCRAP_REGEX);
        for (const match of scrapMatches) {
            if (match.length !== 3) exit();
            scrap = match[2].replace('×', '').replace(/,/g, '');
            break;
        }

        let totalScrap = null;
        const totalScrapMatches = rowData.matchAll(RUSTLABS_ITEM_RESEARCH_TOTAL_SCRAP_REGEX);
        for (const match of totalScrapMatches) {
            if (match.length !== 2) exit();
            totalScrap = match[1];
            break;
        }

        if (type === null || scrap === null || totalScrap === null) exit();

        if (type === 'research.table') {
            content['researchTable'] = parseFloat(scrap);
        }
        else if (type.includes('workbench')) {
            if (alreadyWorkbench) break;
            alreadyWorkbench = true;

            const workbenchId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === type);
            if (!workbenchId) exit();

            content['workbench'] = {
                type: workbenchId,
                scrap: parseFloat(scrap),
                totalScrap: parseFloat(totalScrap)
            };
        }
        else {
            exit();
        }
    }

    rustlabsResearchData[itemId] = content;
}

function processItemRecycle(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    data = data.match(RUSTLABS_ITEM_RECYCLE_AREA_REGEX);
    if (data === null || data.length !== 1) {
        console.log('  - No recycle data found.');
        return;
    }
    data = data[0];

    const recycleData = new Object();
    recycleData['recycler'] = new Object();
    recycleData['recycler']['efficiency'] = null;
    recycleData['recycler']['yield'] = [];
    recycleData['shredder'] = new Object();
    recycleData['shredder']['efficiency'] = null;
    recycleData['shredder']['yield'] = [];
    recycleData['safe-zone-recycler'] = new Object();
    recycleData['safe-zone-recycler']['efficiency'] = null;
    recycleData['safe-zone-recycler']['yield'] = [];

    const rows = data.matchAll(RUSTLABS_ITEM_RECYCLE_ROW_REGEX);
    for (const row of rows) {
        if (row.length !== 2) exit();
        const rowData = row[0];

        let recyclerType = null;
        const recyclerMatches = rowData.matchAll(RUSTLABS_ITEM_RECYCLE_ITEM_REGEX);
        for (const match of recyclerMatches) {
            if (match.length !== 2) exit();
            recyclerType = match[1];
            break;
        }
        if (recyclerType === null) exit();

        let efficiency = null;
        const efficiencyMatches = rowData.matchAll(RUSTLABS_ITEM_RECYCLE_ITEM_EFFICIENCY_REGEX);
        for (const match of efficiencyMatches) {
            if (match.length !== 2) exit();
            efficiency = match[1];
            break;
        }
        recycleData[recyclerType]['efficiency'] = efficiency;

        const matches = rowData.matchAll(RUSTLABS_ITEM_RECYCLE_OUTPUT_ITEMS_REGEX);
        for (const match of matches) {
            if (match.length !== 4) exit();

            const shortnameSub = match[1];
            const nameSub = Utils.decodeHtml(match[2]);
            let quantity = match[3];
            const id = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortnameSub && ITEMS[e].name === nameSub);
            if (id === undefined) exit();

            let probability = 1;
            if (quantity === '') {
                quantity = 1;
            }
            else {
                quantity = quantity.replace('×', '').replace(/,/g, '');

                if (quantity.includes('%')) {
                    probability = `0.${quantity.replace('%', '')}`;
                    quantity = 1;
                }
            }

            recycleData[recyclerType]['yield'].push({
                id: id,
                probability: parseFloat(probability),
                quantity: parseFloat(quantity)
            });
        }
    }

    rustlabsRecycleData[itemId] = recycleData;
}

function processItemDurability(rustlabsName, shortname, name, data, type = 'items') {
    let itemId = null;
    if (type === 'items') {
        itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    }
    else if (type === 'buildingBlocks' || type === 'other') {
        itemId = name;
    }
    if (!itemId) return;

    if (!data.includes('Durability')) {
        console.log('  - No durability data found.');
        return;
    }

    let regexType = null;
    let matches = [...data.matchAll(RUSTLABS_ITEM_DURABILITY_AREA_REGEX1)];
    if (matches.length === 0) {
        matches = [...data.matchAll(RUSTLABS_ITEM_DURABILITY_AREA_REGEX2)];
        if (matches.length === 0) {
            console.log('  - No durability data found.');
            return;
        }
        regexType = 2;
    }
    else {
        regexType = 1;
    }

    const durabilityItems = [];

    for (const match of matches) {
        if ((regexType === 1 && match.length !== 4) || (regexType === 2 && match.length !== 3)) exit();

        const dataMatch = match[0];
        const group = match[1];
        let which = null;
        if (regexType === 1) {
            which = match[2];
        }

        /* Tool */
        let toolId = null, toolShortname = null, toolName = null;
        const toolMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_TOOL_REGEX)];
        if (toolMatches.length !== 0) {
            for (const toolMatch of toolMatches) {
                if (toolMatch.length !== 3) exit();
                toolShortname = Utils.decodeHtml(toolMatch[1]).replace('%20', ' ');
                toolName = Utils.decodeHtml(toolMatch[2]).replace('%20', ' ');
                break;
            }
        }
        if (toolShortname === null || toolName === null) exit();
        toolId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === toolShortname && ITEMS[e].name === toolName);
        if (!toolId) exit();

        /* Caption in tool name */
        let captionInTool = null;
        const captionInToolMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_CAPTION_IN_TOOL_REGEX)];
        if (captionInToolMatches.length !== 0) {
            for (const captionInToolMatch of captionInToolMatches) {
                if (captionInToolMatch.length !== 2) exit();
                captionInTool = captionInToolMatch[1];
                break;
            }
        }

        /* Quantity, if group 'guns' then use different regex, also if dataMatch includes 'Approximate Quantity' */
        let quantity = null, quantityTypeShortname = null, quantityTypeName = null;
        if (group === 'guns' || group === 'turret') {
            const quantityMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_GUNS_REGEX)];
            if (quantityMatches.length !== 0) {
                for (const quantityMatch of quantityMatches) {
                    if (quantityMatch.length !== 4) exit();
                    quantityTypeShortname = quantityMatch[1];
                    quantityTypeName = quantityMatch[2];
                    quantity = quantityMatch[3].replace('×', '').replace(/,/g, '');
                    break;
                }
            }
        }
        else if (dataMatch.includes('Approximate Quantity')) {
            const quantityMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_APPROX_REGEX)];
            if (quantityMatches.length !== 0) {
                for (const quantityMatch of quantityMatches) {
                    if (quantityMatch.length !== 2) exit();
                    quantity = quantityMatch[1].replace('×', '').replace(/,/g, '').replace('~ ', '');
                    break;
                }
            }
        }
        else {
            const quantityMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_REGEX)];
            if (quantityMatches.length !== 0) {
                for (const quantityMatch of quantityMatches) {
                    if (quantityMatch.length !== 3) exit();
                    quantity = quantityMatch[1].replace('×', '').replace(/,/g, '');
                    break;
                }
            }
        }
        if (quantity === null) exit();

        let quantityTypeId = null;
        if (quantityTypeShortname !== null && quantityTypeName !== null) {
            quantityTypeId = Object.keys(ITEMS).find(e =>
                ITEMS[e].shortname === quantityTypeShortname && ITEMS[e].name === quantityTypeName);
            if (!quantityTypeId) exit();
        }

        /* Time */
        let timeString = null, time = null;
        const timeMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_TIME_REGEX)];
        if (timeMatches.length !== 0) {
            for (const timeMatch of timeMatches) {
                if (timeMatch.length !== 3) exit();
                time = parseFloat(timeMatch[1]);
                timeString = timeMatch[2];
                break;
            }
        }

        /* Amount of fuel */
        let fuel = null;
        const fuelMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_FUEL_AMOUNT_REGEX)];
        if (fuelMatches.length !== 0) {
            for (const fuelMatch of fuelMatches) {
                if (fuelMatch.length !== 2) exit();
                fuel = fuelMatch[1].replace('×', '').replace(/,/g, '');
                fuel = parseFloat(fuel);
                break;
            }
        }

        /* Amount of sulfur */
        let sulfur = null;
        const sulfurMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_SULFUR_AMOUNT_REGEX)];
        if (sulfurMatches.length !== 0) {
            for (const sulfurMatch of sulfurMatches) {
                if (sulfurMatch.length !== 2) exit();
                sulfur = sulfurMatch[1].replace('×', '').replace(/,/g, '');
                sulfur = parseFloat(sulfur);
                break;
            }
        }

        durabilityItems.push({
            group: group,
            which: which,
            toolId: toolId,
            caption: captionInTool,
            quantity: parseFloat(quantity),
            quantityTypeId: quantityTypeId,
            time: time,
            timeString: timeString,
            fuel: fuel,
            sulfur: sulfur
        });
    }

    rustlabsDurabilityData[type][itemId] = durabilityItems;
}

function processItemSmelting(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    data = data.match(RUSTLABS_ITEM_SMELTING_AREA_REGEX1);
    if (data === null || data.length !== 1) {
        console.log('  - No smelting data found.');
        return;
    }
    data = data[0];

    data = data.match(RUSTLABS_ITEM_SMELTING_AREA_REGEX2);
    if (data === null || data.length !== 1) {
        console.log('  - No smelting data found.');
        return;
    }
    data = data[0];

    const content = [];

    const smeltingMatches = [...data.matchAll(RUSTLABS_ITEM_SMELTING_AREA_REGEX3)];
    for (const smeltingMatch of smeltingMatches) {
        const area = smeltingMatch[0];

        let fromShortname = null;
        let fromName = null;
        let woodQuantity = null;
        let toShortname = null;
        let toName = null;
        let toQuantity = null;
        let toProbability = null;
        let time = null;
        let timeString = null;

        let matches = [...area.matchAll(RUSTLABS_ITEM_SMELTING_REGEX1)];
        if (matches.length === 0) {
            /* Try the second regex */
            matches = [...area.matchAll(RUSTLABS_ITEM_SMELTING_REGEX2)];
            if (matches.length === 1) {
                matches = matches[0];
                if (matches.length !== 12) exit();

                fromShortname = matches[2];
                fromName = Utils.decodeHtml(matches[3]);
                woodQuantity = (fromShortname === 'wood' && fromName === 'Wood') ? 1 : 0;
                toShortname = matches[6];
                toName = Utils.decodeHtml(matches[7]);

                toQuantity = matches[9];
                toProbability = 1;
                if (toQuantity === '') {
                    toQuantity = 1;
                }
                else {
                    toQuantity = toQuantity.replace('×', '').replace(/,/g, '');

                    if (toQuantity.includes('%')) {
                        toProbability = parseFloat(`0.${toQuantity.replace('%', '')}`);
                        toQuantity = 1;
                    }
                    else {
                        toQuantity = parseFloat(toQuantity);
                    }
                }

                time = parseTime(matches[11]);
                timeString = matches[11];
            }
            else {
                console.log('  - No smelting data found.');
                return;
            }
        }
        else if (matches.length === 1) {
            matches = matches[0];
            if (matches.length !== 16) exit();

            fromShortname = matches[2];
            fromName = Utils.decodeHtml(matches[3]);
            woodQuantity = parseFloat(matches[7].replace('×', '').replace(/,/g, ''));
            toShortname = matches[10];
            toName = Utils.decodeHtml(matches[11]);
            toQuantity = matches[13] === '' ? 1 : parseFloat(matches[13].replace('×', '').replace(/,/g, ''));
            toProbability = 1;
            time = parseTime(matches[15]);
            timeString = matches[15];
        }
        else {
            console.log('  - No smelting data found.');
            return;
        }

        const fromId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === fromShortname && ITEMS[e].name === fromName);
        if (!fromId) exit();
        const toId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === toShortname && ITEMS[e].name === toName);
        if (!toId) exit();


        content.push({
            fromId: fromId,
            woodQuantity: woodQuantity,
            toId: toId,
            toQuantity: toQuantity,
            toProbability: toProbability,
            time: time,
            timeString: timeString
        });
    }

    rustlabsSmeltingData[itemId] = content;
}

function processItemDespawn(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    let matches = [...data.matchAll(RUSTLABS_ITEM_DESPAWN_REGEX)];
    if (matches.length !== 1) {
        console.log('  - No despawn data found.');
        return;
    }

    matches = matches[0];
    if (matches.length !== 3) {
        console.log('  - No despawn data found.');
        return;
    }

    const string = matches[2].trim();
    const seconds = parseTime(string);

    rustlabsDespawnData[itemId] = new Object();
    rustlabsDespawnData[itemId]["time"] = seconds;
    rustlabsDespawnData[itemId]["timeString"] = string;
}

function processItemStack(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    let matches = [...data.matchAll(RUSTLABS_ITEM_STACK_REGEX)];
    if (matches.length !== 1) {
        console.log('  - No stack data found.');
        return;
    }

    matches = matches[0];
    if (matches.length !== 3) {
        console.log('  - No stack data found.');
        return;
    }

    const quantity = matches[2].trim().replace('×', '').replace(/,/g, '');

    rustlabsStackData[itemId] = new Object();
    rustlabsStackData[itemId]["quantity"] = quantity;
}

function processItemDecay(rustlabsName, shortname, name, data, type = 'items') {
    let itemId = null;
    if (type === 'items') {
        itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    }
    else if (type === 'buildingBlocks' || type === 'other') {
        itemId = name;
    }
    if (!itemId) return;

    let decay = null;
    let decayString = null
    let decayOutside = null;
    let decayOutsideString = null;
    let decayInside = null;
    let decayInsideString = null;
    let decayUnderwater = null;
    let decayUnderwaterString = null;
    let hp = null;
    let hpString = null;

    let matches = [...data.matchAll(RUSTLABS_ITEM_DECAY_REGEX1)];
    if (matches.length !== 1) {
        matches = [...data.matchAll(RUSTLABS_ITEM_DECAY_REGEX2)];
        if (matches.length !== 1) {
            matches = [...data.matchAll(RUSTLABS_ITEM_DECAY_REGEX3)];
            if (matches.length !== 1) {
                matches = [...data.matchAll(RUSTLABS_ITEM_DECAY_REGEX4)];
                if (matches.length !== 1) {
                    console.log('  - No decay data found.');
                    return;
                }
                else {
                    /* Decay time outside, HP */
                    matches = matches[0];
                    if (matches.length !== 6) {
                        console.log('  - No decay data found.');
                        return;
                    }

                    decayOutsideString = matches[2].trim();
                    decayOutside = parseTime(decayOutsideString);

                    hpString = matches[5].trim();
                    hp = parseInt(hpString);
                }
            }
            else {
                /* Decay time outside, Decay time underwater, HP */
                matches = matches[0];
                if (matches.length !== 9) {
                    console.log('  - No decay data found.');
                    return;
                }

                decayOutsideString = matches[2].trim();
                decayOutside = parseTime(decayOutsideString);

                decayUnderwaterString = matches[5].trim();
                decayUnderwater = parseTime(decayUnderwaterString);

                hpString = matches[8].trim();
                hp = parseInt(hpString);
            }
        }
        else {
            /* Decay time outside, Decay time inside, HP */
            matches = matches[0];
            if (matches.length !== 9) {
                console.log('  - No decay data found.');
                return;
            }

            decayOutsideString = matches[2].trim();
            decayOutside = parseTime(decayOutsideString);

            decayInsideString = matches[5].trim();
            decayInside = parseTime(decayInsideString);

            hpString = matches[8].trim();
            hp = parseInt(hpString);
        }
    }
    else {
        /* Decay, HP */
        matches = matches[0];
        if (matches.length !== 6) {
            console.log('  - No decay data found.');
            return;
        }

        decayString = matches[2].trim();
        decay = parseTime(decayString);

        hpString = matches[5].trim();
        hp = parseInt(hpString);
    }

    rustlabsDecayData[type][itemId] = {
        decay: decay,
        decayString: decayString,
        decayOutside: decayOutside,
        decayOutsideString: decayOutsideString,
        decayInside: decayInside,
        decayInsideString: decayInsideString,
        decayUnderwater: decayUnderwater,
        decayUnderwaterString: decayUnderwaterString,
        hp: hp,
        hpString: hpString
    };
}

function processItemUpkeep(rustlabsName, shortname, name, data, type = 'items') {
    let itemId = null;
    if (type === 'items') {
        itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    }
    else if (type === 'buildingBlocks' || type === 'other') {
        itemId = name;
    }
    if (!itemId) return;

    data = data.match(RUSTLABS_ITEM_UPKEEP_AREA_REGEX);
    if (data === null || data.length !== 1) {
        console.log('  - No upkeep data found.');
        return;
    }
    data = data[0];

    let matches = [...data.matchAll(RUSTLABS_ITEM_UPKEEP_REGEX)];
    if (matches.length === 0) {
        console.log('  - No upkeep data found.');
        return;
    }

    const content = [];
    for (const match of matches) {
        if (match.length !== 5) {
            console.log('  - No upkeep data found.');
            return;
        }

        const upkeepItemShortname = match[1];
        const upkeepItemName = Utils.decodeHtml(match[2]);
        const upkeepQuantity = match[4];

        const upkeepItemId = Object.keys(ITEMS).find(e =>
            ITEMS[e].shortname === upkeepItemShortname && ITEMS[e].name === upkeepItemName);

        if (!upkeepItemId) return;

        content.push({
            id: upkeepItemId,
            quantity: upkeepQuantity
        });
    }

    rustlabsUpkeepData[type][itemId] = content;
}

async function main() {
    await processAll();

    /* Populate the json files */
    Fs.writeFileSync(`${__dirname}/rustlabsBuildingBlocks.json`, JSON.stringify(rustlabsBuildingBlocks, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsOther.json`, JSON.stringify(rustlabsOther, null, 2));

    Fs.writeFileSync(`${__dirname}/rustlabsCraftData.json`, JSON.stringify(rustlabsCraftData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsResearchData.json`, JSON.stringify(rustlabsResearchData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsRecycleData.json`, JSON.stringify(rustlabsRecycleData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsDurabilityData.json`, JSON.stringify(rustlabsDurabilityData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsSmeltingData.json`, JSON.stringify(rustlabsSmeltingData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsDespawnData.json`, JSON.stringify(rustlabsDespawnData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsStackData.json`, JSON.stringify(rustlabsStackData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsDecayData.json`, JSON.stringify(rustlabsDecayData, null, 2));
    Fs.writeFileSync(`${__dirname}/rustlabsUpkeepData.json`, JSON.stringify(rustlabsUpkeepData, null, 2));
}

main();