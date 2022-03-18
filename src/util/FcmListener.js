const { MessageEmbed, MessageAttachment } = require('discord.js');
const { listen } = require('push-receiver');
const DiscordTools = require('../discordTools/discordTools.js');

const DEFAULT_URL = 'https://rust.facepunch.com/';
const DEFAULT_IMG = 'https://files.facepunch.com/lewis/1b2411b1/og-image.jpg';

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);
    let credentials = client.readCredentialsFile(guild.id);

    if (credentials.credentials === null) {
        return;
    }

    /* Destroy previous instance of fcm listener */
    if (client.currentFcmListeners[guild.id]) {
        client.currentFcmListeners[guild.id].destroy();
    }

    let startTime = new Date();
    client.currentFcmListeners[guild.id] =
        await listen(credentials.credentials.fcm_credentials, async ({ notification, persistentId }) => {
            /* Create a delay so that buffered notifications are ignored. */
            if ((new Date() - startTime) < 3000) return;

            /* Parse the notification body. */
            const full = notification
            const data = full.data;
            const body = JSON.parse(data.body);

            switch (data.channelId) {
                case 'pairing':
                    switch (body.type) {
                        case 'server':
                            client.log('FCM', `${guild.id} pairing: server`);

                            instance = client.readInstanceFile(guild.id);
                            let customId = `${body.ip}-${body.port}`;

                            let exist = instance.serverList.hasOwnProperty(customId);

                            let message = undefined;
                            if (exist) {
                                message = await DiscordTools.getMessageById(
                                    guild.id, instance.channelId.servers, instance.serverList[customId].messageId);
                            }

                            instance.serverList[customId] = {
                                active: (exist) ? instance.serverList[customId].active : false,
                                title: data.title,
                                serverIp: body.ip,
                                appPort: body.port,
                                steamId: body.playerId,
                                playerToken: body.playerToken,
                                description: body.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
                                img: isValidUrl(body.img) ? body.img : DEFAULT_IMG,
                                url: isValidUrl(body.url) ? body.url : DEFAULT_URL,
                                timeTillDay: null,
                                timeTillNight: null,
                                messageId: (message !== undefined) ? message.id : null
                            };
                            client.writeInstanceFile(guild.id, instance);

                            let embed = new MessageEmbed()
                                .setTitle(instance.serverList[customId].title)
                                .setColor('#ce412b')
                                .setDescription(instance.serverList[customId].description)
                                .setThumbnail(instance.serverList[customId].img);

                            let row = DiscordTools.getServerButtonsRow(
                                customId,
                                (instance.serverList[customId].active) ? 1 : 0,
                                instance.serverList[customId].url);

                            if (message !== undefined) {
                                message.edit({ embeds: [embed], components: [row] });
                            }
                            else {
                                let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.servers);

                                if (!channel) {
                                    client.log('ERROR', 'Invalid guild or channel.', 'error');
                                    break;
                                }

                                instance = client.readInstanceFile(guild.id);
                                message = await channel.send({ embeds: [embed], components: [row] });
                                instance.serverList[customId].messageId = message.id;
                                client.writeInstanceFile(guild.id, instance);
                            }
                            break;

                        case 'entity':
                            switch (body.entityName) {
                                case 'Switch':
                                    client.log('FCM', `${guild.id} pairing: entity: Switch`);

                                    let rustplus = client.rustplusInstances[guild.id];
                                    instance = client.readInstanceFile(guild.id);
                                    let id = body.entityId;

                                    if (instance.switches.hasOwnProperty(id)) {
                                        return;
                                    }

                                    instance.switches[id] = {
                                        active: false,
                                        name: 'Smart Switch',
                                        command: id,
                                        image: 'smart_switch.png',
                                        server: body.name,
                                        ipPort: `${body.ip}-${body.port}`
                                    };
                                    client.writeInstanceFile(guild.id, instance);

                                    if (rustplus && `${body.ip}-${body.port}` === `${rustplus.server}-${rustplus.port}`) {
                                        client.rustplusInstances[guild.id].getEntityInfo(id, (msg) => {
                                            if (!client.rustplusInstances[guild.id].isResponseValid(msg)) {
                                                return;
                                            }

                                            let active = msg.response.entityInfo.payload.value;
                                            instance = client.readInstanceFile(guild.id);
                                            instance.switches[id].active = active;
                                            client.writeInstanceFile(guild.id, instance);

                                            let prefix = rustplus.generalSettings.prefix;

                                            let file = new MessageAttachment(
                                                `src/images/electrics${instance.switches[id].image}`);
                                            let embed = DiscordTools.getSwitchButtonsEmbed(
                                                id, instance.switches[id], prefix);

                                            let row = DiscordTools.getSwitchButtonsRow(
                                                id, active);

                                            let channel = DiscordTools.getTextChannelById(
                                                guild.id, instance.channelId.switches);

                                            if (!channel) {
                                                client.log('ERROR', 'Invalid guild or channel.', 'error');
                                                return;
                                            }

                                            channel.send({ embeds: [embed], components: [row], files: [file] }).then((msg) => {
                                                client.switchesMessages[guild.id][id] = msg;
                                            });
                                        });
                                    }
                                    break;

                                case 'Smart Alarm':
                                    client.log('FCM', `${guild.id} pairing: entity: Smart Alarm`);
                                    break;

                                case 'Storage Monitor':
                                    client.log('FCM', `${guild.id} pairing: entity: Storage Monitor`);
                                    break;

                                default:
                                    client.log('FCM', `${guild.id} pairing: entity: other\n${JSON.stringify(full)}`);
                                    break;
                            }
                            break;

                        default:
                            client.log('FCM', `${guild.id} pairing: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'alarm':
                    switch (body.type) {
                        case 'alarm':
                            client.log('FCM', `${guild.id} alarm: alarm`);
                            break;

                        default:
                            client.log('FCM', `${guild.id} alarm: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'player':
                    switch (body.type) {
                        case 'death':
                            client.log('FCM', `${guild.id} player: death`);
                            break;

                        default:
                            client.log('FCM', `${guild.id} player: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'team':
                    switch (body.type) {
                        case 'login':
                            client.log('FCM', `${guild.id} team: login`);
                            break;

                        default:
                            client.log('FCM', `${guild.id} team: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'news':
                    switch (body.type) {
                        case 'news':
                            client.log('FCM', `${guild.id} news: news`);
                            break;

                        default:
                            client.log('FCM', `${guild.id} news: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                default:
                    client.log('FCM', `${guild.id} other\n${JSON.stringify(full)}`);
                    break;
            }
        });
};

function isValidUrl(url) {
    if (url.startsWith('https') || url.startsWith('http')) {
        return true;
    }
    return false;
}