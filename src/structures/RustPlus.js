const Fs = require('fs');
const Path = require('path');
const RustPlusLib = require('@liamcottle/rustplus.js');
const Translate = require('translate');

const Client = require('../../index.ts');
const Constants = require('../util/constants.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Languages = require('../util/languages.js');
const Logger = require('./Logger.js');
const Map = require('../util/map.js');
const TeamHandler = require('../handlers/teamHandler.js');
const Timer = require('../util/timer.js');

const TOKENS_LIMIT = 24;        /* Per player */
const TOKENS_REPLENISH = 3;     /* Per second */

class RustPlus extends RustPlusLib {
    constructor(guildId, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.serverId = `${this.server}-${this.port}`;
        this.guildId = guildId;

        /* Status flags */
        this.isConnected = false;           /* Connected to the server, but request not yet verified. */
        this.isReconnecting = false;        /* Trying to reconnect? */
        this.isOperational = false;         /* Connected to the server, and request is verified. */
        this.isDeleted = false;             /* Is the rustplus instance deleted? */
        this.isConnectionRefused = false;   /* Refused connection when trying to connect? */
        this.isNewConnection = false;       /* Is it an actively selected connection (pressed CONNECT button)? */
        this.isFirstPoll = true;            /* Is this the first poll since connection started? */

        /* Interval ids */
        this.pollingTaskId = 0;             /* The id of the main polling mechanism of the rustplus instance. */
        this.tokensReplenishTaskId = 0;     /* The id of the replenish task for rustplus tokens. */

        /* Other variable initializations */
        this.tokens = 24;                           /* The amount of tokens that is available at start. */
        this.timers = new Object();                 /* Stores all custom timers that are created. */
        this.markers = new Object();                /* Stores all custom markers that are created. */
        this.storageMonitors = new Object();        /* Contain content information of paired storage monitors. */
        this.currentSwitchTimeouts = new Object();  /* Stores timer ids for auto ON/OFF Smart Switch timeouts. */
        this.passedFirstSunriseOrSunset = false;    /* Becomes true when first sunrise/sunset. */
        this.startTimeObject = new Object();        /* Stores in-game time points before first sunrise/sunset. */
        this.informationIntervalCounter = 0;        /* Counter to decide when information should be updated. */
        this.storageMonitorIntervalCounter = 0;     /* Counter to decide when storage monitors should be updated */
        this.smartSwitchIntervalCounter = 10;       /* Counter to decide when smart switches should be updated */
        this.smartAlarmIntervalCounter = 20;        /* Counter to decide when smart alarms should be updated */
        this.interactionSwitches = [];              /* Stores the ids of smart switches that are interacted in-game. */

        /* Rustplus structures */
        this.map = null;            /* Stores the Map structure. */
        this.info = null;           /* Stores the Info structure. */
        this.time = null;           /* Stores the Time structure. */
        this.team = null;           /* Stores the Team structure. */
        this.mapMarkers = null;     /* Stores the MapMarkers structure. */

        /* Retrieve the trademark string */
        const instance = Client.client.readInstanceFile(guildId);
        const trademark = instance.generalSettings.trademark;
        this.trademarkString = (trademark === 'NOT SHOWING') ? '' : `${trademark} | `;

        /* Modify sendTeamMessageAsync function to allow trademark and splitting messages. */
        this.oldSendTeamMessageAsync = this.sendTeamMessageAsync;
        this.sendTeamMessageAsync = async function (message) {
            const messageMaxLength = Constants.MAX_LENGTH_TEAM_MESSAGE - this.trademarkString.length;
            const strings = message.match(new RegExp(`.{1,${messageMaxLength}}(\\s|$)`, 'g'));

            if (this.team === null || this.team.allOffline) return;

            for (const msg of strings) {
                if (!this.generalSettings.muteInGameBotMessages) {
                    await this.oldSendTeamMessageAsync(`${this.trademarkString}${msg}`);
                }
            }
        }

        this.loadRustPlusEvents();
    }

    loadRustPlusEvents() {
        const eventFiles = Fs.readdirSync(
            Path.join(__dirname, '..', 'rustplusEvents')).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../rustplusEvents/${file}`);
            this.on(event.name, (...args) => event.execute(this, Client.client, ...args));
        }
    }

    loadMarkers() {
        const instance = Client.client.readInstanceFile(this.guildId);

        for (const [name, location] of Object.entries(instance.serverList[this.serverId].markers)) {
            this.markers[name] = { x: location.x, y: location.y };
        }
    }

    build() {
        const instance = Client.client.readInstanceFile(this.guildId);

        /* Setup the logger */
        this.logger = new Logger(Path.join(__dirname, '..', '..', `logs/${this.guildId}.log`), 'guild');
        this.logger.setGuildId(this.guildId);
        this.logger.serverName = instance.serverList[this.serverId].title;

        /* Setup settings */
        this.generalSettings = instance.generalSettings;
        this.notificationSettings = instance.notificationSettings;

        this.connect();
    }

    isServerAvailable() {
        const instance = Client.client.readInstanceFile(this.guildId);
        return instance.serverList.hasOwnProperty(this.serverId);
    }

    deleteThisRustplusInstance() {
        this.isDeleted = true;

        if (Client.client.rustplusInstances.hasOwnProperty(this.guildId)) {
            if (Client.client.rustplusInstances[this.guildId].serverId === this.serverId) {
                this.disconnect();
                delete Client.client.rustplusInstances[this.guildId];
                return true;
            }
        }
        return false;
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

    async printCommandOutput(str, type = 'COMMAND') {
        if (str === null) return;

        if (this.generalSettings.commandDelay === '0') {
            if (Array.isArray(str)) {
                for (const string of str) {
                    await this.sendTeamMessageAsync(string);
                }
            }
            else {
                await this.sendTeamMessageAsync(str);
            }
        }
        else {
            const self = this;
            setTimeout(function () {
                if (Array.isArray(str)) {
                    for (const string of str) {
                        self.sendTeamMessageAsync(string);
                    }
                }
                else {
                    self.sendTeamMessageAsync(str);
                }
            }, parseInt(this.generalSettings.commandDelay) * 1000)

        }
        if (Array.isArray(str)) {
            for (const string of str) {
                this.log(type, string);
            }
        }
        else {
            this.log(type, str);
        }
    }

    async sendEvent(setting, text, firstPoll = false, image = null) {
        const img = (image !== null) ? image : setting.image;

        if (!firstPoll && setting.discord) {
            await DiscordMessages.sendDiscordEventMessage(this.guildId, this.serverId, text, img);
        }
        if (!firstPoll && setting.inGame) {
            await this.sendTeamMessageAsync(`${text}`);
        }
        this.log('EVENT', text);
    }

    replenishTokens() {
        this.tokens += TOKENS_REPLENISH;
        if (this.tokens > TOKENS_LIMIT) this.tokens = TOKENS_LIMIT;
    }

    async waitForAvailableTokens(cost) {
        let timeoutCounter = 0;
        while (this.tokens < cost) {
            if (timeoutCounter === 90) return false;

            await Timer.sleep(1000 / 3);
            timeoutCounter += 1;
        }
        this.tokens -= cost;
        return true;
    }

    async turnSmartSwitchAsync(id, value, timeout = 10000) {
        if (value) {
            return await this.turnSmartSwitchOnAsync(id, timeout);
        }
        else {
            return await this.turnSmartSwitchOffAsync(id, timeout);
        }
    }

    async turnSmartSwitchOnAsync(id, timeout = 10000) {
        try {
            return await this.setEntityValueAsync(id, true, timeout);
        }
        catch (e) {
            return e;
        }
    }

    async turnSmartSwitchOffAsync(id, timeout = 10000) {
        try {
            return await this.setEntityValueAsync(id, false, timeout);
        }
        catch (e) {
            return e;
        }
    }

    async setEntityValueAsync(id, value, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                entityId: id,
                setEntityValue: {
                    value: value
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async sendTeamMessageAsync(message, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(2))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                sendTeamMessage: {
                    message: message
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getEntityInfoAsync(id, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                entityId: id,
                getEntityInfo: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getMapAsync(timeout = 30000) {
        try {
            if (!(await this.waitForAvailableTokens(5))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getMap: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getTimeAsync(timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getTime: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getMapMarkersAsync(timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getMapMarkers: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getInfoAsync(timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getInfo: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getTeamInfoAsync(timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getTeamInfo: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async promoteToLeaderAsync(steamId, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                promoteToLeader: {
                    steamId: steamId
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getTeamChatAsync(timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getTeamChat: {}
            }, timeout).catch((e) => {
                return e;
            })
        }
        catch (e) {
            return e;
        }
    }

    async checkSubscriptionAsync(id, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                entityId: id,
                checkSubscription: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async setSubscriptionAsync(id, value, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                entityId: id,
                setSubscription: {
                    value: value
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async getCameraFrameAsync(identifier, frame, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(2))) {
                return { error: 'Tokens did not replenish in time.' };
            }

            return await this.sendRequestAsync({
                getCameraFrame: {
                    identifier: identifier,
                    frame: frame
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async isResponseValid(response) {
        if (response === undefined) {
            this.log('ERROR', 'Response is undefined.', 'error');
            return false;
        }
        else if (response.toString() === 'Error: Timeout reached while waiting for response') {
            this.log('ERROR', 'Timeout reached while waiting for response.', 'error');
            return false;
        }
        else if (response.hasOwnProperty('error')) {
            this.log('ERROR', `Response contain error property with value: ${response.error}.`, 'error');
            return false;
        }
        else if (Object.keys(response).length === 0) {
            this.log('ERROR', 'Response is empty.', 'error');
            clearInterval(this.pollingTaskId);
            return false;
        }
        return true;
    }

    /* Commands */

    getCommandAfk() {
        let string = '';
        for (const player of this.team.players) {
            if (player.isOnline) {
                if (player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS) {
                    string += `${player.name} [${player.getAfkTime('dhs')}], `;
                }
            }
        }

        return string !== '' ? `${string.slice(0, -2)}.` : 'No one is AFK.';
    }

    getCommandAlive(command) {
        const prefix = this.generalSettings.prefix;
        if (command.toLowerCase() === `${prefix}alive`) {
            const player = this.team.getPlayerLongestAlive();
            return `${player.name} has been alive the longest (${player.getAliveTime()}).`;
        }
        else if (command.toLowerCase().startsWith(`${prefix}alive `)) {
            const name = command.slice(`${prefix}alive `.length).trim();
            for (const player of this.team.players) {
                if (player.name.includes(name)) {
                    return `${player.name} has been alive for ${player.getAliveTime()}.`;
                }
            }

            return `Could not find teammate: '${name}'`;
        }

        return null;
    }

    getCommandBradley(isInfoChannel = false) {
        const strings = [];
        for (const timer of Object.values(this.mapMarkers.bradleyAPCRespawnTimers)) {
            const time = Timer.getTimeLeftOfTimer(timer);
            if (time) {
                if (isInfoChannel) {
                    return `${Timer.getTimeLeftOfTimer(timer, 's')} before respawn.`;
                }
                else {
                    strings.push(`${time} before Bradley APC respawns.`);
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceBradleyAPCWasDestroyed === null) {
                if (isInfoChannel) {
                    return 'At Launchsite.';
                }
                else {
                    return 'Bradley APC is probably roaming around at Launch Site.';
                }
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceBradleyAPCWasDestroyed) / 1000;
                if (isInfoChannel) {
                    return `${Timer.secondsToFullScale(secondsSince, 's')} since destroyed.`;
                }
                else {
                    return `${Timer.secondsToFullScale(secondsSince)} since Bradley APC got destroyed.`;
                }
            }
        }

        return strings;
    }

    getCommandCargo(isInfoChannel = false) {
        const strings = [];
        let unhandled = this.mapMarkers.cargoShips.map(e => e.id);
        for (const [id, timer] of Object.entries(this.mapMarkers.cargoShipEgressTimers)) {
            const cargoShip = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.CargoShip, parseInt(id));
            const time = Timer.getTimeLeftOfTimer(timer);
            if (time) {
                if (isInfoChannel) {
                    return `Egress in ${Timer.getTimeLeftOfTimer(timer, 's')} at ${cargoShip.location.string}.\n` +
                        `Crates: (${cargoShip.crates.length}/3).`;
                }
                else {
                    strings.push(`${time} before Cargo Ship at ${cargoShip.location.string}` +
                        ` enters egress stage. Crates: (${cargoShip.crates.length}/3).`);
                }
            }
            unhandled = unhandled.filter(e => e != parseInt(id));
        }

        if (unhandled.length > 0) {
            for (const id of unhandled) {
                const cargoShip = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.CargoShip, id);
                if (cargoShip.onItsWayOut) {
                    if (isInfoChannel) {
                        return `Leaving at ${cargoShip.location.string}.\nCrates: (${cargoShip.crates.length}/3).`;
                    }
                    else {
                        strings.push(`Cargo Ship is leaving the map at ${cargoShip.location.string}.` +
                            ` Crates: (${cargoShip.crates.length}/3).`);
                    }
                }
                else {
                    if (isInfoChannel) {
                        return `At ${cargoShip.location.string}.\nCrates: (${cargoShip.crates.length}/3).`;
                    }
                    else {
                        strings.push(`Cargo Ship is located at ${cargoShip.location.string}.` +
                            ` Crates: (${cargoShip.crates.length}/3).`);
                    }
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceCargoShipWasOut === null) {
                if (isInfoChannel) {
                    return 'Not active.';
                }
                else {
                    return 'Cargo Ship is not currently on the map.';
                }
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceCargoShipWasOut) / 1000;
                if (isInfoChannel) {
                    return `${Timer.secondsToFullScale(secondsSince)} since last.`;
                }
                else {
                    return `${Timer.secondsToFullScale(secondsSince)} since Cargo Ship left the map.`;
                }
            }
        }

        return strings;
    }

    getCommandChinook(isInfoChannel = false) {
        const strings = [];
        for (const ch47 of this.mapMarkers.ch47s) {
            if (ch47.ch47Type === 'crate') {
                if (isInfoChannel) {
                    return `At ${ch47.location.string}.`;
                }
                else {
                    strings.push(`Chinook 47 is located at ${ch47.location.string}.`);
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceCH47WasOut === null) {
                return isInfoChannel ? 'Not active.' : 'Chinook 47 is not currently on the map.';
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceCH47WasOut) / 1000;
                if (isInfoChannel) {
                    return `${Timer.secondsToFullScale(secondsSince, 's')} since last.`;
                }
                else {
                    strings.push(`${Timer.secondsToFullScale(secondsSince)} since the last Chinook 47 was on the map.`);
                }
            }
        }

        return strings;
    }

    getCommandCrate(isInfoChannel = false) {
        const strings = [];
        for (const [id, timer] of Object.entries(this.mapMarkers.crateDespawnTimers)) {
            const crate = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.Crate, parseInt(id));
            const time = Timer.getTimeLeftOfTimer(timer);

            if (time) {
                if (isInfoChannel) {
                    return `${Timer.getTimeLeftOfTimer(timer, 's')} until despawns at ${crate.crateType}`;
                }
                else {
                    strings.push(`${time} before Locked Crate at ${crate.crateType} despawns.`);
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceCH47DroppedCrate === null) {
                for (const crate of this.mapMarkers.crates) {
                    if (!['cargoShip', 'oil_rig_small', 'large_oil_rig', 'invalid'].includes(crate.crateType)) {
                        if (isInfoChannel) {
                            return `At ` +
                                `${crate.crateType === 'grid' ? `${crate.location.string}` : `${crate.crateType}`}.`;
                        }
                        else {
                            strings.push(`Locked Crate is located at ` +
                                `${crate.crateType === 'grid' ? `${crate.location.string}` : `${crate.crateType}`}.`);
                        }
                    }
                }

                if (strings.length === 0) return 'No active Locked Crates.';
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceCH47DroppedCrate) / 1000;
                if (isInfoChannel) {
                    const timeSince = Timer.secondsToFullScale(secondsSince, 's');
                    return `${timeSince} since last drop.`;
                }
                else {
                    const timeSince = Timer.secondsToFullScale(secondsSince);
                    return `${timeSince} since Chinook 47 last dropped a Locked Crate.`;
                }
            }
        }

        return strings;
    }

    getCommandHeli(isInfoChannel = false) {
        const strings = [];
        for (const patrolHelicopter of this.mapMarkers.patrolHelicopters) {
            if (isInfoChannel) {
                return `At ${patrolHelicopter.location.string}`;
            }
            else {
                strings.push(`Patrol Helicopter is located at ${patrolHelicopter.location.string}.`);
            }
        }

        if (strings.length === 0) {
            const wasOnMap = this.mapMarkers.timeSincePatrolHelicopterWasOnMap;
            const wasDestroyed = this.mapMarkers.timeSincePatrolHelicopterWasDestroyed;

            if (wasOnMap == null && wasDestroyed === null) {
                return isInfoChannel ? 'Not active.' : 'Patrol Helicopter is not currently on the map.';
            }
            else if (wasOnMap !== null && wasDestroyed === null) {
                const secondsSince = (new Date() - wasOnMap) / 1000;
                if (isInfoChannel) {
                    const timeSince = Timer.secondsToFullScale(secondsSince, 's');
                    return `${timeSince} since last.`;
                }
                else {
                    const timeSince = Timer.secondsToFullScale(secondsSince);
                    return `${timeSince} since the last Patrol Helicopter was on the map.`;
                }
            }
            else if (wasOnMap !== null && wasDestroyed !== null) {
                if (isInfoChannel) {
                    const timeSinceOnMap = Timer.secondsToFullScale((new Date() - wasOnMap) / 1000, 's');
                    const timeSinceDestroyed = Timer.secondsToFullScale((new Date() - wasDestroyed) / 1000, 's');
                    return `${timeSinceOnMap} since last.\n${timeSinceDestroyed} since destroyed.`;
                }
                else {
                    const timeSinceOnMap = Timer.secondsToFullScale((new Date() - wasOnMap) / 1000);
                    const timeSinceDestroyed = Timer.secondsToFullScale((new Date() - wasDestroyed) / 1000);
                    return `${timeSinceOnMap} since the last Patrol Helicopter was on the map, ` +
                        `${timeSinceDestroyed} since it last got downed.`;
                }
            }
        }

        return strings;
    }

    getCommandLarge(isInfoChannel = false) {
        const strings = [];
        for (const [id, timer] of Object.entries(this.mapMarkers.crateLargeOilRigTimers)) {
            const crate = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.Crate, parseInt(id));
            const time = Timer.getTimeLeftOfTimer(timer);
            if (time) {
                if (isInfoChannel) {
                    return `${Timer.getTimeLeftOfTimer(timer, 's')} until unlocks at ${crate.location.location}.`;
                }
                else {
                    strings.push(`${time} before Locked Crate at Large Oil Rig (${crate.location.location}) unlocks.`);
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceLargeOilRigWasTriggered === null) {
                return isInfoChannel ? 'No data.' : 'No current data on Large Oil Rig.';
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceLargeOilRigWasTriggered) / 1000;
                if (isInfoChannel) {
                    return `${Timer.secondsToFullScale(secondsSince, 's')} since last event.`;
                }
                else {
                    return `${Timer.secondsToFullScale(secondsSince)} ` +
                        `since Heavy Scientists last got called to Large Oil Rig.`;
                }
            }
        }

        return strings;
    }

    async getCommandLeader(command, callerSteamId) {
        const prefix = this.generalSettings.prefix;

        if (!this.generalSettings.leaderCommandEnabled) return 'Leader command is disabled in settings.';

        if (this.team.leaderSteamId !== this.playerId) {
            const player = this.team.getPlayer(this.playerId);
            return `Command only works if the current leader is: ${player.name}.`;
        }

        if (command.toLowerCase() === `${prefix}leader`) {
            if (this.team.leaderSteamId !== callerSteamId) {
                await this.team.changeLeadership(callerSteamId);
                const player = this.team.getPlayer(callerSteamId);
                return `Team leadership was transferred to ${player.name}.`;
            }
            else {
                return 'You are already leader.';
            }
        }
        else if (command.toLowerCase().startsWith(`${prefix}leader `)) {
            const name = command.slice(`${prefix}leader `.length).trim();
            for (const player of this.team.players) {
                if (player.name.includes(name)) {
                    if (this.team.leaderSteamId === player.steamId) {
                        return `${player.name} is already leader.`;
                    }
                    else {
                        await this.team.changeLeadership(player.steamId);
                        return `Team leadership was transferred to ${player.name}`;
                    }
                }
            }

            return `Could not identify team member: ${name}.`;
        }

        return null;
    }

    async getCommandMarker(command, callerSteamId) {
        const prefix = this.generalSettings.prefix;

        command = command.slice(`${prefix}marker `.length).trim();
        const subcommand = command.replace(/ .*/, '');
        const name = command.slice(subcommand.length + 1);

        switch (subcommand.toLowerCase()) {
            case 'add': {
                if (name.startsWith('add') || name.startsWith('remove') || name.startsWith('list')) return null;
                if (name === '') return null;

                const teamInfo = await this.getTeamInfoAsync();
                if (!(await this.isResponseValid(teamInfo))) return null;

                for (const player of teamInfo.teamInfo.members) {
                    if (player.steamId.toString() === callerSteamId) {
                        const instance = Client.client.readInstanceFile(this.guildId);
                        instance.serverList[this.serverId].markers[name] = { x: player.x, y: player.y };
                        Client.client.writeInstanceFile(this.guildId, instance);
                        this.markers[name] = { x: player.x, y: player.y };

                        return `Marker '${name}' was added.`;
                    }
                }
            } break;

            case 'remove': {
                const instance = Client.client.readInstanceFile(this.guildId);

                if (name in this.markers) {
                    delete this.markers[name];
                    delete instance.serverList[this.serverId].markers[name];
                    Client.client.writeInstanceFile(this.guildId, instance);

                    return `Marker '${name}' was removed.`;
                }
            } break;

            case 'list': {
                let str = '';
                for (const name in this.markers) str += `${name}, `;

                return str !== '' ? str.slice(0, -2) : 'No registered markers.';
            } break;

            default: {
                if (!(command in this.markers)) return `Marker '${command}' does not exist.`;

                const teamInfo = await this.getTeamInfoAsync();
                if (!(await this.isResponseValid(teamInfo))) return null;

                for (const player of teamInfo.teamInfo.members) {
                    if (player.steamId.toString() === callerSteamId) {
                        const direction = Map.getAngleBetweenPoints(player.x, player.y, this.markers[command].x,
                            this.markers[command].y);
                        const distance = Math.floor(Map.getDistance(player.x, player.y, this.markers[command].x,
                            this.markers[command].y));

                        return `Marker '${command}' is ${distance}m from ${player.name} in direction ${direction}°.`;
                    }
                }
            } break;
        }

        return null;
    }

    getCommandNote(command) {
        const prefix = this.generalSettings.prefix;
        const instance = Client.client.readInstanceFile(this.guildId);
        const strings = [];

        if (command.toLowerCase() === `${prefix}notes`) {
            if (Object.keys(instance.serverList[this.serverId].notes).length === 0) {
                return 'There are no saved notes.';
            }

            for (const [id, note] of Object.entries(instance.serverList[this.serverId].notes)) {
                strings.push(`${id}: ${note}`);
            }
        }
        else if (command.toLowerCase().startsWith(`${prefix}note add `)) {
            const note = command.slice(`${prefix}note add `.length).trim();

            let index = 0;
            while (Object.keys(instance.serverList[this.serverId].notes).map(Number).includes(index)) {
                index += 1;
            }

            instance.serverList[this.serverId].notes[index] = `${note}`;
            Client.client.writeInstanceFile(this.guildId, instance);
            return 'Note saved.';
        }
        else if (command.toLowerCase().startsWith(`${prefix}note remove `)) {
            const id = parseInt(command.slice(`${prefix}note remove `.length).trim());

            if (!isNaN(id)) {
                if (!Object.keys(instance.serverList[this.serverId].notes).map(Number).includes(id)) {
                    return `Note ID: '${id}' does not exist.`;
                }

                delete instance.serverList[this.serverId].notes[id];
                Client.client.writeInstanceFile(this.guildId, instance);
                return `Note ID: ${id} was removed.`;
            }
            else {
                return 'Note ID is invalid.';
            }
        }

        return strings.length !== 0 ? strings : null;
    }

    getCommandOffline() {
        let string = '';
        for (const player of this.team.players) {
            if (!player.isOnline) string += `${player.name}, `;
        }

        return string !== '' ? `${string.slice(0, -2)}.` : 'No one is offline.';
    }

    getCommandOnline() {
        let string = '';
        for (const player of this.team.players) {
            if (player.isOnline) string += `${player.name}, `;
        }

        return string !== '' ? `${string.slice(0, -2)}.` : 'No one is online.';
    }

    getCommandPlayer(command) {
        const instance = Client.client.readInstanceFile(this.guildId);
        const battlemetricsId = instance.serverList[this.serverId].battlemetricsId;
        const prefix = this.generalSettings.prefix;

        if (!battlemetricsId) return 'This server is using streamer-mode.';
        if (!Object.keys(Client.client.battlemetricsOnlinePlayers).includes(battlemetricsId)) {
            return 'Could not find players for this server.';
        }

        let foundPlayers = [];
        if (command.toLowerCase() === `${prefix}players`) {
            foundPlayers = Client.client.battlemetricsOnlinePlayers[battlemetricsId].slice();
            if (foundPlayers.length === 0) return 'Could not find any players.';
        }
        else if (command.toLowerCase().startsWith(`${prefix}player `)) {
            const name = command.slice(`${prefix}player `.length).trim();

            for (const player of Client.client.battlemetricsOnlinePlayers[battlemetricsId]) {
                if (player.name.includes(name)) foundPlayers.push(player);
            }
            if (foundPlayers.length === 0) return `Could not find any players '${name}'`;
        }
        else {
            return null;
        }

        const messageMaxLength = Constants.MAX_LENGTH_TEAM_MESSAGE - this.trademarkString.length;
        const leftLength = `...xxx more.`.length;

        let string = '';
        let playerIndex = 0;
        for (const player of foundPlayers) {
            const playerString = `${player.name} [${player.time}], `;

            if ((string.length + playerString.length + leftLength) < messageMaxLength) {
                string += playerString;
            }
            else if ((string.length + playerString.length + leftLength) > messageMaxLength) {
                break;
            }

            playerIndex += 1;
        }

        if (string !== '') {
            string = string.slice(0, -2);

            if (playerIndex < foundPlayers.length) {
                return `${string} ...${foundPlayers.length - playerIndex} more.`;
            }
            else {
                return `${string}.`;
            }
        }
    }

    getCommandPop(isInfoChannel = false) {
        if (isInfoChannel) {
            return `${this.info.players}${this.info.isQueue() ? `(${this.info.queuedPlayers})` : ''}` +
                `/${this.info.maxPlayers}`;
        }
        else {
            const string = `Population: (${this.info.players}/${this.info.maxPlayers}) players`;
            return `${string}${this.info.isQueue() ? ` and ${this.info.queuedPlayers} players in queue.` : '.'}`;
        }
    }

    async getCommandProx(command, callerSteamId) {
        const caller = this.team.getPlayer(callerSteamId);
        const prefix = this.generalSettings.prefix;

        if (command.toLowerCase() !== `${prefix}prox` && !command.toLowerCase().startsWith(`${prefix}prox `)) {
            return null;
        }

        const teamInfo = await this.getTeamInfoAsync();
        if (!(await this.isResponseValid(teamInfo))) return null;
        TeamHandler.handler(this, Client.client, teamInfo.teamInfo);
        this.team.updateTeam(teamInfo.teamInfo);

        if (command.toLowerCase() === `${prefix}prox`) {
            const closestPlayers = [];
            let players = [...this.team.players].filter(e => e.steamId !== callerSteamId && e.isAlive === true);
            if (players.length === 0) return 'You are the only one in the team.';

            for (let i = 0; i < 3; i++) {
                if (players.length > 0) {
                    const player = players.reduce(function (prev, curr) {
                        if (Map.getDistance(prev.x, prev.y, caller.x, caller.y) <
                            Map.getDistance(curr.x, curr.y, caller.x, caller.y)) {
                            return prev;
                        }
                        else {
                            return curr;
                        }
                    });
                    closestPlayers.push(player);
                    players = players.filter(e => e.steamId !== player.steamId);
                }
            }

            let string = '';
            for (const player of closestPlayers) {
                const distance = Math.floor(Map.getDistance(player.x, player.y, caller.x, caller.y));
                string += `${player.name} (${distance}m), `;
            }

            return string === '' ? 'All your teammates are dead.' : `${string.slice(0, -2)}.`
        }

        const memberName = command.slice(`${prefix}prox `.length).trim();

        for (const player of this.team.players) {
            if (player.name.includes(memberName)) {
                const distance = Math.floor(Map.getDistance(caller.x, caller.y, player.x, player.y));
                const direction = Map.getAngleBetweenPoints(caller.x, caller.y, player.x, player.y);
                return `${player.name} is ${distance}m from ${caller.name} in direction ${direction}.`;
            }
        }

        return `Could not identify team member: ${memberName}.`;
    }

    getCommandSmall(isInfoChannel = false) {
        const strings = [];
        for (const [id, timer] of Object.entries(this.mapMarkers.crateSmallOilRigTimers)) {
            const crate = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.Crate, parseInt(id));
            const time = Timer.getTimeLeftOfTimer(timer);
            if (time) {
                if (isInfoChannel) {
                    return `${Timer.getTimeLeftOfTimer(timer, 's')} until unlocks at ${crate.location.location}.`;
                }
                else {
                    strings.push(`${time} before Locked Crate at Small Oil Rig (${crate.location.location}) unlocks.`);
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceSmallOilRigWasTriggered === null) {
                return isInfoChannel ? 'No data.' : 'No current data on Small Oil Rig.';
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceSmallOilRigWasTriggered) / 1000;
                if (isInfoChannel) {
                    return `${Timer.secondsToFullScale(secondsSince, 's')} since last event.`;
                }
                else {
                    return `${Timer.secondsToFullScale(secondsSince)} ` +
                        `since Heavy Scientists last got called to Small Oil Rig.`;
                }
            }
        }

        return strings;
    }

    getCommandTime(isInfoChannel = false) {
        const time = Timer.convertDecimalToHoursMinutes(this.time.time);
        if (isInfoChannel) {
            return [time, this.time.getTimeTillDayOrNight('s')];
        }
        else {
            const string = `In-Game time: ${time}.`;
            const timeLeft = this.time.getTimeTillDayOrNight();

            if (timeLeft !== null) {
                return `${string} ${timeLeft} before ${this.time.isDay() ? 'nightfall' : 'daylight'}.`;
            }

            return string;
        }
    }

    getCommandTimer(command) {
        const prefix = this.generalSettings.prefix;

        command = command.slice(`${prefix}timer `.length).trim();
        const subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        if (subcommand.toLowerCase() === 'list' && command === '') {
            const strings = [];
            if (Object.keys(this.timers).length === 0) {
                return 'No active timers.';
            }

            for (const [id, content] of Object.entries(this.timers)) {
                const timeLeft = Timer.getTimeLeftOfTimer(content.timer);
                strings.push(`${parseInt(id)}: Time left: ${timeLeft}, Message: ${content.message}`);
            }

            return strings;
        }

        if (subcommand.toLowerCase() !== 'add' && subcommand.toLowerCase() !== 'remove') return 'Invalid subcommand.';
        if (command === '') return 'Missing arguments.';

        switch (subcommand.toLowerCase()) {
            case 'add': {
                const time = command.replace(/ .*/, '');
                const message = command.slice(time.length + 1);
                if (message === '') return 'Missing timer message.';

                const timeSeconds = Timer.getSecondsFromStringTime(time);
                if (timeSeconds === null) return 'Time format invalid.';

                let id = 0;
                while (Object.keys(this.timers).map(Number).includes(id)) {
                    id += 1;
                }

                this.timers[id] = {
                    timer: new Timer.timer(
                        () => {
                            this.printCommandOutput(`Timer: ${message}.`, 'TIMER');
                            delete this.timers[id]
                        },
                        timeSeconds * 1000),
                    message: message
                };
                this.timers[id].timer.start();

                return `Timer set for ${time}.`;
            } break;

            case 'remove': {
                const id = parseInt(command.replace(/ .*/, ''));
                if (isNaN(id)) return 'Timer ID is invalid.';

                if (!Object.keys(this.timers).map(Number).includes(id)) return `Timer ID: '${id}' does not exist.`;

                this.timers[id].timer.stop();
                delete this.timers[id];

                return `Timer ID: ${id} was removed.`;
            } break;

            default: {
                return null;
            } break;
        }
    }

    async getCommandTranslateTo(command) {
        const prefix = this.generalSettings.prefix;

        if (command.toLowerCase().startsWith(`${prefix}tr language `)) {
            const language = command.slice(`${prefix}tr language `.length).trim();
            if (language in Languages) {
                return `Language code: '${Languages[language]}'`;
            }
            else {
                return `Could not find language: '${language}'`;
            }
        }

        command = command.slice(`${prefix}tr `.length).trim();
        const language = command.replace(/ .*/, '');
        const text = command.slice(language.length).trim();

        if (language === '' || text === '') return 'Missing arguments.';

        try {
            return await Translate(text, language);
        }
        catch (e) {
            return `The language '${language}' is not supported.`;
        }
    }

    async getCommandTranslateFromTo(command) {
        const prefix = this.generalSettings.prefix;

        command = command.slice(`${prefix}trf `.length).trim();
        const languageFrom = command.replace(/ .*/, '');
        command = command.slice(languageFrom.length).trim();
        const languageTo = command.replace(/ .*/, '');
        const text = command.slice(languageTo.length).trim();

        if (languageFrom === '' || languageTo === '' || text === '') return 'Missing arguments.';

        try {
            return await Translate(text, { from: languageFrom, to: languageTo });
        }
        catch (e) {
            const regex = new RegExp('The language "(.*?)"');
            const invalidLanguage = regex.exec(e.message);

            if (invalidLanguage.length === 2) {
                return `The language '${invalidLanguage[1]}' is not supported.`;
            }

            return `The language is not supported.`;
        }
    }

    async getCommandTTS(command, callerName) {
        const prefix = this.generalSettings.prefix;
        const text = command.slice(`${prefix}tts `.length).trim();

        await DiscordMessages.sendTTSMessage(this.guildId, callerName, text);
        return 'Sent the Text-To-Speech.';
    }

    getCommandUpkeep() {
        const instance = Client.client.readInstanceFile(this.guildId);
        let cupboardFound = false;
        const strings = [];
        for (const [key, value] of Object.entries(instance.serverList[this.serverId].storageMonitors)) {
            if (value.type !== 'toolcupboard') continue;

            if (value.upkeep) {
                cupboardFound = true;
                strings.push(`${value.name} [${key}] upkeep: ${value.upkeep}`);
            }
        }

        if (!cupboardFound) return `No Tool Cupboard monitors were found.`;

        return strings;
    }

    getCommandWipe(isInfoChannel = false) {
        if (isInfoChannel) {
            return `Day ${Math.ceil(this.info.getSecondsSinceWipe() / (60 * 60 * 24))}`;
        }
        else {
            return `${this.info.getTimeSinceWipe()} since wipe.`;
        }
    }
}

module.exports = RustPlus;