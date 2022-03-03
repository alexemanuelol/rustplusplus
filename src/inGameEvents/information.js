const Timer = require('../util/timer');
const Map = require('../util/map.js');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const DiscordTools = require('../discordTools/discordTools.js');

const STEAM_LINK = 'https://steamcommunity.com/profiles/';
const ONLINE = ':green_circle:';
const OFFLINE = ':red_circle:';
const AFK = ':yellow_circle:';
const ALIVE = ':nerd:';
const SLEEPING = ':sleeping:';
const DEAD = ':skull:';
const LEADER = ':crown:';
const DAY = ':sunny:';
const NIGHT = ':crescent_moon:';

const SERVER_IMG = 'server_info_logo.png';
const EVENT_IMG = 'event_info_logo.png';
const TEAM_IMG = 'team_info_logo.png';

const AFK_TIME_SECONDS = 5 * 60; /* 5 Minutes */

module.exports = {
    checkEvent: async function (rustplus, client, info, mapMarkers, teamInfo, time) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let channelId = instance.channelId.information;

        /* Update Server Information embed */
        let messageId = instance.informationMessageId.server;
        let message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
        }
        await module.exports.updateServerInformation(rustplus, client, info, mapMarkers, teamInfo, time, instance, message);

        /* Update Event Information embed */
        messageId = instance.informationMessageId.event;
        message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
        }
        await module.exports.updateEventInformation(rustplus, client, info, mapMarkers, teamInfo, time, instance, message);

        /* Update Team Information embed */
        messageId = instance.informationMessageId.team;
        message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
        }
        await module.exports.updateTeamInformation(rustplus, client, info, mapMarkers, teamInfo, time, instance, message);

        if (rustplus.informationIntervalCounter === 5) {
            rustplus.informationIntervalCounter = 0;
        }
        else {
            rustplus.informationIntervalCounter += 1;
        }
    },

    updateServerInformation: async function (rustplus, client, info, mapMarkers, teamInfo, time, instance, message) {
        const serverName = info.response.info.name;
        const sinceWipe = (new Date() - new Date(info.response.info.wipeTime * 1000)) / 1000;
        const wipeDay = `Day ${Math.ceil(sinceWipe / (60 * 60 * 24))}`;

        const serverTime = `${Timer.convertDecimalToHoursMinutes(time.response.time.time)}`;
        const timeLeft = Timer.getTimeBeforeSunriseOrSunset(rustplus, client, time, 's');
        const timeLeftTitle = getTimeLeftTillDayOrNightTitle(time);

        const pop = getPopString(info);

        const map = `${info.response.info.map}`;
        const mapSize = `${info.response.info.mapSize}`;
        const mapSeed = `${info.response.info.seed}`;
        const mapSalt = `${info.response.info.salt}`;

        let file = new MessageAttachment(`src/images/${SERVER_IMG}`)
        let embed = new MessageEmbed()
            .setTitle('Server Information')
            .setColor('#ce412b')
            .setThumbnail(`attachment://${SERVER_IMG}`)
            .setDescription(serverName)
            .addFields(
                { name: 'Players', value: pop, inline: true },
                { name: 'Time', value: serverTime, inline: true },
                { name: 'Wipe', value: wipeDay, inline: true });

        if (timeLeft !== null) {
            embed.addFields(
                { name: timeLeftTitle, value: timeLeft, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '\u200B', value: '\u200B', inline: true });
        }
        else {
            embed.addField('\u200B', '\u200B');
        }

        embed.addFields(
            { name: 'Map Size', value: mapSize, inline: true },
            { name: 'Map Seed', value: mapSeed, inline: true },
            { name: 'Map Salt', value: mapSalt, inline: true },
            { name: 'Map', value: map, inline: true });

        if (rustplus.informationIntervalCounter === 0) {
            await sendInformationEmbed(rustplus, client, instance, embed, file, message, 'server');
        }
    },

    updateEventInformation: async function (rustplus, client, info, mapMarkers, teamInfo, time, instance, message) {
        /* Cargoship */
        let cargoship = '';
        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            let pos = rustplus.activeCargoShips[parseInt(id)].location;
            cargoship = `Egress in ${time} at ${pos}.`;
            break;
        }

        if (cargoship === '') {
            for (const [id, content] of Object.entries(rustplus.activeCargoShips)) {
                cargoship = `At ${content.location}.`
                break;
            }

            if (cargoship === '') {
                if (rustplus.timeSinceCargoWasOut === null) {
                    cargoship = 'Not active.';
                }
                else {
                    let secondsSince = (new Date() - rustplus.timeSinceCargoWasOut) / 1000;
                    let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                    cargoship = `${timeSince} since last.`;
                }
            }
        }

        /* Patrol Helicopter */
        let patrolHelicopter = '';
        for (const [id, content] of Object.entries(rustplus.activePatrolHelicopters)) {
            patrolHelicopter = `At ${content.location}.`
            break;
        }

        if (patrolHelicopter === '') {
            if (rustplus.timeSinceHeliWasOnMap === null &&
                rustplus.timeSinceHeliWasDestroyed === null) {
                patrolHelicopter = 'Not active.';
            }
            else if (rustplus.timeSinceHeliWasOnMap !== null &&
                rustplus.timeSinceHeliWasDestroyed === null) {
                let secondsSince = (new Date() - rustplus.timeSinceHeliWasOnMap) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                patrolHelicopter = `${timeSince} since last.`;
            }
            else if (rustplus.timeSinceHeliWasOnMap !== null &&
                rustplus.timeSinceHeliWasDestroyed !== null) {
                let secondsSince = (new Date() - rustplus.timeSinceHeliWasOnMap) / 1000;
                let timeSinceOut = Timer.secondsToFullScale(secondsSince, 's');
                secondsSince = (new Date() - rustplus.timeSinceHeliWasDestroyed) / 1000;
                let timeSinceDestroyed = Timer.secondsToFullScale(secondsSince, 's');
                patrolHelicopter = `${timeSinceOut} since last.\n${timeSinceDestroyed} since destroyed.`;
            }
        }

        /* Bradley APC */
        let bradley = '';
        for (const [id, timer] of Object.entries(rustplus.bradleyRespawnTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            bradley = `${time} before respawn.`;
            break;
        }

        if (bradley === '') {
            if (rustplus.timeSinceBradleyWasDestroyed === null) {
                bradley = 'At Launchsite.';
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceBradleyWasDestroyed) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                bradley = `${timeSince} since destroyed.`;
            }
        }

        /* Small Oil Rig */
        let smallOil = '';
        for (const [id, timer] of Object.entries(rustplus.lockedCrateSmallOilRigTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            let pos = rustplus.activeLockedCrates[parseInt(id)].location;

            if (time !== null) {
                smallOil = `${time} until unlocks at ${pos}.`;
                break;
            }
        }

        if (smallOil === '') {
            if (rustplus.timeSinceSmallOilRigWasTriggered === null) {
                smallOil = 'No data.';
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceSmallOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                smallOil = `${timeSince} since last event.`;
            }
        }


        /* Large Oil Rig */
        let largeOil = '';
        for (const [id, timer] of Object.entries(rustplus.lockedCrateLargeOilRigTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            let pos = rustplus.activeLockedCrates[parseInt(id)].location;

            if (time !== null) {
                largeOil = `${time} until unlocks at ${pos}.`;
                break;
            }
        }

        if (largeOil === '') {
            if (rustplus.timeSinceLargeOilRigWasTriggered === null) {
                largeOil = 'No data.';
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceLargeOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                largeOil = `${timeSince} since last event.`;
            }
        }

        let file = new MessageAttachment(`src/images/${EVENT_IMG}`)
        let embed = new MessageEmbed()
            .setTitle('Event Information')
            .setColor('#ce412b')
            .setThumbnail(`attachment://${EVENT_IMG}`)
            .setDescription('In-game event information')
            .addFields(
                { name: 'Cargoship', value: cargoship, inline: true },
                { name: 'Patrol Helicopter', value: patrolHelicopter, inline: true },
                { name: 'Bradley APC', value: bradley, inline: true },
                { name: 'Small Oil Rig', value: smallOil, inline: true },
                { name: 'Large Oil Rig', value: largeOil, inline: true })
            .setFooter({
                text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
            });

        if (rustplus.informationIntervalCounter === 0) {
            await sendInformationEmbed(rustplus, client, instance, embed, file, message, 'event');
        }
    },

    updateTeamInformation: async function (rustplus, client, info, mapMarkers, teamInfo, time, instance, message) {
        const teamLeaderId = teamInfo.response.teamInfo.leaderSteamId.toNumber();

        const mapSize = info.response.info.mapSize;
        const teamSize = teamInfo.response.teamInfo.members.length;

        let names = '';
        let status = '';
        let locations = '';
        let unhandled = Object.keys(rustplus.teamMembers);
        for (let member of teamInfo.response.teamInfo.members) {
            if (!rustplus.teamMembers.hasOwnProperty(member.steamId)) {
                rustplus.teamMembers[member.steamId] = {
                    x: member.x,
                    y: member.y,
                    time: new Date()
                };
            }

            unhandled = unhandled.filter(e => parseInt(e) !== member.steamId.toNumber());

            let outsidePos = Map.getPointDirection(member.x, member.y, mapSize);
            let gridPos = Map.getGridPos(member.x, member.y, mapSize);
            let pos = (gridPos === null) ? outsidePos : gridPos;

            if (teamSize < 12) {
                names += `[${member.name}](${STEAM_LINK}${member.steamId})`;
            }
            else {
                names += `${member.name}`;
            }

            names += (member.steamId.toNumber() === teamLeaderId) ? `${LEADER}\n` : '\n';
            locations += (member.isOnline || member.isAlive) ? `${pos}\n` : '-\n';

            if (member.isOnline) {
                let teamMember = rustplus.teamMembers[member.steamId];
                if (member.x !== teamMember.x || member.y !== teamMember.y) {
                    teamMember.x = member.x;
                    teamMember.y = member.y;
                    teamMember.time = new Date();
                }

                let timeDifferenceSeconds = (new Date() - teamMember.time) / 1000;
                let afk = Timer.secondsToFullScale(timeDifferenceSeconds, 'dhs');

                if (member.isAlive) {
                    status += (timeDifferenceSeconds >= AFK_TIME_SECONDS) ?
                        `${AFK}${SLEEPING} ${afk}` : `${ONLINE}${ALIVE}`;
                }
                else {
                    status += (timeDifferenceSeconds >= AFK_TIME_SECONDS) ?
                        `${AFK}${DEAD} ${afk}` : `${ONLINE}${DEAD}`;
                }
            }
            else {
                status += OFFLINE;
                status += (member.isAlive) ? SLEEPING : DEAD;
            }

            status += '\n';
        }

        for (let leftMember of unhandled) {
            delete rustplus.teamMembers[leftMember];
        }

        let file = new MessageAttachment(`src/images/${TEAM_IMG}`)
        let embed = new MessageEmbed()
            .setTitle('Team Member Information')
            .setColor('#ce412b')
            .setThumbnail(`attachment://${TEAM_IMG}`)
            .addFields(
                { name: 'Team Member', value: names, inline: true },
                { name: 'Status', value: status, inline: true },
                { name: 'Location', value: locations, inline: true })
            .setFooter({
                text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
            });

        if (rustplus.informationIntervalCounter === 0) {
            await sendInformationEmbed(rustplus, client, instance, embed, file, message, 'team');
        }
    }
}

