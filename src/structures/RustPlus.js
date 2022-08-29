const Discord = require('discord.js');
const Fs = require('fs');
const Path = require('path');

const Client = require('../../index.ts');
const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const Items = require('./Items');
const Logger = require('./Logger.js');
const RustPlusLib = require('rustplus.js');
const Timer = require('../util/timer.js');

class RustPlus extends RustPlusLib {
    constructor(guildId, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.serverId = `${this.server}-${this.port}`;

        this.guildId = guildId;
        this.newConnection = false;
        this.intervalId = 0;
        this.logger = null;
        this.firstPoll = true;
        this.generalSettings = null;
        this.notificationSettings = null;
        this.deleted = false;
        this.connected = false;
        this.isReconnect = false;
        this.refusedConnectionRetry = false;
        this.firstTime = true;
        this.ready = false;
        this.currentSwitchTimeouts = new Object();

        this.storageMonitors = new Object();

        this.map = null;
        this.info = null;
        this.time = null;
        this.team = null;
        this.mapMarkers = null;

        this.items = new Items();

        let instance = Client.client.readInstanceFile(guildId);
        this.trademarkString = (instance.generalSettings.trademark === 'NOT SHOWING') ?
            '' : `${instance.generalSettings.trademark} | `;

        this.oldsendTeamMessageAsync = this.sendTeamMessageAsync;
        this.sendTeamMessageAsync = async function (message) {
            let messageMaxLength = Constants.MAX_LENGTH_TEAM_MESSAGE - this.trademarkString.length;
            let strings = message.match(new RegExp(`.{1,${messageMaxLength}}(\\s|$)`, 'g'));

            if (this.team === null || this.team.allOffline) {
                return;
            }

            for (let msg of strings) {
                if (!this.generalSettings.muteInGameBotMessages) {
                    await this.oldsendTeamMessageAsync(`${this.trademarkString}${msg}`);
                }
            }
        }

        /* Event timers */
        this.timers = new Object();

        /* Time variables */
        this.passedFirstSunriseOrSunset = false;
        this.startTimeObject = new Object();

        this.markers = new Object();

        this.informationIntervalCounter = 0;
        this.storageMonitorIntervalCounter = 0;
        this.smartSwitchIntervalCounter = 10;
        this.smartAlarmIntervalCounter = 20;

        this.interactionSwitches = [];

        /* Load rustplus events */
        this.loadRustPlusEvents();

        this.tokens = 24;
        this.tokens_limit = 24;     /* Per player */
        this.tokens_replenish = 3;  /* Per second */
        this.tokens_replenish_task = 0;
    }

    loadRustPlusEvents() {
        /* Dynamically retrieve the rustplus event files */
        const eventFiles = Fs.readdirSync(`${__dirname}/../rustplusEvents`).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../rustplusEvents/${file}`);
            this.on(event.name, (...args) => event.execute(this, Client.client, ...args));
        }
    }

    loadMarkers() {
        const instance = Client.client.readInstanceFile(this.guildId);
        const serverId = `${this.server}-${this.port}`;

        if (!instance.markers.hasOwnProperty(serverId)) {
            instance.markers[serverId] = {};
            Client.client.writeInstanceFile(this.guildId, instance);
        }

        for (const [name, location] of Object.entries(instance.markers[serverId])) {
            this.markers[name] = { x: location.x, y: location.y };
        }
    }

    build() {
        const instance = Client.client.readInstanceFile(this.guildId);

        /* Setup the logger */
        this.logger = new Logger(Path.join(__dirname, '..', `logs/${this.guildId}.log`), 'guild');
        this.logger.setGuildId(this.guildId);
        this.logger.serverName = instance.serverList[`${this.server}-${this.port}`].title;

        /* Setup settings */
        this.generalSettings = instance.generalSettings;
        this.notificationSettings = instance.notificationSettings;

        this.connect();
    }

    log(title, text, level = 'info') {
        this.logger.log(title, text, level);
    }

    async printCommandOutput(str, type = 'COMMAND') {
        if (this.generalSettings.commandDelay === '0') {
            await this.sendTeamMessageAsync(str);
        }
        else {
            let self = this;
            setTimeout(function () {
                self.sendTeamMessageAsync(str);
            }, parseInt(this.generalSettings.commandDelay) * 1000)

        }
        this.log(type, str);
    }

    async sendEvent(setting, text, firstPoll = false, image = null) {
        const img = (image !== null) ? image : setting.image;

        if (!firstPoll && setting.discord) {
            this.sendDiscordEvent(text, img)
        }
        if (!firstPoll && setting.inGame) {
            await this.sendTeamMessageAsync(`${text}`);
        }
        this.log('EVENT', text);
    }

    sendDiscordEvent(text, image) {
        const instance = Client.client.readInstanceFile(this.guildId);

        const content = {
            embeds: [DiscordEmbeds.getEventEmbed(this.guildId, this, text, image)],
            files: [new Discord.AttachmentBuilder(`src/resources/images/events/${image}`)]
        }

        DiscordMessages.sendMessage(this.guildId, content, null, instance.channelId.events);
    }

    replenish_tokens() {
        this.tokens += this.tokens_replenish;
        if (this.tokens > this.tokens_limit) {
            this.tokens = this.tokens_limit;
        }
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
            clearInterval(this.intervalId);
            return false;
        }
        return true;
    }
}

module.exports = RustPlus;