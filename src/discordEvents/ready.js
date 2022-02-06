module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        client.user.setActivity('/help', { type: 'LISTENING' });
        client.log('INFO', 'LOGGED IN AS: ' + client.user.tag);

        client.createInstanceFiles();
        client.registerSlashCommands();

        /* TODO: Wait for all text channels to be created before continue */
        client.setupGuildChannels();
        client.log('INFO', 'Waiting 5 seconds to make sure all text channels are created');

        setTimeout(() => {
            client.setupFcmListeners();
            client.setupServerLists();
            client.setupSettingsMenus(); /* Only run on guildCreate? */
            client.createRustplusInstancesFromConfig();
        }, 5000);
    },
};