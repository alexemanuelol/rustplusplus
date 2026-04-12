/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2026 FaiThix (faithix)

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

const Fs = require('fs');
const Path = require('path');

const Utils = require('../util/utils.js');

let Chromium = null;
try {
    ({ chromium: Chromium } = require('playwright-core'));
}
catch (error) {
    Chromium = null;
}


/* Constants */

const SLEEP_TIMEOUT_MS = 2000;
const OUTPUT_DIRECTORY = Path.join(__dirname, 'rustlabs');
const DEFAULT_TIMEOUT_MS = 30000;
const REQUEST_TIMEOUT_MS = Number.parseInt(process.env.RPP_RUSTLABS_TIMEOUT_MS || `${DEFAULT_TIMEOUT_MS}`, 10);
const CHALLENGE_WAIT_MS = Number.parseInt(process.env.RPP_RUSTLABS_CHALLENGE_WAIT_MS || '180000', 10);
const USE_PROXY = (process.env.RPP_RUSTLABS_USE_PROXY || '').toLowerCase() === 'true';
const BROWSER_HEADLESS = (process.env.RPP_RUSTLABS_HEADLESS || '').toLowerCase() === 'true';
const BROWSER_PROFILE_DIRECTORY = Path.join(OUTPUT_DIRECTORY, '.browser-profile');
const BROWSER_EXECUTABLE_PATH = (process.env.RPP_RUSTLABS_BROWSER_PATH || '').trim();
const BROWSER_USER_AGENT = (process.env.RPP_RUSTLABS_USER_AGENT ||
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36').trim();

const COOKIE_HEADER = (process.env.RPP_RUSTLABS_COOKIE || '').trim();
const CF_CLEARANCE = (process.env.RPP_RUSTLABS_CF_CLEARANCE || '').trim();

const RUSTLABS_ALL_ITEMS_URL = 'https://wiki.rustclash.com/group=itemlist';
const RUSTLABS_ITEM_URL = 'https://wiki.rustclash.com/item/';

const RUSTLABS_ALL_LOOT_CONTAINERS_URL = 'https://wiki.rustclash.com/group=containers';
const RUSTLABS_ENTITY_URL = 'https://wiki.rustclash.com/entity/';

const RUSTLABS_ALL_BUILDING_BLOCKS_URL = 'https://wiki.rustclash.com/group=building-blocks';
const RUSTLABS_BUILDING_BLOCK_URL = 'https://wiki.rustclash.com/building/';

const RUSTLABS_ALL_OTHER_URL = 'https://wiki.rustclash.com/group=else';
const RUSTLABS_OTHER_URL = 'https://wiki.rustclash.com/entity/';

const EXTRA_REQUEST_HEADERS = {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9'
};

const PROGRAM_FILES = process.env.ProgramFiles || 'C:\\Program Files';
const PROGRAM_FILES_X86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const DEFAULT_BROWSER_PATHS = [
    Path.join(PROGRAM_FILES, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    Path.join(PROGRAM_FILES_X86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    Path.join(PROGRAM_FILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    Path.join(PROGRAM_FILES_X86, 'Google', 'Chrome', 'Application', 'chrome.exe')
];


const RUSTLABS_ALL_ITEMS_REGEX = /<a\shref="\/item\/(.*?)"\sclass.*?img\ssrc=.*?img\/.*?\/(.*?)\.png"\salt="(.*?)"/gm
const RUSTLABS_ITEM_RECYCLE_AREA_REGEX = /Recycler<\/th>(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_RECYCLE_ROW_REGEX = /<td class="left">(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_RECYCLE_ITEM_REGEX = /\/entity\/(.*?)"/gm
const RUSTLABS_ITEM_RECYCLE_ITEM_EFFICIENCY_REGEX = /<td\sdata-value="(.*?)">.*?%<\/td>/gm
const RUSTLABS_ITEM_RECYCLE_OUTPUT_ITEMS_REGEX = /<a\shref.*?img\/.*?\/(.*?)\.png.*?alt="(.*?)".*?text-in-icon">(.*?)<\/span><\/a>/gm

const RUSTLABS_ITEM_CRAFT_AREA_REGEX = /data-name="craft"\sclass="tab-page(\n|.)*?<table\sclass(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_MIXING_AREA_REGEX = /data-name="mixing"\sclass="tab-page(\n|.)*?<table\sclass(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_CRAFT_ROW_REGEX = /<tbody>\s*<tr[^>]*>(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_TABLE_HEADER_REGEX = /<th\b([^>]*)>([\s\S]*?)<\/th>/gm
const RUSTLABS_ITEM_TABLE_CELL_REGEX = /<td\b([^>]*)>([\s\S]*?)<\/td>/gm
const RUSTLABS_ITEM_CRAFT_INGREDIENTS_REGEX =
    /<a\shref.*?img\/.*?\/(.*?)\.png.*?alt="(.*?)".*?text-in-icon">(.*?)<\/span><\/a>/gm
const RUSTLABS_ITEM_CRAFT_TIME_IN_CELL_ATTRS_REGEX = /data-value="(.*?)"/gm
const CRAFT_WORKBENCH_SHORTNAME_PRIORITY = ['workbench3', 'workbench2', 'workbench1', 'mixingtable', 'cookingworkbench', 'iotable'];

const RUSTLABS_ITEM_RESEARCH_AREA_REGEX =
    /data-name="blueprint"\sclass="tab-page(\n|.)*?<table\sclass(\n|.)*?<\/table>/gm
const RUSTLABS_ITEM_RESEARCH_ROW_REGEX = /<td\sclass="item-cell">(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_RESEARCH_TYPE_REGEX =
    /<td\sclass="item-cell">(\n|.)*?<img[^>]*\ssrc="(\n|.)*?img\/(\n|.)*?\/(.*?)\.png/gm
const RUSTLABS_ITEM_RESEARCH_SCRAP_REGEX = /\/scrap\.png(\n|.)*?class="text-in-icon">(.*?)<\/span>/gm
const RUSTLABS_ITEM_RESEARCH_TOTAL_SCRAP_REGEX = /<td\sclass="no-padding"\sdata-value="(.*?)">/gm

const RUSTLABS_ITEM_DURABILITY_AREA_REGEX1 =
    /<tr\s+[^>]*data-group="([^"]+)"[^>]*data-group2="([^"]+)"[^>]*>(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_DURABILITY_AREA_REGEX2 = /<tr\s+[^>]*data-group="([^"]+)"[^>]*>(\n|.)*?<\/tr>/gm
const RUSTLABS_ITEM_DURABILITY_TOOL_REGEX = /<img\sclass=""\ssrc=".*?\/img\/.*?\/(.*?)\.png"\salt="(.*?)">/gm
const RUSTLABS_ITEM_DURABILITY_CAPTION_IN_TOOL_REGEX = /caption-in-item-name">(.*?)</gm
const RUSTLABS_ITEM_DURABILITY_QUANTITY_REGEX = /<td\sclass="no-padding"\sdata-value="(\d{1,7})">(.{1,10})<\/td>/gm
const RUSTLABS_ITEM_DURABILITY_QUANTITY_DATA_VALUE_REGEX = /<td\sclass="no-padding"\sdata-value="([^"]+)">/gm
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

let browserContext = null;
let browserPage = null;

function getRequestTimeout() {
    return Number.isNaN(REQUEST_TIMEOUT_MS) ? DEFAULT_TIMEOUT_MS : REQUEST_TIMEOUT_MS;
}

function getChallengeWaitMs() {
    return Number.isNaN(CHALLENGE_WAIT_MS) ? 180000 : CHALLENGE_WAIT_MS;
}

function getCookieHeader() {
    if (COOKIE_HEADER !== '') {
        return COOKIE_HEADER;
    }
    if (CF_CLEARANCE !== '') {
        return `cf_clearance=${CF_CLEARANCE}`;
    }
    return '';
}

function parseCookieHeader(cookieHeader) {
    const cookies = [];
    for (const part of cookieHeader.split(';')) {
        const trimmed = part.trim();
        if (trimmed === '') continue;

        const separatorIndex = trimmed.indexOf('=');
        if (separatorIndex <= 0) continue;

        const name = trimmed.slice(0, separatorIndex).trim();
        const value = trimmed.slice(separatorIndex + 1).trim();
        if (name === '') continue;

        cookies.push({
            name: name,
            value: value
        });
    }

    return cookies;
}

function buildCookieObjectsForHost(url, cookieHeader) {
    if (cookieHeader === '') return [];

    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname;
    const cookies = parseCookieHeader(cookieHeader);

    return cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: host,
        path: '/',
        secure: parsedUrl.protocol === 'https:',
        httpOnly: false
    }));
}

function isCloudflareChallenge(status, data) {
    if (typeof data !== 'string') return false;
    const page = data.toLowerCase();

    const containsChallengeText = page.includes('just a moment') ||
        page.includes('attention required') ||
        page.includes('checking your browser') ||
        page.includes('cf-browser-verification');

    if (!containsChallengeText) {
        return false;
    }

    return status === 200 || status === 403 || status === 429 || status === 503 || status === null || status === undefined;
}

function resolveBrowserExecutablePath() {
    if (BROWSER_EXECUTABLE_PATH !== '') {
        if (!Fs.existsSync(BROWSER_EXECUTABLE_PATH)) {
            return null;
        }
        return BROWSER_EXECUTABLE_PATH;
    }

    for (const browserPath of DEFAULT_BROWSER_PATHS) {
        if (Fs.existsSync(browserPath)) {
            return browserPath;
        }
    }

    return null;
}

function parsePlaywrightProxyConfiguration() {
    const rawProxy = (process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.ALL_PROXY || '').trim();
    if (rawProxy === '') {
        return null;
    }

    let parsedProxy = null;
    try {
        parsedProxy = new URL(rawProxy);
    }
    catch (error) {
        return { invalid: rawProxy };
    }

    const proxyConfig = {
        server: `${parsedProxy.protocol}//${parsedProxy.host}`
    };

    if (parsedProxy.username !== '') {
        proxyConfig['username'] = decodeURIComponent(parsedProxy.username);
    }
    if (parsedProxy.password !== '') {
        proxyConfig['password'] = decodeURIComponent(parsedProxy.password);
    }

    return proxyConfig;
}

async function initializeBrowser() {
    if (browserPage !== null && browserContext !== null) {
        return;
    }

    if (Chromium === null) {
        throw createRequestError(RUSTLABS_ALL_ITEMS_URL, {
            message: 'Missing dependency "playwright-core".',
            hints: [
                'Run: npm install playwright-core',
                'Then run this script again.'
            ]
        });
    }

    const executablePath = resolveBrowserExecutablePath();
    if (executablePath === null) {
        throw createRequestError(RUSTLABS_ALL_ITEMS_URL, {
            message: BROWSER_EXECUTABLE_PATH === '' ?
                'No supported browser executable was found.' :
                `Configured browser path does not exist: ${BROWSER_EXECUTABLE_PATH}`,
            hints: [
                'Install Microsoft Edge or Google Chrome.',
                'Or set RPP_RUSTLABS_BROWSER_PATH to your browser executable.'
            ]
        });
    }

    const launchOptions = {
        headless: BROWSER_HEADLESS,
        executablePath: executablePath,
        userAgent: BROWSER_USER_AGENT,
        args: ['--disable-blink-features=AutomationControlled']
    };

    if (!USE_PROXY) {
        launchOptions.args.push('--no-proxy-server');
    }
    else {
        const proxyConfiguration = parsePlaywrightProxyConfiguration();
        if (proxyConfiguration !== null && proxyConfiguration.invalid) {
            throw createRequestError(RUSTLABS_ALL_ITEMS_URL, {
                message: `Invalid proxy URL in environment: ${proxyConfiguration.invalid}`,
                hints: [
                    'Fix HTTP_PROXY/HTTPS_PROXY/ALL_PROXY.',
                    'Or disable proxy mode with RPP_RUSTLABS_USE_PROXY=false.'
                ]
            });
        }
        if (proxyConfiguration !== null) {
            launchOptions['proxy'] = proxyConfiguration;
        }
    }

    browserContext = await Chromium.launchPersistentContext(BROWSER_PROFILE_DIRECTORY, launchOptions);
    browserPage = browserContext.pages().length > 0 ? browserContext.pages()[0] : await browserContext.newPage();

    await browserPage.setExtraHTTPHeaders(EXTRA_REQUEST_HEADERS);
    browserPage.setDefaultTimeout(getRequestTimeout());
    browserPage.setDefaultNavigationTimeout(getRequestTimeout());

    const cookieHeader = getCookieHeader();
    const cookies = buildCookieObjectsForHost(RUSTLABS_ALL_ITEMS_URL, cookieHeader);
    if (cookies.length > 0) {
        await browserContext.addCookies(cookies);
    }
}

async function closeBrowser() {
    if (browserContext !== null) {
        await browserContext.close();
    }

    browserContext = null;
    browserPage = null;
}

async function waitForCloudflareBypass(url) {
    if (BROWSER_HEADLESS) {
        return null;
    }

    console.log('Cloudflare challenge detected. Solve it in the opened browser window.');

    const maxWaitMs = getChallengeWaitMs();
    const start = Date.now();

    while ((Date.now() - start) < maxWaitMs) {
        await sleep(2000);

        const content = await browserPage.content();
        if (isCloudflareChallenge(200, content)) {
            continue;
        }

        const retryResponse = await browserPage.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: getRequestTimeout()
        });

        const status = retryResponse ? retryResponse.status() : null;
        const retryContent = await browserPage.content();

        if (status === 200 && !isCloudflareChallenge(status, retryContent)) {
            return {
                status: status,
                data: retryContent,
                headers: retryResponse ? retryResponse.headers() : {}
            };
        }
    }

    return null;
}

function getErrorCodeFromMessage(message) {
    if (!message) return null;

    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('timed out') || lowerMessage.includes('timeout')) return 'ETIMEDOUT';
    if (lowerMessage.includes('err_name_not_resolved')) return 'ENOTFOUND';
    if (lowerMessage.includes('err_connection_refused')) return 'ECONNREFUSED';
    if (lowerMessage.includes('err_tunnel_connection_failed')) return 'ECONNREFUSED';
    return null;
}

