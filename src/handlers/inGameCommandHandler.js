const DiscordMessages = require('../discordTools/discordMessages.js');
const SmartSwitchGroupHandler = require('./smartSwitchGroupHandler.js');
const Timer = require('../util/timer');

module.exports = {
    inGameCommandHandler: async function (rustplus, client, message) {
        const command = message.broadcast.teamMessage.message.message;
        const callerSteamId = message.broadcast.teamMessage.message.steamId.toString();
        const callerName = message.broadcast.teamMessage.message.name;
        const commandLowerCase = message.broadcast.teamMessage.message.message.toLowerCase();
        const prefix = rustplus.generalSettings.prefix;


        if (!rustplus.isOperational) {
            return false;
        }
        else if (!rustplus.generalSettings.inGameCommandsEnabled) {
            return false;
        }
        else if (commandLowerCase === `${prefix}afk`) {
            rustplus.printCommandOutput(rustplus.getCommandAfk());
        }
        else if (commandLowerCase.startsWith(`${prefix}alive`)) {
            rustplus.printCommandOutput(rustplus.getCommandAlive(command));
        }
        else if (commandLowerCase === `${prefix}bradley`) {
            rustplus.printCommandOutput(rustplus.getCommandBradley());
        }
        else if (commandLowerCase === `${prefix}cargo`) {
            rustplus.printCommandOutput(rustplus.getCommandCargo());
        }
        else if (commandLowerCase === `${prefix}chinook`) {
            rustplus.printCommandOutput(rustplus.getCommandChinook());
        }
        else if (commandLowerCase === `${prefix}crate`) {
            rustplus.printCommandOutput(rustplus.getCommandCrate());
        }
        else if (commandLowerCase === `${prefix}heli`) {
            rustplus.printCommandOutput(rustplus.getCommandHeli());
        }
        else if (commandLowerCase === `${prefix}large`) {
            rustplus.printCommandOutput(rustplus.getCommandLarge());
        }
        else if (commandLowerCase.startsWith(`${prefix}leader`)) {
            rustplus.printCommandOutput(await rustplus.getCommandLeader(command, callerSteamId));
        }
        else if (commandLowerCase.startsWith(`${prefix}marker `)) {
            rustplus.printCommandOutput(await rustplus.getCommandMarker(command, callerSteamId));
        }
        else if (commandLowerCase === `${prefix}mute`) {
            rustplus.printCommandOutput(rustplus.getCommandMute());
        }
        else if (commandLowerCase.startsWith(`${prefix}note`)) {
            rustplus.printCommandOutput(rustplus.getCommandNote(command));
        }
        else if (commandLowerCase === `${prefix}offline`) {
            rustplus.printCommandOutput(rustplus.getCommandOffline());
        }
        else if (commandLowerCase === `${prefix}online`) {
            rustplus.printCommandOutput(rustplus.getCommandOnline());
        }
        else if (commandLowerCase.startsWith(`${prefix}player`)) {
            rustplus.printCommandOutput(rustplus.getCommandPlayer(command));
        }
        else if (commandLowerCase === `${prefix}pop`) {
            rustplus.printCommandOutput(rustplus.getCommandPop());
        }
        else if (commandLowerCase.startsWith(`${prefix}prox`)) {
            rustplus.printCommandOutput(await rustplus.getCommandProx(command, callerSteamId));
        }
        else if (commandLowerCase === `${prefix}small`) {
            rustplus.printCommandOutput(rustplus.getCommandSmall());
        }
        else if (commandLowerCase === `${prefix}time`) {
            rustplus.printCommandOutput(rustplus.getCommandTime());
        }
        else if (commandLowerCase.startsWith(`${prefix}timer `)) {
            rustplus.printCommandOutput(rustplus.getCommandTimer(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}tr `)) {
            rustplus.printCommandOutput(await rustplus.getCommandTranslateTo(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}trf `)) {
            rustplus.printCommandOutput(await rustplus.getCommandTranslateFromTo(command));
        }
        else if (commandLowerCase.startsWith(`${prefix}tts `)) {
            rustplus.printCommandOutput(await rustplus.getCommandTTS(command, callerName));
        }
        else if (commandLowerCase === `${prefix}unmute`) {
            rustplus.printCommandOutput(rustplus.getCommandUnmute());
        }
        else if (commandLowerCase === `${prefix}upkeep`) {
            rustplus.printCommandOutput(rustplus.getCommandUpkeep());
        }
        else if (commandLowerCase === `${prefix}wipe`) {
            rustplus.printCommandOutput(rustplus.getCommandWipe());
        }
        else {
            /* Maybe a custom command? */
            let instance = client.getInstance(rustplus.guildId);

            const onCap = client.intlGet(rustplus.guildId, 'onCap');
            const offCap = client.intlGet(rustplus.guildId, 'offCap');
            const notFoundCap = client.intlGet(rustplus.guildId, 'notFoundCap');

            for (const [id, content] of Object.entries(instance.serverList[rustplus.serverId].switches)) {
                let cmd = `${prefix}${content.command}`;
                if (command === cmd || command.startsWith(`${cmd} `)) {
                    let rest = command;
                    let active;
                    if (command.startsWith(`${cmd} on`)) {
                        rest = rest.replace(`${cmd} on`, '').trim();
                        if (!content.active) {
                            active = true;
                        }
                        else {
                            return true;
                        }
                    }
                    else if (command.startsWith(`${cmd} off`)) {
                        rest = rest.replace(`${cmd} off`, '').trim();
                        if (content.active) {
                            active = false;
                        }
                        else {
                            return true;
                        }
                    }
                    else if (command === `${cmd} status`) {
                        let info = await rustplus.getEntityInfoAsync(id);
                        if (!(await rustplus.isResponseValid(info))) {
                            instance.serverList[rustplus.serverId].switches[id].reachable = false;
                            client.setInstance(rustplus.guildId, instance);
                            DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, id);
                            SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                                client, rustplus.guildId, rustplus.serverId, id);

                            rustplus.printCommandOutput(client.intlGet(rustplus.guildId, 'noCommunicationSmartSwitch', {
                                name: instance.serverList[rustplus.serverId].switches[id].name
                            }));
                            return false;
                        }

                        rustplus.printCommandOutput(client.intlGet(rustplus.guildId, 'deviceIsCurrentlyOnOff', {
                            device: instance.serverList[rustplus.serverId].switches[id].name,
                            status: info.entityInfo.payload.value ? onCap : offCap
                        }));
                        return true;
                    }
                    else if (command.startsWith(`${cmd}`)) {
                        rest = rest.replace(`${cmd}`, '').trim();
                        active = !content.active;
                    }
                    else {
                        return false;
                    }

                    if (rustplus.currentSwitchTimeouts.hasOwnProperty(id)) {
                        clearTimeout(rustplus.currentSwitchTimeouts[id]);
                        delete rustplus.currentSwitchTimeouts[id];
                    }

                    let timeSeconds = Timer.getSecondsFromStringTime(rest);

                    let prevActive = instance.serverList[rustplus.serverId].switches[id].active;
                    instance.serverList[rustplus.serverId].switches[id].active = active;
                    client.setInstance(rustplus.guildId, instance);

                    rustplus.interactionSwitches.push(id);

                    let response = null;
                    if (active) {
                        response = await rustplus.turnSmartSwitchOnAsync(id);
                    }
                    else {
                        response = await rustplus.turnSmartSwitchOffAsync(id);
                    }

                    if (!(await rustplus.isResponseValid(response))) {
                        rustplus.printCommandOutput(client.intlGet(rustplus.guildId, 'noCommunicationSmartSwitch', {
                            name: content.name
                        }));
                        if (instance.serverList[rustplus.serverId].switches[id].reachable) {
                            await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                rustplus.serverId, id);
                        }
                        instance.serverList[rustplus.serverId].switches[id].reachable = false;
                        instance.serverList[rustplus.serverId].switches[id].active = prevActive;
                        client.setInstance(rustplus.guildId, instance);

                        rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);
                    }
                    else {
                        instance.serverList[rustplus.serverId].switches[id].reachable = true;
                        client.setInstance(rustplus.guildId, instance);
                    }

                    DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, id);
                    SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                        client, rustplus.guildId, rustplus.serverId, id);

                    if (instance.serverList[rustplus.serverId].switches[id].reachable) {
                        let str = client.intlGet(rustplus.guildId, 'deviceWasTurnedOnOff', {
                            device: instance.serverList[rustplus.serverId].switches[id].name,
                            status: active ? onCap : offCap
                        });

                        if (timeSeconds !== null) {
                            let time = Timer.secondsToFullScale(timeSeconds);
                            str += client.intlGet(rustplus.guildId, 'automaticallyTurnBackOnOff', {
                                status: active ? offCap : onCap,
                                time: time
                            });

                            rustplus.currentSwitchTimeouts[id] = setTimeout(async function () {
                                let instance = client.getInstance(rustplus.guildId);
                                if (!instance.serverList[rustplus.serverId].switches.hasOwnProperty(id)) {
                                    return false;
                                }

                                let prevActive = instance.serverList[rustplus.serverId].switches[id].active;
                                instance.serverList[rustplus.serverId].switches[id].active = !active;
                                client.setInstance(rustplus.guildId, instance);

                                rustplus.interactionSwitches.push(id);

                                let response = null;
                                if (!active) {
                                    response = await rustplus.turnSmartSwitchOnAsync(id);
                                }
                                else {
                                    response = await rustplus.turnSmartSwitchOffAsync(id);
                                }

                                if (!(await rustplus.isResponseValid(response))) {
                                    rustplus.printCommandOutput(client.intlGet(rustplus.guildId,
                                        'noCommunicationSmartSwitch', { name: content.name }));
                                    if (instance.serverList[rustplus.serverId].switches[id].reachable) {
                                        await DiscordMessages.sendSmartSwitchNotFoundMessage(rustplus.guildId,
                                            rustplus.serverId, id);
                                    }
                                    instance.serverList[rustplus.serverId].switches[id].reachable = false;
                                    instance.serverList[rustplus.serverId].switches[id].active = prevActive;
                                    client.setInstance(rustplus.guildId, instance);

                                    rustplus.interactionSwitches = rustplus.interactionSwitches.filter(e => e !== id);
                                }
                                else {
                                    instance.serverList[rustplus.serverId].switches[id].reachable = true;
                                    client.setInstance(rustplus.guildId, instance);
                                }

                                DiscordMessages.sendSmartSwitchMessage(rustplus.guildId, rustplus.serverId, id);
                                SmartSwitchGroupHandler.updateSwitchGroupIfContainSwitch(
                                    client, rustplus.guildId, rustplus.serverId, id);

                                let str = client.intlGet(rustplus.guildId, 'automaticallyTurningBackOnOff', {
                                    device: instance.serverList[rustplus.serverId].switches[id].name,
                                    status: !active ? onCap : offCap
                                });
                                rustplus.printCommandOutput(str);
                            }, timeSeconds * 1000);
                        }

                        rustplus.printCommandOutput(str);
                    }

                    return true;
                }
            }

            let groups = instance.serverList[rustplus.serverId].switchGroups;
            for (const [groupId, content] of Object.entries(groups)) {
                let cmd = `${prefix}${content.command}`;
                if (command === cmd || command.startsWith(`${cmd} `)) {
                    let rest = command;
                    let active;
                    if (command.startsWith(`${cmd} on`)) {
                        rest = rest.replace(`${cmd} on`, '').trim();
                        active = true;
                    }
                    else if (command.startsWith(`${cmd} off`)) {
                        rest = rest.replace(`${cmd} off`, '').trim();
                        active = false;
                    }
                    else if (command === `${cmd}`) {
                        /* Get switch info, create message */
                        var switchStatus = content.switches.map(switchId => {
                            const { active, name, reachable } =
                                instance.serverList[rustplus.serverId].switches[switchId];
                            return { active, name, reachable }
                        });
                        const statusMessage = switchStatus.map(status =>
                            `${status.name}: ${status.reachable ? (status.active ? onCap : offCap) : notFoundCap}`)
                            .join(', ');
                        rustplus.printCommandOutput(`${client.intlGet(rustplus.guildId, 'status')}: ${statusMessage}`);
                        return true;
                    }
                    else {
                        return false;
                    }

                    if (rustplus.currentSwitchTimeouts.hasOwnProperty(groupId)) {
                        clearTimeout(rustplus.currentSwitchTimeouts[groupId]);
                        delete rustplus.currentSwitchTimeouts[groupId];
                    }

                    let timeSeconds = Timer.getSecondsFromStringTime(rest);

                    let str = client.intlGet(rustplus.guildId, 'turningGroupOnOff', {
                        group: content.name,
                        status: active ? onCap : offCap
                    });

                    if (timeSeconds !== null) {
                        let time = Timer.secondsToFullScale(timeSeconds);
                        str += client.intlGet(rustplus.guildId, 'automaticallyTurnBackOnOff', {
                            status: active ? offCap : onCap,
                            time: time
                        });

                        rustplus.currentSwitchTimeouts[groupId] = setTimeout(async function () {
                            let instance = client.getInstance(rustplus.guildId);
                            if (!instance.serverList.hasOwnProperty(rustplus.serverId) ||
                                !instance.serverList[rustplus.serverId].switchGroups.hasOwnProperty(groupId)) {
                                return false;
                            }
                            let str = client.intlGet(rustplus.guildId, 'automaticallyTurningBackOnOff', {
                                device: content.name,
                                status: !active ? onCap : offCap
                            });
                            rustplus.printCommandOutput(str);

                            await SmartSwitchGroupHandler.TurnOnOffGroup(
                                client, rustplus, rustplus.guildId, rustplus.serverId, groupId, !active);

                        }, timeSeconds * 1000);
                    }

                    rustplus.printCommandOutput(str);

                    await SmartSwitchGroupHandler.TurnOnOffGroup(
                        client, rustplus, rustplus.guildId, rustplus.serverId, groupId, active);

                    return true;
                }
            }

            return false;
        }

        return true;
    },
};
