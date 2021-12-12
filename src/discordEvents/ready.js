module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        client.user.setActivity('/help', { type: 'LISTENING' });

        client.log('LOGGED IN AS: ' + client.user.tag);

        client.createInstanceFiles();

        client.registerSlashCommands();
        client.setupGuildChannels();
        //client.setupSettingsMenus(); /* Only run on guildCreate? */
        client.createRustplusInstancesFromConfig();
    },
};