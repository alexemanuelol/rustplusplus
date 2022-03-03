const Timer = require('../util/timer');
const Str = require('../util/string.js');
const { MessageAttachment } = require('discord.js');
const DiscordTools = require('../discordTools/discordTools.js');
const Map = require('../util/map.js');

const AFK_TIME_SECONDS = 5 * 60; /* 5 Minutes */

module.exports = {
    inGameCommandHandler: function (rustplus, client, message) {
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
        else if (command === `${rustplus.generalSettings.prefix}offline`) {
            module.exports.commandOffline(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}online`) {
            module.exports.commandOnline(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}pop`) {
            module.exports.commandPop(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}small`) {
            module.exports.commandSmall(rustplus);
        }
        else if (command === `${rustplus.generalSettings.prefix}time`) {
            module.exports.commandTime(rustplus, client);
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
                    else {
                        return false;
                    }

                    let prefix = rustplus.generalSettings.prefix;

                    let file = new MessageAttachment(`src/images/${(active) ?
                        'on_logo.png' : 'off_logo.png'}`);
                    let embed = DiscordTools.getSwitchButtonsEmbed(
                        id, content.name, `${prefix}${content.command}`, content.server, active);

                    let row = DiscordTools.getSwitchButtonsRow(id, active);

                    rustplus.interactionSwitches[id] = active;

                    if (active) {
                        rustplus.turnSmartSwitchOn(id, async (msg) => {
                            await client.switchesMessages[rustplus.guildId][id].edit({
                                embeds: [embed], components: [row], files: [file]
                            });
                        });
                    }
                    else {
                        rustplus.turnSmartSwitchOff(id, async (msg) => {
                            await client.switchesMessages[rustplus.guildId][id].edit({
                                embeds: [embed], components: [row], files: [file]
                            });
                        });
                    }

                    instance.switches[id].active = active;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    return true;
                }
            }
            return false;
        }

        return true;
    },

    commandAfk: function (rustplus) {
        const date = new Date();
        let str = '';

        rustplus.getTeamInfo((teamInfo) => {
            if (!rustplus.isResponseValid(teamInfo)) {
                return;
            }

            for (let member of teamInfo.response.teamInfo.members) {
                if (!rustplus.teamMembers.hasOwnProperty(member.steamId)) {
                    continue;
                }

                if (member.isOnline) {
                    let teamMember = rustplus.teamMembers[member.steamId];

                    let timeDifferenceSeconds = (date - teamMember.time) / 1000;
                    let afk = Timer.secondsToFullScale(timeDifferenceSeconds, 'dhs');

                    if (timeDifferenceSeconds >= AFK_TIME_SECONDS) {
                        str += `${member.name} [${afk}], `;
                    }
                }
            }

            if (str !== '') {
                str = str.slice(0, -2);
            }
            else {
                str = 'No one is AFK.';
            }

            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        });
    },

    commandAlive: function (rustplus) {
        const date = new Date();

        rustplus.getTeamInfo((teamInfo) => {
            if (!rustplus.isResponseValid(teamInfo)) {
                return;
            }

            let name = null;
            let time = null;

            for (let member of teamInfo.response.teamInfo.members) {
                if (member.isAlive === true) {
                    let memberAlive = (date - new Date(member.spawnTime * 1000)) / 1000;

                    if (time === null) {
                        name = member.name;
                        time = memberAlive;
                        time = (time < 0) ? 0 : time;
                    }
                    else if (memberAlive > time) {
                        name = member.name;
                        time = memberAlive;
                        time = (time < 0) ? 0 : time;
                    }
                }
            }

            if (time !== null) {
                time = Timer.secondsToFullScale(time);
                time = (time === '') ? '0s' : time;
                let str = `${name} has been alive the longest (${time})`;
                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
            }
        });
    },

    commandBradley: function (rustplus) {
        let strings = [];

        let timerCounter = 0;
        for (const [id, timer] of Object.entries(rustplus.bradleyRespawnTimers)) {
            timerCounter += 1;
            let time = Timer.getTimeLeftOfTimer(timer);

            if (time !== null) {
                strings.push(`Approximately ${time} before Bradley APC respawns.`);
            }
        }

        if (timerCounter === 0) {
            if (rustplus.timeSinceBradleyWasDestroyed === null) {
                strings.push('Bradley APC is probably roaming around at Launch Site.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceBradleyWasDestroyed) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Bradley APC got destroyed.`)
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandCargo: function (rustplus) {
        let strings = [];
        let unhandled = Object.keys(rustplus.activeCargoShips);
        let numOfShips = unhandled.length;

        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            unhandled = unhandled.filter(e => e != parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer);
            let pos = rustplus.activeCargoShips[parseInt(id)].location;

            if (time !== null) {
                strings.push(`Approximately ${time} before Cargo Ship at ${pos} enters egress stage.`);
            }
        }

        if (unhandled !== []) {
            for (let cargoShip of unhandled) {
                let pos = rustplus.activeCargoShips[cargoShip].location;
                strings.push(`Cargo Ship is located at ${pos}.`);
            }
        }

        if (numOfShips === 0) {
            if (rustplus.timeSinceCargoWasOut === null) {
                strings.push('Cargo Ship is currently not on the map.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceCargoWasOut) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Cargo Ship left.`)
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandHeli: function (rustplus) {
        let strings = [];

        let heliCounter = 0;
        for (const [id, content] of Object.entries(rustplus.activePatrolHelicopters)) {
            heliCounter += 1;
            strings.push(`Patrol Helicopter is located at ${content.location}.`);
        }

        if (heliCounter === 0) {
            if (rustplus.timeSinceHeliWasOnMap === null &&
                rustplus.timeSinceHeliWasDestroyed === null) {
                strings.push('No current data on Patrol Helicopter.');
            }
            else if (rustplus.timeSinceHeliWasOnMap !== null &&
                rustplus.timeSinceHeliWasDestroyed === null) {
                let secondsSince = (new Date() - rustplus.timeSinceHeliWasOnMap) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since the last Patrol Helicopter was on the map.`);
            }
            else if (rustplus.timeSinceHeliWasOnMap !== null &&
                rustplus.timeSinceHeliWasDestroyed !== null) {
                let secondsSince = (new Date() - rustplus.timeSinceHeliWasOnMap) / 1000;
                let timeSinceOut = Timer.secondsToFullScale(secondsSince);
                secondsSince = (new Date() - rustplus.timeSinceHeliWasDestroyed) / 1000;
                let timeSinceDestroyed = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSinceOut} since Patrol Helicopter was on the map and ` +
                    `${timeSinceDestroyed} since it got downed.`);
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandLarge: function (rustplus) {
        let strings = [];

        let timerCounter = 0;
        for (const [id, timer] of Object.entries(rustplus.lockedCrateLargeOilRigTimers)) {
            timerCounter += 1;
            let time = Timer.getTimeLeftOfTimer(timer);
            let pos = rustplus.activeLockedCrates[parseInt(id)].location;

            if (time !== null) {
                strings.push(`Approximately ${time} before Locked Crate unlocks at Large Oil Rig at ${pos}.`);
            }
        }

        if (timerCounter === 0) {
            if (rustplus.timeSinceLargeOilRigWasTriggered === null) {
                strings.push('No current data on Large Oil Rig.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceLargeOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Large Oil Rig last got triggered.`);
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandLeader: function (rustplus, message) {
        let command = message.broadcast.teamMessage.message.message;
        let callerId = message.broadcast.teamMessage.message.steamId;
        let callerName = message.broadcast.teamMessage.message.name;

        rustplus.getTeamInfo((msg) => {
            if (!rustplus.isResponseValid(msg)) {
                return;
            }

            if (command === `${rustplus.generalSettings.prefix}leader`) {
                promoteToLeader(rustplus, callerId).then((result) => {
                    rustplus.log('COMMAND', `Team Leadership was transferred to ${callerName}:${callerId}.`);
                }).catch((error) => {
                    rustplus.log('ERROR', JSON.stringify(error), 'error');
                });
            }
            else {
                let name = command.replace(`${rustplus.generalSettings.prefix}leader `, '');

                /* Look if the value provided is a steamId */
                for (let member of msg.response.teamInfo.members) {
                    if (name == member.steamId) {
                        promoteToLeader(rustplus, member.steamId).then((result) => {
                            rustplus.log('COMMAND', `Team Leadership was transferred to ${member.name}:${name}.`);
                        }).catch((error) => {
                            rustplus.log('ERROR', JSON.stringify(error), 'error');
                        });
                        return;
                    }
                }

                /* Find the closest name */
                for (let member of msg.response.teamInfo.members) {
                    if (Str.similarity(name, member.name) >= 0.9) {
                        promoteToLeader(rustplus, member.steamId).then((result) => {
                            rustplus.log('COMMAND', `Team Leadership was transferred to ${name}:` +
                                `${member.steamId}.`);
                        }).catch((error) => {
                            rustplus.log('ERROR', JSON.stringify(error), 'error');
                        });
                        return;
                    }
                }
            }
        });
    },

    commandMarker: function (rustplus, client, message) {
        let callerId = message.broadcast.teamMessage.message.steamId.toNumber();
        let command = message.broadcast.teamMessage.message.message;
        let serverId = `${rustplus.server}-${rustplus.port}`;

        if (!command.startsWith(`${rustplus.generalSettings.prefix}marker `)) {
            return;
        }

        command = command.replace(`${rustplus.generalSettings.prefix}marker `, '');
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        switch (subcommand) {
            case 'add':
                rustplus.getTeamInfo((msg) => {
                    if (!rustplus.isResponseValid(msg)) {
                        return;
                    }

                    let instance = client.readInstanceFile(rustplus.guildId);

                    let callerLocation = null;
                    for (let member of msg.response.teamInfo.members) {
                        if (member.steamId.toNumber() === callerId) {
                            callerLocation = { x: member.x, y: member.y };
                            break;
                        }
                    }

                    instance.markers[serverId][command] = callerLocation;
                    client.writeInstanceFile(rustplus.guildId, instance);
                    rustplus.markers[command] = callerLocation;

                    let str = `Marker '${command}' was added.`;
                    rustplus.sendTeamMessage(str);
                    rustplus.log('COMMAND', str);
                });
                break;

            case 'remove':
                let instance = client.readInstanceFile(rustplus.guildId);

                if (command in rustplus.markers) {
                    delete rustplus.markers[command];
                    delete instance.markers[serverId][command];
                    client.writeInstanceFile(rustplus.guildId, instance);

                    let str = `Marker '${command}' was removed.`;
                    rustplus.sendTeamMessage(str);
                    rustplus.log('COMMAND', str);
                }
                break;

            case 'list':
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

                rustplus.sendTeamMessage(str);
                rustplus.log('COMMAND', str);
                break;

            default:
                if (!(subcommand in rustplus.markers)) {
                    return;
                }

                rustplus.getTeamInfo((msg) => {
                    if (!rustplus.isResponseValid(msg)) {
                        return;
                    }

                    let callerLocation = null;
                    let callerName = null;
                    for (let member of msg.response.teamInfo.members) {
                        if (member.steamId.toNumber() === callerId) {
                            callerLocation = { x: member.x, y: member.y };
                            callerName = member.name;
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
                    rustplus.sendTeamMessage(str);
                    rustplus.log('COMMAND', str);
                });
                break;
        }
    },

    commandMute: function (rustplus, client) {
        let str = `In-Game bot messages muted.`;
        rustplus.sendTeamMessage(str);
        rustplus.log('COMMAND', str);

        let instance = client.readInstanceFile(rustplus.guildId);
        rustplus.generalSettings.muteInGameBotMessages = true;
        instance.generalSettings.muteInGameBotMessages = true;
        client.writeInstanceFile(rustplus.guildId, instance);
    },

    commandOffline: function (rustplus) {
        rustplus.getTeamInfo((teamInfo) => {
            if (!rustplus.isResponseValid(teamInfo)) {
                return;
            }

            let str = '';
            for (let member of teamInfo.response.teamInfo.members) {
                if (member.isOnline === false) {
                    str += `${member.name}, `;
                }
            }

            if (str === '') {
                str = 'No one is offline.';
            }
            else {
                str = str.slice(0, -2);
            }

            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        });
    },

    commandOnline: function (rustplus) {
        rustplus.getTeamInfo((teamInfo) => {
            if (!rustplus.isResponseValid(teamInfo)) {
                return;
            }

            let str = '';
            for (let member of teamInfo.response.teamInfo.members) {
                if (member.isOnline === true) {
                    str += `${member.name}, `;
                }
            }

            str = str.slice(0, -2);

            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        });
    },

    commandPop: function (rustplus) {
        rustplus.getInfo((msg) => {
            if (!rustplus.isResponseValid(msg)) {
                return;
            }

            const now = msg.response.info.players;
            const max = msg.response.info.maxPlayers;
            const queue = msg.response.info.queuedPlayers;

            let str = `Population: (${now}/${max}) players`;

            if (queue !== 0) {
                str += ` and ${queue} players in queue.`;
            }

            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        });
    },

    commandSmall: function (rustplus) {
        let strings = [];

        let timerCounter = 0;
        for (const [id, timer] of Object.entries(rustplus.lockedCrateSmallOilRigTimers)) {
            timerCounter += 1;
            let time = Timer.getTimeLeftOfTimer(timer);
            let pos = rustplus.activeLockedCrates[parseInt(id)].location;

            if (time !== null) {
                strings.push(`Approximately ${time} before Locked Crate unlocks at Small Oil Rig at ${pos}.`);
            }
        }

        if (timerCounter === 0) {
            if (rustplus.timeSinceSmallOilRigWasTriggered === null) {
                strings.push('No current data on Small Oil Rig.');
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceSmallOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince);
                strings.push(`It was ${timeSince} since Small Oil Rig last got triggered.`);
            }
        }

        for (let str of strings) {
            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        }
    },

    commandTime: function (rustplus, client) {
        rustplus.getTime((msg) => {
            if (!rustplus.isResponseValid(msg)) {
                return;
            }

            const rawTime = parseFloat(msg.response.time.time.toFixed(2));
            const sunrise = parseFloat(msg.response.time.sunrise.toFixed(2));
            const sunset = parseFloat(msg.response.time.sunset.toFixed(2));
            const time = Timer.convertDecimalToHoursMinutes(msg.response.time.time);
            let str = `In-Game time: ${time}.`;

            let timeLeft = Timer.getTimeBeforeSunriseOrSunset(rustplus, client, msg);
            if (timeLeft !== null) {
                if (rawTime >= sunrise && rawTime < sunset) {
                    /* It's Day */
                    str += ` Approximately ${timeLeft} before nightfall.`;
                }
                else {
                    /* It's Night */
                    str += ` Approximately ${timeLeft} before daybreak.`;
                }
            }

            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        });
    },

    commandTimer: function (rustplus, command) {
        if (!command.startsWith(`${rustplus.generalSettings.prefix}timer `)) {
            return;
        }

        command = command.replace(`${rustplus.generalSettings.prefix}timer `, '');
        let subcommand = command.replace(/ .*/, '');
        command = command.slice(subcommand.length + 1);

        if (subcommand !== 'remain' && command === '') {
            return;
        }

        let id;
        switch (subcommand) {
            case 'add':
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
                            rustplus.sendTeamMessage(`Timer: ${message}`);
                            rustplus.log('TIMER', message);
                            delete rustplus.timers[id]
                        },
                        timeSeconds * 1000),
                    message: message
                };
                rustplus.timers[id].timer.start();

                rustplus.sendTeamMessage(`Timer set for ${time}.`);
                rustplus.log('COMMAND', `Timer set for ${time}.`);
                break;

            case 'remove':
                id = parseInt(command.replace(/ .*/, ''));
                if (id === 'NaN') {
                    return;
                }

                if (!Object.keys(rustplus.timers).map(Number).includes(id)) {
                    return;
                }

                rustplus.timers[id].timer.stop();
                delete rustplus.timers[id];

                rustplus.sendTeamMessage(`Timer with ID: ${id} was removed.`);
                rustplus.log('COMMAND', `Timer with ID: ${id} was removed.`);

                break;

            case 'remain':
                if (Object.keys(rustplus.timers).length === 0) {
                    rustplus.sendTeamMessage('No active timers.');
                    rustplus.log('COMMAND', 'No active timers');
                }
                else {
                    rustplus.sendTeamMessage('Active timers:');
                    rustplus.log('COMMAND', 'Active timers:');
                }
                for (const [id, content] of Object.entries(rustplus.timers)) {
                    let timeLeft = Timer.getTimeLeftOfTimer(content.timer);
                    let str = `- ID: ${parseInt(id)}, Time left: ${timeLeft}, Message: ${content.message}`;
                    rustplus.sendTeamMessage(str);
                    rustplus.log('COMMAND', str);
                }
                break;

            default:
                break;
        }
    },

    commandUnmute: function (rustplus, client) {
        let instance = client.readInstanceFile(rustplus.guildId);
        rustplus.generalSettings.muteInGameBotMessages = false;
        instance.generalSettings.muteInGameBotMessages = false;
        client.writeInstanceFile(rustplus.guildId, instance);

        let str = `In-Game chat unmuted.`;
        rustplus.sendTeamMessage(str);
        rustplus.log('COMMAND', str);
    },

    commandWipe: function (rustplus) {
        rustplus.getInfo((msg) => {
            if (!rustplus.isResponseValid(msg)) {
                return;
            }

            const wipe = new Date(msg.response.info.wipeTime * 1000);
            const now = new Date();

            const sinceWipe = Timer.secondsToFullScale((now - wipe) / 1000);

            let str = `${sinceWipe} since wipe.`;

            rustplus.sendTeamMessage(str);
            rustplus.log('COMMAND', str);
        });
    },
};

function promoteToLeader(rustplus, steamId) {
    return rustplus.sendRequestAsync({
        promoteToLeader: {
            steamId: steamId
        },
    }, 2000);
}