const DiscordTools = require('../discordTools/discordTools.js');

module.exports = {
    handler: async function (rustplus, client, time) {
        let instance = client.readInstanceFile(rustplus.guildId);
        let server = `${rustplus.server}-${rustplus.port}`;

        if (rustplus.smartSwitchIntervalCounter === 29) {
            rustplus.smartSwitchIntervalCounter = 0;
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                    delete instance.switches[key];
                    client.writeInstanceFile(rustplus.guildId, instance);

                    await client.switchesMessages[rustplus.guildId][key].delete();
                    delete client.switchesMessages[rustplus.guildId][key];
                    continue;
                }
            }
        }
        else {
            rustplus.smartSwitchIntervalCounter += 1;
        }

        if (rustplus.time.isTurnedDay(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                if (value.autoDayNight === 1) {
                    let response = await rustplus.turnSmartSwitchOnAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await client.switchesMessages[rustplus.guildId][key].delete();
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = true;
                }
                else if (value.autoDayNight === 2) {
                    let response = await rustplus.turnSmartSwitchOffAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await client.switchesMessages[rustplus.guildId][key].delete();
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = false;
                }
            }
        }
        else if (rustplus.time.isTurnedNight(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (server !== `${value.ipPort}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                if (value.autoDayNight === 1) {
                    let response = await rustplus.turnSmartSwitchOffAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await client.switchesMessages[rustplus.guildId][key].delete();
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = false;
                }
                else if (value.autoDayNight === 2) {
                    let response = await rustplus.turnSmartSwitchOnAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await client.switchesMessages[rustplus.guildId][key].delete();
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);

                    rustplus.interactionSwitches[key] = true;
                }
            }
        }
    },
}