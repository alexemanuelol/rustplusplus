const Timer = require('../util/timer');
const Str = require('../util/string.js');
const DiscordTools = require('../discordTools/discordTools.js');
const Map = require('../util/map.js');
const Constants = require('../util/constants.js');
const TeamHandler = require('../handlers/teamHandler.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const string = require('../util/string.js');

module.exports = {
    inGameCommandHandler: async function (rustplus, client, message) {
        let command = message.broadcast.teamMessage.message.message;

        if (!rustplus.generalSettings.inGameCommandsEnabled) {
            return false;
        }
        else if (command === `${rustplus.generalSettings.prefix}afk`) {
            module.exports.commandAfk(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}alive`) {
            module.exports.commandAlive(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}bradley`) {
            module.exports.commandBradley(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}cargo`) {
            module.exports.commandCargo(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}chinook`) {
            module.exports.commandChinook(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}crate`) {
            module.exports.commandCrate(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}heli`) {
            module.exports.commandHeli(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}large`) {
            module.exports.commandLarge(rustplus);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}leader`)) {
            module.exports.commandLeader(rustplus, message);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}marker`)) {
            module.exports.commandMarker(rustplus, client, message);
        }
        else if (command === `${rustplus.generalSettings.prefix}mute`) {
            module.exports.commandMute(rustplus, client);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}note`)) {
            module.exports.commandNote(rustplus, client, message)
        }
        else if (command === `${rustplus.generalSettings.prefix}offline`) {
            module.exports.commandOffline(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}online`) {
            module.exports.commandOnline(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}pop`) {
            module.exports.commandPop(rustplus);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}prox`)) {
            module.exports.commandProx(rustplus, client, message);
        }
        else if (command === `${rustplus.generalSettings.prefix}small`) {
            module.exports.commandSmall(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}time`) {
            module.exports.commandTime(rustplus);
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}timer `)) {
            module.exports.commandTimer(rustplus, command);
        }
        else if (command === `${rustplus.generalSettings.prefix}unmute`) {
            module.exports.commandUnmute(rustplus, client);
        }
        else if (command === `${rustplus.generalSettings.prefix}wipe`) {
            module.exports.commandWipe(rustplus);
        }
        else {
            /* Maybe a custom command? */
            let instance = client.readInstanceFile(rustplus.guildId);

            for (const [id, content] of Object.entries(instance.switches)) {
                let cmd = `${rustplus.generalSettings.prefix}${content.command}`;
                if (command.startsWith(cmd)) {
                    let active;
                    if (command === cmd) {
                        active = !content.active;
                    }
                    else if (command === `${cmd} on`) {
                        if (!content.active) {
                            active = true;
                        }
                        else {
                            return true;
                        }
                    }
                    else if (command === `${cmd} off`) {
                        if (content.active) {
                            active = false;
                        }
                        else {
                            return true;
                        }
                    }
                    else if (command === `${cmd} status`) {
                        let info = await rustplus.getEntityInfoAsync(id);
                        if (!(await rustplus.isResponseValid(info))) return false;

                        active = (info.entityInfo.payload.value) ? 'ON' : 'OFF';
                        rustplus.printCommandOutput(`${instance.switches[id].name} is currently ${active}.`);
                        return true;
                    }
                    else {
                        return false;
                    }

                    instance.switches[id].active = active;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(id);

                    let response = null;
                    if (active) {
                        response = await rustplus.turnSmartSwitchOnAsync(id);
                    }
                    else {
                        response = await rustplus.turnSmartSwitchOffAsync(id);
                    }

                    if (!(await rustplus.isResponseValid(response))) {
                        rustplus.printCommandOutput(`Could not communicate with Smart Switch: ${content.name}`);
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, id);

                        delete instance.switches[id];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);

                        try {
                            await client.switchesMessages[rustplus.guildId][id].delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete switch message for entityId: ${id}.`, 'error');
                        }
                        delete client.switchesMessages[rustplus.guildId][id];
                        return false;
                    }

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, id, true, true, false);
                    SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                        client, rustplus.guildId, rustplus.serverId, id);

                    let str = `${instance.switches[id].name} was turned `;
                    str += (active) ? 'on.' : 'off.';
                    rustplus.printCommandOutput(str);

                    return true;
                }
            }

            let groups = instance.serverList[rustplus.serverId].switchGroups;
            for (const [groupName, content] of Object.entries(groups)) {
                let cmd = `${rustplus.generalSettings.prefix}${content.command}`;
                if (command.startsWith(cmd)) {
                    let active;
                    if (command === `${cmd} on`) {
                        active = true;
                        rustplus.printCommandOutput(`Turning ${groupName} ON.`);
                    }
                    else if (command === `${cmd} off`) {
                        active = false;
                        rustplus.printCommandOutput(`Turning ${groupName} OFF.`);
                    }
                    else if (command === `${cmd}`) {
                        /* Get switch info, create message */
                        var switchStatus = content.switches.map(switchId => {
                            const { active, name } = instance.switches[switchId];
                            return { active, name }
                        });
                        const statusMessage = switchStatus.map(status =>
                            `${status.name}: ${status.active ? 'ON' : 'OFF'}`).join(', ');
                        rustplus.printCommandOutput(`Status: ${statusMessage}`);
                    }
                    else {
                        return false;
                    }

                    await SmartSwitchGroupHandler.TurnOnOffGroup(
                        client, rustplus, rustplus.guildId, rustplus.serverId, groupName, active);

                    return true;
                }
            }

            return false;
        }

        return true;
    },

    commandAfk: function (rustplus) {
        let str = '';

        for (let player of rustplus.team.players) {
            if (player.isOnline) {
                if (player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS) {
                    str += `${player.name} [${player.getAfkTime('dhs')}], `;
                }
            }
        }

        str = (str !== '') ? `${str.slice(0, -2)}.` : 'No one is AFK.';
        rustplus.printCommandOutput(str);
    },

    commandAlive: function (rustplus) {
        let player = rustplus.team.getPlayerLongestAlive();
        let time = player.getAliveTime();
        rustplus.printCommandOutput(`${player.name} has been alive the longest (${time}).`);
    },

    commandBradley: function (rustplus) {
        let strings = [];

        for (const [id, timer] of Object.entries(rustplus.mapMarkers.bradleyAPCRespawnTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer);
            if (time !== null) {
                strings.push(`Approximately ${time} before Bradley APC respawns.`);
            }
        }

        if (strings.length === 0) {
            if (rustplus.mapMarkers.timeSinceBradleyAPCWasDestroyed === null) {
                strings.push('Bradley APC is probably roaming around at Launch Site.');
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceBradleyAPCWasDestroyed) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Bradley APC got destroyed.`)
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandCargo: function (rustplus) {
        let strings = [];
        let unhandled = rustplus.mapMarkers.cargoShips.map(e => e.id);

        for (const [id, timer] of Object.entries(rustplus.mapMarkers.cargoShipEgressTimers)) {
            let cargoShip = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.CargoShip, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer);

            if (time !== null) {
                strings.push(`Approximately ${time} before Cargo Ship at ${cargoShip.location} enters egress stage.` +
                    ` Active crates: (${cargoShip.crates.length}/3).`);
            }
            unhandled = unhandled.filter(e => e != parseInt(id));
        }

        if (unhandled.length > 0) {
            for (let id of unhandled) {
                let cargoShip = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.CargoShip, id);
                strings.push(`Cargo Ship is located at ${cargoShip.location}.` +
                    ` Active crates: (${cargoShip.crates.length}/3).`);
            }
        }

        if (strings.length === 0) {
            if (rustplus.mapMarkers.timeSinceCargoShipWasOut === null) {
                strings.push('Cargo Ship is currently not on the map.');
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceCargoShipWasOut) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Cargo Ship left.`)
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandChinook: function (rustplus) {
        let strings = [];

        for (let ch47 of rustplus.mapMarkers.ch47s) {
            if (ch47.ch47Type === 'crate') {
                strings.push(`Chinook 47 is located at ${ch47.location}.`);
            }
        }

        if (strings.length === 0) {
            if (rustplus.mapMarkers.timeSinceCH47WasOut === null) {
                strings.push('No current data on Chinook 47.');
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceCH47WasOut) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since the last Chinook 47 was on the map.`);
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandCrate: function (rustplus) {
        let strings = [];

        for (const [id, timer] of Object.entries(rustplus.mapMarkers.crateDespawnTimers)) {
            let crate = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.Crate, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer);

            if (time !== null) {
                strings.push(`Approximately ${time} before Locked Crate at ${crate.crateType} despawns.`);
            }
        }

        if (strings.length === 0) {
            if (rustplus.mapMarkers.timeSinceCH47DroppedCrate === null) {
                for (let crate of rustplus.mapMarkers.crates) {
                    if (!['cargoShip', 'oil_rig_small', 'large_oil_rig', 'invalid'].includes(crate.crateType)) {
                        if (crate.crateType === 'grid') {
                            strings.push(`A Locked Crate is located at ${crate.location}.`);
                        }
                        else {
                            strings.push(`A Locked Crate is located at ${crate.crateType}.`);
                        }
                    }
                }

                if (strings.length === 0) {
                    strings.push('No active Crates.');
                }
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceCH47DroppedCrate) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since the last Chinook 47 Locked Crate was dropped.`);
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandHeli: function (rustplus) {
        let strings = [];

        for (let patrolHelicopter of rustplus.mapMarkers.patrolHelicopters) {
            strings.push(`Patrol Helicopter is located at ${patrolHelicopter.location}.`);
        }

        if (strings.length === 0) {
            let wasOnMap = rustplus.mapMarkers.timeSincePatrolHelicopterWasOnMap;
            let wasDestroyed = rustplus.mapMarkers.timeSincePatrolHelicopterWasDestroyed;

            if (wasOnMap === null && WasDestroyed === null) {
                strings.push('No current data on Patrol Helicopter.');
            }
            else if (wasOnMap !== null && wasDestroyed === null) {
                let secondsSince = (new Date() - wasOnMap) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since the last Patrol Helicopter was on the map.`);
            }
            else if (wasOnMap !== null && wasDestroyed !== null) {
                let secondsSince = (new Date() - wasOnMap) / 1000;
                let timeSinceOnMap = Timer.secondsToFullScale(secondsSince);

                secondsSince = (new Date() - wasDestroyed) / 1000;
                let timeSinceDestroyed = Timer.secondsToFullScale(secondsSince);

                strings.push(`It was ${timeSinceOnMap} since Patrol Helicopter was on the map and ` +
                    `${timeSinceDestroyed} since it got downed.`);
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandLarge: function (rustplus) {
        let strings = [];

        for (const [id, timer] of Object.entries(rustplus.mapMarkers.crateLargeOilRigTimers)) {
            let crate = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.Crate, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer);

            if (time !== null) {
                strings.push(
                    `Approximately ${time} before Locked Crate unlocks at Large Oil Rig at ${crate.location}.`);
            }
        }

        if (strings.length === 0) {
            if (rustplus.mapMarkers.timeSinceLargeOilRigWasTriggered === null) {
                strings.push('No current data on Large Oil Rig.');
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceLargeOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Large Oil Rig last got triggered.`);
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandLeader: async function (rustplus, message) {
        let command = message.broadcast.teamMessage.message.message;
        let callerId = message.broadcast.teamMessage.message.steamId.toString();
        let str = 'Team leadership was transferred to ';

        if (!rustplus.generalSettings.leaderCommandEnabled) {
            rustplus.printCommandOutput('Leader command is turned OFF in settings.');
            return;
        }

        if (rustplus.team.leaderSteamId !== rustplus.playerId) {
            let player = rustplus.team.getPlayer(rustplus.playerId);
            rustplus.printCommandOutput(`Leader command only works if the current leader is ${player.name}.`);
            return;
        }

        if (command === `${rustplus.generalSettings.prefix}leader`) {
            if (rustplus.team.leaderSteamId !== callerId) {
                await rustplus.team.changeLeadership(callerId);
                let player = rustplus.team.getPlayer(callerId);
                str += `${player.name}.`;
                rustplus.printCommandOutput(str);
                return;
            }
            else {
                rustplus.printCommandOutput('You are already leader.');
                return;
            }
        }
        else {
            let name = command.replace(`${rustplus.generalSettings.prefix}leader `, '');

            let matchedPlayer = null;
            /* Look if the value provided is a steamId */
            for (let player of rustplus.team.players) {
                if (name === player.steamId) {
                    matchedPlayer = player;
                }
            }

            if (matchedPlayer === null) {
                /* Look for parts of the name */
                for (let player of rustplus.team.players) {
                    if (player.name.toLowerCase().includes(name.toLowerCase())) {
                        matchedPlayer = player;
                    }
                }
            }

            if (matchedPlayer === null) {
                /* Find the closest name */
                for (let player of rustplus.team.players) {
                    if (Str.similarity(name, player.name) >= 0.9) {
                        matchedPlayer = player;
                    }
                }
            }

            if (matchedPlayer === null) {
                rustplus.printCommandOutput(`Could not identify team member: ${name}.`);
            }
            else {
                if (rustplus.team.leaderSteamId === matchedPlayer.steamId) {
                    rustplus.printCommandOutput(`${matchedPlayer.name} is already leader.`);
                }
                else {
                    await rustplus.team.changeLeadership(matchedPlayer.steamId);
                    str += `${matchedPlayer.name}.`;
                    rustplus.printCommandOutput(str);
                }
            }
        }
    },

    commandMarker: async function (rustplus, client, message) {
        let callerId = message.broadcast.teamMessage.message.steamId.toString();
        let command = message.broadcast.teamMessage.message.message;

        if (!command.startsWith(`${rustplus.generalSettings.prefix}marker `)) {
            return;
        }

        command = command.replace(`${rustplus.generalSettings.prefix}marker `, '');
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        switch (subcommand) {
            case 'add': {
                let teamInfo = await rustplus.getTeamInfoAsync();
                if (!(await rustplus.isResponseValid(teamInfo))) return;

                let instance = client.readInstanceFile(rustplus.guildId);

                let callerLocation = null;
                for (let player of teamInfo.teamInfo.members) {
                    if (player.steamId.toString() === callerId) {
                        callerLocation = { x: player.x, y: player.y };
                        break;
                    }
                }

                instance.markers[rustplus.serverId][command] = callerLocation;
                client.writeInstanceFile(rustplus.guildId, instance);
                rustplus.markers[command] = callerLocation;

                let str = `Marker '${command}' was added.`;
                rustplus.printCommandOutput(str);
            } break;

            case 'remove': {
                let instance = client.readInstanceFile(rustplus.guildId);

                if (command in rustplus.markers) {
                    delete rustplus.markers[command];
                    delete instance.markers[rustplus.serverId][command];
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let str = `Marker '${command}' was removed.`;
                    rustplus.printCommandOutput(str);
                }
            } break;

            case 'list': {
                let str = '';
                for (const [name, location] of Object.entries(rustplus.markers)) {
                    str += `${name}, `;
                }

                if (str !== '') {
                    str = str.slice(0, -2);
                }
                else {
                    str = 'No markers.';
                }

                rustplus.printCommandOutput(str);
            } break;

            default: {
                if (!(subcommand in rustplus.markers)) {
                    return;
                }

                let teamInfo = await rustplus.getTeamInfoAsync();
                if (!(await rustplus.isResponseValid(teamInfo))) return;

                let callerLocation = null;
                let callerName = null;
                for (let player of teamInfo.teamInfo.members) {
                    if (player.steamId.toString() === callerId) {
                        callerLocation = { x: player.x, y: player.y };
                        callerName = player.name;
                        break;
                    }
                }

                let direction = Map.getAngleBetweenPoints(
                    callerLocation.x, callerLocation.y,
                    rustplus.markers[subcommand].x, rustplus.markers[subcommand].y);
                let distance = Math.floor(Map.getDistance(
                    callerLocation.x, callerLocation.y,
                    rustplus.markers[subcommand].x, rustplus.markers[subcommand].y));

                let str = `Marker '${subcommand}' is ${distance}m from ${callerName} in direction ${direction}°.`;
                rustplus.printCommandOutput(str);
            } break;
        }
    },

    commandMute: function (rustplus, client) {
        let str = `In-Game bot messages muted.`;
        rustplus.printCommandOutput(str);

        let instance = client.readInstanceFile(rustplus.guildId);
        rustplus.generalSettings.muteInGameBotMessages = true;
        instance.generalSettings.muteInGameBotMessages = true;
        client.writeInstanceFile(rustplus.guildId, instance);
    },

    commandNote: function (rustplus, client, message) {
        let command = message.broadcast.teamMessage.message.message;
        let instance = client.readInstanceFile(rustplus.guildId);

        if (!instance.serverList[rustplus.serverId].hasOwnProperty('notes')) {
            instance.serverList[rustplus.serverId].notes = {};
        }

        if (command === `${rustplus.generalSettings.prefix}notes`) {
            if (Object.keys(instance.serverList[rustplus.serverId].notes).length === 0) {
                rustplus.printCommandOutput('There are no saved notes.');
            }
            else {
                rustplus.printCommandOutput('Notes:');
            }
            for (const [id, note] of Object.entries(instance.serverList[rustplus.serverId].notes)) {
                let str = `${id}: ${note}`;
                rustplus.printCommandOutput(str);
            }
        }
        else if (command.startsWith(`${rustplus.generalSettings.prefix}note remove`)) {
            let id = parseInt(command.replace(`${rustplus.generalSettings.prefix}note remove`, '').trim());

            if (!isNaN(id)) {
                if (!Object.keys(instance.serverList[rustplus.serverId].notes).map(Number).includes(id)) {
                    rustplus.printCommandOutput('Note ID does not exist.');
                    return;
                }

                delete instance.serverList[rustplus.serverId].notes[id];
                rustplus.printCommandOutput(`Note with ID: ${id} was removed.`);
                client.writeInstanceFile(rustplus.guildId, instance);
                return;
            }
        }

        if (command.startsWith(`${rustplus.generalSettings.prefix}note `)) {
            let note = command.replace(`${rustplus.generalSettings.prefix}note `, '').trim();

            index = 0;
            while (Object.keys(instance.serverList[rustplus.serverId].notes).map(Number).includes(index)) {
                index += 1;
            }

            instance.serverList[rustplus.serverId].notes[index] = `${note}`;
            rustplus.printCommandOutput('Note saved.');
        }

        client.writeInstanceFile(rustplus.guildId, instance);
    },

    commandOffline: function (rustplus) {
        let str = '';
        for (let player of rustplus.team.players) {
            if (!player.isOnline) {
                str += `${player.name}, `;
            }
        }

        str = (str !== '') ? `${str.slice(0, -2)}.` : 'No one is offline.';
        rustplus.printCommandOutput(str);
    },

    commandOnline: function (rustplus) {
        let str = '';
        for (let player of rustplus.team.players) {
            if (player.isOnline) {
                str += `${player.name}, `;
            }
        }

        str = `${str.slice(0, -2)}.`;
        rustplus.printCommandOutput(str);
    },

    commandPop: function (rustplus) {
        let str = `Population: (${rustplus.info.players}/${rustplus.info.maxPlayers}) players`;
        if (rustplus.info.queuedPlayers !== 0) {
            str += ` and ${rustplus.info.queuedPlayers} players in queue.`;
        }
        rustplus.printCommandOutput(str);
    },

    commandProx: async function (rustplus, client, message) {
        let callerId = message.broadcast.teamMessage.message.steamId.toString();
        let caller = rustplus.team.getPlayer(callerId);
        let command = message.broadcast.teamMessage.message.message;

        if (command === `${rustplus.generalSettings.prefix}prox`) {
            let teamInfo = await rustplus.getTeamInfoAsync();
            if (!(await rustplus.isResponseValid(teamInfo))) return;
            TeamHandler.handler(rustplus, client, teamInfo.teamInfo);
            rustplus.team.updateTeam(teamInfo.teamInfo);

            let topClosestPlayers = [];
            let players = [...rustplus.team.players].filter(e => e.steamId !== callerId);

            if (players.length === 0) {
                rustplus.printCommandOutput('You are the only one in the team.');
                return;
            }

            for (let player of players) {
                if (!player.isAlive) {
                    players = players.filter(e => e.steamId !== player.steamId);
                }
            }

            for (let i = 0; i < 3; i++) {
                if (players.length > 0) {
                    let player = players.reduce(function (prev, current) {
                        if (Map.getDistance(prev.x, prev.y, caller.x, caller.y) <
                            Map.getDistance(current.x, current.y, caller.x, caller.y)) {
                            return prev;
                        }
                        else {
                            return current;
                        }
                    });
                    topClosestPlayers.push(player);
                    players = players.filter(e => e.steamId !== player.steamId);
                }
            }

            let str = '';
            for (let player of topClosestPlayers) {
                let distance = Math.floor(Map.getDistance(player.x, player.y, caller.x, caller.y));
                str += `${player.name} (${distance}m), `;
            }

            if (str === '') {
                str = 'All your teammates are dead.';
            }
            else {
                str = `${str.slice(0, -2)}.`;
            }

            rustplus.printCommandOutput(str);
            return;
        }

        memberName = command.replace(`${rustplus.generalSettings.prefix}prox`, '').trim();

        let teamInfo = await rustplus.getTeamInfoAsync();
        if (!(await rustplus.isResponseValid(teamInfo))) return;
        TeamHandler.handler(rustplus, client, teamInfo.teamInfo);
        rustplus.team.updateTeam(teamInfo.teamInfo);

        /* Look for parts of the name */
        for (let player of rustplus.team.players) {
            if (player.name.toLowerCase().includes(memberName.toLowerCase())) {
                let distance = Math.floor(Map.getDistance(caller.x, caller.y, player.x, player.y));
                let direction = Map.getAngleBetweenPoints(caller.x, caller.y, player.x, player.y);
                let str = `${player.name} is ${distance}m from ${caller.name} in direction ${direction}.`;
                rustplus.printCommandOutput(str);
                return;
            }
        }

        /* Find the closest name */
        for (let player of rustplus.team.players) {
            if (Str.similarity(memberName, player.name) >= 0.9) {
                let distance = Math.floor(Map.getDistance(caller.x, caller.y, player.x, player.y));
                let direction = Map.getAngleBetweenPoints(caller.x, caller.y, player.x, player.y);
                let str = `${player.name} is ${distance}m from ${caller.name} in direction ${direction}.`;
                rustplus.printCommandOutput(str);
                return;
            }
        }

        rustplus.printCommandOutput(`Could not identify team member: ${memberName}.`);
    },

    commandSmall: function (rustplus) {
        let strings = [];

        for (const [id, timer] of Object.entries(rustplus.mapMarkers.crateSmallOilRigTimers)) {
            let crate = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.Crate, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer);

            if (time !== null) {
                strings.push(
                    `Approximately ${time} before Locked Crate unlocks at Small Oil Rig at ${crate.location}.`);
            }
        }

        if (strings.length === 0) {
            if (rustplus.mapMarkers.timeSinceSmallOilRigWasTriggered === null) {
                strings.push('No current data on Small Oil Rig.');
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceSmallOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Small Oil Rig last got triggered.`);
            }
        }

        for (let str of strings) {
            rustplus.printCommandOutput(str);
        }
    },

    commandTime: function (rustplus) {
        let time = Timer.convertDecimalToHoursMinutes(rustplus.time.time);
        let str = `In-Game time: ${time}.`;
        let timeLeft = rustplus.time.getTimeTillDayOrNight();

        if (timeLeft !== null) {
            if (rustplus.time.isDay()) {
                str += ` Approximately ${timeLeft} before nightfall.`;
            }
            else {
                str += ` Approximately ${timeLeft} before daybreak.`;
            }
        }

        rustplus.printCommandOutput(str);
    },

    commandTimer: function (rustplus, command) {
        if (!command.startsWith(`${rustplus.generalSettings.prefix}timer `)) {
            return;
        }

        command = command.replace(`${rustplus.generalSettings.prefix}timer `, '');
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        if (subcommand !== 'list' && command === '') {
            return;
        }

        let id;
        switch (subcommand) {
            case 'add': {
                let time = command.replace(/ .*/, '');
                let timeSeconds = Timer.getSecondsFromStringTime(time);
                if (timeSeconds === null) {
                    return;
                }

                id = 0;
                while (Object.keys(rustplus.timers).map(Number).includes(id)) {
                    id += 1;
                }

                let message = command.slice(time.length + 1);
                if (message === "") {
                    return;
                }

                rustplus.timers[id] = {
                    timer: new Timer.timer(
                        () => {
                            rustplus.printCommandOutput(`Timer: ${message}.`, 'TIMER');
                            delete rustplus.timers[id]
                        },
                        timeSeconds * 1000),
                    message: message
                };
                rustplus.timers[id].timer.start();

                rustplus.printCommandOutput(`Timer set for ${time}.`);
            } break;

            case 'remove': {
                id = parseInt(command.replace(/ .*/, ''));
                if (id === 'NaN') {
                    return;
                }

                if (!Object.keys(rustplus.timers).map(Number).includes(id)) {
                    return;
                }

                rustplus.timers[id].timer.stop();
                delete rustplus.timers[id];

                rustplus.printCommandOutput(`Timer with ID: ${id} was removed.`);
            } break;

            case 'list': {
                if (Object.keys(rustplus.timers).length === 0) {
                    rustplus.printCommandOutput('No active timers.');
                }
                else {
                    rustplus.printCommandOutput('Active timers:');
                }

                for (const [id, content] of Object.entries(rustplus.timers)) {
                    let timeLeft = Timer.getTimeLeftOfTimer(content.timer);
                    let str = `- ID: ${parseInt(id)}, Time left: ${timeLeft}, Message: ${content.message}`;
                    rustplus.printCommandOutput(str);
                }
            } break;

            default: {
            } break;
        }
    },

    commandUnmute: function (rustplus, client) {
        let instance = client.readInstanceFile(rustplus.guildId);
        rustplus.generalSettings.muteInGameBotMessages = false;
        instance.generalSettings.muteInGameBotMessages = false;
        client.writeInstanceFile(rustplus.guildId, instance);

        let str = `In-Game chat unmuted.`;
        rustplus.printCommandOutput(str);
    },

    commandWipe: function (rustplus) {
        let str = `${rustplus.info.getTimeSinceWipe()} since wipe.`;
        rustplus.printCommandOutput(str);
    },
};
