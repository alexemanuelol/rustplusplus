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
        const cargoShipMessage = rustplus.getCommandCargo(true);
        const patrolHelicopterMessage = rustplus.getCommandHeli(true);
        const bradleyAPCMessage = rustplus.getCommandBradley(true);
        const smallOilMessage = rustplus.getCommandSmall(true);
        const largeOilMessage = rustplus.getCommandLarge(true);
        const ch47Message = rustplus.getCommandChinook(true);
        const crateMessage = rustplus.getCommandCrate(true);

        const files = [
            new Discord.AttachmentBuilder(Path.join(__dirname, '..', 'resources/images/event_info_logo.png'))];
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