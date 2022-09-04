const DiscordMessages = require('../discordTools/discordMessages.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');

module.exports = {
    handler: async function (rustplus, client, time) {
        let instance = client.readInstanceFile(rustplus.guildId);

        let changedSwitches = [];
        if (rustplus.smartSwitchIntervalCounter === 29) {
            rustplus.smartSwitchIntervalCounter = 0;
            for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].switches)) {
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    if (instance.serverList[rustplus.serverId].switches[key].reachable) {
                        await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId, rustplus.serverId, key);
                        instance.serverList[rustplus.serverId].switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
                        changedSwitches.push(key);
                    }
                }
                else {
                    if (!instance.serverList[rustplus.serverId].switches[key].reachable) {
                        instance.serverList[rustplus.serverId].switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
                        changedSwitches.push(key);
                    }
                }
            }
        }
        else {
            rustplus.smartSwitchIntervalCounter += 1;
        }

        if (rustplus.time.isTurnedDay(time)) {
            for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].switches)) {
                instance = client.readInstanceFile(rustplus.guildId);

                if (value.autoDayNight === 1) {
                    instance.serverList[rustplus.serverId].switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOnAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[rustplus.serverId].switches[key].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                rustplus.serverId, key);
                        }
                        instance.serverList[rustplus.serverId].switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.serverList[rustplus.serverId].switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
                    }

                    DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
                    changedSwitches.push(key);
                }
                else if (value.autoDayNight === 2) {
                    instance.serverList[rustplus.serverId].switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOffAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[rustplus.serverId].switches[key].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                rustplus.serverId, key);
                        }
                        instance.serverList[rustplus.serverId].switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.serverList[rustplus.serverId].switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
                    }

                    DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
                    changedSwitches.push(key);
                }
            }
        }
        else if (rustplus.time.isTurnedNight(time)) {
            for (const [key, value] of Object.entries(instance.serverList[rustplus.serverId].switches)) {
                instance = client.readInstanceFile(rustplus.guildId);

                if (value.autoDayNight === 1) {
                    instance.serverList[rustplus.serverId].switches[key].active = false;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOffAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[rustplus.serverId].switches[key].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                rustplus.serverId, key);
                        }
                        instance.serverList[rustplus.serverId].switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.serverList[rustplus.serverId].switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
                    }

                    DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
                    changedSwitches.push(key);
                }
                else if (value.autoDayNight === 2) {
                    instance.serverList[rustplus.serverId].switches[key].active = true;
                    client.writeInstanceFile(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(key);

                    let response = await rustplus.turnSmartSwitchOnAsync(key);
                    if (!(await rustplus.isResponseValid(response))) {
                        if (instance.serverList[rustplus.serverId].switches[key].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                rustplus.serverId, key);
                        }
                        instance.serverList[rustplus.serverId].switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.serverList[rustplus.serverId].switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
                    }

                    DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, key);
                    changedSwitches.push(key);
                }
            }
        }

        let groups = SmartSwitchGroupHandler.getGroupsFromSwitchList(
            client, rustplus.guildId, rustplus.serverId, changedSwitches);

        for (let group of groups) {
            await DiscordMessages.sendSmartSwitchGroupMessage(rustplus.guildId, rustplus.serverId, group);
        }
    },
}