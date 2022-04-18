const DiscordTools = require('../discordTools/discordTools.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');

module.exports = {
    handler: async function (rustplus, client, time) {
        let instance = client.readInstanceFile(rustplus.guildId);

        if (rustplus.smartSwitchIntervalCounter === 29) {
            rustplus.smartSwitchIntervalCounter = 0;
            for (const [key, value] of Object.entries(instance.switches)) {
                if (rustplus.serverId !== `${value.serverId}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                    delete instance.switches[key];
                    client.writeInstanceFile(rustplus.guildId, instance);

                    try {
                        await client.switchesMessages[rustplus.guildId][key].delete();
                    }
                    catch (e) {
                        client.log('ERROR', `Could not delete switch message for entityId: ${key}.`, 'error');
                    }
                    delete client.switchesMessages[rustplus.guildId][key];
                    continue;
                }
            }
        }
        else {
            rustplus.smartSwitchIntervalCounter += 1;
        }

        let changedSwitches = [];
        if (rustplus.time.isTurnedDay(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (rustplus.serverId !== `${value.serverId}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                if (value.autoDayNight === 1) {
                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOnAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);

                        try {
                            await client.switchesMessages[rustplus.guildId][key].delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete switch message for entityId: ${key}.`, 'error');
                        }
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }


                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);
                    changedSwitches.push(key);
                }
                else if (value.autoDayNight === 2) {
                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOffAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);

                        try {
                            await client.switchesMessages[rustplus.guildId][key].delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete switch message for entityId: ${key}.`, 'error');
                        }
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);
                    changedSwitches.push(key);
                }
            }
        }
        else if (rustplus.time.isTurnedNight(time)) {
            for (const [key, value] of Object.entries(instance.switches)) {
                if (rustplus.serverId !== `${value.serverId}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                if (value.autoDayNight === 1) {
                    instance.switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOffAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);

                        try {
                            await client.switchesMessages[rustplus.guildId][key].delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete switch message for entityId: ${key}.`, 'error');
                        }
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);
                    changedSwitches.push(key);
                }
                else if (value.autoDayNight === 2) {
                    instance.switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOnAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);

                        delete instance.switches[key];
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);

                        try {
                            await client.switchesMessages[rustplus.guildId][key].delete();
                        }
                        catch (e) {
                            client.log('ERROR', `Could not delete switch message for entityId: ${key}.`, 'error');
                        }
                        delete client.switchesMessages[rustplus.guildId][key];
                        continue;
                    }

                    DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);
                    changedSwitches.push(key);
                }
            }
        }

        let groups = SmartSwitchGroupHandler.getGroupsFromSwitchList(
            client, rustplus.guildId, rustplus.serverId, changedSwitches);

        for (let group of groups) {
            await DiscordTools.sendSmartSwitchGroupMessage(rustplus.guildId, group);
        }
    },
}