function createRequestError(url, details = {}) {
    const error = new Error(`Request to ${url} failed.`);
    error.rustlabsRequestError = Object.assign({ url: url }, details);
    return error;
}

function normalizeRequestError(url, error) {
    if (error && error.rustlabsRequestError) {
        return error;
    }

    const message = (error && error.message) ? error.message : 'Unknown request error.';
    const code = getErrorCodeFromMessage(message);
    const hints = [];

    if (code === 'ETIMEDOUT') {
        hints.push(`The request timed out. Increase timeout with RPP_RUSTLABS_TIMEOUT_MS (currently ${getRequestTimeout()}ms).`);
    }
    else if (code === 'ENOTFOUND') {
        hints.push('DNS lookup failed. Check your internet connection and DNS settings.');
    }
    else if (code === 'ECONNREFUSED') {
        if (USE_PROXY) {
            hints.push('Connection was refused while using proxy settings. Check HTTP_PROXY/HTTPS_PROXY/ALL_PROXY or disable proxy with RPP_RUSTLABS_USE_PROXY=false.');
        }
        else {
            hints.push('Connection was refused by the target or local network policy.');
        }
    }

    if (message.includes('Executable doesn\'t exist')) {
        hints.push('Set RPP_RUSTLABS_BROWSER_PATH to your browser executable.');
    }

    return createRequestError(url, {
        code: code,
        message: message,
        hints: hints
    });
}

