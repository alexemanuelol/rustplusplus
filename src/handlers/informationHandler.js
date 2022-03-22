const Timer = require('../util/timer');
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
    handler: async function (rustplus, client, info, mapMarkers, teamInfo, time) {
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
        const serverName = rustplus.info.name;
        const sinceWipe = rustplus.info.getSecondsSinceWipe();
        const wipeDay = `Day ${Math.ceil(sinceWipe / (60 * 60 * 24))}`;

        const serverTime = `${Timer.convertDecimalToHoursMinutes(rustplus.time.time)}`;
        const timeLeft = rustplus.time.getTimeTillDayOrNight('s');
        const timeLeftTitle = 'Time till ' + ((rustplus.time.isDay()) ? `${NIGHT}` : `${DAY}`);

        const pop = getPopString(info);

        const map = `${rustplus.info.map}`;
        const mapSize = `${rustplus.info.mapSize}`;
        const mapSeed = `${rustplus.info.seed}`;
        const mapSalt = `${rustplus.info.salt}`;

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

        /* Chinook */
        let chinook = '';
        for (const [id, content] of Object.entries(rustplus.activeChinook47s)) {
            chinook = `At ${content.location}.`
            break;
        }

        if (chinook === '') {
            if (rustplus.timeSinceChinookWasOut === null) {
                chinook = 'Not active.';
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceChinookWasOut) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                chinook = `${timeSince} since last.`;
            }
        }

        /* Crate */
        let crate = '';
        for (const [id, timer] of Object.entries(rustplus.lockedCrateDespawnTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            let pos = rustplus.activeLockedCrates[parseInt(id)].type;

            if (time !== null) {
                crate = `${time} until despawns at ${pos}.`;
                break;
            }
        }

        if (crate === '') {
            if (rustplus.timeSinceChinookDroppedCrate === null) {
                crate = 'No data.';
            }
            else {
                let secondsSince = (new Date() - rustplus.timeSinceChinookDroppedCrate) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                crate = `${timeSince} since last drop.`;
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
                { name: 'Large Oil Rig', value: largeOil, inline: true },
                { name: 'Chinook 47', value: chinook, inline: true },
                { name: 'Crate', value: crate, inline: true })
            .setFooter({
                text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
            });

        if (rustplus.informationIntervalCounter === 0) {
            await sendInformationEmbed(rustplus, client, instance, embed, file, message, 'event');
        }
    },

    updateTeamInformation: async function (rustplus, client, info, mapMarkers, teamInfo, time, instance, message) {
        let names = '';
        let status = '';
        let locations = '';
        for (let player of rustplus.team.players) {
            if (rustplus.team.teamSize < 12) {
                names += `[${player.name}](${STEAM_LINK}${player.steamId})`;
            }
            else {
                names += `${player.name}`;
            }

            names += (player.teamLeader) ? `${LEADER}\n` : '\n';
            locations += (player.isOnline || player.isAlive) ? `${player.pos}\n` : '-\n';

            if (player.isOnline) {
                status += (player.getAfkSeconds() >= AFK_TIME_SECONDS) ?
                    `${AFK}${(player.isAlive) ? SLEEPING : DEAD} ${player.getAfkTime('dhs')}\n` :
                    `${ONLINE}${(player.isAlive) ? ALIVE : DEAD}\n`;
            }
            else {
                status += `${OFFLINE}${(player.isAlive) ? SLEEPING : DEAD}\n`;
            }
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