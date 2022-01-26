const { MessageEmbed } = require('discord.js');
const { listen } = require('push-receiver');
const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);

    if (instance.credentials === null) {
        return;
    }

    /* Destroy previous instance of fcm listener */
    if (client.currentFcmListeners[guild.id]) {
        client.currentFcmListeners[guild.id].destroy();
    }

    let startTime = new Date();
    client.currentFcmListeners[guild.id] =
        await listen(instance.credentials.fcm_credentials, ({ notification, persistentId }) => {
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
                            client.log(`${guild.id} pairing: server`);

                            instance = client.readInstanceFile(guild.id);
                            let customId = `${body.ip}-${body.port}`;

                            let exist = instance.serverList.hasOwnProperty(customId);
                            instance.serverList[customId] = {
                                active: (exist) ? instance.serverList[customId].active : false,
                                title: data.title,
                                serverIp: body.ip,
                                appPort: body.port,
                                steamId: body.playerId,
                                playerToken: body.playerToken,
                                description: body.desc.replace(/\\n/g, '\n').replace(/\\t/g, '\t'),
                                img: body.img,
                                url: body.url
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
                                body.url);

                            if (exist) {
                                client.serverListMessages[guild.id][customId].edit({
                                    embeds: [embed],
                                    components: [row]
                                });
                            }
                            else {
                                let channel = DiscordTools.getTextChannelById(guild.id, instance.channelId.servers);

                                if (!channel) {
                                    client.log('Invalid guild or channel.');
                                    break;
                                }

                                channel.send({ embeds: [embed], components: [row] }).then((msg) => {
                                    client.serverListMessages[guild.id][customId] = msg;
                                });
                            }
                            break;

                        case 'entity':
                            switch (body.entityName) {
                                case 'Switch':
                                    client.log(`${guild.id} pairing: entity: Switch`);
                                    break;

                                case 'Smart Alarm':
                                    client.log(`${guild.id} pairing: entity: Smart Alarm`);
                                    break;

                                case 'Storage Monitor':
                                    client.log(`${guild.id} pairing: entity: Storage Monitor`);
                                    break;

                                default:
                                    client.log(`${guild.id} pairing: entity: other\n${JSON.stringify(full)}`);
                                    break;
                            }
                            break;

                        default:
                            client.log(`${guild.id} pairing: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'alarm':
                    switch (body.type) {
                        case 'alarm':
                            client.log(`${guild.id} alarm: alarm`);
                            break;

                        default:
                            client.log(`${guild.id} alarm: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'player':
                    switch (body.type) {
                        case 'death':
                            client.log(`${guild.id} player: death`);
                            break;

                        default:
                            client.log(`${guild.id} player: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                case 'team':
                    switch (body.type) {
                        case 'login':
                            client.log(`${guild.id} team: login`);
                            break;

                        default:
                            client.log(`${guild.id} team: other\n${JSON.stringify(full)}`);
                            break;
                    }
                    break;

                default:
                    client.log(`${guild.id} other\n${JSON.stringify(full)}`);
                    break;
            }
        });
};
