const Client = require('../../index.ts');
const Player = require('./Player.js');

class Team {
    constructor(team, rustplus) {
        this._leaderSteamId = team.leaderSteamId.toString();
        this._players = [];
        this._teamSize = this.players.length;

        this._rustplus = rustplus;

        this._allOnline = false;
        this._allOffline = false;

        this.updateTeam(team);
    }

    /* Getters and Setters */
    get leaderSteamId() { return this._leaderSteamId; }
    set leaderSteamId(steamId) { this._leaderSteamId = steamId; }
    get players() { return this._players; }
    set players(players) { this._players = players; }
    get teamSize() { return this._teamSize; }
    set teamSize(teamSize) { this._teamSize = teamSize; }
    get rustplus() { return this._rustplus; }
    set rustplus(rustplus) { this._rustplus = rustplus; }
    get allOnline() { return this._allOnline; }
    set allOnline(allOnline) { this._allOnline = allOnline; }
    get allOffline() { return this._allOffline; }
    set allOffline(allOffline) { this._allOffline = allOffline; }

    /* Change checkers */
    isLeaderSteamIdChanged(team) { return (this.leaderSteamId !== team.leaderSteamId.toString()); }

    updateTeam(team) {
        if (this.isLeaderSteamIdChanged(team)) {
            let player = this.getPlayer(this.leaderSteamId);
            if (player !== null) {
                player.teamLeader = false;
            }

            player = this.getPlayer(team.leaderSteamId.toString());
            if (player !== null) {
                this.rustplus.log(Client.client.intlGet(null, 'commandCap'),
                    Client.client.intlGet(null, 'leaderTransferred', {
                        name: `${player.name}:${player.steamId}`
                    }));
            }
        }
        this.leaderSteamId = team.leaderSteamId.toString();

        let unhandled = this.players.slice();
        /* Add new players and update existing players */
        for (let player of team.members) {
            let steamId = player.steamId.toString();
            if (this.players.some(e => e.steamId === steamId)) {
                this.getPlayer(steamId).updatePlayer(player);
                unhandled = unhandled.filter(e => e.steamId !== steamId);
            }
            else {
                this.addPlayer(player);
            }
        }

        /* Remove players that have left */
        for (let player of unhandled) {
            this.removePlayer(player);
        }

        /* Update variables */
        this.allOnline = true;
        this.allOffline = true;
        for (let player of this.players) {
            this.allOnline = (this.allOnline && player.isOnline);
            this.allOffline = (this.allOffline && !player.isOnline);
        }

        this.teamSize = this.players.length;

        let player = this.getPlayer(this.leaderSteamId);
        if (player !== null) {
            player.teamLeader = true;
        }
    }

    addPlayer(player) {
        /* Add player if it does not already exist */
        if (!this.players.some(e => e.steamId === player.steamId)) {
            this.players.push(new Player(player, this.rustplus));
        }
    }

    removePlayer(player) {
        this.players = this.players.filter(e => e.steamId !== player.steamId);
    }

    getPlayer(steamId) {
        for (let player of this.players) {
            if (player.steamId === steamId) return player;
        }
        return null;
    }

    isPlayerInTeam(steamId) {
        let player = this.getPlayer(steamId);
        if (player !== null) return true;
        return false;
    }

    getPlayerLongestAlive() {
        return this.players.reduce(function (prev, current) {
            return (prev.getAliveSeconds() > current.getAliveSeconds()) ? prev : current;
        })
    }

    async changeLeadership(steamId) {
        let player = this.getPlayer(steamId);
        if (player !== null) {
            await player.assignLeader();
        }
    }

    getNewPlayers(team) {
        let newPlayers = [];

        for (let player of team.members) {
            if (!this.isPlayerInTeam(player.steamId.toString())) {
                newPlayers.push(player.steamId.toString());
            }
        }

        return newPlayers;
    }

    getLeftPlayers(team) {
        let leftPlayers = this.players.map(function (e) { return e.steamId; });

        for (let player of team.members) {
            let steamId = player.steamId.toString();
            if (this.players.some(e => e.steamId === steamId)) {
                leftPlayers = leftPlayers.filter(e => e !== steamId);
            }
        }

        return leftPlayers;
    }
}

module.exports = Team;