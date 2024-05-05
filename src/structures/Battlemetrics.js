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

const Client = require('../../index.ts');
const RandomUsernames = require('../staticFiles/RandomUsernames.json');
const Utils = require = require('../util/utils.js');

const SERVER_LOG_SIZE = 1000;
const CONNECTION_LOG_SIZE = 1000;
const PLAYER_CONNECTION_LOG_SIZE = 100;
const NAME_CHANGE_LOG_SIZE = 100;

class Battlemetrics {

    /**
     *  Constructor for the Battlemetrics Class.
     *  @param {number|null} id The id of the server, default null.
     *  @param {string|null} name The name of the server, default null.
     */
    constructor(id = null, name = null) {
        this._id = id;
        this._name = name;

        this._data = null;

        this._ready = false;
        this._updatedAt = null;
        this._lastUpdateSuccessful = null;
        this._rustmapsAvailable = null;
        this._streamerMode = true; /* Until proven otherwise */
        this._serverLog = [];
        this._connectionLog = [];

        this._players = new Object();

        this._newPlayers = [];          /* New players in the players variable, updates every evaluation call. (id) */
        this._loginPlayers = [];        /* Players that just logged in, updates every evaluation call. (id) */
        this._logoutPlayers = [];       /* Players that just logged out, updates every evaluation call. (id) */
        this._nameChangedPlayers = [];  /* Players that changed name, updates every evaluation call({id, from, to}) */
        this._onlinePlayers = [];       /* Players that are online, updates every evaluation call. (id) */
        this._offlinePlayers = [];      /* Player that are offline, updates every evaluation call. (id) */

        this._serverEvaluation = new Object();

        /* Init API parameter variables */

        this.server_name = null;
        this.server_address = null;
        this.server_ip = null;
        this.server_port = null;
        this.server_players = null;
        this.server_maxPlayers = null;
        this.server_rank = null;
        this.server_location = null;
        this.server_status = null;
        this.server_private = null;
        this.server_createdAt = null;
        this.server_updatedAt = null;
        this.server_portQuery = null;
        this.server_country = null;
        this.server_queryStatus = null;
        this.server_official = null;
        this.server_rust_type = null;
        this.server_map = null;
        this.server_environment = null;
        this.server_rust_build = null;
        this.server_rust_ent_cnt_i = null;
        this.server_rust_fps = null;
        this.server_rust_fps_avg = null;
        this.server_rust_gc_cl = null;
        this.server_rust_gc_mb = null;
        this.server_rust_hash = null;
        this.server_rust_headerimage = null;
        this.server_rust_mem_pv = null;
        this.server_rust_mem_ws = null;
        this.server_pve = null;
        this.server_rust_uptime = null;
        this.server_rust_url = null;
        this.server_rust_world_seed = null;
        this.server_rust_world_size = null;
        this.server_rust_description = null;
        this.server_rust_modded = null;
        this.server_rust_queued_players = null;
        this.server_rust_gamemode = null;
        this.server_rust_born = null;
        this.server_rust_last_seed_change = null;
        this.server_rust_last_wipe = null;
        this.server_rust_last_wipe_ent = null;
        this.server_serverSteamId = null;
        this.map_url = null;
        this.map_thumbnailUrl = null;
        this.map_monuments = null;
        this.map_barren = null;
        this.map_updatedAt = null;
    }

    /***********************************************************************************
     *  Getters and Setters
     **********************************************************************************/