async function sendInformationEmbed(rustplus, client, instance, embed, file, message, messageType) {
    if (message === undefined) {
        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.information);

        if (!channel) {
            client.log('ERROR', 'Invalid guild or channel.', 'error');
            return;
        }

        instance = client.readInstanceFile(rustplus.guildId);

        let msg = await channel.send({ embeds: [embed], files: [file] });
        instance.informationMessageId[messageType] = msg.id;
        client.writeInstanceFile(rustplus.guildId, instance);
    }
    else {
        await message.edit({ embeds: [embed] });
    }

}

function getTimeLeftTillDayOrNightTitle(time) {
    const rawTime = parseFloat(time.response.time.time.toFixed(2));
    const sunrise = parseFloat(time.response.time.sunrise.toFixed(2));
    const sunset = parseFloat(time.response.time.sunset.toFixed(2));

    return (rawTime >= sunrise && rawTime < sunset) ? `Time till ${NIGHT}` : `Time till ${DAY}`;
}

function getPopString(info) {
    const players = info.response.info.players;
    const maxPlayers = info.response.info.maxPlayers;
    const queuedPlayers = info.response.info.queuedPlayers;

    let pop = `${players}`;
    if (queuedPlayers !== 0) {
        pop += `(${queuedPlayers})`;
    }
    pop += `/${maxPlayers}`;

    return pop;
}