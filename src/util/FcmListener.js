const { MessageActionRow, MessageButton, MessageEmbed, MessageAttachment } = require('discord.js');
const { listen } = require('push-receiver');
const DiscordTools = require('../discordTools/discordTools.js');
const Constants = require('../util/constants.js');
const Scrape = require('../util/scrape.js');
const BattlemetricsAPI = require('../util/battlemetricsAPI.js');

module.exports = async (client, guild) => {
    let credentials = client.readCredentialsFile(guild.id);

    if (credentials.credentials === null) {
        client.log('WARNING', `Credentials is not set for guild: ${guild.id}, cannot start FCM-listener.`);
        return;
    }

    const ownerId = credentials.credentials.owner;

    /* Destroy previous instance of fcm listener */
    if (client.currentFcmListeners[guild.id]) {
        client.currentFcmListeners[guild.id].destroy();
    }

    client.log('INFO', `FCM-listener will start in 5 seconds for guild: ${guild.id}`);

    let startTime = new Date();
    client.currentFcmListeners[guild.id] =
        await listen(credentials.credentials.fcm_credentials, async ({ notification, persistentId }) => {
            /* Create a delay so that buffered notifications are ignored. */
            if ((new Date() - startTime) < 5000) return;

            /* Parse the notification body. */
            const full = notification
            const data = full.data;
            const body = JSON.parse(data.body);

            switch (data.channelId) {
                case 'pairing': {
                    switch (body.type) {
                        case 'server': {
                            client.log('FCM', `${guild.id} pairing: server`);
                            pairingServer(client, guild, full, data, body);
                        } break;

                        case 'entity': {
                            switch (body.entityName) {
                                case 'Switch': {
                                    client.log('FCM', `${guild.id} pairing: entity: Switch`);
                                    pairingEntitySwitch(client, guild, full, data, body);
                                } break;

                                case 'Smart Alarm': {
                                    client.log('FCM', `${guild.id} pairing: entity: Smart Alarm`);
                                    pairingEntitySmartAlarm(client, guild, full, data, body);
                                } break;

                                case 'Storage Monitor': {
                                    client.log('FCM', `${guild.id} pairing: entity: Storage Monitor`);
                                    pairingEntityStorageMonitor(client, guild, full, data, body);
                                } break;

                                default: {
                                    client.log('FCM', `${guild.id} pairing: entity: other\n${JSON.stringify(full)}`);
                                } break;
                            }
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} pairing: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'alarm': {
                    switch (body.type) {
                        case 'alarm': {
                            client.log('FCM', `${guild.id} alarm: alarm`);
                            alarmAlarm(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} alarm: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'player': {
                    switch (body.type) {
                        case 'death': {
                            client.log('FCM', `${guild.id} player: death`);
                            playerDeath(client, guild, full, data, body, ownerId);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} player: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'team': {
                    switch (body.type) {
                        case 'login': {
                            client.log('FCM', `${guild.id} team: login`);
                            teamLogin(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} team: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                case 'news': {
                    switch (body.type) {
                        case 'news': {
                            client.log('FCM', `${guild.id} news: news`);
                            newsNews(client, guild, full, data, body);
                        } break;

                        default: {
                            client.log('FCM', `${guild.id} news: other\n${JSON.stringify(full)}`);
                        } break;
                    }
                } break;

                default: {
                    client.log('FCM', `${guild.id} other\n${JSON.stringify(full)}`);
                } break;
            }
        });
};

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) {
        return true;
    }
    return false;
}

async function pairingServer(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;
    let serversId = instance.channelId.servers;
    let message = undefined;

    let serverExist = instance.serverList.hasOwnProperty(serverId);
    if (serverExist) {
        message = await DiscordTools.getMessageById(guild.id, serversId, instance.serverList[serverId].messageId);
    }

    let info = null;
    let battlemetricsId = await BattlemetricsAPI.getBattlemetricsServerId(client, data.title);
    if (battlemetricsId !== null) {
        info = await BattlemetricsAPI.getBattlemetricsServerInfo(client, battlemetricsId);
        let onlinePlayers = await BattlemetricsAPI.getBattlemetricsServerOnlinePlayers(client, battlemetricsId);
        if (BattlemetricsAPI.isBattlemetricsServerHidden(onlinePlayers)) {
            battlemetricsId = null;
        }
    }

    instance.serverList[serverId] = {
        active: (serverExist) ? instance.serverList[serverId].active : false,
        title: data.title,
        serverIp: body.ip,
        appPort: body.port,
        steamId: body.playerId,
        playerToken: body.playerToken,
        description: body.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
        img: isValidUrl(body.img) ? body.img : Constants.DEFAULT_SERVER_IMG,
        url: isValidUrl(body.url) ? body.url : Constants.DEFAULT_SERVER_URL,
        timeTillDay: null,
        timeTillNight: null,
        notes: {},
        switchGroups: {},
        messageId: (message !== undefined) ? message.id : null,
        battlemetricsId: battlemetricsId,
        connect: (info === null) ? info : `connect ${info.ip}:${info.port}`,
        cargoShipEgressTimeMs: Constants.DEFAULT_CARGO_SHIP_EGRESS_TIME_MS,
        bradleyApcRespawnTimeMs: Constants.DEFAULT_BRADLEY_APC_RESPAWN_TIME_MS,
        lockedCrateDespawnTimeMs: Constants.DEFAULT_LOCKED_CRATE_DESPAWN_TIME_MS,
        lockedCrateDespawnWarningTimeMs: Constants.DEFAULT_LOCKED_CRATE_DESPAWN_WARNING_TIME_MS,
        oilRigLockedCrateUnlockTimeMs: Constants.DEFAULT_OIL_RIG_LOCKED_CRATE_UNLOCK_TIME_MS
    };
    client.writeInstanceFile(guild.id, instance);

    await DiscordTools.sendServerMessage(guild.id, serverId, null);
}

async function pairingEntitySwitch(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;
    let entityId = body.entityId;

    if (instance.switches.hasOwnProperty(entityId)) return;

    instance.switches[entityId] = {
        active: false,
        reachable: true,
        name: 'Smart Switch',
        command: entityId,
        image: 'smart_switch.png',
        autoDayNight: 0,
        server: body.name,
        serverId: serverId
    };
    client.writeInstanceFile(guild.id, instance);

    let rustplus = client.rustplusInstances[guild.id];
    if (!rustplus) return;

    if (serverId === rustplus.serverId) {
        let info = await rustplus.getEntityInfoAsync(entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.switches[entityId].reachable = false;
            client.writeInstanceFile(guild.id, instance);
        }

        if (instance.switches[entityId].reachable) {
            instance.switches[entityId].active = info.entityInfo.payload.value;
            client.writeInstanceFile(guild.id, instance);
        }

        await DiscordTools.sendSmartSwitchMessage(guild.id, entityId);
    }
}

async function pairingEntitySmartAlarm(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;
    let entityId = body.entityId;

    if (instance.alarms.hasOwnProperty(entityId)) return;

    instance.alarms[entityId] = {
        active: false,
        reachable: true,
        everyone: false,
        name: 'Smart Alarm',
        message: 'Your base is under attack!',
        id: entityId,
        image: 'smart_alarm.png',
        server: body.name,
        serverId: serverId,
        messageId: null
    };
    client.writeInstanceFile(guild.id, instance);

    let rustplus = client.rustplusInstances[guild.id];
    if (!rustplus) return;

    if (serverId === rustplus.serverId) {
        let info = await rustplus.getEntityInfoAsync(entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.alarms[entityId].reachable = false;
            client.writeInstanceFile(guild.id, instance);
        }

        if (instance.alarms[entityId].reachable) {
            instance.alarms[entityId].active = info.entityInfo.payload.value;
            client.writeInstanceFile(guild.id, instance);
        }
    }

    await DiscordTools.sendSmartAlarmMessage(guild.id, entityId);
}

async function pairingEntityStorageMonitor(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;
    let entityId = body.entityId;

    if (instance.storageMonitors.hasOwnProperty(entityId)) return;

    instance.storageMonitors[entityId] = {
        name: 'Storage Monitor',
        reachable: true,
        id: entityId,
        type: 'container',
        decaying: false,
        upkeep: null,
        everyone: false,
        inGame: true,
        image: 'storage_monitor.png',
        server: body.name,
        serverId: serverId
    };
    client.writeInstanceFile(guild.id, instance);

    let rustplus = client.rustplusInstances[guild.id];
    if (!rustplus) return;

    if (serverId === rustplus.serverId) {
        let info = await rustplus.getEntityInfoAsync(entityId);
        if (!(await rustplus.isResponseValid(info))) {
            instance.storageMonitors[entityId].reachable = false;
            client.writeInstanceFile(guild.id, instance);
        }

        if (instance.storageMonitors[entityId].reachable) {
            if (info.entityInfo.payload.capacity === 28) {
                instance.storageMonitors[entityId].type = 'toolcupboard';
                instance.storageMonitors[entityId].image = 'tool_cupboard.png';
                if (info.entityInfo.payload.protectionExpiry === 0) {
                    instance.storageMonitors[entityId].decaying = true;
                }
            }
            client.writeInstanceFile(guild.id, instance);

            rustplus.storageMonitors[entityId] = {
                items: info.entityInfo.payload.items,
                expiry: info.entityInfo.payload.protectionExpiry,
                capacity: info.entityInfo.payload.capacity,
                hasProtection: info.entityInfo.payload.hasProtection
            }
        }

        await DiscordTools.sendStorageMonitorMessage(guild.id, entityId);
    }
}

async function alarmAlarm(client, guild, full, data, body) {
    /* Unfortunately the alarm notification from the fcm listener is unreliable. The notification does not include
    which entityId that got triggered which makes it impossible to know which Smart Alarms are still being used
    actively. Also, from testing it seems that notifications don't always reach this fcm listener which makes it even
    more unreliable. The only advantage to using the fcm listener alarm notification is that it includes the title and
    description messagethat is configured on the Smart Alarm in the game. Due to missing out on this data, Smart Alarm
    title and description message needs to be re-configured via the /alarm slash command. Alarms that are used on the
    connected rust server will be handled through the message event from rustplus. Smart Alarms that are still attached
    to the credential owner and which is not part of the currently connected rust server can notify IF the general
    setting fcmAlarmNotificationEnabled is enabled. Those notifications will be handled here. */

    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;
    let rustplus = client.rustplusInstances[guild.id];

    if (!rustplus || (rustplus && (serverId !== rustplus.serverId))) {
        if (instance.generalSettings.fcmAlarmNotificationEnabled) {
            let title = (data.title !== '') ? data.title : 'Smart Alarm';
            let message = (data.message !== '') ? data.message : 'Your base is under attack!';

            let content = {};
            content.embeds = [
                new MessageEmbed()
                    .setColor('#ce412b')
                    .setThumbnail('attachment://smart_alarm.png')
                    .setTitle(title)
                    .addFields({ name: 'Message', value: `\`${message}\``, inline: true })
                    .setFooter({ text: body.name })
                    .setTimestamp()];
            content.files = [new MessageAttachment('src/resources/images/electrics/smart_alarm.png')];

            if (instance.generalSettings.fcmAlarmNotificationEveryone) {
                content.content = '@everyone';
            }

            let channel = DiscordTools.getTextChannelById(rustplus.guildId, instance.channelId.activity);
            if (channel) {
                await client.messageSend(channel, content);
            }

            if (instance.generalSettings.smartAlarmNotifyInGame && rustplus) {
                rustplus.sendTeamMessageAsync(`${title}: ${message}`);
            }
        }
    }
}

async function playerDeath(client, guild, full, data, body, ownerId) {
    let member = await DiscordTools.getMemberById(guild.id, ownerId);

    if (member !== undefined) {
        let png = null;
        if (body.targetId !== '') {
            png = await Scrape.scrapeSteamProfilePicture(client, body.targetId);
        }

        if (png === null) {
            png = (isValidUrl(body.img)) ? body.img : Constants.DEFAULT_SERVER_IMG;
        }

        let embed = new MessageEmbed()
            .setColor('#ff0040')
            .setThumbnail(png)
            .setTitle(data.title)
            .setTimestamp()
            .setFooter({ text: body.name });

        if (body.targetId !== '') {
            embed.setURL(`${Constants.STEAM_PROFILES_URL}${body.targetId}`)
        }

        await client.messageSend(member, { embeds: [embed] });
    }
}

async function teamLogin(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let serverId = `${body.ip}-${body.port}`;
    let rustplus = client.rustplusInstances[guild.id];
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.activity);

    if (!rustplus || (rustplus && (serverId !== rustplus.serverId))) {
        if (channel !== undefined) {
            let png = await Scrape.scrapeSteamProfilePicture(client, body.targetId);
            await client.messageSend(channel, {
                embeds: [
                    new MessageEmbed()
                        .setColor('#00ff40')
                        .setAuthor({
                            name: `${body.targetName} just connected.`,
                            iconURL: (png !== null) ? png : Constants.DEFAULT_SERVER_IMG,
                            url: `${Constants.STEAM_PROFILES_URL}${body.targetId}`
                        })
                        .setTimestamp()
                        .setFooter({ text: body.name })
                ]
            });
            client.log('INFO', `${body.targetName} just connected to ${body.name}.`);
        }
    }
}

async function newsNews(client, guild, full, data, body) {
    let instance = client.readInstanceFile(guild.id);
    let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.activity);

    if (channel !== undefined) {
        await client.messageSend(channel, {
            embeds: [
                new MessageEmbed()
                    .setTitle(`NEWS: ${data.title}`)
                    .setColor('#ce412b')
                    .setDescription(`${data.message}`)
                    .setThumbnail(Constants.DEFAULT_SERVER_IMG)
                    .setTimestamp()
            ],
            components: [
                new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setStyle('LINK')
                            .setLabel('LINK')
                            .setURL(isValidUrl(body.url) ? body.url : Constants.DEFAULT_SERVER_URL))
            ]
        });
    }
}