    get id() { return this._id; }
    set id(id) { this._id = id; }
    get name() { return this._name; }
    set name(name) { this._name = name; }
    get data() { return this._data; }
    set data(data) { this._data = data; }
    get ready() { return this._ready; }
    set ready(ready) { this._ready = ready; }
    get updatedAt() { return this._updatedAt; }
    set updatedAt(updatedAt) { this._updatedAt = updatedAt; }
    get lastUpdateSuccessful() { return this._lastUpdateSuccessful; }
    set lastUpdateSuccessful(lastUpdateSuccessful) { this._lastUpdateSuccessful = lastUpdateSuccessful; }
    get rustmapsAvailable() { return this._rustmapsAvailable; }
    set rustmapsAvailable(rustmapsAvailable) { this._rustmapsAvailable = rustmapsAvailable; }
    get streamerMode() { return this._streamerMode; }
    set streamerMode(streamerMode) { this._streamerMode = streamerMode; }
    get serverLog() { return this._serverLog; }
    set serverLog(serverLog) { this._serverLog = serverLog; }
    get connectionLog() { return this._connectionLog; }
    set connectionLog(connectionLog) { this._connectionLog = connectionLog; }
    get players() { return this._players; }
    set players(players) { this._players = players; }
    get newPlayers() { return this._newPlayers; }
    set newPlayers(newPlayers) { this._newPlayers = newPlayers; }
    get loginPlayers() { return this._loginPlayers; }
    set loginPlayers(loginPlayers) { this._loginPlayers = loginPlayers; }
    get logoutPlayers() { return this._logoutPlayers; }
    set logoutPlayers(logoutPlayers) { this._logoutPlayers = logoutPlayers; }
    get nameChangedPlayers() { return this._nameChangedPlayers; }
    set nameChangedPlayers(nameChangedPlayers) { this._nameChangedPlayers = nameChangedPlayers; }
    get onlinePlayers() { return this._onlinePlayers; }
    set onlinePlayers(onlinePlayers) { this._onlinePlayers = onlinePlayers; }
    get offlinePlayers() { return this._offlinePlayers; }
    set offlinePlayers(offlinePlayers) { this._offlinePlayers = offlinePlayers; }
    get serverEvaluation() { return this._serverEvaluation; }
    set serverEvaluation(serverEvaluation) { this._serverEvaluation = serverEvaluation; }

    /**
     *  Construct the Battlemetrics API call for searching servers by name.
     *  @param {string} name The name of the server.
     *  @return {string} The Battlemetrics API call string.
     */
    SEARCH_SERVER_NAME_API_CALL(name) {
        return `https://api.battlemetrics.com/servers?filter[search]=${name}&filter[game]=rust`;
    }

    /**
     *  Construct the Battlemetrics API call for getting server data.
     *  @param {number} id The id of the server.
     *  @return {string} The Battlemetrics API call string.
     */
    GET_SERVER_DATA_API_CALL(id) {
        return `https://api.battlemetrics.com/servers/${id}?include=player`;
    }

    /**
     *  Construct the Battlemetrics API call for getting profile data.
     *  @param {number} id The id of the player.
     *  @return {string} The Battlemetrics API call string.
     */
    GET_PROFILE_DATA_API_CALL(id) {
        return `https://api.battlemetrics.com/players/${id}?include=identifier`;
    }

    /**
     *  Construct the Battlemetrics API call for getting most time played data.
     *  @param {number} id The id of the server.
     *  @param {number} days The number of days before today to look.
     *  @return {string} The Battlemetrics API call string.
     */
    GET_SERVER_MOST_TIME_PLAYED_API_CALL(id, days = null) {
        let period = 'AT'; /* All-time if days are not provided */
        if (days !== null) {
            const now = new Date().toISOString();
            const daysAgo = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
            period = `${daysAgo}:${now}`
        }

        return `https://api.battlemetrics.com/servers/${id}/relationships/leaderboards/time?filter[period]=${period}`;
    }

    /**
     *  Construct the Battlemetrics player profile URL.
     *  @param {number} id The id of the player.
     *  @return {string} The Battlemetrics player profile URL.
     */
    GET_BATTLEMETRICS_PLAYER_URL(id) {
        return `https://www.battlemetrics.com/players/${id}`;
    }

    /***********************************************************************************
     *  Private methods
     **********************************************************************************/

