const Translate = require('translate');

const Constants = require('../util/constants.js');
const DiscordMessages = require('../discordTools/discordMessages.js');
const DiscordTools = require('../discordTools/discordTools.js');
const Languages = require('../util/languages.js');
const Map = require('../util/map.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const Str = require('../util/string.js');
const TeamHandler = require('../handlers/teamHandler.js');
const Timer = require('../util/timer');

module.exports = {
    inGameCommandHandler: async function (rustplus, client, message) {
        let command = message.broadcast.teamMessage.message.message;
        let commandLowerCase = message.broadcast.teamMessage.message.message.toLowerCase();

        if (!rustplus.generalSettings.inGameCommandsEnabled) {
            return false;
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}afk`) {
            module.exports.commandAfk(rustplus);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}alive`)) {
            module.exports.commandAlive(rustplus, message);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}bradley`) {
            module.exports.commandBradley(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}cargo`) {
            module.exports.commandCargo(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}chinook`) {
            module.exports.commandChinook(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}crate`) {
            module.exports.commandCrate(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}heli`) {
            module.exports.commandHeli(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}large`) {
            module.exports.commandLarge(rustplus);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}leader`)) {
            module.exports.commandLeader(rustplus, message);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}marker`)) {
            module.exports.commandMarker(rustplus, client, message);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}mute`) {
            module.exports.commandMute(rustplus, client);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}note`)) {
            module.exports.commandNote(rustplus, client, message)
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}offline`) {
            module.exports.commandOffline(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}online`) {
            module.exports.commandOnline(rustplus);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}player`)) {
            module.exports.commandPlayer(rustplus, client, message);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}pop`) {
            module.exports.commandPop(rustplus);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}prox`)) {
            module.exports.commandProx(rustplus, client, message);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}small`) {
            module.exports.commandSmall(rustplus);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}time`) {
            module.exports.commandTime(rustplus);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}timer `)) {
            module.exports.commandTimer(rustplus, command);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}tr `)) {
            module.exports.commandTranslateTo(rustplus, command);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}trf `)) {
            module.exports.commandTranslateFromTo(rustplus, command);
        }
        else if (commandLowerCase.startsWith(`${rustplus.generalSettings.prefix}tts `)) {
            module.exports.commandTTS(rustplus, client, message);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}unmute`) {
            module.exports.commandUnmute(rustplus, client);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}upkeep`) {
            module.exports.commandUpkeep(rustplus, client);
        }
        else if (commandLowerCase === `${rustplus.generalSettings.prefix}wipe`) {
            module.exports.commandWipe(rustplus);
        }
        else {
            /* Maybe a custom command? */
            let instance = client.readInstanceFile(rustplus.guildId);

            for (const [id, content] of Object.entries(instance.serverList[rustplus.serverId].switches)) {
                let cmd = `${rustplus.generalSettings.prefix}${content.command}`;
                if (command === cmd || command.startsWith(`${cmd} `)) {
                    let rest = command;
                    let active;
                    if (command.startsWith(`${cmd} on`)) {
                        rest = rest.replace(`${cmd} on`, '').trim();
                        if (!content.active) {
                            active = true;
                        }
                        else {
                            return true;
                        }
                    }
                    else if (command.startsWith(`${cmd} off`)) {
                        rest = rest.replace(`${cmd} off`, '').trim();
                        if (content.active) {
                            active = false;
                        }
                        else {
                            return true;
                        }
                    }
                    else if (command === `${cmd} status`) {
                        let info = await rustplus.getEntityInfoAsync(id);
                        if (!(await rustplus.isResponseValid(info))) {
                            instance.serverList[rustplus.serverId].switches[id].reachable = false;
                            client.writeInstanceFile(rustplus.guildId, instance);
                            DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, id);
                            SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                                client, rustplus.guildId, rustplus.serverId, id);

                            rustplus.printCommandOutput(
                                `Could not communicate with Smart Switch: ` +
                                `${instance.serverList[rustplus.serverId].switches[id].name}`);
                            return false;
                        }

                        active = (info.entityInfo.payload.value) ? 'ON' : 'OFF';
                        rustplus.printCommandOutput(`${instance.serverList[rustplus.serverId].switches[id].name} ` +
                            `is currently ${active}.`);
                        return true;
                    }
                    else if (command.startsWith(`${cmd}`)) {
                        rest = rest.replace(`${cmd}`, '').trim();
                        active = !content.active;
                    }
                    else {
                        return false;
                    }

                    if (rustplus.currentSwitchTimeouts.hasOwnProperty(id)) {
                        clearTimeout(rustplus.currentSwitchTimeouts[id]);
                        delete rustplus.currentSwitchTimeouts[id];
                    }

                    let timeSeconds = Timer.getSecondsFromStringTime(rest);

                    let prevActive = instance.serverList[rustplus.serverId].switches[id].active;
                    instance.serverList[rustplus.serverId].switches[id].active = active;
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
                        if (instance.serverList[rustplus.serverId].switches[id].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                rustplus.serverId, id);
                        }
                        instance.serverList[rustplus.serverId].switches[id].reachable = false;
                        instance.serverList[rustplus.serverId].switches[id].active = prevActive;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);
                    }
                    else {
                        instance.serverList[rustplus.serverId].switches[id].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
                    }

                    DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, id);
                    SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                        client, rustplus.guildId, rustplus.serverId, id);

                    if (instance.serverList[rustplus.serverId].switches[id].reachable) {
                        let str = `${instance.serverList[rustplus.serverId].switches[id].name} was turned `;
                        str += (active) ? 'ON.' : 'OFF.';

                        if (timeSeconds !== null) {
                            let time = Timer.secondsToFullScale(timeSeconds);
                            str += ` Automatically turned back ${(active) ? 'OFF' : 'ON'} in ${time}.`;

                            rustplus.currentSwitchTimeouts[id] = setTimeout(async function () {
                                let instance = client.readInstanceFile(rustplus.guildId);
                                if (!instance.serverList[rustplus.serverId].switches.hasOwnProperty(id)) {
                                    return false;
                                }

                                let prevActive = instance.serverList[rustplus.serverId].switches[id].active;
                                instance.serverList[rustplus.serverId].switches[id].active = !active;
                                client.writeInstanceFile(rustplus.guildId, instance);

                                rustplus.interactionSwitches.push(id);

                                let response = null;
                                if (!active) {
                                    response = await rustplus.turnSmartSwitchOnAsync(id);
                                }
                                else {
                                    response = await rustplus.turnSmartSwitchOffAsync(id);
                                }

                                if (!(await rustplus.isResponseValid(response))) {
                                    rustplus.printCommandOutput(`Could not communicate with Smart Switch: ${content.name}`);
                                    if (instance.serverList[rustplus.serverId].switches[id].reachable) {
                                        await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                            rustplus.serverId, id);
                                    }
                                    instance.serverList[rustplus.serverId].switches[id].reachable = false;
                                    instance.serverList[rustplus.serverId].switches[id].active = prevActive;
                                    client.writeInstanceFile(rustplus.guildId, instance);

                                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);
                                }
                                else {
                                    instance.serverList[rustplus.serverId].switches[id].reachable = true;
                                    client.writeInstanceFile(rustplus.guildId, instance);
                                }

                                DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, id);
                                SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                                    client, rustplus.guildId, rustplus.serverId, id);

                                let str = `Automatically turning ` +
                                    `${instance.serverList[rustplus.serverId].switches[id].name} back ` +
                                    `${(!active) ? 'ON' : 'OFF'}.`;
                                rustplus.printCommandOutput(str);
                            }, timeSeconds * 1000);
                        }

                        rustplus.printCommandOutput(str);
                    }

                    return true;
                }
            }

            let groups = instance.serverList[rustplus.serverId].switchGroups;
            for (const [groupId, content] of Object.entries(groups)) {
                let cmd = `${rustplus.generalSettings.prefix}${content.command}`;
                if (command === cmd || command.startsWith(`${cmd} `)) {
                    let rest = command;
                    let active;
                    if (command.startsWith(`${cmd} on`)) {
                        rest = rest.replace(`${cmd} on`, '').trim();
                        active = true;
                    }
                    else if (command.startsWith(`${cmd} off`)) {
                        rest = rest.replace(`${cmd} off`, '').trim();
                        active = false;
                    }
                    else if (command === `${cmd}`) {
                        /* Get switch info, create message */
                        var switchStatus = content.switches.map(switchId => {
                            const { active, name, reachable } =
                                instance.serverList[rustplus.serverId].switches[switchId];
                            return { active, name, reachable }
                        });
                        const statusMessage = switchStatus.map(status =>
                            `${status.name}: ${status.reachable ? (status.active ? 'ON' : 'OFF') : 'NOT FOUND'}`)
                            .join(', ');
                        rustplus.printCommandOutput(`Status: ${statusMessage}`);
                        return true;
                    }
                    else {
                        return false;
                    }

                    if (rustplus.currentSwitchTimeouts.hasOwnProperty(groupId)) {
                        clearTimeout(rustplus.currentSwitchTimeouts[groupId]);
                        delete rustplus.currentSwitchTimeouts[groupId];
                    }

                    let timeSeconds = Timer.getSecondsFromStringTime(rest);

                    let str = `Turning Group ${content.name} ${(active) ? 'ON' : 'OFF'}.`;

                    if (timeSeconds !== null) {
                        let time = Timer.secondsToFullScale(timeSeconds);
                        str += ` Automatically turned back ${(active) ? 'OFF' : 'ON'} in ${time}.`;

                        rustplus.currentSwitchTimeouts[groupId] = setTimeout(async function () {
                            let instance = client.readInstanceFile(rustplus.guildId);
                            if (!instance.serverList.hasOwnProperty(rustplus.serverId) ||
                                !instance.serverList[rustplus.serverId].switchGroups.hasOwnProperty(groupId)) {
                                return false;
                            }
                            let str = `Automatically turning ${content.name} back ${(!active) ? 'ON' : 'OFF'}.`;
                            rustplus.printCommandOutput(str);

                            await SmartSwitchGroupHandler.TurnOnOffGroup(
                                client, rustplus, rustplus.guildId, rustplus.serverId, groupId, !active);

                        }, timeSeconds * 1000);
                    }

                    rustplus.printCommandOutput(str);

                    await SmartSwitchGroupHandler.TurnOnOffGroup(
                        client, rustplus, rustplus.guildId, rustplus.serverId, groupId, active);

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

    commandAlive: function (rustplus, message) {
        let command = message.broadcast.teamMessage.message.message;
        if (command.toLowerCase() === `${rustplus.generalSettings.prefix}alive`) {
            let player = rustplus.team.getPlayerLongestAlive();
            let time = player.getAliveTime();
            rustplus.printCommandOutput(`${player.name} has been alive the longest (${time}).`);
        }
        else if (command.toLowerCase().startsWith(`${rustplus.generalSettings.prefix}alive `)) {
            nameSearch = command.slice(6).trim();

            let found = false;
            for (let player of rustplus.team.players) {
                if (player.name.includes(nameSearch)) {
                    let time = player.getAliveTime();
                    rustplus.printCommandOutput(`${player.name} has been alive for ${time}.`);
                    found = true;
                    break;
                }
            }

            if (!found) {
                rustplus.printCommandOutput(`Could not find teammate: '${nameSearch}'`);
            }
        }
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
                strings.push(`Approximately ${time} before Cargo Ship at ${cargoShip.location.string}` +
                    ` enters egress stage. Active crates: (${cargoShip.crates.length}/3).`);
            }
            unhandled = unhandled.filter(e => e != parseInt(id));
        }

        if (unhandled.length > 0) {
            for (let id of unhandled) {
                let cargoShip = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.CargoShip, id);
                strings.push(`Cargo Ship is located at ${cargoShip.location.string}.` +
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
                strings.push(`Chinook 47 is located at ${ch47.location.string}.`);
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
                            strings.push(`A Locked Crate is located at ${crate.location.string}.`);
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
            strings.push(`Patrol Helicopter is located at ${patrolHelicopter.location.string}.`);
        }

        if (strings.length === 0) {
            let wasOnMap = rustplus.mapMarkers.timeSincePatrolHelicopterWasOnMap;
            let wasDestroyed = rustplus.mapMarkers.timeSincePatrolHelicopterWasDestroyed;

            if (wasOnMap === null && wasDestroyed === null) {
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
                    `Approximately ${time} before Locked Crate unlocks at Large Oil Rig at ${crate.location.location}.`);
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

        if (command.toLowerCase() === `${rustplus.generalSettings.prefix}leader`) {
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
            let name = command.slice(8);

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

        if (!command.toLowerCase().startsWith(`${rustplus.generalSettings.prefix}marker `)) {
            return;
        }

        command = command.slice(8);
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        switch (subcommand.toLowerCase()) {
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

                instance.serverList[rustplus.serverId].markers[command] = callerLocation;
                client.writeInstanceFile(rustplus.guildId, instance);
                rustplus.markers[command] = callerLocation;

                let str = `Marker '${command}' was added.`;
                rustplus.printCommandOutput(str);
            } break;

            case 'remove': {
                let instance = client.readInstanceFile(rustplus.guildId);

                if (command in rustplus.markers) {
                    delete rustplus.markers[command];
                    delete instance.serverList[rustplus.serverId].markers[command];
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

        if (command.toLowerCase() === `${rustplus.generalSettings.prefix}notes`) {
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
        else if (command.toLowerCase().startsWith(`${rustplus.generalSettings.prefix}note remove`)) {
            let id = parseInt(command.slice(12).trim());

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

        if (command.toLowerCase().startsWith(`${rustplus.generalSettings.prefix}note `)) {
            let note = command.slice(5).trim();

            let index = 0;
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

    commandPlayer: function (rustplus, client, message) {
        let instance = client.readInstanceFile(rustplus.guildId);
        const battlemetricsId = instance.serverList[rustplus.serverId].battlemetricsId;
        let command = message.broadcast.teamMessage.message.message;
        let nameSearch = '';

        if (battlemetricsId === null) {
            rustplus.printCommandOutput('This server is using streamer mode.');
            return;
        }

        if (!Object.keys(client.battlemetricsOnlinePlayers).includes(battlemetricsId)) {
            rustplus.printCommandOutput('Could not find players for this server.');
            return;
        }

        let foundPlayers = [];
        if (command.toLowerCase() === `${rustplus.generalSettings.prefix}players`) {
            foundPlayers = client.battlemetricsOnlinePlayers[battlemetricsId].slice();
        }
        else if (command.toLowerCase().startsWith(`${rustplus.generalSettings.prefix}player `)) {
            nameSearch = command.slice(7).trim();

            for (let player of client.battlemetricsOnlinePlayers[battlemetricsId]) {
                if (player.name.includes(nameSearch)) {
                    foundPlayers.push(player);
                }
            }
        }

        let allPlayersLength = foundPlayers.length;
        let messageMaxLength = Constants.MAX_LENGTH_TEAM_MESSAGE - rustplus.trademarkString.length;
        let leftLength = `...xxx more.`.length;
        let str = '';

        let playerIndex = 0;
        for (let player of foundPlayers) {
            let playerStr = `${player.name} [${player.time}], `;

            if ((str.length + playerStr.length + leftLength) < messageMaxLength) {
                str += playerStr;
            }
            else if ((str.length + playerStr.length + leftLength) > messageMaxLength) {
                break;
            }

            playerIndex += 1;
        }

        if (str !== '') {
            str = str.slice(0, -2);

            if (playerIndex < allPlayersLength) {
                str += ` ...${allPlayersLength - playerIndex} more.`;
            }
            else {
                str += '.';
            }
        }
        else {
            if (command.toLowerCase() === `${rustplus.generalSettings.prefix}players`) {
                str = 'Could not find any players.';
            }
            else {
                str = `Could not find a player '${nameSearch}'.`;
            }
        }

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

        if (command.toLowerCase() === `${rustplus.generalSettings.prefix}prox`) {
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

        memberName = command.slice(5).trim();

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
                    `Approximately ${time} before Locked Crate unlocks at Small Oil Rig at ${crate.location.location}.`);
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
        command = command.slice(6).trim();
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        if (subcommand.toLowerCase() !== 'list' && command === '') {
            return;
        }

        let id;
        switch (subcommand.toLowerCase()) {
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

    commandTranslateTo: async function (rustplus, command) {
        if (command.toLowerCase().startsWith(`${rustplus.generalSettings.prefix}tr language `)) {
            let lang = command.replace(`${rustplus.generalSettings.prefix}tr language `, '')
            if (lang in Languages) {
                rustplus.printCommandOutput(`Language code: '${Languages[lang]}'`)
            }
            else {
                rustplus.printCommandOutput(`Could not find language: '${lang}'`)
            }
            return;
        }

        command = command.slice(3).trim();
        let language = command.replace(/ .*/, '');
        let text = command.slice(language.length).trim();

        if (language === '' || text === '') {
            rustplus.printCommandOutput('Too few arguments.');
            return;
        }

        let translation = undefined;
        try {
            translation = await Translate(text, language);
        }
        catch (e) {
            rustplus.printCommandOutput(`The language '${language}' is not available.`);
            return;
        }

        if (translation !== undefined) {
            rustplus.printCommandOutput(translation);
        }
    },

    commandTranslateFromTo: async function (rustplus, command) {
        command = command.slice(4).trim();
        let languageFrom = command.replace(/ .*/, '');
        command = command.slice(languageFrom.length).trim();
        let languageTo = command.replace(/ .*/, '');
        let text = command.slice(languageTo.length).trim();

        if (languageFrom === '' || languageTo === '' || text === '') {
            rustplus.printCommandOutput('Too few arguments.');
            return;
        }

        let translation = undefined;
        try {
            translation = await Translate(text, { from: languageFrom, to: languageTo });
        }
        catch (e) {
            let regex = new RegExp('The language "(.*?)"');
            let invalidLanguage = regex.exec(e.message);

            if (invalidLanguage.length === 2) {
                invalidLanguage = invalidLanguage[1];
                rustplus.printCommandOutput(`The language '${invalidLanguage}' is not available.`);
                return;
            }

            rustplus.printCommandOutput(`The language is not available.`);
            return;
        }

        if (translation !== undefined) {
            rustplus.printCommandOutput(translation);
        }
    },

    commandTTS: async function (rustplus, client, message) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.teamchat);
        let command = message.broadcast.teamMessage.message.message;
        let text = command.slice(4).trim();

        if (channel !== undefined) {
            await client.messageSend(channel, {
                content: `${message.broadcast.teamMessage.message.name} said: ${text}`,
                tts: true
            });
            rustplus.printCommandOutput('Sent the Text-To-Speech.');
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

    commandUpkeep: function (rustplus, client) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let cupboardFound = false;
        for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].storageMonitors)) {
            if (value.type !== 'toolcupboard') continue;

            if (value.upkeep !== null) {
                cupboardFound = true;
                rustplus.printCommandOutput(
                    `${value.name} [${key}] upkeep: ${value.upkeep}`);
            }
        }
        if (!cupboardFound) {
            rustplus.printCommandOutput(
                `No tool cupboard monitors found.`);
        }
    },

    commandWipe: function (rustplus) {
        let str = `${rustplus.info.getTimeSinceWipe()} since wipe.`;
        rustplus.printCommandOutput(str);
    },
};
