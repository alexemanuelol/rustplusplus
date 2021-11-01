module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log('LOGGED IN AS: ' + client.user.tag);

        client.registerSlashCommands();
        client.setupGuildChannels();
    },
};