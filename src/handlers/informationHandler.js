const Timer = require('../util/timer');
const { MessageEmbed, MessageAttachment } = require('discord.js');
const DiscordTools = require('../discordTools/discordTools.js');
const Constants = require('../util/constants.js');

module.exports = {
    handler: async function (rustplus, client) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let channelId = instance.channelId.information;

        if (rustplus.informationIntervalCounter === 0 && instance.generalSettings.updateMapInformation) {
            /* Update Map image */
            let messageId = instance.informationMessageId.map;
            let message = undefined;
            if (messageId !== null) {
                message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
            }

            await module.exports.updateMapInformation(rustplus, client, instance, message);
        }

        instance = client.readInstanceFile(rustplus.guildId);

        /* Update Server Information embed */
        let messageId = instance.informationMessageId.server;
        let message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
        }
        await module.exports.updateServerInformation(rustplus, client, instance, message);

        /* Update Event Information embed */
        messageId = instance.informationMessageId.event;
        message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
        }
        await module.exports.updateEventInformation(rustplus, client, instance, message);

        /* Update Team Information embed */
        messageId = instance.informationMessageId.team;
        message = undefined;
        if (messageId !== null) {
            message = await DiscordTools.getMessageById(rustplus.guildId, channelId, messageId);
        }
        await module.exports.updateTeamInformation(rustplus, client, instance, message);

        if (rustplus.informationIntervalCounter === 5) {
            rustplus.informationIntervalCounter = 0;
        }
        else {
            rustplus.informationIntervalCounter += 1;
        }
    },

    updateMapInformation: async function (rustplus, client, instance, message) {
        await rustplus.map.writeMap(true, true);
        let file = new MessageAttachment(`src/resources/images/maps/${rustplus.guildId}_map_full.png`);

        if (message === undefined) {
            let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.information);

            if (!channel) {
                client.log('ERROR', 'Invalid guild or channel.', 'error');
                return;
            }

            instance = client.readInstanceFile(rustplus.guildId);

            let msg = await channel.send({ files: [file] });
            instance.informationMessageId.map = msg.id;
            client.writeInstanceFile(rustplus.guildId, instance);
        }
        else {
            await message.edit({ files: [file] });
        }
    },

    updateServerInformation: async function (rustplus, client, instance, message) {
        const serverName = rustplus.info.name;
        const sinceWipe = rustplus.info.getSecondsSinceWipe();
        const wipeDay = `Day ${Math.ceil(sinceWipe / (60 * 60 * 24))}`;

        const serverTime = `${Timer.convertDecimalToHoursMinutes(rustplus.time.time)}`;
        const timeLeft = rustplus.time.getTimeTillDayOrNight('s');
        const timeLeftTitle = 'Time till ' + ((rustplus.time.isDay()) ? `${Constants.NIGHT_EMOJI}` : `${Constants.DAY_EMOJI}`);

        let pop = `${rustplus.info.players}`;
        if (rustplus.info.isQueue()) {
            pop += `(${rustplus.info.queuedPlayers})`;
        }
        pop += `/${rustplus.info.maxPlayers}`;

        const map = `${rustplus.info.map}`;
        const mapSize = `${rustplus.info.mapSize}`;
        const mapSeed = `${rustplus.info.seed}`;
        const mapSalt = `${rustplus.info.salt}`;

        let files = [new MessageAttachment('src/resources/images/server_info_logo.png')];
        let embed = new MessageEmbed()
            .setTitle('Server Information')
            .setColor('#ce412b')
            .setThumbnail('attachment://server_info_logo.png')
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
            await sendInformationEmbed(rustplus, client, instance, embed, files, message, 'server');
        }
    },

    updateEventInformation: async function (rustplus, client, instance, message) {
        /* Cargoship */
        let cargoship = '';
        for (const [id, timer] of Object.entries(rustplus.cargoShipEgressTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            let pos = rustplus.activeCargoShips[parseInt(id)].location;
            let crates = rustplus.activeCargoShips[parseInt(id)].crates.length;
            cargoship = `Egress in ${time} at ${pos}.`;
            cargoship += `\nCrates: (${crates}/3)`;
            break;
        }

        if (cargoship === '') {
            for (const [id, content] of Object.entries(rustplus.activeCargoShips)) {
                let crates = rustplus.activeCargoShips[parseInt(id)].crates.length;
                cargoship = `At ${content.location}.`
                cargoship += `\nCrates: (${crates}/3)`;
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


        let files = [new MessageAttachment('src/resources/images/event_info_logo.png')];
        let embed = new MessageEmbed()
            .setTitle('Event Information')
            .setColor('#ce412b')
            .setThumbnail('attachment://event_info_logo.png')
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
            await sendInformationEmbed(rustplus, client, instance, embed, files, message, 'event');
        }
    },

    updateTeamInformation: async function (rustplus, client, instance, message) {
        let names = '';
        let status = '';
        let locations = '';
        for (let player of rustplus.team.players) {
            if (rustplus.team.teamSize < 12) {
                names += `[${player.name}](${Constants.STEAM_PROFILES_URL}${player.steamId})`;
            }
            else {
                names += `${player.name}`;
            }

            names += (player.teamLeader) ? `${Constants.LEADER_EMOJI}\n` : '\n';
            locations += (player.isOnline || player.isAlive) ? `${player.pos}\n` : '-\n';

            if (player.isOnline) {
                status += (player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS) ?
                    `${Constants.AFK_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI} ${player.getAfkTime('dhs')}\n` :
                    `${Constants.ONLINE_EMOJI}${(player.isAlive) ? Constants.ALIVE_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
            else {
                status += `${Constants.OFFLINE_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
        }

        let files = [new MessageAttachment('src/resources/images/team_info_logo.png')];
        let embed = new MessageEmbed()
            .setTitle('Team Member Information')
            .setColor('#ce412b')
            .setThumbnail('attachment://team_info_logo.png')
            .addFields(
                { name: 'Team Member', value: names, inline: true },
                { name: 'Status', value: status, inline: true },
                { name: 'Location', value: locations, inline: true })
            .setFooter({
                text: instance.serverList[`${rustplus.server}-${rustplus.port}`].title
            });

        if (rustplus.informationIntervalCounter === 0) {
            await sendInformationEmbed(rustplus, client, instance, embed, files, message, 'team');
        }
    }
}

async function sendInformationEmbed(rustplus, client, instance, embed, files, message, messageType) {
    if (message === undefined) {
        let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.information);

        if (!channel) {
            client.log('ERROR', 'Invalid guild or channel.', 'error');
            return;
        }

        instance = client.readInstanceFile(rustplus.guildId);

        let msg = await channel.send({ embeds: [embed], files: files });
        instance.informationMessageId[messageType] = msg.id;
        client.writeInstanceFile(rustplus.guildId, instance);
    }
    else {
        await message.edit({ embeds: [embed] });
    }
}