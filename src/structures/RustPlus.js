const Fs = require('fs');
const RustPlusLib = require('@liamcottle/rustplus.js');
const Path = require('path');

const Client = require('../../index.ts');
const Constants = require('../util/constants.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Logger = require('./Logger.js');
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
        this.logger = new Logger(Path.join(__dirname, '..', `logs/${this.guildId}.log`), 'guild');
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
        if (this.generalSettings.commandDelay === '0') {
            await this.sendTeamMessageAsync(str);
        }
        else {
            const self = this;
            setTimeout(function () {
                self.sendTeamMessageAsync(str);
            }, parseInt(this.generalSettings.commandDelay) * 1000)

        }
        this.log(type, str);
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
}

module.exports = RustPlus;