module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        client.user.setActivity('/help', { type: 'LISTENING' });

        client.log('LOGGED IN AS: ' + client.user.tag);

        client.createInstancesFile();

        client.registerSlashCommands();
        client.setupGuildChannels();
        client.createRustplusInstancesFromConfig();
    },
};