async function scrape(url) {
    try {
        await initializeBrowser();

        const response = await browserPage.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: getRequestTimeout()
        });

        const status = response ? response.status() : null;
        const data = await browserPage.content();

        if (isCloudflareChallenge(status, data)) {
            const bypassResponse = await waitForCloudflareBypass(url);
            if (bypassResponse !== null) {
                return bypassResponse;
            }

            const hints = [
                'Cloudflare challenge detected.',
                BROWSER_HEADLESS ?
                    'Run with RPP_RUSTLABS_HEADLESS=false to solve the challenge interactively.' :
                    `Challenge was not solved within ${Math.floor(getChallengeWaitMs() / 1000)} seconds.`,
                'Set RPP_RUSTLABS_COOKIE=<full-cookie-header> if you already have valid session cookies.'
            ];

            throw createRequestError(url, {
                status: status,
                server: response ? response.headers()['server'] : null,
                responseSnippet: data.slice(0, 220),
                hints: hints
            });
        }

        if (status !== 200) {
            throw createRequestError(url, {
                status: status,
                server: response ? response.headers()['server'] : null,
                responseSnippet: data.slice(0, 220),
                hints: [`Unexpected HTTP status: ${status}`]
            });
        }

        return {
            status: status,
            data: data,
            headers: response ? response.headers() : {}
        };
    }
    catch (error) {
        throw normalizeRequestError(url, error);
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function exit(reason = null) {
    if (reason && reason.rustlabsRequestError) {
        const details = reason.rustlabsRequestError;

        console.error(`Failed to get: ${details.url}. Exiting...`);

        if (details.status !== null && details.status !== undefined) {
            console.error(`  - HTTP status: ${details.status}`);
        }
        if (details.code !== null && details.code !== undefined) {
            console.error(`  - Error code: ${details.code}`);
        }
        if (details.server !== null && details.server !== undefined && details.server !== '') {
            console.error(`  - Server: ${details.server}`);
        }
        if (details.message) {
            console.error(`  - Details: ${details.message}`);
        }
        if (details.responseSnippet) {
            console.error(`  - Response snippet: ${details.responseSnippet}`);
        }
        if (Array.isArray(details.hints) && details.hints.length > 0) {
            for (const hint of details.hints) {
                console.error(`  - Hint: ${hint}`);
            }
        }
    }
    else if (typeof reason === 'string') {
        console.error(`Failed to get: ${reason}. Exiting...`);
    }
    else if (reason instanceof Error) {
        console.error(`Something went wrong. Exiting...`);
        console.error(`  - ${reason.message}`);
    }
    else {
        console.error('Something went wrong. Exiting...');
        const stackTrace = new Error().stack;
        if (stackTrace) {
            const stackLines = stackTrace.split('\n').slice(2, 5);
            for (const line of stackLines) {
                console.error(`  - ${line.trim()}`);
            }
        }
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

async function preflightCheck() {
    console.log(`Preflight check: ${RUSTLABS_ALL_ITEMS_URL}`);
    await scrape(RUSTLABS_ALL_ITEMS_URL);
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

function sanitizeTableText(text) {
    if (typeof text !== 'string') return '';

    return Utils.decodeHtml(text)
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function findItemIdByShortnameAndName(shortname, name) {
    let id = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (id === undefined) {
        id = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname);
    }
    return id;
}

function getExpandedTableHeaders(tableData) {
    const headers = [];
    const headerMatches = tableData.matchAll(RUSTLABS_ITEM_TABLE_HEADER_REGEX);

    for (const match of headerMatches) {
        if (match.length !== 3) continue;

        const attrs = match[1];
        const text = sanitizeTableText(match[2]).toLowerCase();
        const colspanMatch = attrs.match(/colspan="(\d+)"/m);
        const colspan = colspanMatch ? Math.max(parseInt(colspanMatch[1], 10), 1) : 1;

        for (let i = 0; i < colspan; i++) {
            headers.push(text);
        }
    }

    return headers;
}

function getRowCells(rowData) {
    const cells = [];
    const cellMatches = rowData.matchAll(RUSTLABS_ITEM_TABLE_CELL_REGEX);
    for (const match of cellMatches) {
        if (match.length !== 3) continue;

        cells.push({
            attrs: match[1],
            html: match[2]
        });
    }

    return cells;
}

function getCraftColumnIndex(headers, predicates, fallbackIndex) {
    for (const predicate of predicates) {
        const index = headers.findIndex(predicate);
        if (index !== -1) {
            return index;
        }
    }

    return fallbackIndex;
}

function parseCraftIngredientQuantity(rawQuantity) {
    const sanitized = Utils.decodeHtml(rawQuantity || '')
        .replace(/,/g, '')
        .replace(/[^0-9.-]/g, '')
        .trim();

    if (sanitized === '') {
        return 1;
    }

    const parsed = parseFloat(sanitized);
    if (Number.isNaN(parsed)) {
        return null;
    }

    return parsed;
}

function parseCraftIngredientsFromHtml(data, ingredientMap) {
    const matches = data.matchAll(RUSTLABS_ITEM_CRAFT_INGREDIENTS_REGEX);
    for (const match of matches) {
        if (match.length !== 4) {
            continue;
        }

        const shortnameSub = match[1];
        const nameSub = Utils.decodeHtml(match[2]);

        const id = findItemIdByShortnameAndName(shortnameSub, nameSub);
        if (id === undefined) {
            continue;
        }

        const itemShortname = ITEMS[id].shortname;
        if (CRAFT_WORKBENCH_SHORTNAME_PRIORITY.includes(itemShortname)) {
            continue;
        }

        const quantity = parseCraftIngredientQuantity(match[3]);
        if (quantity === null) {
            continue;
        }

        ingredientMap.set(id, (ingredientMap.get(id) || 0) + quantity);
    }
}

function parseWorkbenchCandidates(data, workbenchCandidates) {
    const matches = data.matchAll(RUSTLABS_ITEM_CRAFT_INGREDIENTS_REGEX);
    for (const match of matches) {
        if (match.length !== 4) {
            continue;
        }

        const shortnameSub = match[1];
        const nameSub = Utils.decodeHtml(match[2]);
        const id = findItemIdByShortnameAndName(shortnameSub, nameSub);
        if (id === undefined) {
            continue;
        }

        if (!CRAFT_WORKBENCH_SHORTNAME_PRIORITY.includes(ITEMS[id].shortname)) {
            continue;
        }

        if (!workbenchCandidates.includes(id)) {
            workbenchCandidates.push(id);
        }
    }
}

function pickPreferredWorkbench(workbenchCandidates) {
    if (workbenchCandidates.length === 0) {
        return null;
    }

    for (const shortname of CRAFT_WORKBENCH_SHORTNAME_PRIORITY) {
        const preferred = workbenchCandidates.find(id => ITEMS[id].shortname === shortname);
        if (preferred) {
            return preferred;
        }
    }

    return workbenchCandidates[0];
}

function processItemCraft(rustlabsName, shortname, name, data) {
    const itemId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === shortname && ITEMS[e].name === name);
    if (!itemId) return;

    let areaMatch = data.match(RUSTLABS_ITEM_CRAFT_AREA_REGEX);
    if (areaMatch === null || areaMatch.length !== 1) {
        areaMatch = data.match(RUSTLABS_ITEM_MIXING_AREA_REGEX);
    }
    if (areaMatch === null || areaMatch.length !== 1) {
        console.log('  - No craft data found.');
        return;
    }
    data = areaMatch[0];

    const content = new Object();
    content['ingredients'] = [];
    content['workbench'] = null;
    content['time'] = null;
    content['timeString'] = null;

    const rowMatches = [...data.matchAll(RUSTLABS_ITEM_CRAFT_ROW_REGEX)];
    if (rowMatches.length === 0) {
        console.log('  - No craft data found.');
        return;
    }
    const rowData = rowMatches[0][0];

    const expandedHeaders = getExpandedTableHeaders(data);
    const cells = getRowCells(rowData);

    const ingredientCellIndex = getCraftColumnIndex(expandedHeaders, [
        header => header.includes('ingredients total'),
        header => header === 'ingredients',
        header => header.includes('ingredients'),
        header => header === 'recipe'
    ], 2);
    const ingredientCell = cells[ingredientCellIndex] || null;
    const ingredientMap = new Map();
    if (ingredientCell !== null) {
        parseCraftIngredientsFromHtml(ingredientCell.html, ingredientMap);
    }
    if (ingredientMap.size === 0) {
        parseCraftIngredientsFromHtml(rowData, ingredientMap);
    }
    for (const [id, quantity] of ingredientMap.entries()) {
        content['ingredients'].push({
            id: id,
            quantity: quantity
        });
    }

    const workbenchCellIndex = getCraftColumnIndex(expandedHeaders, [
        header => header.includes('workbench')
    ], cells.length - 1);
    const workbenchCell = cells[workbenchCellIndex] || null;
    const workbenchCandidates = [];
    if (workbenchCell !== null) {
        parseWorkbenchCandidates(workbenchCell.html, workbenchCandidates);
    }
    if (workbenchCandidates.length === 0) {
        parseWorkbenchCandidates(rowData, workbenchCandidates);
    }
    content['workbench'] = pickPreferredWorkbench(workbenchCandidates);

    const timeCellIndex = getCraftColumnIndex(expandedHeaders, [
        header => header === 'time',
        header => header.includes('time')
    ], 3);
    const timeCell = cells[timeCellIndex] || null;
    if (timeCell !== null) {
        const timeMatches = [...timeCell.attrs.matchAll(RUSTLABS_ITEM_CRAFT_TIME_IN_CELL_ATTRS_REGEX)];
        if (timeMatches.length > 0 && timeMatches[0].length === 2) {
            const parsedTime = parseFloat(timeMatches[0][1]);
            if (!Number.isNaN(parsedTime)) {
                content['time'] = parsedTime;
            }
        }

        const timeString = sanitizeTableText(timeCell.html);
        if (timeString !== '') {
            content['timeString'] = timeString;
            if (content['time'] === null) {
                content['time'] = parseTime(timeString);
            }
        }
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

    const skipResearchRow = (reason, rowData = '') => {
        const rowSnippet = rowData.replace(/\s+/g, ' ').trim().slice(0, 140);
        console.log(`  - Skipping research row: ${reason}${rowSnippet !== '' ? ` [${rowSnippet}]` : ''}`);
    };

    let alreadyWorkbench = false;
    const rows = data.matchAll(RUSTLABS_ITEM_RESEARCH_ROW_REGEX);
    for (const row of rows) {
        if (row.length !== 2) {
            skipResearchRow('unexpected row format');
            continue;
        }
        const rowData = row[0];

        const typeCandidates = [];
        const typeMatches = rowData.matchAll(RUSTLABS_ITEM_RESEARCH_TYPE_REGEX);
        for (const match of typeMatches) {
            if (match.length !== 5) {
                skipResearchRow('invalid type format', rowData);
                break;
            }
            typeCandidates.push(match[4]);
        }

        let type = null;
        if (typeCandidates.includes('research.table')) {
            type = 'research.table';
        }
        else {
            type = typeCandidates.find(candidate => candidate.includes('workbench')) || null;

            if (type === null && typeCandidates.includes('iotable')) {
                type = 'iotable';
            }
            else if (type === null && typeCandidates.length > 0) {
                type = typeCandidates[0];
            }
        }

        let scrap = null;
        const scrapMatches = rowData.matchAll(RUSTLABS_ITEM_RESEARCH_SCRAP_REGEX);
        for (const match of scrapMatches) {
            if (match.length !== 3) {
                skipResearchRow('invalid scrap format', rowData);
                break;
            }
            scrap = match[2].replace(/,/g, '').replace(/[^0-9.-]/g, '');
            break;
        }

        let totalScrap = null;
        const totalScrapMatches = rowData.matchAll(RUSTLABS_ITEM_RESEARCH_TOTAL_SCRAP_REGEX);
        for (const match of totalScrapMatches) {
            if (match.length !== 2) {
                skipResearchRow('invalid total scrap format', rowData);
                break;
            }
            totalScrap = match[1];
            break;
        }

        if (type === null || scrap === null || totalScrap === null) {
            skipResearchRow('incomplete row data', rowData);
            continue;
        }

        const scrapValue = parseFloat(scrap);
        const totalScrapValue = parseFloat(totalScrap);
        if (Number.isNaN(scrapValue) || Number.isNaN(totalScrapValue)) {
            skipResearchRow(`invalid numeric values (scrap=${scrap}, total=${totalScrap})`, rowData);
            continue;
        }

        if (type === 'research.table') {
            content['researchTable'] = scrapValue;
            continue;
        }

        if (type.includes('workbench') || type === 'iotable') {
            if (alreadyWorkbench) {
                continue;
            }

            const workbenchId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === type);
            if (!workbenchId) {
                skipResearchRow(`unknown workbench type (${type})`, rowData);
                continue;
            }

            alreadyWorkbench = true;
            content['workbench'] = {
                type: workbenchId,
                scrap: scrapValue,
                totalScrap: totalScrapValue
            };
            continue;
        }

        skipResearchRow(`unknown research type (${type})`, rowData);
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
                quantity = quantity.replace(/,/g, '').replace(/[^0-9.%-]/g, '');

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

    const MAX_DURABILITY_ROW_WARNINGS = 3;
    let skippedDurabilityRows = 0;
    let loggedDurabilityRows = 0;

    const skipDurabilityRow = (group, reason, rowData = '') => {
        skippedDurabilityRows += 1;
        if (loggedDurabilityRows >= MAX_DURABILITY_ROW_WARNINGS) {
            return;
        }

        loggedDurabilityRows += 1;
        const rowSnippet = rowData.replace(/\s+/g, ' ').trim().slice(0, 140);
        console.log(`  - Skipping durability row (${group}): ${reason}${rowSnippet !== '' ? ` [${rowSnippet}]` : ''}`);
    };

    const normalizeQuantityString = (value) => value.replace(/,/g, '').replace(/[^0-9.-]/g, '').trim();

    const durabilityItems = [];

    for (const match of matches) {
        if ((regexType === 1 && match.length !== 4) || (regexType === 2 && match.length !== 3)) {
            skipDurabilityRow('unknown', 'unexpected durability match format');
            continue;
        }

        const dataMatch = match[0];
        let group = match[1];
        if (typeof group === 'string') {
            group = group.trim();
        }
        let which = null;
        if (regexType === 1) {
            which = match[2];
            if (typeof which === 'string') {
                which = which.trim();
            }
        }

        let rowInvalid = false;
        const invalidateRow = (reason) => {
            if (!rowInvalid) {
                skipDurabilityRow(group, reason, dataMatch);
            }
            rowInvalid = true;
        };

        /* Tool */
        let toolId = null;
        let toolShortname = null;
        let toolName = null;
        const toolMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_TOOL_REGEX)];
        if (toolMatches.length !== 0) {
            for (const toolMatch of toolMatches) {
                if (toolMatch.length !== 3) {
                    invalidateRow('invalid tool match format');
                    break;
                }
                toolShortname = Utils.decodeHtml(toolMatch[1]).replace('%20', ' ');
                toolName = Utils.decodeHtml(toolMatch[2]).replace('%20', ' ');
                break;
            }
        }
        if (toolShortname === null || toolName === null) {
            invalidateRow('missing tool data');
        }
        if (rowInvalid) continue;

        toolId = Object.keys(ITEMS).find(e => ITEMS[e].shortname === toolShortname && ITEMS[e].name === toolName);
        if (!toolId) {
            invalidateRow(`unknown tool id (${toolShortname} / ${toolName})`);
        }
        if (rowInvalid) continue;

        /* Caption in tool name */
        let captionInTool = null;
        const captionInToolMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_CAPTION_IN_TOOL_REGEX)];
        if (captionInToolMatches.length !== 0) {
            for (const captionInToolMatch of captionInToolMatches) {
                if (captionInToolMatch.length !== 2) {
                    invalidateRow('invalid caption format');
                    break;
                }
                captionInTool = captionInToolMatch[1];
                break;
            }
        }
        if (rowInvalid) continue;

        /* Quantity, if group 'guns' then use different regex, also if dataMatch includes 'Approximate Quantity' */
        let quantity = null;
        let quantityTypeShortname = null;
        let quantityTypeName = null;

        /* Prefer data-value because inner HTML structure changes frequently. */
        const quantityDataValueMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_DATA_VALUE_REGEX)];
        if (quantityDataValueMatches.length !== 0) {
            for (const quantityDataValueMatch of quantityDataValueMatches) {
                if (quantityDataValueMatch.length !== 2) {
                    invalidateRow('invalid quantity data-value format');
                    break;
                }

                const dataValue = normalizeQuantityString(quantityDataValueMatch[1]);
                if (dataValue !== '' && dataValue !== '-' && dataValue !== '2147483647') {
                    quantity = dataValue;
                }
                break;
            }
        }

        if (quantity === null && (group === 'guns' || group === 'turret')) {
            const quantityMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_GUNS_REGEX)];
            if (quantityMatches.length !== 0) {
                for (const quantityMatch of quantityMatches) {
                    if (quantityMatch.length !== 4) {
                        invalidateRow('invalid gun quantity format');
                        break;
                    }
                    quantityTypeShortname = quantityMatch[1];
                    quantityTypeName = quantityMatch[2];
                    quantity = normalizeQuantityString(quantityMatch[3]);
                    break;
                }
            }
        }
        else if (quantity === null && dataMatch.includes('Approximate Quantity')) {
            const quantityMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_APPROX_REGEX)];
            if (quantityMatches.length !== 0) {
                for (const quantityMatch of quantityMatches) {
                    if (quantityMatch.length !== 2) {
                        invalidateRow('invalid approximate quantity format');
                        break;
                    }
                    quantity = normalizeQuantityString(quantityMatch[1]).replace('~ ', '');
                    break;
                }
            }
        }
        else if (quantity === null) {
            const quantityMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_QUANTITY_REGEX)];
            if (quantityMatches.length !== 0) {
                for (const quantityMatch of quantityMatches) {
                    if (quantityMatch.length !== 3) {
                        invalidateRow('invalid quantity format');
                        break;
                    }
                    quantity = normalizeQuantityString(quantityMatch[1]);
                    break;
                }
            }
        }
        if (rowInvalid) continue;

        if (quantity === null) {
            invalidateRow('quantity not found');
        }
        if (rowInvalid) continue;

        const parsedQuantity = parseFloat(quantity);
        if (Number.isNaN(parsedQuantity)) {
            invalidateRow(`invalid quantity value (${quantity})`);
        }
        if (rowInvalid) continue;

        let quantityTypeId = null;
        if (quantityTypeShortname !== null && quantityTypeName !== null) {
            quantityTypeId = Object.keys(ITEMS).find(e =>
                ITEMS[e].shortname === quantityTypeShortname && ITEMS[e].name === quantityTypeName);
            if (!quantityTypeId) {
                invalidateRow(`unknown quantity type (${quantityTypeShortname} / ${quantityTypeName})`);
            }
        }
        if (rowInvalid) continue;

        /* Time */
        let timeString = null;
        let time = null;
        const timeMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_TIME_REGEX)];
        if (timeMatches.length !== 0) {
            for (const timeMatch of timeMatches) {
                if (timeMatch.length !== 3) {
                    invalidateRow('invalid time format');
                    break;
                }
                time = parseFloat(timeMatch[1]);
                timeString = timeMatch[2];
                break;
            }
        }
        if (rowInvalid) continue;

        /* Amount of fuel */
        let fuel = null;
        const fuelMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_FUEL_AMOUNT_REGEX)];
        if (fuelMatches.length !== 0) {
            for (const fuelMatch of fuelMatches) {
                if (fuelMatch.length !== 2) {
                    invalidateRow('invalid fuel format');
                    break;
                }
                fuel = parseFloat(normalizeQuantityString(fuelMatch[1]));
                break;
            }
        }
        if (rowInvalid) continue;

        /* Amount of sulfur */
        let sulfur = null;
        const sulfurMatches = [...dataMatch.matchAll(RUSTLABS_ITEM_DURABILITY_SULFUR_AMOUNT_REGEX)];
        if (sulfurMatches.length !== 0) {
            for (const sulfurMatch of sulfurMatches) {
                if (sulfurMatch.length !== 2) {
                    invalidateRow('invalid sulfur format');
                    break;
                }
                sulfur = parseFloat(normalizeQuantityString(sulfurMatch[1]));
                break;
            }
        }
        if (rowInvalid) continue;

        durabilityItems.push({
            group: group,
            which: which,
            toolId: toolId,
            caption: captionInTool,
            quantity: parsedQuantity,
            quantityTypeId: quantityTypeId,
            time: time,
            timeString: timeString,
            fuel: fuel,
            sulfur: sulfur
        });
    }

    if (skippedDurabilityRows > loggedDurabilityRows) {
        console.log(`  - Skipped ${skippedDurabilityRows} durability rows (${skippedDurabilityRows - loggedDurabilityRows} additional warnings suppressed).`);
    }

    if (durabilityItems.length === 0) {
        console.log('  - No durability data found.');
        return;
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
                    toQuantity = toQuantity.replace(/,/g, '').replace(/[^0-9.-]/g, '');

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
            woodQuantity = parseFloat(matches[7].replace(/,/g, '').replace(/[^0-9.-]/g, ''));
            toShortname = matches[10];
            toName = Utils.decodeHtml(matches[11]);
            toQuantity = matches[13] === '' ? 1 : parseFloat(matches[13].replace(/,/g, '').replace(/[^0-9.-]/g, ''));
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

    const quantity = matches[2].trim().replace(/,/g, '').replace(/[^0-9.-]/g, '');

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
    let caughtError = null;

    try {
        await preflightCheck();
        await processAll();

        Fs.mkdirSync(OUTPUT_DIRECTORY, { recursive: true });

        /* Populate the json files */
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsBuildingBlocks.json'),
            JSON.stringify(rustlabsBuildingBlocks, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsOther.json'),
            JSON.stringify(rustlabsOther, null, 2));

        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsCraftData.json'),
            JSON.stringify(rustlabsCraftData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsResearchData.json'),
            JSON.stringify(rustlabsResearchData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsRecycleData.json'),
            JSON.stringify(rustlabsRecycleData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsDurabilityData.json'),
            JSON.stringify(rustlabsDurabilityData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsSmeltingData.json'),
            JSON.stringify(rustlabsSmeltingData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsDespawnData.json'),
            JSON.stringify(rustlabsDespawnData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsStackData.json'),
            JSON.stringify(rustlabsStackData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsDecayData.json'),
            JSON.stringify(rustlabsDecayData, null, 2));
        Fs.writeFileSync(Path.join(OUTPUT_DIRECTORY, 'rustlabsUpkeepData.json'),
            JSON.stringify(rustlabsUpkeepData, null, 2));

        console.log(`Rustlabs data written to: ${OUTPUT_DIRECTORY}`);
    }
    catch (error) {
        caughtError = error;
    }
    finally {
        await closeBrowser();
    }

    if (caughtError !== null) {
        exit(caughtError);
    }
}

main();




