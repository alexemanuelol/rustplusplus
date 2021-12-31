const fs = require('fs');
const { listen } = require('push-receiver');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);

    if (instance.credentials === null) {
        return;
    }
    console.log('HELLO');

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
