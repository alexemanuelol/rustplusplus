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

const Fs = require('fs');
const Path = require('path');
const RustPlusLib = require('@liamcottle/rustplus.js');
const Translate = require('translate');

const Client = require('../../index.ts');
const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const InstanceUtils = require('../util/instanceUtils.js');
const Languages = require('../util/languages.js');
const Logger = require('./Logger.js');
const Map = require('../util/map.js');
const RustPlusLite = require('../structures/RustPlusLite');
const TeamHandler = require('../handlers/teamHandler.js');
const Timer = require('../util/timer.js');

const TOKENS_LIMIT = 24;        /* Per player */
const TOKENS_REPLENISH = 3;     /* Per second */

class RustPlus extends RustPlusLib {
    constructor(guildId, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.serverId = `${this.server}-${this.port}`;
        this.guildId = guildId;

        this.leaderRustPlusInstance = null;

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

        this.foundSubscriptionItems = [];           /* Stores found vending machine items that are subscribed to */
        this.firstPollItems = [];                   /* When a new item is added to subscription list, dont notify
                                                       about the already available items. */

        this.allConnections = [];
        this.playerConnections = new Object();
        this.allDeaths = [];
        this.playerDeaths = new Object();
        this.patrolHelicopterTracers = new Object();
        this.cargoShipTracers = new Object();

        /* Rustplus structures */
        this.map = null;            /* Stores the Map structure. */
        this.info = null;           /* Stores the Info structure. */
        this.time = null;           /* Stores the Time structure. */
        this.team = null;           /* Stores the Team structure. */
        this.mapMarkers = null;     /* Stores the MapMarkers structure. */

        /* Retrieve the trademark string */
        const instance = Client.client.getInstance(guildId);
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
        const instance = Client.client.getInstance(this.guildId);

        for (const [name, location] of Object.entries(instance.serverList[this.serverId].markers)) {
            this.markers[name] = { x: location.x, y: location.y, location: location.location };
        }
    }

    build() {
        const instance = Client.client.getInstance(this.guildId);

        /* Setup the logger */
        this.logger = new Logger(Path.join(__dirname, '..', '..', `logs/${this.guildId}.log`), 'guild');
        this.logger.setGuildId(this.guildId);
        this.logger.serverName = instance.serverList[this.serverId].title;

        /* Setup settings */
        this.generalSettings = instance.generalSettings;
        this.notificationSettings = instance.notificationSettings;

        this.connect();
    }

    updateLeaderRustPlusLiteInstance() {
        if (this.leaderRustPlusInstance !== null) {
            this.leaderRustPlusInstance.isActive = false;
            this.leaderRustPlusInstance.disconnect();
            this.leaderRustPlusInstance = null;
        }

        const instance = Client.client.getInstance(this.guildId);
        const leader = this.team.leaderSteamId;
        if (leader === this.playerId) return;
        if (!(leader in instance.serverListLite[this.serverId])) return;
        const serverLite = instance.serverListLite[this.serverId][leader];

        this.leaderRustPlusInstance = new RustPlusLite(
            this.guildId,
            this.logger,
            serverLite.serverIp,
            serverLite.appPort,
            serverLite.steamId,
            serverLite.playerToken
        );
        this.leaderRustPlusInstance.connect();
    }

    isServerAvailable() {
        const instance = Client.client.getInstance(this.guildId);
        return instance.serverList.hasOwnProperty(this.serverId);
    }

    updateConnections(steamId, str) {
        const time = Timer.getCurrentDateTime();
        const savedString = `${time} - ${str}`;

        if (this.allConnections.length === 10) {
            this.allConnections.pop();
        }
        this.allConnections.unshift(savedString)

        if (!this.playerConnections.hasOwnProperty(steamId)) {
            this.playerConnections[steamId] = [];
        }

        if (this.playerConnections[steamId].length === 10) {
            this.playerConnections[steamId].pop();
        }
        this.playerConnections[steamId].unshift(savedString);
    }