    /**
     *  Request a get call from the Axios library.
     *  @param {string} api_call The request api call string.
     *  @return {object} The response from Axios library.
     */
    async #request(api_call) {
        try {
            return await Axios.get(api_call);
        }
        catch (e) {
            return {};
        }
    }

    /**
     *  Parse the data from a most time played api call.
     *  @param {object} data The data to be parsed.
     *  @return {object} The parsed data object.
     */
    #parseMostTimePlayedApiResponse(data) {
        const parsed = new Object();
        parsed['players'] = [];

        for (const entity of data.data) {
            if (entity.type !== 'leaderboardPlayer') continue;

            const player = new Object();
            player['id'] = entity.id;
            player['name'] = Utils.removeInvisibleCharacters(entity.attributes.name);
            player['time'] = entity.attributes.value;
            player['rank'] = entity.attributes.rank;
            player['url'] = this.GET_BATTLEMETRICS_PLAYER_URL(entity.id);

            parsed['players'].push(player);
        }

        if (data.hasOwnProperty('links') && data['links'].hasOwnProperty('next')) {
            parsed['next'] = data.links.next;
        }

        return parsed;
    }

    /**
     *  Parse the data from a profile data api call.
     *  @param {object} data The data to be parsed.
     *  @return {object} The parsed data object.
     */
    #parseProfileDataApiResponse(data) {
        const parsed = [];

        for (const name of data.included) {
            if (name.type !== 'identifier') continue;
            if (!name.hasOwnProperty('attributes')) continue;
            if (!name['attributes'].hasOwnProperty('type')) continue;
            if (name['attributes']['type'] !== 'name') continue;
            if (!name['attributes'].hasOwnProperty('identifier')) continue;
            if (!name['attributes'].hasOwnProperty('lastSeen')) continue;

            parsed.push({
                'name': name['attributes']['identifier'],
                'lastSeen': name['attributes']['lastSeen']
            });
        }

        return parsed;
    }

    /**
     *  Update the server log of the server.
     *  @param {object} data Types 0 = Online, 1 = Offline. And time in iso format.
     */
    #updateServerLog(data) {
        if (this.serverLog.length === SERVER_LOG_SIZE) {
            this.serverLog.pop();
        }
        this.serverLog.unshift(data);
    }

    /**
     *  Update the connection log of a player.
     *  @param {number} id The id of the player.
     *  @param {object} data Types 0 = Login, 1 = Logout. And time in iso format.
     */
    #updateConnectionLog(id, data) {
        if (!this.players.hasOwnProperty(id)) return;

        if (this.players[id]['connectionLog'].length === PLAYER_CONNECTION_LOG_SIZE) {
            this.players[id]['connectionLog'].pop();
        }
        this.players[id]['connectionLog'].unshift(data);

        /* Add to server connection log of all players */
        if (this.connectionLog.length === CONNECTION_LOG_SIZE) {
            this.connectionLog.pop();
        }
        this.connectionLog.unshift({ id: id, data: data });
    }

    /**
     *  Update the name change history of a player.
     *  @param {number} id The id of the player.
     *  @param {object} data From and To names and time in iso format.
     */
    #updateNameChangeHistory(id, data) {
        if (!this.players.hasOwnProperty(id)) return;

        if (this.players[id]['nameChangeHistory'].length === NAME_CHANGE_LOG_SIZE) {
            this.players[id]['nameChangeHistory'].pop();
        }
        this.players[id]['nameChangeHistory'].unshift(data);
    }

    /**
     *  Evaluate if a server parameter have changed.
     *  @param {string} key The parameter key.
     *  @param {string} value1 The value of the current server setting.
     *  @param {string} value2 The value of the new server setting.
     */
    #evaluateServerParameter(key, value1, value2, firstTime) {
        if (firstTime) return;

        let isDifferent = false;
        if (Array.isArray(value1) || Array.isArray(value2)) {
            if (value1.length != value2.length || !value1.every(function (u, i) { return u === value2[i] })) {
                isDifferent = true;
            }
        }
        else {
            if (value1 !== value2) {
                isDifferent = true;
            }
        }

        if (isDifferent) {
            this.serverEvaluation[key] = { from: value1, to: value2 }

            const time = new Date().toISOString();
            this.#updateServerLog({ key: key, from: value1, to: value2, time: time });
        }
    }

    /**
     *  Format the time from timestamp to now [seconds,HH:MM].
     *  @param {string} timestamp The timestamp from before.
     *  @return {Array} index 0: seconds, index 1: The formatted time, null if invalid.
     */
    #formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = Date.now();
        const diffMs = now - date;
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs / (1000 * 60)) % 60);
        const hoursStr = diffHours.toString().padStart(2, '0');
        const minutesStr = diffMinutes.toString().padStart(2, '0');
        return [parseInt(diffMs / 1000), `${hoursStr}:${minutesStr}`];
    }

    /***********************************************************************************
     *  Public methods
     **********************************************************************************/

    /**
     *  Request the data part of an API call.
     *  @param {string} api_call The request api call string.
     *  @return {(object|null)} The response data.
     */
    async request(api_call) {
        if (this.id === null) return null;

        const response = await this.#request(api_call);

        if (response.status !== 200) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'battlemetricsApiRequestFailed', { api_call: api_call }), 'error');
            return null;
        }

        return response.data;
    }

    /**
     *  Setup the Battlemetrics instance based on the id or name of the server.
     *  This will update the instance for the first time with server data and
     *  decide if the server is streamer mode or not.
     */
    async setup() {
        if (this.id === null && this.name === null) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'battlemetricsIdAndNameMissing'), 'error');
            return;
        }

        if (this.id === null && this.name !== null) {
            this.id = await this.getServerIdFromName(this.name);
            if (!this.id) return;
        }

        this.updateStreamerMode();

        this.lastUpdateSuccessful = true;
        await this.evaluation(null, true);
    }

    /**
     *  Sends a request to get most time played data 30 days back and from that
     *  evaluate if the names are part of the "streamer mode names"-list or not.
     *  If any name can't be found in the "streamer mode names"-list, streamerMode
     *  flag will be set to false.
     */
    async updateStreamerMode() {
        const data = await this.request(this.GET_SERVER_MOST_TIME_PLAYED_API_CALL(this.id, 30));
        if (!data) return;

        const parsed = this.#parseMostTimePlayedApiResponse(data);
        for (const player of parsed.players) {
            if (!RandomUsernames.RandomUsernames.includes(player.name)) this.streamerMode = false;
        }
    }

    /**
     *  Get the id of a server based on the name of that server.
     *  @param {string} name The name of the server.
     *  @return {number|null} The id of the server.
     */
    async getServerIdFromName(name) {
        const originalName = name;
        name = encodeURI(name).replace('\#', '\*');
        const search = this.SEARCH_SERVER_NAME_API_CALL(name);
        const response = await this.#request(search);

        if (response.status !== 200) {
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'battlemetricsApiRequestFailed', { api_call: search }), 'error');
            return null;
        }

        /* Find the correct server. */
        for (const server of response.data.data) {
            if (server.attributes.name === originalName) {
                return server.id;
            }
        }

        return null;
    }

    /**
     *  Get the profile data of a player.
     *  @param {id} id The id of the player.
     *  @return {object|null} The profile data object of the player.
     */
    async getProfileData(playerId) {
        const data = await this.request(this.GET_PROFILE_DATA_API_CALL(playerId));
        if (!data) return [];

        return this.#parseProfileDataApiResponse(data);
    }

    /**
     *  Evaluate the server data to check for changes.
     *  @param {bool} firstTime True if it is the first time evaluating, else false.
     *  @return {bool|null} null if id is not set, false if something went wrong, true if successful.
     */
    async evaluation(data = null, firstTime = false) {
        if (this.id === null) return null;

        if (data === null) {
            data = await this.request(this.GET_SERVER_DATA_API_CALL(this.id));
        }

        if (!data) {
            this.lastUpdateSuccessful = false;
            Client.client.log(Client.client.intlGet(null, 'errorCap'),
                Client.client.intlGet(null, 'battlemetricsFailedToUpdate', { server: this.id }), 'error');
            return false;
        }

        this.lastUpdateSuccessful = true;
        this.data = data;

        const time = new Date().toISOString();
        this.updatedAt = time;

        /* Server parameter evaluation */

        const attributes = data.data.attributes;
        this.serverEvaluation = new Object();
        this.#evaluateServerParameter('server_name', this.server_name, attributes.name, firstTime);
        this.#evaluateServerParameter('server_address', this.server_address, attributes.address, firstTime);
        this.#evaluateServerParameter('server_ip', this.server_ip, attributes.ip, firstTime);
        this.#evaluateServerParameter('server_port', this.server_port, attributes.port, firstTime);
        this.#evaluateServerParameter('server_players', this.server_players, attributes.players, firstTime);
        this.#evaluateServerParameter('server_maxPlayers', this.server_maxPlayers, attributes.maxPlayers, firstTime);
        this.#evaluateServerParameter('server_rank', this.server_rank, attributes.rank, firstTime);
        this.#evaluateServerParameter('server_location', this.server_location, attributes.location, firstTime);
        this.#evaluateServerParameter('server_status', this.server_status, attributes.status, firstTime);
        this.#evaluateServerParameter('server_private', this.server_private, attributes.private, firstTime);
        this.#evaluateServerParameter('server_createdAt', this.server_createdAt, attributes.createdAt, firstTime);
        this.#evaluateServerParameter('server_updatedAt', this.server_updatedAt, attributes.updatedAt, firstTime);
        this.#evaluateServerParameter('server_portQuery', this.server_portQuery, attributes.portQuery, firstTime);
        this.#evaluateServerParameter('server_country', this.server_country, attributes.country, firstTime);
        this.#evaluateServerParameter('server_queryStatus', this.server_queryStatus, attributes.queryStatus, firstTime);

        const details = attributes.details;
        this.#evaluateServerParameter('server_official', this.server_official, details.official, firstTime);
        this.#evaluateServerParameter('server_rust_type', this.server_rust_type, details.rust_type, firstTime);
        this.#evaluateServerParameter('server_map', this.server_map, details.map, firstTime);
        this.#evaluateServerParameter('server_environment', this.server_environment, details.environment, firstTime);
        this.#evaluateServerParameter('server_rust_build', this.server_rust_build, details.rust_build, firstTime);
        this.#evaluateServerParameter('server_rust_ent_cnt_i', this.server_rust_ent_cnt_i,
            details.rust_ent_cnt_i, firstTime);
        this.#evaluateServerParameter('server_rust_fps', this.server_rust_fps, details.rust_fps, firstTime);
        this.#evaluateServerParameter('server_rust_fps_avg', this.server_rust_fps_avg, details.rust_fps_avg, firstTime);
        this.#evaluateServerParameter('server_rust_gc_cl', this.server_rust_gc_cl, details.rust_gc_cl, firstTime);
        this.#evaluateServerParameter('server_rust_gc_mb', this.server_rust_gc_mb, details.rust_gc_mb, firstTime);
        this.#evaluateServerParameter('server_rust_hash', this.server_rust_hash, details.rust_hash, firstTime);
        this.#evaluateServerParameter('server_rust_headerimage', this.server_rust_headerimage,
            details.rust_headerimage, firstTime);
        this.#evaluateServerParameter('server_rust_mem_pv', this.server_rust_mem_pv, details.rust_mem_pv, firstTime);
        this.#evaluateServerParameter('server_rust_mem_ws', this.server_rust_mem_ws, details.rust_mem_ws, firstTime);
        this.#evaluateServerParameter('server_pve', this.server_pve, details.pve, firstTime);
        this.#evaluateServerParameter('server_rust_uptime', this.server_rust_uptime, details.rust_uptime, firstTime);
        this.#evaluateServerParameter('server_rust_url', this.server_rust_url, details.rust_url, firstTime);
        this.#evaluateServerParameter('server_rust_world_seed', this.server_rust_world_seed,
            details.rust_world_seed, firstTime);
        this.#evaluateServerParameter('server_rust_world_size', this.server_rust_world_size,
            details.rust_world_size, firstTime);
        this.#evaluateServerParameter('server_rust_description', this.server_rust_description,
            details.rust_description, firstTime);
        this.#evaluateServerParameter('server_rust_modded', this.server_rust_modded, details.rust_modded, firstTime);
        this.#evaluateServerParameter('server_rust_queued_players', this.server_rust_queued_players,
            details.rust_queued_players, firstTime);
        this.#evaluateServerParameter('server_rust_gamemode', this.server_rust_gamemode,
            details.rust_gamemode, firstTime);
        this.#evaluateServerParameter('server_rust_born', this.server_rust_born, details.rust_born, firstTime);
        this.#evaluateServerParameter('server_rust_last_seed_change', this.server_rust_last_seed_change,
            details.rust_last_seed_change, firstTime);
        this.#evaluateServerParameter('server_rust_last_wipe', this.server_rust_last_wipe,
            details.rust_last_wipe, firstTime);
        this.#evaluateServerParameter('server_rust_last_wipe_ent', this.server_rust_last_wipe_ent,
            details.rust_last_wipe_ent, firstTime);
        this.#evaluateServerParameter('server_serverSteamId', this.server_serverSteamId,
            details.serverSteamId, firstTime);

        const rustMaps = details.rust_maps;
        if (rustMaps) {
            this.#evaluateServerParameter('map_url', this.map_url, rustMaps.url, firstTime);
            this.#evaluateServerParameter('map_thumbnailUrl', this.map_thumbnailUrl, rustMaps.thumbnailUrl, firstTime);
            this.#evaluateServerParameter('map_monuments', this.map_monuments, rustMaps.monuments, firstTime);
            this.#evaluateServerParameter('map_barren', this.map_barren, rustMaps.barren, firstTime);
            this.#evaluateServerParameter('map_updatedAt', this.map_updatedAt, rustMaps.updatedAt, firstTime);
        }

        /* Players evaluation */

        this.newPlayers = [];
        this.loginPlayers = [];
        this.logoutPlayers = [];
        this.nameChangedPlayers = [];
        const prevOnlinePlayers = this.onlinePlayers;
        this.onlinePlayers = [];
        this.offlinePlayers = [];

        const included = data.included;
        for (const entity of included) {
            if (entity.type !== 'player') continue;

            const name = Utils.removeInvisibleCharacters(entity.attributes.name);

            if (!RandomUsernames.RandomUsernames.includes(name)) this.streamerMode = false;

            /**
             * Attributes description from Battlemetrics API Documentation
             *
             *  id              Unique identifier of player.
             *  name            The most recent name the player was seen using.
             *  private         True if this is a private profile. Private profiles disable public profiles
             *                  and remove the player from search and player lists.
             *  positiveMatch   Players with positiveMatch set to true will only match with a guaranteed
             *                  unique identifier.
             *  createdAt       When player was created.
             *  updatedAt       When player was last updated
             *  firstTime       True when this is the first time the player has been seen on the associated
             *                  server.
             */

            if (!this.players.hasOwnProperty(entity.id)) {  /* New Player */
                this.players[entity.id] = new Object();

                /* From Battlemetrics */
                this.players[entity.id]['id'] = entity.id;
                this.players[entity.id]['name'] = name;
                this.players[entity.id]['private'] = entity.attributes.private;
                this.players[entity.id]['positiveMatch'] = entity.attributes.positiveMatch;
                this.players[entity.id]['createdAt'] = entity.attributes.createdAt;
                this.players[entity.id]['updatedAt'] = entity.attributes.updatedAt;
                const firstTimeVar = entity.meta.metadata.find(e => e.key === 'firstTime');
                if (firstTimeVar) this.players[entity.id]['firstTime'] = firstTimeVar.value;

                /* Other */
                this.players[entity.id]['url'] = this.GET_BATTLEMETRICS_PLAYER_URL(entity.id);
                this.players[entity.id]['status'] = true;
                this.players[entity.id]['nameChangeHistory'] = [];
                this.players[entity.id]['connectionLog'] = [];
                this.players[entity.id]['logoutDate'] = null;

                if (!firstTime) this.#updateConnectionLog(entity.id, { type: 0, time: time }); /* 0 = Login event */

                this.newPlayers.push(entity.id);
            }
            else {  /* Existing Player */
                /* From Battlemetrics */
                this.players[entity.id]['id'] = entity.id;
                if (this.players[entity.id]['name'] !== name) {
                    this.nameChangedPlayers.push({
                        id: entity.id,
                        from: this.players[entity.id]['name'],
                        to: name
                    });
                    this.#updateNameChangeHistory(entity.id, {
                        from: this.players[entity.id]['name'],
                        to: name,
                        time: time
                    });
                    this.players[entity.id]['name'] = name;
                }
                this.players[entity.id]['private'] = entity.attributes.private;
                this.players[entity.id]['positiveMatch'] = entity.attributes.positiveMatch;
                this.players[entity.id]['createdAt'] = entity.attributes.createdAt;
                this.players[entity.id]['updatedAt'] = entity.attributes.updatedAt;
                const firstTime = entity.meta.metadata.find(e => e.key === 'firstTime');
                if (firstTime) this.players[entity.id]['firstTime'] = firstTime.value;

                /* Other */
                this.players[entity.id]['url'] = this.GET_BATTLEMETRICS_PLAYER_URL(entity.id);
                if (this.players[entity.id]['status'] === false) {
                    this.players[entity.id]['status'] = true;
                    this.#updateConnectionLog(entity.id, { type: 0, time: time }); /* 0 = Login event */
                    this.loginPlayers.push(entity.id);
                }
            }
            this.onlinePlayers.push(entity.id);
        }

        const offlinePlayers = prevOnlinePlayers.filter(e => !this.onlinePlayers.includes(e));
        for (const id of offlinePlayers) {
            this.players[id]['status'] = false;
            this.players[id]['logoutDate'] = time;
            this.#updateConnectionLog(id, { type: 1, time: time }); /* 1 = Logout event */
            this.logoutPlayers.push(id);
        }

        for (const [playerId, content] of Object.entries(this.players)) {
            if (content['status'] === false) this.offlinePlayers.push(playerId);
        }

        this.update(data);
        return true;
    }

    /**
     *  Update all parameters with fresh data.
     *  @param {object} data The data to update with.
     */
    update(data) {
        this.ready = true;
        this.id = data.data.id;

        const attributes = data.data.attributes;
        this.server_name = attributes.name;
        this.server_address = attributes.address;
        this.server_ip = attributes.ip;
        this.server_port = attributes.port;
        this.server_players = attributes.players;
        this.server_maxPlayers = attributes.maxPlayers;
        this.server_rank = attributes.rank;
        this.server_location = attributes.location;
        this.server_status = attributes.status;
        this.server_private = attributes.private;
        this.server_createdAt = attributes.createdAt;
        this.server_updatedAt = attributes.updatedAt;
        this.server_portQuery = attributes.portQuery;
        this.server_country = attributes.country;
        this.server_queryStatus = attributes.queryStatus;

        const details = attributes.details;
        this.server_official = details.official;
        this.server_rust_type = details.rust_type;
        this.server_map = details.map;
        this.server_environment = details.environment;
        this.server_rust_build = details.rust_build;
        this.server_rust_ent_cnt_i = details.rust_ent_cnt_i;
        this.server_rust_fps = details.rust_fps;
        this.server_rust_fps_avg = details.rust_fps_avg;
        this.server_rust_gc_cl = details.rust_gc_cl;
        this.server_rust_gc_mb = details.rust_gc_mb;
        this.server_rust_hash = details.rust_hash;
        this.server_rust_headerimage = details.rust_headerimage;
        this.server_rust_mem_pv = details.rust_mem_pv;
        this.server_rust_mem_ws = details.rust_mem_ws;
        this.server_pve = details.pve;
        this.server_rust_uptime = details.rust_uptime;
        this.server_rust_url = details.rust_url;
        this.server_rust_world_seed = details.rust_world_seed;
        this.server_rust_world_size = details.rust_world_size;
        this.server_rust_description = details.rust_description;
        this.server_rust_modded = details.rust_modded;
        this.server_rust_queued_players = details.rust_queued_players;
        this.server_rust_gamemode = details.rust_gamemode;
        this.server_rust_born = details.rust_born;
        this.server_rust_last_seed_change = details.rust_last_seed_change;
        this.server_rust_last_wipe = details.rust_last_wipe;
        this.server_rust_last_wipe_ent = details.rust_last_wipe_ent;
        this.server_serverSteamId = details.serverSteamId;

        const rustMaps = details.rust_maps;
        if (rustMaps) {
            this.rustmapsAvailable = true;
            this.map_url = rustMaps.url;
            this.map_thumbnailUrl = rustMaps.thumbnailUrl;
            this.map_monuments = rustMaps.monuments;
            this.map_barren = rustMaps.barren;
            this.map_updatedAt = rustMaps.updatedAt;
        }
        else {
            this.rustmapsAvailable = false;
            this.map_url = null;
            this.map_thumbnailUrl = null;
            this.map_monuments = null;
            this.map_barren = null;
            this.map_updatedAt = null;
        }
    }

    /**
     *  Get the online time of a player.
     *  @param {string} playerId The id of the player to get online time from.
     *  @return {Array} index 0: seconds online, index 1: The formatted online time of a player.
     */
    getOnlineTime(playerId) {
        if (!this.lastUpdateSuccessful || !this.players.hasOwnProperty(playerId) ||
            !this.players[playerId]['updatedAt']) {
            return null;
        }

        return this.#formatTime(this.players[playerId]['updatedAt']);
    }

    /**
     *  Get the offline time of a player.
     *  @param {string} playerId The id of the player to get offline time from.
     *  @return {Array} index 0: seconds offline, index 1: The formatted offline time of a player.
     */
    getOfflineTime(playerId) {
        if (!this.lastUpdateSuccessful || !this.players.hasOwnProperty(playerId) ||
            !this.players[playerId]['logoutDate']) {
            return null;
        }

        return this.#formatTime(this.players[playerId]['logoutDate']);
    }

    /**
     *  Get an array of online players ordered by time played.
     *  @return {Array} An array of online players ordered by time played.
     */
    getOnlinePlayerIdsOrderedByTime() {
        const unordered = [];
        for (const playerId of this.onlinePlayers) {
            const seconds = this.#formatTime(this.players[playerId]['updatedAt']);
            unordered.push([seconds !== null ? seconds[0] : 0, playerId]);
        }
        let ordered = unordered.sort(function (a, b) { return b[0] - a[0] })
        return ordered.map(e => e[1]);
    }

    /**
     *  Get an array of offline players ordered by least time since online.
     *  @return {Array} An array of online players ordered by least time since online.
     */
    getOfflinePlayerIdsOrderedByLeastTimeSinceOnline() {
        const unordered = [];
        for (const playerId of this.offlinePlayers) {
            const seconds = this.#formatTime(this.players[playerId]['logoutDate']);
            unordered.push([seconds !== null ? seconds[0] : 0, playerId]);
        }
        let ordered = unordered.sort(function (a, b) { return a[0] - b[0] })
        return ordered.map(e => e[1]);
    }

    /**
     *  Get the offline time from a player.
     *  @param {string} playerId The id of the player to get offline time from.
     *  @return {Array} index 0: seconds offline, index 1: The formatted offline time of a player.
     */
    getOfflineTime(playerId) {
        if (!this.lastUpdateSuccessful || !this.players.hasOwnProperty(playerId) ||
            !this.players[playerId]['logoutDate']) {
            return null;
        }

        return this.#formatTime(this.players[playerId]['logoutDate']);
    }
}

module.exports = Battlemetrics;