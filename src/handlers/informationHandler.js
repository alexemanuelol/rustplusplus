const Discord = require('discord.js');
const Path = require('path');

const Constants = require('../util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');
const DiscordTools = require('../discordTools/discordTools.js');
const Timer = require('../util/timer');

module.exports = {
    handler: async function (rustplus, client) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let channelId = instance.channelId.information;

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

        let files = [new Discord.AttachmentBuilder(
            Path.join(__dirname, '..', 'resources/images/server_info_logo.png'))];
        const embed = DiscordEmbeds.getEmbed({
            title: 'Server Information',
            color: '#ce412b',
            thumbnail: 'attachment://server_info_logo.png',
            description: serverName,
            fields: [
                { name: 'Players', value: `\`${pop}\``, inline: true },
                { name: 'Time', value: `\`${serverTime}\``, inline: true },
                { name: 'Wipe', value: `\`${wipeDay}\``, inline: true }]
        });

        if (timeLeft !== null) {
            embed.addFields(
                { name: timeLeftTitle, value: `\`${timeLeft}\``, inline: true },
                { name: '\u200B', value: '\u200B', inline: true },
                { name: '\u200B', value: '\u200B', inline: true });
        }
        else {
            embed.addFields({ name: '\u200B', value: '\u200B', inline: false });
        }

        embed.addFields(
            { name: 'Map Size', value: `\`${mapSize}\``, inline: true },
            { name: 'Map Seed', value: `\`${mapSeed}\``, inline: true },
            { name: 'Map Salt', value: `\`${mapSalt}\``, inline: true },
            { name: 'Map', value: `\`${map}\``, inline: true });

        if (instance.serverList[rustplus.serverId].connect !== null) {
            embed.addFields(
                {
                    name: 'Connect',
                    value: `\`${instance.serverList[rustplus.serverId].connect}\``,
                    inline: false
                });
        }

        if (rustplus.informationIntervalCounter === 0) {
            await sendInformationEmbed(rustplus, client, instance, embed, files, message, 'server');
        }
    },

    updateEventInformation: async function (rustplus, client, instance, message) {
        /* CargoShip */
        let cargoShipMessage = '';
        for (const [id, timer] of Object.entries(rustplus.mapMarkers.cargoShipEgressTimers)) {
            let cargoShip = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.CargoShip, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            cargoShipMessage = `Egress in ${time} at ${cargoShip.location.string}.`;
            cargoShipMessage += `\nCrates: (${cargoShip.crates.length}/3).`;
            break;
        }

        if (cargoShipMessage === '') {
            for (let cargoShip of rustplus.mapMarkers.cargoShips) {
                cargoShipMessage = `At ${cargoShip.location.string}.`;
                cargoShipMessage += `\nCrates: (${cargoShip.crates.length}/3).`;
                break;
            }

            if (cargoShipMessage === '') {
                if (rustplus.mapMarkers.timeSinceCargoShipWasOut === null) {
                    cargoShipMessage = 'Not active.';
                }
                else {
                    let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceCargoShipWasOut) / 1000;
                    let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                    cargoShipMessage = `${timeSince} since last.`;
                }
            }
        }

        /* PatrolHelicopter */
        let patrolHelicopterMessage = '';
        for (let patrolHelicopter of rustplus.mapMarkers.patrolHelicopters) {
            patrolHelicopterMessage = `At ${patrolHelicopter.location.string}.`
            break;
        }

        if (patrolHelicopterMessage === '') {
            let wasOnMap = rustplus.mapMarkers.timeSincePatrolHelicopterWasOnMap;
            let wasDestroyed = rustplus.mapMarkers.timeSincePatrolHelicopterWasDestroyed;

            if (wasOnMap === null && wasDestroyed === null) {
                patrolHelicopterMessage = 'Not active.';
            }
            else if (wasOnMap !== null && wasDestroyed === null) {
                let secondsSince = (new Date() - wasOnMap) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                patrolHelicopterMessage = `${timeSince} since last.`;
            }
            else if (wasOnMap !== null && wasDestroyed !== null) {
                let secondsSince = (new Date() - wasOnMap) / 1000;
                let timeSinceOnMap = Timer.secondsToFullScale(secondsSince, 's');

                secondsSince = (new Date() - wasDestroyed) / 1000;
                let timeSinceDestroyed = Timer.secondsToFullScale(secondsSince, 's');

                patrolHelicopterMessage = `${timeSinceOnMap} since last.\n${timeSinceDestroyed} since destroyed.`;
            }
        }

        /* BradleyAPC */
        let bradleyAPCMessage = '';
        for (const [id, timer] of Object.entries(rustplus.mapMarkers.bradleyAPCRespawnTimers)) {
            let time = Timer.getTimeLeftOfTimer(timer, 's');
            bradleyAPCMessage = `${time} before respawn.`;
            break;
        }

        if (bradleyAPCMessage === '') {
            if (rustplus.mapMarkers.timeSinceBradleyAPCWasDestroyed === null) {
                bradleyAPCMessage = 'At Launchsite.';
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceBradleyAPCWasDestroyed) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                bradleyAPCMessage = `${timeSince} since destroyed.`;
            }
        }

        /* Small Oil Rig */
        let smallOilMessage = '';
        for (const [id, timer] of Object.entries(rustplus.mapMarkers.crateSmallOilRigTimers)) {
            let crate = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.Crate, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer, 's');

            if (time !== null) {
                smallOilMessage = `${time} until unlocks at ${crate.location.location}.`;
                break;
            }
        }

        if (smallOilMessage === '') {
            if (rustplus.mapMarkers.timeSinceSmallOilRigWasTriggered === null) {
                smallOilMessage = 'No data.';
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceSmallOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                smallOilMessage = `${timeSince} since last event.`;
            }
        }


        /* Large Oil Rig */
        let largeOilMessage = '';
        for (const [id, timer] of Object.entries(rustplus.mapMarkers.crateLargeOilRigTimers)) {
            let crate = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.Crate, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer, 's');

            if (time !== null) {
                largeOilMessage = `${time} until unlocks at ${crate.location.location}.`;
                break;
            }
        }

        if (largeOilMessage === '') {
            if (rustplus.mapMarkers.timeSinceLargeOilRigWasTriggered === null) {
                largeOilMessage = 'No data.';
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceLargeOilRigWasTriggered) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                largeOilMessage = `${timeSince} since last event.`;
            }
        }

        /* CH47 */
        let ch47Message = '';
        for (let ch47 of rustplus.mapMarkers.ch47s) {
            ch47Message = `At ${ch47.location.string}.`
            break;
        }

        if (ch47Message === '') {
            if (rustplus.mapMarkers.timeSinceCH47WasOut === null) {
                ch47Message = 'Not active.';
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceCH47WasOut) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                ch47Message = `${timeSince} since last.`;
            }
        }

        /* Crate */
        let crateMessage = '';
        for (const [id, timer] of Object.entries(rustplus.mapMarkers.crateDespawnTimers)) {
            let crate = rustplus.mapMarkers.getMarkerByTypeId(rustplus.mapMarkers.types.Crate, parseInt(id));
            let time = Timer.getTimeLeftOfTimer(timer, 's');

            if (time !== null) {
                crateMessage = `${time} until despawns at ${crate.crateType}.`;
                break;
            }
        }

        if (crateMessage === '') {
            if (rustplus.mapMarkers.timeSinceCH47DroppedCrate === null) {
                for (let crate of rustplus.mapMarkers.crates) {
                    if (!['cargoShip', 'oil_rig_small', 'large_oil_rig', 'invalid'].includes(crate.crateType)) {
                        if (crate.crateType === 'grid') {
                            crateMessage = `At ${crate.location.string}.`;
                        }
                        else {
                            crateMessage = `At ${crate.crateType}.`;
                        }
                        break;
                    }
                }

                if (crateMessage === '') {
                    crateMessage = 'No active Crates.';
                }
            }
            else {
                let secondsSince = (new Date() - rustplus.mapMarkers.timeSinceCH47DroppedCrate) / 1000;
                let timeSince = Timer.secondsToFullScale(secondsSince, 's');
                crateMessage = `${timeSince} since last drop.`;
            }
        }


        let files = [new Discord.AttachmentBuilder(
            Path.join(__dirname, '..', 'resources/images/event_info_logo.png'))];
        const embed = DiscordEmbeds.getEmbed({
            title: 'Event Information',
            color: '#ce412b',
            thumbnail: 'attachment://event_info_logo.png',
            description: 'In-game event information',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: 'Cargoship', value: `\`${cargoShipMessage}\``, inline: true },
                { name: 'Patrol Helicopter', value: `\`${patrolHelicopterMessage}\``, inline: true },
                { name: 'Bradley APC', value: `\`${bradleyAPCMessage}\``, inline: true },
                { name: 'Small Oil Rig', value: `\`${smallOilMessage}\``, inline: true },
                { name: 'Large Oil Rig', value: `\`${largeOilMessage}\``, inline: true },
                { name: 'Chinook 47', value: `\`${ch47Message}\``, inline: true },
                { name: 'Crate', value: `\`${crateMessage}\``, inline: true }]
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
            locations += (player.isOnline || player.isAlive) ? `${player.pos.string}\n` : '-\n';

            if (player.isOnline) {
                status += (player.getAfkSeconds() >= Constants.AFK_TIME_SECONDS) ?
                    `${Constants.AFK_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI} ${player.getAfkTime('dhs')}\n` :
                    `${Constants.ONLINE_EMOJI}${(player.isAlive) ? Constants.ALIVE_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
            else {
                status += `${Constants.OFFLINE_EMOJI}${(player.isAlive) ? Constants.SLEEPING_EMOJI : Constants.DEAD_EMOJI}\n`;
            }
        }

        let files = [new Discord.AttachmentBuilder(
            Path.join(__dirname, '..', 'resources/images/team_info_logo.png'))];
        const embed = DiscordEmbeds.getEmbed({
            title: 'Team Member Information',
            color: '#ce412b',
            thumbnail: 'attachment://team_info_logo.png',
            footer: { text: instance.serverList[rustplus.serverId].title },
            fields: [
                { name: 'Team Member', value: names, inline: true },
                { name: 'Status', value: status, inline: true },
                { name: 'Location', value: locations, inline: true }]
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

        let msg = await client.messageSend(channel, { embeds: [embed], files: files });
        instance.informationMessageId[messageType] = msg.id;
        client.writeInstanceFile(rustplus.guildId, instance);
    }
    else {
        await client.messageEdit(message, { embeds: [embed] });
    }
}