    updateDeaths(steamId, data) {
        const time = Timer.getCurrentDateTime();
        data['time'] = time;

        if (this.allDeaths.length === 10) {
            this.allDeaths.pop();
        }
        this.allDeaths.unshift(data)

        if (!this.playerDeaths.hasOwnProperty(steamId)) {
            this.playerDeaths[steamId] = [];
        }

        if (this.playerDeaths[steamId].length === 10) {
            this.playerDeaths[steamId].pop();
        }
        this.playerDeaths[steamId].unshift(data);
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

    async sendEvent(setting, text, embed_color, firstPoll = false, image = null) {
        const img = (image !== null) ? image : setting.image;

        if (!firstPoll && setting.discord) {
            await DiscordMessages.sendDiscordEventMessage(this.guildId, this.serverId, text, img, embed_color);
        }
        if (!firstPoll && setting.inGame) {
            await this.sendTeamMessageAsync(`${text}`);
        }
        this.log(Client.client.intlGet(null, 'eventCap'), text);
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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

    async subscribeToCameraAsync(identifier, timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
            }

            return await this.sendRequestAsync({
                cameraSubscribe: {
                    cameraId: identifier
                }
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async unsubscribeFromCameraAsync(timeout = 10000) {
        try {
            if (!(await this.waitForAvailableTokens(1))) {
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
            }

            return await this.sendRequestAsync({
                cameraUnsubscribe: {}
            }, timeout).catch((e) => {
                return e;
            });
        }
        catch (e) {
            return e;
        }
    }

    async sendCameraInputAsync(buttons, x, y, timeout = 1000) {
        try {
            if (!(await this.waitForAvailableTokens(0.01))) {
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
            }

            return await this.sendRequestAsync({
                cameraInput: {
                    buttons: buttons,
                    mouseDelta: {
                        x: x,
                        y: y
                    }
                }
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
                return { error: Client.client.intlGet(null, 'tokensDidNotReplenish') };
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
            this.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'responseIsUndefined'), 'error');
            return false;
        }
        else if (response.toString() === 'Error: Timeout reached while waiting for response') {
            this.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'responseTimeout'), 'error');
            return false;
        }
        else if (response.hasOwnProperty('error')) {
            this.log(Client.client.intlGet(null, 'errorCap'), Client.client.intlGet(null, 'responseContainError', {
                error: response.error
            }), 'error');
            return false;
        }
        else if (Object.keys(response).length === 0) {
            this.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'responseIsEmpty'), 'error');
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

        return string !== '' ? `${string.slice(0, -2)}.` : Client.client.intlGet(this.guildId, 'noOneIsAfk');
    }

    getCommandAlive(command) {
        const prefix = this.generalSettings.prefix;
        const commandAlive = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxAlive')}`;
        const commandAliveEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxAlive')}`;
        let name = null;

        if (command.toLowerCase() === `${commandAlive}` || command.toLowerCase() === `${commandAliveEn}`) {
            const player = this.team.getPlayerLongestAlive();
            return Client.client.intlGet(this.guildId, 'hasBeenAliveLongest', {
                name: player.name,
                time: player.getAliveTime()
            });
        }
        else if (command.toLowerCase().startsWith(`${commandAlive} `)) {
            name = command.slice(`${commandAlive} `.length).trim();
        }
        else if (command.toLowerCase().startsWith(`${commandAliveEn} `)) {
            name = command.slice(`${commandAliveEn} `.length).trim();
        }

        if (name === null) return null;

        for (const player of this.team.players) {
            if (player.name.includes(name)) {
                return Client.client.intlGet(this.guildId, 'playerHasBeenAliveFor', {
                    name: player.name,
                    time: player.getAliveTime()
                });
            }
        }

        return Client.client.intlGet(this.guildId, 'couldNotFindTeammate', {
            name: name
        });
    }

    getCommandCargo(isInfoChannel = false) {
        const strings = [];
        let unhandled = this.mapMarkers.cargoShips.map(e => e.id);
        for (const [id, timer] of Object.entries(this.mapMarkers.cargoShipEgressTimers)) {
            const cargoShip = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.CargoShip, parseInt(id));
            const time = Timer.getTimeLeftOfTimer(timer);
            if (time) {
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'egressInTime', {
                        time: Timer.getTimeLeftOfTimer(timer, 's'),
                        location: cargoShip.location.string
                    });
                }
                else {
                    strings.push(Client.client.intlGet(this.guildId, 'timeBeforeCargoEntersEgress', {
                        time: time,
                        location: cargoShip.location.string
                    }));
                }
            }
            unhandled = unhandled.filter(e => e != parseInt(id));
        }

        if (unhandled.length > 0) {
            for (const id of unhandled) {
                const cargoShip = this.mapMarkers.getMarkerByTypeId(this.mapMarkers.types.CargoShip, id);
                if (cargoShip.onItsWayOut) {
                    if (isInfoChannel) {
                        return Client.client.intlGet(this.guildId, 'leavingMapAt', {
                            location: cargoShip.location.string
                        });
                    }
                    else {
                        strings.push(Client.client.intlGet(this.guildId, 'cargoLeavingMapAt', {
                            location: cargoShip.location.string
                        }));
                    }
                }
                else {
                    if (isInfoChannel) {
                        return Client.client.intlGet(this.guildId, 'cargoAt', {
                            location: cargoShip.location.string
                        });
                    }
                    else {
                        strings.push(Client.client.intlGet(this.guildId, 'cargoLocatedAt', {
                            location: cargoShip.location.string
                        }));
                    }
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceCargoShipWasOut === null) {
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'notActive');;
                }
                else {
                    return Client.client.intlGet(this.guildId, 'cargoNotCurrentlyOnMap');
                }
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceCargoShipWasOut) / 1000;
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'timeSinceLast', {
                        time: Timer.secondsToFullScale(secondsSince)
                    });
                }
                else {
                    return Client.client.intlGet(this.guildId, 'timeSinceCargoLeft', {
                        time: Timer.secondsToFullScale(secondsSince)
                    });
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
                    return Client.client.intlGet(this.guildId, 'atLocation', {
                        location: ch47.location.string
                    });
                }
                else {
                    strings.push(Client.client.intlGet(this.guildId, 'chinook47Located', {
                        location: ch47.location.string
                    }));
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceCH47WasOut === null) {
                return isInfoChannel ? Client.client.intlGet(this.guildId, 'notActive') :
                    Client.client.intlGet(this.guildId, 'chinook47NotOnMap');
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceCH47WasOut) / 1000;
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'timeSinceLast', {
                        time: Timer.secondsToFullScale(secondsSince, 's')
                    });
                }
                else {
                    strings.push(Client.client.intlGet(this.guildId, 'timeSinceChinook47OnMap', {
                        time: Timer.secondsToFullScale(secondsSince)
                    }));
                }
            }
        }

        return strings;
    }

    getCommandConnection(command) {
        const prefix = this.generalSettings.prefix;
        const commandConnection = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxConnection')}`;
        const commandConnectionEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxConnection')}`;
        const commandConnections = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxConnections')}`;
        const commandConnectionsEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxConnections')}`;

        if (command.toLowerCase().startsWith(`${commandConnections}`) ||
            command.toLowerCase().startsWith(`${commandConnectionsEn}`)) {
            let number = null;
            if (command.toLowerCase().startsWith(`${commandConnections}`)) {
                number = parseInt(command.slice(`${commandConnections}`.length).trim());
            }
            else {
                number = parseInt(command.slice(`${commandConnectionsEn}`.length).trim());
            }

            if (this.allConnections.length === 0) {
                return Client.client.intlGet(this.guildId, 'noRegisteredConnectionEvents');
            }

            const strings = [];
            let counter = 1;
            for (const event of this.allConnections) {
                if (counter === 6) break;
                if (number === counter) return event;

                strings.push(event);
                counter += 1;
            }

            return strings;
        }
        else if (command.toLowerCase().startsWith(`${commandConnection} `) ||
            command.toLowerCase().startsWith(`${commandConnectionEn} `)) {
            if (command.toLowerCase().startsWith(`${commandConnection} `)) {
                command = command.slice(`${commandConnection} `.length).trim();
            }
            else {
                command = command.slice(`${commandConnectionEn} `.length).trim();
            }
            const name = command.replace(/ .*/, '');
            const number = parseInt(command.slice(name.length + 1));

            for (const player of this.team.players) {
                if (player.name.includes(name)) {
                    if (!this.playerConnections.hasOwnProperty(player.steamId)) {
                        this.playerConnections[player.steamId] = [];
                    }

                    if (this.playerConnections[player.steamId].length === 0) {
                        return Client.client.intlGet(this.guildId, 'noRegisteredConnectionEventsUser', {
                            user: player.name
                        });
                    }

                    const strings = [];
                    let counter = 1;
                    for (const event of this.playerConnections[player.steamId]) {
                        if (counter === 6) break;
                        if (number === counter) return event;

                        strings.push(event);
                        counter += 1;
                    }

                    return strings;
                }
            }

            return Client.client.intlGet(this.guildId, 'couldNotFindTeammate', {
                name: name
            });
        }

        return null;
    }

    async getCommandDeath(command, callerSteamId) {
        const prefix = this.generalSettings.prefix;
        const commandDeath = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxDeath')}`;
        const commandDeathEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxDeath')}`;
        const commandDeaths = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxDeaths')}`;
        const commandDeathsEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxDeaths')}`;

        const teamInfo = await this.getTeamInfoAsync();
        if (!(await this.isResponseValid(teamInfo))) return null;
        TeamHandler.handler(this, Client.client, teamInfo.teamInfo);
        this.team.updateTeam(teamInfo.teamInfo);

        const caller = this.team.getPlayer(callerSteamId);

        if (command.toLowerCase().startsWith(`${commandDeaths}`) ||
            command.toLowerCase().startsWith(`${commandDeathsEn}`)) {
            let number = null;
            if (command.toLowerCase().startsWith(`${commandDeaths}`)) {
                number = parseInt(command.slice(`${commandDeaths}`.length).trim());
            }
            else {
                number = parseInt(command.slice(`${commandDeathsEn}`.length).trim());
            }

            if (this.allDeaths.length === 0) {
                return Client.client.intlGet(this.guildId, 'noRegisteredDeathEvents');
            }

            const strings = [];
            let counter = 1;
            for (const event of this.allDeaths) {
                if (counter === 6) break;
                const location = event.location;

                let str = `${event.time} - ${event.name}: `;
                if (event.location === null) {
                    if (counter === number) return `${str}${Client.client.intlGet(this.guildId, 'unknown')}`;
                    strings.push(`${str}${Client.client.intlGet(this.guildId, 'unknown')}`);
                }
                else {
                    const distance = Math.floor(Map.getDistance(caller.x, caller.y, location.x, location.y));
                    const direction = Map.getAngleBetweenPoints(caller.x, caller.y, location.x, location.y);
                    const grid = location.location;
                    str += Client.client.intlGet(this.guildId, 'distanceDirectionGrid', {
                        distance: distance, direction: direction, grid: grid
                    });
                    if (counter === number) return str;
                    strings.push(str);
                }

                counter += 1;
            }

            return strings;
        }

        if (command.toLowerCase().startsWith(`${commandDeath} `)) {
            command = command.slice(`${commandDeath} `.length).trim();
        }
        else {
            command = command.slice(`${commandDeathEn} `.length).trim();
        }
        const name = command.replace(/ .*/, '');
        const number = parseInt(command.slice(name.length + 1));

        for (const player of this.team.players) {
            if (player.name.includes(name)) {
                if (!this.playerDeaths.hasOwnProperty(player.steamId)) {
                    this.playerDeaths[player.steamId] = [];
                }

                if (this.playerDeaths[player.steamId].length === 0) {
                    return Client.client.intlGet(this.guildId, 'noRegisteredDeathEventsUser', {
                        user: player.name
                    });
                }

                const strings = [];
                let counter = 1;
                for (const event of this.playerDeaths[player.steamId]) {
                    if (counter === 6) break;
                    const location = event.location;

                    let str = `${event.time} - `;
                    if (event.location === null) {
                        if (counter === number) return `${str}${Client.client.intlGet(this.guildId, 'unknown')}`;
                        strings.push(`${str}${Client.client.intlGet(this.guildId, 'unknown')}`);
                    }
                    else {
                        const distance = Math.floor(Map.getDistance(caller.x, caller.y, location.x, location.y));
                        const direction = Map.getAngleBetweenPoints(caller.x, caller.y, location.x, location.y);
                        const grid = location.location;
                        str += Client.client.intlGet(this.guildId, 'distanceDirectionGrid', {
                            distance: distance, direction: direction, grid: grid
                        });
                        if (counter === number) return str;
                        strings.push(str);
                    }

                    counter += 1;
                }

                return strings;
            }
        }

        return Client.client.intlGet(this.guildId, 'couldNotIdentifyMember', {
            name: name
        });
    }

    getCommandHeli(isInfoChannel = false) {
        const strings = [];
        for (const patrolHelicopter of this.mapMarkers.patrolHelicopters) {
            if (isInfoChannel) {
                return Client.client.intlGet(this.guildId, 'atLocation', {
                    location: patrolHelicopter.location.string
                });
            }
            else {
                strings.push(Client.client.intlGet(this.guildId, 'patrolHelicopterLocatedAt', {
                    location: patrolHelicopter.location.string
                }));
            }
        }

        if (strings.length === 0) {
            const wasOnMap = this.mapMarkers.timeSincePatrolHelicopterWasOnMap;
            const wasDestroyed = this.mapMarkers.timeSincePatrolHelicopterWasDestroyed;

            if (wasOnMap == null && wasDestroyed === null) {
                return isInfoChannel ? Client.client.intlGet(this.guildId, 'notActive') :
                    Client.client.intlGet(this.guildId, 'patrolHelicopterNotCurrentlyOnMap');
            }
            else if (wasOnMap !== null && wasDestroyed === null) {
                const secondsSince = (new Date() - wasOnMap) / 1000;
                if (isInfoChannel) {
                    const timeSince = Timer.secondsToFullScale(secondsSince, 's');
                    return Client.client.intlGet(this.guildId, 'timeSinceLast', {
                        time: timeSince
                    });
                }
                else {
                    const timeSince = Timer.secondsToFullScale(secondsSince);
                    return Client.client.intlGet(this.guildId, 'timeSincePatrolHelicopterWasOnMap', {
                        time: timeSince
                    });
                }
            }
            else if (wasOnMap !== null && wasDestroyed !== null) {
                if (isInfoChannel) {
                    const timeSinceOnMap = Timer.secondsToFullScale((new Date() - wasOnMap) / 1000, 's');
                    const timeSinceDestroyed = Timer.secondsToFullScale((new Date() - wasDestroyed) / 1000, 's');
                    return Client.client.intlGet(this.guildId, 'timeSinceLastSinceDestroyedShort', {
                        time1: timeSinceOnMap,
                        time2: timeSinceDestroyed
                    });
                }
                else {
                    const timeSinceOnMap = Timer.secondsToFullScale((new Date() - wasOnMap) / 1000);
                    const timeSinceDestroyed = Timer.secondsToFullScale((new Date() - wasDestroyed) / 1000);
                    return Client.client.intlGet(this.guildId, 'timeSinceLastSinceDestroyedLong', {
                        time1: timeSinceOnMap,
                        time2: timeSinceDestroyed
                    });
                }
            }
        }

        return strings;
    }

    getCommandLarge(isInfoChannel = false) {
        const strings = [];
        if (this.mapMarkers.crateLargeOilRigTimer) {
            const time = Timer.getTimeLeftOfTimer(this.mapMarkers.crateLargeOilRigTimer);
            if (time) {
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'timeUntilUnlocksAt', {
                        time: Timer.getTimeLeftOfTimer(this.mapMarkers.crateLargeOilRigTimer, 's'),
                        location: this.mapMarkers.crateLargeOilRigLocation
                    });
                }
                else {
                    strings.push(Client.client.intlGet(this.guildId, 'timeBeforeCrateAtLargeOilRigUnlocks', {
                        time: time,
                        location: this.mapMarkers.crateLargeOilRigLocation
                    }));
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceLargeOilRigWasTriggered === null) {
                return isInfoChannel ? Client.client.intlGet(this.guildId, 'noData') :
                    Client.client.intlGet(this.guildId, 'noDataOnLargeOilRig');
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceLargeOilRigWasTriggered) / 1000;
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'timeSinceLastEvent', {
                        time: Timer.secondsToFullScale(secondsSince, 's')
                    });
                }
                else {
                    return Client.client.intlGet(this.guildId, 'timeSinceHeavyScientistsOnLarge', {
                        time: Timer.secondsToFullScale(secondsSince)
                    });
                }
            }
        }

        return strings;
    }

    async getCommandLeader(command, callerSteamId) {
        const prefix = this.generalSettings.prefix;
        const commandLeader = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxLeader')}`;
        const commandLeaderEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxLeader')}`;

        if (!this.generalSettings.leaderCommandEnabled) {
            return Client.client.intlGet(this.guildId, 'leaderCommandIsDisabled');
        }

        const instance = Client.client.getInstance(this.guildId);
        if (!Object.keys(instance.serverListLite[this.serverId]).includes(this.team.leaderSteamId)) {
            let names = '';
            for (const player of this.team.players) {
                if (Object.keys(instance.serverListLite[this.serverId]).includes(player.steamId)) {
                    names += `${player.name}, `
                }
            }
            names = names.slice(0, -2);

            return Client.client.intlGet(this.guildId, 'leaderCommandOnlyWorks', {
                name: names
            });
        }

        if (command.toLowerCase() === `${commandLeader}` || command.toLowerCase() === `${commandLeaderEn}`) {
            if (callerSteamId === null) return null;

            if (this.team.leaderSteamId !== callerSteamId) {
                if (this.generalSettings.leaderCommandOnlyForPaired) {
                    if (!Object.keys(instance.serverListLite[this.serverId]).includes(callerSteamId)) {
                        return Client.client.intlGet(this.guildId, 'youAreNotPairedWithServer');
                    }
                }

                if (this.team.leaderSteamId === this.playerId) {
                    await this.team.changeLeadership(callerSteamId);
                }
                else {
                    this.leaderRustPlusInstance.promoteToLeaderAsync(callerSteamId);
                }

                const player = this.team.getPlayer(callerSteamId);
                return Client.client.intlGet(this.guildId, 'leaderTransferred', {
                    name: player.name
                });
            }
            else {
                return Client.client.intlGet(this.guildId, 'youAreAlreadyLeader');
            }
        }
        else if (command.toLowerCase().startsWith(`${commandLeader} `) ||
            command.toLowerCase().startsWith(`${commandLeaderEn} `)) {
            let name = null;
            if (command.toLowerCase().startsWith(`${commandLeader} `)) {
                name = command.slice(`${commandLeader} `.length).trim();
            }
            else {
                name = command.slice(`${commandLeaderEn} `.length).trim();
            }

            for (const player of this.team.players) {
                if (player.name.includes(name)) {
                    if (this.team.leaderSteamId === player.steamId) {
                        return Client.client.intlGet(this.guildId, 'leaderAlreadyLeader', {
                            name: player.name
                        });
                    }
                    else {
                        if (this.generalSettings.leaderCommandOnlyForPaired) {
                            if (!Object.keys(instance.serverListLite[this.serverId]).includes(player.steamId)) {
                                return Client.client.intlGet(this.guildId, 'playerNotPairedWithServer', {
                                    name: player.name
                                });
                            }
                        }

                        if (this.team.leaderSteamId === this.playerId) {
                            await this.team.changeLeadership(player.steamId);
                        }
                        else {
                            this.leaderRustPlusInstance.promoteToLeaderAsync(player.steamId);
                        }

                        return Client.client.intlGet(this.guildId, 'leaderTransferred', {
                            name: player.name
                        });
                    }
                }
            }

            return Client.client.intlGet(this.guildId, 'couldNotIdentifyMember', {
                name: name
            });
        }

        return null;
    }

    async getCommandMarker(command, callerSteamId) {
        const prefix = this.generalSettings.prefix;
        const commandMarker = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxMarker')}`;
        const commandMarkerEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxMarker')}`;
        const commandMarkers = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxMarkers')}`;
        const commandMarkersEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxMarkers')}`;
        const commandAdd = `${Client.client.intlGet(this.guildId, 'commandSyntaxAdd')}`;
        const commandAddEn = `${Client.client.intlGet('en', 'commandSyntaxAdd')}`;
        const commandRemove = `${Client.client.intlGet(this.guildId, 'commandSyntaxRemove')}`;
        const commandRemoveEn = `${Client.client.intlGet('en', 'commandSyntaxRemove')}`;

        if (command.toLowerCase() === `${commandMarkers}` || command.toLowerCase() === `${commandMarkersEn}`) {
            let str = '';
            for (const name in this.markers) str += `${name} [${this.markers[name].location}], `;

            return str !== '' ? str.slice(0, -2) : Client.client.intlGet(this.guildId, 'noRegisteredMarkers');
        }

        if (command.toLowerCase().startsWith(`${commandMarker} `)) {
            command = command.slice(`${commandMarker} `.length).trim();
        }
        else {
            command = command.slice(`${commandMarkerEn} `.length).trim();
        }
        const subcommand = command.replace(/ .*/, '');
        const name = command.slice(subcommand.length + 1);

        switch (subcommand.toLowerCase()) {
            case commandAddEn:
            case commandAdd: {
                if (name.startsWith(commandAdd) || name.startsWith(commandRemove)) return null;
                if (name.startsWith(commandAddEn) || name.startsWith(commandRemoveEn)) return null;
                if (name === '') return null;

                const teamInfo = await this.getTeamInfoAsync();
                if (!(await this.isResponseValid(teamInfo))) return null;

                for (const player of teamInfo.teamInfo.members) {
                    if (player.steamId.toString() === callerSteamId) {
                        const instance = Client.client.getInstance(this.guildId);
                        const location = Map.getPos(player.x, player.y, this.info.correctedMapSize, this);
                        instance.serverList[this.serverId].markers[name] =
                            { x: player.x, y: player.y, location: location.location };
                        Client.client.setInstance(this.guildId, instance);
                        this.markers[name] = { x: player.x, y: player.y, location: location.location };

                        return Client.client.intlGet(this.guildId, 'markerAdded', {
                            name: name,
                            location: location.location
                        });
                    }
                }
            } break;

            case commandRemoveEn:
            case commandRemove: {
                const instance = Client.client.getInstance(this.guildId);

                if (name in this.markers) {
                    const location = this.markers[name].location;
                    delete this.markers[name];
                    delete instance.serverList[this.serverId].markers[name];
                    Client.client.setInstance(this.guildId, instance);

                    return Client.client.intlGet(this.guildId, 'markerRemoved', {
                        name: name,
                        location: location
                    });
                }
                return Client.client.intlGet(this.guildId, 'markerDoesNotExist', {
                    name: name
                });
            } break;

            default: {
                if (!(command in this.markers)) {
                    return Client.client.intlGet(this.guildId, 'markerDoesNotExist', {
                        name: command
                    });
                }

                const teamInfo = await this.getTeamInfoAsync();
                if (!(await this.isResponseValid(teamInfo))) return null;

                for (const player of teamInfo.teamInfo.members) {
                    if (player.steamId.toString() === callerSteamId) {
                        const direction = Map.getAngleBetweenPoints(player.x, player.y, this.markers[command].x,
                            this.markers[command].y);
                        const distance = Math.floor(Map.getDistance(player.x, player.y, this.markers[command].x,
                            this.markers[command].y));
                        console.log(this.markers[command])

                        return Client.client.intlGet(this.guildId, 'markerLocation', {
                            name: command,
                            location: this.markers[command].location,
                            distance: distance,
                            player: player.name,
                            direction: direction
                        });
                    }
                }
            } break;
        }

        return null;
    }

    getCommandMarket(command) {
        const instance = Client.client.getInstance(this.guildId);
        const prefix = this.generalSettings.prefix;
        const commandMarket = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxMarket')}`;
        const commandMarketEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxMarket')}`;
        const commandSearch = `${Client.client.intlGet(this.guildId, 'commandSyntaxSearch')}`;
        const commandSearchEn = `${Client.client.intlGet('en', 'commandSyntaxSearch')}`;
        const commandSub = `${Client.client.intlGet(this.guildId, 'commandSyntaxSubscribe')}`;
        const commandSubEn = `${Client.client.intlGet('en', 'commandSyntaxSubscribe')}`;
        const commandUnsub = `${Client.client.intlGet(this.guildId, 'commandSyntaxUnsubscribe')}`;
        const commandUnsubEn = `${Client.client.intlGet('en', 'commandSyntaxUnsubscribe')}`;
        const commandList = `${Client.client.intlGet(this.guildId, 'commandSyntaxList')}`;
        const commandListEn = `${Client.client.intlGet('en', 'commandSyntaxList')}`;

        if (command.toLowerCase().startsWith(`${commandMarket} `)) {
            command = command.slice(`${commandMarket} `.length).trim();
        }
        else {
            command = command.slice(`${commandMarketEn} `.length).trim();
        }
        const subcommand = command.replace(/ .*/, '');
        const name = command.slice(subcommand.length + 1);

        switch (subcommand) {
            case commandSearchEn:
            case commandSearch: {
                let itemId = null;
                if (name !== null) {
                    const item = Client.client.items.getClosestItemIdByName(name)
                    if (item === undefined) {
                        return Client.client.intlGet(this.guildId, 'noItemWithNameFound', {
                            name: name
                        });
                    }
                    else {
                        itemId = item;
                    }
                }

                const locations = [];
                for (const vendingMachine of this.mapMarkers.vendingMachines) {
                    if (!vendingMachine.hasOwnProperty('sellOrders')) continue;

                    for (const order of vendingMachine.sellOrders) {
                        if (order.amountInStock === 0) continue;

                        if (order.itemId === parseInt(itemId) || order.currencyId === parseInt(itemId)) {
                            if (locations.includes(vendingMachine.location.location)) continue;
                            locations.push(vendingMachine.location.location);
                        }
                    }
                }

                if (locations.length === 0) {
                    return Client.client.intlGet(this.guildId, 'noItemFound');
                }

                return locations.join(', ');
            } break;

            case commandSubEn:
            case commandSub: {
                let itemId = null;
                if (name !== null) {
                    const item = Client.client.items.getClosestItemIdByName(name)
                    if (item === undefined) {
                        return Client.client.intlGet(this.guildId, 'noItemWithNameFound', {
                            name: name
                        });
                    }
                    else {
                        itemId = item;
                    }
                }
                const itemName = Client.client.items.getName(itemId);

                if (instance.marketSubscriptionListItemIds.includes(itemId)) {
                    return Client.client.intlGet(this.guildId, 'alreadySubscribedToItem', {
                        name: itemName
                    });
                }
                else {
                    instance.marketSubscriptionListItemIds.push(itemId);
                    this.firstPollItems.push(itemId);
                    Client.client.setInstance(this.guildId, instance);

                    return Client.client.intlGet(this.guildId, 'justSubscribedToItem', {
                        name: itemName
                    });
                }
            } break;

            case commandUnsubEn:
            case commandUnsub: {
                let itemId = null;
                if (name !== null) {
                    const item = Client.client.items.getClosestItemIdByName(name)
                    if (item === undefined) {
                        return Client.client.intlGet(this.guildId, 'noItemWithNameFound', {
                            name: name
                        });
                    }
                    else {
                        itemId = item;
                    }
                }
                const itemName = Client.client.items.getName(itemId);

                if (instance.marketSubscriptionListItemIds.includes(itemId)) {
                    instance.marketSubscriptionListItemIds = instance.marketSubscriptionListItemIds.filter(e => e !== itemId);
                    Client.client.setInstance(this.guildId, instance);

                    return Client.client.intlGet(this.guildId, 'removedSubscribeItem', {
                        name: itemName
                    });
                }
                else {
                    return Client.client.intlGet(this.guildId, 'notExistInSubscription', {
                        name: itemName
                    });
                }
            } break;

            case commandListEn:
            case commandList: {
                const names = [];
                for (const item of instance.marketSubscriptionListItemIds) {
                    names.push(Client.client.items.getName(item));
                }

                if (names.length === 0) {
                    return Client.client.intlGet(this.guildId, 'subscriptionListEmpty');
                }

                return names.join(', ');
            } break;

            default: {
                return null;
            } break;
        }
    }

    getCommandMute() {
        const instance = Client.client.getInstance(this.guildId);
        instance.generalSettings.muteInGameBotMessages = true;
        this.generalSettings.muteInGameBotMessages = true;
        Client.client.setInstance(this.guildId, instance);

        return Client.client.intlGet(this.guildId, 'inGameBotMessagesMuted');
    }

    getCommandNote(command) {
        const instance = Client.client.getInstance(this.guildId);
        const prefix = this.generalSettings.prefix;
        const commandNote = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxNote')}`;
        const commandNoteEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxNote')}`;
        const commandNotes = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxNotes')}`;
        const commandNotesEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxNotes')}`;
        const commandAdd = `${Client.client.intlGet(this.guildId, 'commandSyntaxAdd')}`;
        const commandAddEn = `${Client.client.intlGet('en', 'commandSyntaxAdd')}`;
        const commandRemove = `${Client.client.intlGet(this.guildId, 'commandSyntaxRemove')}`;
        const commandRemoveEn = `${Client.client.intlGet('en', 'commandSyntaxRemove')}`;

        if (command.toLowerCase() === `${commandNotes}` || command.toLowerCase() === `${commandNotesEn}`) {
            if (Object.keys(instance.serverList[this.serverId].notes).length === 0) {
                return Client.client.intlGet(this.guildId, 'noSavedNotes');
            }

            const strings = [];
            for (const [id, note] of Object.entries(instance.serverList[this.serverId].notes)) {
                strings.push(`${id}: ${note}`);
            }
            return strings;
        }

        if (command.toLowerCase().startsWith(`${commandNote} `)) {
            command = command.slice(`${commandNote} `.length).trim();
        }
        else {
            command = command.slice(`${commandNoteEn} `.length).trim();
        }
        const subcommand = command.replace(/ .*/, '');
        const rest = command.slice(subcommand.length + 1);

        switch (subcommand.toLowerCase()) {
            case commandAddEn:
            case commandAdd: {
                let index = 0;
                while (Object.keys(instance.serverList[this.serverId].notes).map(Number).includes(index)) {
                    index += 1;
                }

                instance.serverList[this.serverId].notes[index] = `${rest}`;
                Client.client.setInstance(this.guildId, instance);
                return Client.client.intlGet(this.guildId, 'noteSaved');
            } break;

            case commandRemoveEn:
            case commandRemove: {
                const id = parseInt(rest.trim());

                if (!isNaN(id)) {
                    if (!Object.keys(instance.serverList[this.serverId].notes).map(Number).includes(id)) {
                        return Client.client.intlGet(this.guildId, 'noteIdDoesNotExist', { id: id });
                    }

                    delete instance.serverList[this.serverId].notes[id];
                    Client.client.setInstance(this.guildId, instance);
                    return Client.client.intlGet(this.guildId, 'noteIdWasRemoved', { id: id });
                }
                else {
                    return Client.client.intlGet(this.guildId, 'noteIdInvalid');
                }
            } break;

            default: {
                return null;
            } break;
        }
    }

    getCommandOffline() {
        let string = '';
        let counter = 0;
        for (const player of this.team.players) {
            if (!player.isOnline) {
                string += `${player.name}, `;
                counter += 1;
            }
        }
        const amount = `(${counter}/${this.team.players.length}) `;

        return string !== '' ? `${amount}${string.slice(0, -2)}.` :
            `${amount}${Client.client.intlGet(this.guildId, 'noOneIsOffline')}`;
    }

    getCommandOnline() {
        let string = '';
        let counter = 0;
        for (const player of this.team.players) {
            if (player.isOnline) {
                string += `${player.name}, `;
                counter += 1;
            }
        }
        const amount = `(${counter}/${this.team.players.length}) `;

        return string !== '' ? `${amount}${string.slice(0, -2)}.` :
            `${amount}${Client.client.intlGet(this.guildId, 'noOneIsOnline')}`;
    }

    getCommandPlayer(command) {
        const instance = Client.client.getInstance(this.guildId);
        const battlemetricsId = instance.serverList[this.serverId].battlemetricsId;
        const prefix = this.generalSettings.prefix;
        const commandPlayer = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxPlayer')}`;
        const commandPlayerEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxPlayer')}`;
        const commandPlayers = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxPlayers')}`;
        const commandPlayersEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxPlayers')}`;

        if (!battlemetricsId) {
            return Client.client.intlGet(this.guildId, 'serverUsingStreamerMode');
        }
        if (!Object.keys(Client.client.battlemetricsOnlinePlayers).includes(battlemetricsId)) {
            return Client.client.intlGet(this.guildId, 'couldNotFindPlayersForThisServer');
        }

        let foundPlayers = [];
        if (command.toLowerCase() === `${commandPlayers}` || command.toLowerCase() === `${commandPlayersEn}`) {
            foundPlayers = Client.client.battlemetricsOnlinePlayers[battlemetricsId].slice();
            if (foundPlayers.length === 0) {
                return Client.client.intlGet(this.guildId, 'couldNotFindAnyPlayers');
            }
        }
        else if (command.toLowerCase().startsWith(`${commandPlayer} `) ||
            command.toLowerCase().startsWith(`${commandPlayerEn} `)) {

            let name = null;
            if (command.toLowerCase().startsWith(`${commandPlayer}`)) {
                name = command.slice(`${commandPlayer} `.length).trim();
            }
            else {
                name = command.slice(`${commandPlayerEn} `.length).trim();
            }

            for (const player of Client.client.battlemetricsOnlinePlayers[battlemetricsId]) {
                if (player.name.includes(name)) foundPlayers.push(player);
            }
            if (foundPlayers.length === 0) {
                return Client.client.intlGet(this.guildId, 'couldNotFindPlayer', {
                    name: name
                });
            }
        }
        else {
            return null;
        }

        const messageMaxLength = Constants.MAX_LENGTH_TEAM_MESSAGE - this.trademarkString.length;
        const leftLength = `...xxx ${Client.client.intlGet(this.guildId, 'more')}.`.length;

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
                return Client.client.intlGet(this.guildId, 'morePlayers', {
                    players: string,
                    number: foundPlayers.length - playerIndex
                });
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
            const string = Client.client.intlGet(this.guildId, 'populationPlayers', {
                current: this.info.players,
                max: this.info.maxPlayers
            });
            const queuedPlayers = this.info.isQueue() ?
                ` ${Client.client.intlGet(this.guildId, 'populationQueue', { number: this.info.queuedPlayers })}` : '';

            return `${string}${queuedPlayers}`;
        }
    }

    async getCommandProx(command, callerSteamId) {
        const caller = this.team.getPlayer(callerSteamId);
        const prefix = this.generalSettings.prefix;
        const commandProx = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxProx')}`;
        const commandProxEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxProx')}`;

        if ((command.toLowerCase() !== `${commandProx}` && !command.toLowerCase().startsWith(`${commandProx} `)) &&
            (command.toLowerCase() !== `${commandProxEn}` && !command.toLowerCase().startsWith(`${commandProxEn} `))) {
            return null;
        }

        const teamInfo = await this.getTeamInfoAsync();
        if (!(await this.isResponseValid(teamInfo))) return null;
        TeamHandler.handler(this, Client.client, teamInfo.teamInfo);
        this.team.updateTeam(teamInfo.teamInfo);

        if (command.toLowerCase() === `${commandProx}` || command.toLowerCase() === `${commandProxEn}`) {
            const closestPlayers = [];
            let players = [...this.team.players].filter(e => e.steamId !== callerSteamId && e.isAlive === true);
            if (players.length === 0) {
                return Client.client.intlGet(this.guildId, 'onlyOneInTeam');
            }

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
                string += `${player.name} (${distance}m [${player.pos.location}]), `;
            }

            return string === '' ? Client.client.intlGet(this.guildId, 'allTeammatesAreDead') :
                `${string.slice(0, -2)}.`
        }

        let memberName = null;
        if (command.toLowerCase().startsWith(`${commandProx}`)) {
            memberName = command.slice(`${commandProx} `.length).trim();
        }
        else {
            memberName = command.slice(`${commandProxEn} `.length).trim();
        }

        for (const player of this.team.players) {
            if (player.name.includes(memberName)) {
                const distance = Math.floor(Map.getDistance(caller.x, caller.y, player.x, player.y));
                const direction = Map.getAngleBetweenPoints(caller.x, caller.y, player.x, player.y);
                return Client.client.intlGet(this.guildId, 'proxLocation', {
                    name: player.name,
                    distance: distance,
                    caller: caller.name,
                    direction: direction,
                    location: player.pos.location
                });
            }
        }

        return Client.client.intlGet(this.guildId, 'couldNotIdentifyMember', {
            name: memberName
        });
    }

    async getCommandSend(command, callerName) {
        const credentials = InstanceUtils.readCredentialsFile(this.guildId);
        const prefix = this.generalSettings.prefix;
        const commandSend = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxSend')}`;
        const commandSendEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxSend')}`;

        if (command.toLowerCase().startsWith(`${commandSend} `)) {
            command = command.slice(`${commandSend} `.length).trim();
        }
        else {
            command = command.slice(`${commandSendEn} `.length).trim();
        }
        const name = command.replace(/ .*/, '');
        const message = command.slice(name.length + 1).trim();

        if (name === '' || message === '') {
            return Client.client.intlGet(this.guildId, 'missingArguments');
        }

        for (const player of this.team.players) {
            if (player.name.includes(name)) {
                if (!(player.steamId in credentials)) {
                    return Client.client.intlGet(this.guildId, 'userNotRegistered', {
                        user: player.name
                    });
                }

                const discordUserId = credentials[player.steamId].discordUserId;
                const user = await DiscordTools.getUserById(this.guildId, discordUserId);

                const content = {
                    embeds: [DiscordEmbeds.getUserSendEmbed(this.guildId, this.serverId, callerName, message)]
                }

                if (user) {
                    await Client.client.messageSend(user, content);
                    return Client.client.intlGet(this.guildId, 'messageWasSent');
                }

                return Client.client.intlGet(this.guildId, 'couldNotFindUser', {
                    userId: discordUserId
                });
            }
        }

        return Client.client.intlGet(this.guildId, 'couldNotIdentifyMember', {
            name: name
        });
    }

    getCommandSmall(isInfoChannel = false) {
        const strings = [];
        if (this.mapMarkers.crateSmallOilRigTimer) {
            const time = Timer.getTimeLeftOfTimer(this.mapMarkers.crateSmallOilRigTimer);
            if (time) {
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'timeUntilUnlocksAt', {
                        time: Timer.getTimeLeftOfTimer(this.mapMarkers.crateSmallOilRigTimer, 's'),
                        location: this.mapMarkers.crateSmallOilRigLocation
                    });
                }
                else {
                    strings.push(Client.client.intlGet(this.guildId, 'timeBeforeCrateAtSmallOilRigUnlocks', {
                        time: time,
                        location: this.mapMarkers.crateSmallOilRigLocation
                    }));
                }
            }
        }

        if (strings.length === 0) {
            if (this.mapMarkers.timeSinceSmallOilRigWasTriggered === null) {
                return isInfoChannel ? Client.client.intlGet(this.guildId, 'noData') :
                    Client.client.intlGet(this.guildId, 'noDataOnSmallOilRig');
            }
            else {
                const secondsSince = (new Date() - this.mapMarkers.timeSinceSmallOilRigWasTriggered) / 1000;
                if (isInfoChannel) {
                    return Client.client.intlGet(this.guildId, 'timeSinceLastEvent', {
                        time: Timer.secondsToFullScale(secondsSince, 's')
                    });
                }
                else {
                    return Client.client.intlGet(this.guildId, 'timeSinceHeavyScientistsOnSmall', {
                        time: Timer.secondsToFullScale(secondsSince)
                    });
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
            const currentTime = Client.client.intlGet(this.guildId, 'inGameTime', { time: time });
            const timeLeft = this.time.getTimeTillDayOrNight();

            if (timeLeft === null) return currentTime;

            const locString = this.time.isDay() ? 'timeTillNightfall' : 'timeTillDaylight';
            const timeTilltransition = Client.client.intlGet(this.guildId, locString, { time: timeLeft });

            return `${currentTime} ${timeTilltransition}`;
        }
    }

    getCommandTimer(command) {
        const prefix = this.generalSettings.prefix;
        const commandTimer = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxTimer')}`;
        const commandTimerEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxTimer')}`;
        const commandTimers = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxTimers')}`;
        const commandTimersEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxTimers')}`;
        const commandAdd = `${Client.client.intlGet(this.guildId, 'commandSyntaxAdd')}`;
        const commandAddEn = `${Client.client.intlGet('en', 'commandSyntaxAdd')}`;
        const commandRemove = `${Client.client.intlGet(this.guildId, 'commandSyntaxRemove')}`;
        const commandRemoveEn = `${Client.client.intlGet('en', 'commandSyntaxRemove')}`;

        if (command.toLowerCase() === `${commandTimers}` || command.toLowerCase() === `${commandTimersEn}`) {
            if (Object.keys(this.timers).length === 0) {
                return Client.client.intlGet(this.guildId, 'noActiveTimers');
            }

            const strings = [];
            for (const [id, content] of Object.entries(this.timers)) {
                const timeLeft = Timer.getTimeLeftOfTimer(content.timer);
                strings.push(Client.client.intlGet(this.guildId, 'timeLeftTimer', {
                    id: parseInt(id),
                    time: timeLeft,
                    message: content.message
                }));
            }
            return strings;
        }

        if (command.toLowerCase().startsWith(`${commandTimer} `)) {
            command = command.slice(`${commandTimer} `.length).trim();
        }
        else {
            command = command.slice(`${commandTimerEn} `.length).trim();
        }
        const subcommand = command.replace(/ .*/, '');
        const rest = command.slice(subcommand.length + 1);

        switch (subcommand.toLowerCase()) {
            case commandAddEn:
            case commandAdd: {
                const time = rest.replace(/ .*/, '');
                const message = rest.slice(time.length + 1);
                if (message === '') return Client.client.intlGet(this.guildId, 'missingTimerMessage');

                const timeSeconds = Timer.getSecondsFromStringTime(time);
                if (timeSeconds === null) return Client.client.intlGet(this.guildId, 'timeFormatInvalid');

                let id = 0;
                while (Object.keys(this.timers).map(Number).includes(id)) {
                    id += 1;
                }

                this.timers[id] = {
                    timer: new Timer.timer(
                        () => {
                            this.printCommandOutput(Client.client.intlGet(this.guildId, 'timer',
                                { message: message }), 'TIMER');
                            delete this.timers[id]
                        },
                        timeSeconds * 1000),
                    message: message
                };
                this.timers[id].timer.start();

                return Client.client.intlGet(this.guildId, 'timerSet', { time: time });
            } break;

            case commandRemoveEn:
            case commandRemove: {
                const id = parseInt(rest.replace(/ .*/, ''));
                if (isNaN(id)) return Client.client.intlGet(this.guildId, 'timerIdInvalid');

                if (!Object.keys(this.timers).map(Number).includes(id)) {
                    return Client.client.intlGet(this.guildId, 'timerIdDoesNotExist', { id: id });
                }

                this.timers[id].timer.stop();
                delete this.timers[id];

                return Client.client.intlGet(this.guildId, 'timerRemoved', { id: id });
            } break;

            default: {
                return null;
            } break;
        }
    }

    async getCommandTranslateTo(command) {
        const prefix = this.generalSettings.prefix;
        const commandTr = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxTranslateTo')}`;
        const commandTrEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxTranslateTo')}`;
        const commandLanguage = `${Client.client.intlGet(this.guildId, 'commandSyntaxLanguage')}`;
        const commandLanguageEn = `${Client.client.intlGet('en', 'commandSyntaxLanguage')}`;

        if (command.toLowerCase().startsWith(`${commandTr} ${commandLanguage} `) ||
            command.toLowerCase().startsWith(`${commandTrEn} ${commandLanguageEn} `)) {

            let language = null;
            if (command.toLowerCase().startsWith(`${commandTr} ${commandLanguage} `)) {
                language = command.slice(`${commandTr} ${commandLanguage} `.length).trim();
            }
            else {
                language = command.slice(`${commandTrEn} ${commandLanguageEn} `.length).trim();
            }

            if (language in Languages) {
                return Client.client.intlGet(this.guildId, 'languageCode', {
                    code: Languages[language]
                });
            }
            else {
                return Client.client.intlGet(this.guildId, 'couldNotFindLanguage', {
                    language: language
                });
            }
        }

        if (command.toLowerCase().startsWith(`${commandTr} `)) {
            command = command.slice(`${commandTr} `.length).trim();
        }
        else {
            command = command.slice(`${commandTrEn} `.length).trim();
        }
        const language = command.replace(/ .*/, '');
        const text = command.slice(language.length).trim();

        if (language === '' || text === '') {
            return Client.client.intlGet(this.guildId, 'missingArguments');
        }

        try {
            return await Translate(text, language);
        }
        catch (e) {
            return Client.client.intlGet(this.guildId, 'languageLangNotSupported', {
                language: language
            });
        }
    }

    async getCommandTranslateFromTo(command) {
        const prefix = this.generalSettings.prefix;
        const commandTrf = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxTranslateFromTo')}`;
        const commandTrfEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxTranslateFromTo')}`;

        if (command.toLowerCase().startsWith(`${commandTrf}`)) {
            command = command.slice(`${commandTrf} `.length).trim();
        }
        else {
            command = command.slice(`${commandTrfEn} `.length).trim();
        }

        const languageFrom = command.replace(/ .*/, '');
        command = command.slice(languageFrom.length).trim();
        const languageTo = command.replace(/ .*/, '');
        const text = command.slice(languageTo.length).trim();

        if (languageFrom === '' || languageTo === '' || text === '') {
            return Client.client.intlGet(this.guildId, 'missingArguments');
        }

        try {
            return await Translate(text, { from: languageFrom, to: languageTo });
        }
        catch (e) {
            const regex = new RegExp('The language "(.*?)"');
            const invalidLanguage = regex.exec(e.message);

            if (invalidLanguage.length === 2) {
                return Client.client.intlGet(this.guildId, 'languageLangNotSupported', {
                    language: invalidLanguage[1]
                });
            }

            return Client.client.intlGet(this.guildId, 'languageNotSupported');
        }
    }

    async getCommandTTS(command, callerName) {
        const prefix = this.generalSettings.prefix;
        const commandTTS = `${prefix}${Client.client.intlGet(this.guildId, 'commandSyntaxTTS')}`;
        const commandTTSEn = `${prefix}${Client.client.intlGet('en', 'commandSyntaxTTS')}`;

        let text = null;
        if (command.toLowerCase().startsWith(`${commandTTS}`)) {
            text = command.slice(`${commandTTS} `.length).trim();
        }
        else {
            text = command.slice(`${commandTTSEn} `.length).trim();
        }

        await DiscordMessages.sendTTSMessage(this.guildId, callerName, text);
        return Client.client.intlGet(this.guildId, 'sentTextToSpeech');
    }

    getCommandUnmute() {
        const instance = Client.client.getInstance(this.guildId);
        instance.generalSettings.muteInGameBotMessages = false;
        this.generalSettings.muteInGameBotMessages = false;
        Client.client.setInstance(this.guildId, instance);

        return Client.client.intlGet(this.guildId, 'inGameBotMessagesUnmuted');
    }

    getCommandUpkeep() {
        const instance = Client.client.getInstance(this.guildId);
        let cupboardFound = false;
        const strings = [];
        for (const [key, value] of Object.entries(instance.serverList[this.serverId].storageMonitors)) {
            if (value.type !== 'toolCupboard') continue;

            if (value.upkeep) {
                cupboardFound = true;
                const upkeepStr = Client.client.intlGet(this.guildId, 'upkeep').toLowerCase();
                strings.push(`${value.name} [${key}] ${upkeepStr}: ${value.upkeep}`);
            }
        }

        if (!cupboardFound) return Client.client.intlGet(this.guildId, 'noToolCupboardWereFound');

        return strings;
    }

    getCommandWipe(isInfoChannel = false) {
        if (isInfoChannel) {
            return Client.client.intlGet(this.guildId, 'dayOfWipe', {
                day: Math.ceil(this.info.getSecondsSinceWipe() / (60 * 60 * 24))
            });
        }
        else {
            return Client.client.intlGet(this.guildId, 'timeSinceWipe', {
                time: this.info.getTimeSinceWipe()
            });
        }
    }
}

module.exports = RustPlus;
