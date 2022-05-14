const DiscordTools = require('../discordTools/discordTools.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');

module.exports = {
    handler: async function (rustplus, client, time) {
        let instance = client.readInstanceFile(rustplus.guildId);

        let changedSwitches = [];
        if (rustplus.smartSwitchIntervalCounter === 29) {
            rustplus.smartSwitchIntervalCounter = 0;
            for (const [key, value] of Object.entries(instance.switches)) {
                if (rustplus.serverId !== `${value.serverId}`) continue;
                instance = client.readInstanceFile(rustplus.guildId);

                let info = await rustplus.getEntityInfoAsync(key);
                if (!(await rustplus.isResponseValid(info))) {
                    if (instance.switches[key].reachable) {
                        await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);
                        instance.switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);
                        changedSwitches.push(key);
                    }
                }
                else {
                    if (!instance.switches[key].reachable) {
                        instance.switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        await DiscordTools.sendSmartSwitchMessage(rustplus.guildId, key, true, true, false);
                        changedSwitches.push(key);
                    }
                }
            }
        }
        else {
            rustplus.smartSwitchIntervalCounter += 1;
        }

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
                        if (instance.switches[key].reachable) {
                            await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);
                        }
                        instance.switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
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
                        if (instance.switches[key].reachable) {
                            await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);
                        }
                        instance.switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
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
                        if (instance.switches[key].reachable) {
                            await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);
                        }
                        instance.switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
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
                        if (instance.switches[key].reachable) {
                            await DiscordTools.sendSmartSwitchNotFound(rustplus.guildId, key);
                        }
                        instance.switches[key].reachable = false;
                        client.writeInstanceFile(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== key);
                    }
                    else {
                        instance.switches[key].reachable = true;
                        client.writeInstanceFile(rustplus.guildId, instance);
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