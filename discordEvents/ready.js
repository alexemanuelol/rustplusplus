module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        client.user.setActivity('/help', { type: 'LISTENING' });

        console.log('LOGGED IN AS: ' + client.user.tag);

        client.registerSlashCommands();
        client.setupGuildChannels();
        client.createRustplusInstancesFromConfig();
    },
};