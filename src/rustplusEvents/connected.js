const DiscordMessages = require('../discordTools/discordMessages.js');
const Info = require('../structures/Info');
const Map = require('../structures/Map');
const PollingHandler = require('../handlers/pollingHandler.js');

module.exports = {
    name: 'connected',
    async execute(rustplus, client) {
        if (!rustplus.isServerAvailable()) return rustplus.deleteThisServer();

        rustplus.log(client.intlGet(null, 'connectedCap'), client.intlGet(null, 'connectedToServer'));
        rustplus.isConnected = true;
        rustplus.isConnectionRefused = false;

        const instance = client.getInstance(rustplus.guildId);
        const guildId = rustplus.guildId;
        const serverId = rustplus.serverId;

        /* Start the token replenish task */
        rustplus.tokensReplenishTaskId = setInterval(rustplus.replenishTokens.bind(rustplus), 1000);

        /* Request the map. Act as a check to see if connection is truly operational. */
        const map = await rustplus.getMapAsync(3 * 60 * 1000); /* 3 min timeout */
        if (!(await rustplus.isResponseValid(map))) {
            rustplus.log(client.intlGet(null, 'errorCap'),
                client.intlGet(null, 'somethingWrongWithConnection'), 'error');

            instance.serverList[serverId].active = false;
            client.setInstance(guildId, instance);

            await DiscordMessages.sendServerConnectionInvalidMessage(guildId, serverId);
            await DiscordMessages.sendServerMessage(guildId, serverId, null);

            rustplus.disconnect();
            delete client.rustplusInstances[guildId]; // TODO: move to disconnected.js?
            return;
        }
        rustplus.log(client.intlGet(null, 'connectedCap'), client.intlGet(null, 'rustplusOperational'));

        const info = await rustplus.getInfoAsync();
        if (await rustplus.isResponseValid(info)) rustplus.info = new Info(info.info)
        if (!rustplus.map) rustplus.map = new Map(map.map, rustplus);

        let mapWiped = false;
        if (rustplus.map.isJpgImageChanged(map.map)) mapWiped = true;

        await rustplus.map.updateMap(map.map);
        await rustplus.map.writeMap(false, true);
        if (mapWiped) await DiscordMessages.sendServerWipeDetectedMessage(guildId, serverId);
        await DiscordMessages.sendInformationMapMessage(guildId);

        if (rustplus.isReconnecting) {
            rustplus.isReconnecting = false;
            await DiscordMessages.sendServerChangeStateMessage(guildId, serverId, 0);
        }

        await DiscordMessages.sendServerMessage(guildId, serverId, null);

        /* Setup Smart Devices */
        await require('../discordTools/SetupSwitches')(client, rustplus);
        await require('../discordTools/SetupSwitchGroups')(client, rustplus);
        await require('../discordTools/SetupAlarms')(client, rustplus);
        await require('../discordTools/SetupStorageMonitors')(client, rustplus);
        rustplus.isNewConnection = false;
        rustplus.loadMarkers();

        PollingHandler.pollingHandler(rustplus, client);
        rustplus.pollingTaskId = setInterval(PollingHandler.pollingHandler, client.pollingIntervalMs, rustplus, client);
        rustplus.isOperational = true;
    },
};
