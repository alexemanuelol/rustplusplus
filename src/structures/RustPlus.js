const fs = require('fs');
const RP = require('rustplus.js');
const Client = require('../../index.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const Logger = require('./Logger.js');
const path = require('path');
const DiscordTools = require('../discordTools/discordTools.js');

const MAX_LENGTH_TEAM_MESSAGE = 128;

class RustPlus extends RP {
    constructor(guildId, serverIp, appPort, steamId, playerToken) {
        super(serverIp, appPort, steamId, playerToken);

        this.guildId = guildId;

        this.trademarkString = 'rustPlusPlus | ';
        this.messageIgnoreCounter = 0;

        this.oldsendTeamMessage = this.sendTeamMessage;
        this.sendTeamMessage = function (message, ignoreForward = false) {
            let trademark = (this.generalSettings.showTrademark) ? this.trademarkString : '';
            let messageMaxLength = MAX_LENGTH_TEAM_MESSAGE - trademark.length;
            let strings = message.match(new RegExp(`.{1,${messageMaxLength}}(\\s|$)`, 'g'));

            if (ignoreForward) {
                this.messageIgnoreCounter = strings.length;
            }

            for (let msg of strings) {
                if (!this.generalSettings.muteInGameBotMessages) {
                    this.oldsendTeamMessage(`${trademark}${msg}`);
                }
            }
        }

        this.logger = null;
        this.firstPoll = true;
        this.generalSettings = null;
        this.notificationSettings = null;

        /* Map meta */
        this.intervalId = 0;
        this.debug = false;
        this.mapSize = null;
        this.mapWidth = null;
        this.mapHeight = null;
        this.mapOceanMargin = null;
        this.mapMonuments = null;

        /* Event active entities */
        this.activeCargoShips = new Object();
        this.activeChinook47s = new Object();
        this.activeLockedCrates = new Object();
        this.activePatrolHelicopters = new Object();
        this.activeExplosions = new Object();
        this.patrolHelicoptersLeft = [];
        this.smallOilRigLockedCratesLeft = [];
        this.largeOilRigLockedCratesLeft = [];
        this.activeVendingMachines = [];
        this.foundItems = [];
        this.itemsToLookForId = [];

        /* Event timers */
        this.cargoShipEgressTimers = new Object();
        this.lockedCrateSmallOilRigTimers = new Object();
        this.lockedCrateLargeOilRigTimers = new Object();
        this.lockedCrateDespawnTimers = new Object();
        this.lockedCrateDespawnWarningTimers = new Object();
        this.bradleyRespawnTimers = new Object();
        this.timers = new Object();

        /* Event dates */
        this.timeSinceCargoWasOut = null;
        this.timeSinceChinookWasOut = null;
        this.timeSinceBradleyWasDestroyed = null;
        this.timeSinceHeliWasDestroyed = null;
        this.timeSinceHeliWasOnMap = null;
        this.timeSinceSmallOilRigWasTriggered = null;
        this.timeSinceLargeOilRigWasTriggered = null;
        this.timeSinceChinookDroppedCrate = null;

        /* Time variables */
        this.passedFirstSunriseOrSunset = false;
        this.startTimeObject = new Object();

        this.team = null;
        this.time = null;
        this.info = null;
        this.markers = new Object();

        this.informationIntervalCounter = 0;

        this.interactionSwitches = [];

        this.deleted = false;
        this.connected = false;
        this.isReconnect = false;
        this.firstTime = true;

        /* Load rustplus events */
        this.loadEvents();
    }

    loadEvents() {
        /* Dynamically retrieve the rustplus event files */
        const eventFiles = fs.readdirSync(`${__dirname}/../rustplusEvents`).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(`../rustplusEvents/${file}`);
            this.on(event.name, (...args) => event.execute(this, Client.client, ...args));
        }
    }

    loadMarkers() {
        let instance = Client.client.readInstanceFile(this.guildId);
        let server = `${this.server}-${this.port}`;

        if (!instance.markers.hasOwnProperty(server)) {
            instance.markers[server] = {};
            Client.client.writeInstanceFile(this.guildId, instance);
        }

        for (const [name, location] of Object.entries(instance.markers[server])) {
            this.markers[name] = { x: location.x, y: location.y };
        }
    }

    build() {
        let instance = Client.client.readInstanceFile(this.guildId);

        /* Setup the logger */
        this.logger = new Logger(path.join(__dirname, '..', `logs/${this.guildId}.log`), 'guild');
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

    isResponseValid(response) {
        if (response.response.hasOwnProperty('error')) {
            return false;
        }
        return true;
    }

    printCommandOutput(rustplus, str, type = 'COMMAND') {
        rustplus.sendTeamMessage(str, !rustplus.generalSettings.showTrademark);
        rustplus.log(type, str);
    }

    sendEvent(setting, text, firstPoll = false, image = null) {
        let img = (image !== null) ? image : setting.image;

        if (!firstPoll && setting.discord) {
            this.sendDiscordEvent(text, img)
        }
        if (!firstPoll && setting.inGame) {
            this.sendTeamMessage(`${text}`, !this.generalSettings.showTrademark);
        }
        this.log('EVENT', text);
    }

    sendDiscordEvent(text, image) {
        let instance = Client.client.readInstanceFile(this.guildId);
        let channel = DiscordTools.getTextChannelById(this.guildId, instance.channelId.events);

        if (channel !== undefined) {
            let file = new MessageAttachment(`src/images/${image}`);
            let embed = new MessageEmbed()
                .setColor('#ce412b')
                .setThumbnail(`attachment://${image}`)
                .setTitle(text)
                .setFooter({
                    text: instance.serverList[`${this.server}-${this.port}`].title
                })
                .setTimestamp();

            channel.send({ embeds: [embed], files: [file] });
        }
    }

    addItemToLookFor(id) {
        if (!this.itemsToLookForId.includes(id)) {
            this.itemsToLookForId.push(id);
        }
    }

    removeItemToLookFor(id) {
        this.itemsToLookForId = this.itemsToLookForId.filter(e => e !== id);
    }

    async turnSmartSwitchOnAsync(id, timeout = 2000) {
        return await this.setEntityValueAsync(id, true, timeout);
    }

    async turnSmartSwitchOffAsync(id, timeout = 2000) {
        return await this.setEntityValueAsync(id, false, timeout);
    }

    async setEntityValueAsync(id, value, timeout = 2000) {
        return await this.sendRequestAsync({
            entityId: id,
            setEntityValue: {
                value: value
            }
        }, timeout).catch((e) => {
            return e;
        });
    }

    async sendTeamMessageAsync(message, timeout = 2000) {
        return await this.sendRequestAsync({
            sendTeamMessage: {
                message: message
            }
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getEntityInfoAsync(id, timeout = 2000) {
        return await this.sendRequestAsync({
            entityId: id,
            getEntityInfo: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getMapAsync(timeout = 2000) {
        return await this.sendRequestAsync({
            getMap: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getTimeAsync(timeout = 2000) {
        return await this.sendRequestAsync({
            getTime: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getMapMarkersAsync(timeout = 2000) {
        return await this.sendRequestAsync({
            getMapMarkers: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getInfoAsync(timeout = 2000) {
        return await this.sendRequestAsync({
            getInfo: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getTeamInfoAsync(timeout = 2000) {
        return await this.sendRequestAsync({
            getTeamInfo: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async promoteToLeaderAsync(steamId, timeout = 2000) {
        return await this.sendRequestAsync({
            promoteToLeader: {
                steamId: steamId
            }
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getTeamChatAsync(timeout = 2000) {
        return await this.sendRequestAsync({
            getTeamChat: {

            }
        }, timeout).catch((e) => {
            return e;
        });
    }

    async checkSubscriptionAsync(id, timeout = 2000) {
        return await this.sendRequestAsync({
            entityId: id,
            checkSubscription: {}
        }, timeout).catch((e) => {
            return e;
        });
    }

    async setSubscriptionAsync(id, value, timeout = 2000) {
        return await this.sendRequestAsync({
            entityId: id,
            setSubscription: {
                value: value
            }
        }, timeout).catch((e) => {
            return e;
        });
    }

    async getCameraFrameAsync(identifier, frame, timeout = 2000) {
        return await this.sendRequestAsync({
            getCameraFrame: {
                identifier: identifier,
                frame: frame
            }
        }, timeout).catch((e) => {
            return e;
        });
    }
}

module.exports = RustPlus;