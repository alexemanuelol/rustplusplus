/*
    Copyright (C) 2022 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

import { client, localeManager as lm } from "../../index";
import * as guildInstance from '../util/guild-instance';
import * as discordMessages from '../discordTools/discord-messages';
import { teamChatHandler } from '../handlers/team-chat-handler';
import { teamHandler } from '../handlers/team-handler'
import { inGameChatHandler } from '../handlers/in-game-chat-handler';
import { inGameCommandHandler } from '../handlers/in-game-command-handler';
import { updateSwitchGroupIfContainSwitch } from '../handlers/smart-switch-group-handler';
import * as constants from '../util/constants';
const { RustPlus } = require('../structures/RustPlus');
const Config = require('../../config');

export const name = 'message';

export async function execute(rustplus: typeof RustPlus, message: any) {
    if (!rustplus.isServerAvailable()) return rustplus.deleteThisRustplusInstance();

    if (!rustplus.isOperational) return;

    if (message.hasOwnProperty('response')) {
        await messageResponse(rustplus, message);
    }
    else if (message.hasOwnProperty('broadcast')) {
        await messageBroadcast(rustplus, message);
    }
}

async function messageResponse(rustplus: typeof RustPlus, message: any) {
    /* Not implemented */
}

async function messageBroadcast(rustplus: typeof RustPlus, message: any) {
    if (message.broadcast.hasOwnProperty('teamChanged')) {
        await messageBroadcastTeamChanged(rustplus, message);
    }
    else if (message.broadcast.hasOwnProperty('teamMessage')) {
        await messageBroadcastTeamMessage(rustplus, message);
    }
    else if (message.broadcast.hasOwnProperty('entityChanged')) {
        await messageBroadcastEntityChanged(rustplus, message);
    }
    else if (message.broadcast.hasOwnProperty('cameraRays')) {
        await messageBroadcastCameraRays(rustplus, message);
    }
}

async function messageBroadcastTeamChanged(rustplus: typeof RustPlus, message: any) {
    await teamHandler(rustplus, message.broadcast.teamChanged.teamInfo);
    const changed = rustplus.team.isLeaderSteamIdChanged(message.broadcast.teamChanged.teamInfo);
    rustplus.team.updateTeam(message.broadcast.teamChanged.teamInfo);
    if (changed) rustplus.updateLeaderRustPlusLiteInstance();
}

async function messageBroadcastTeamMessage(rustplus: typeof RustPlus, message: any) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
    const steamId = message.broadcast.teamMessage.message.steamId.toString();

    if (steamId === rustplus.playerId) {
        /* Delay inGameChatHandler */
        clearTimeout(rustplus.inGameChatTimeout);
        const commandDelayMs = parseInt(rustplus.generalSettings.commandDelay) * 1000;
        rustplus.inGameChatTimeout = setTimeout(inGameChatHandler, commandDelayMs, rustplus);
    }

    let tempName = message.broadcast.teamMessage.message.name;
    let tempMessage = message.broadcast.teamMessage.message.message;

    tempName = tempName.replace(/^<size=.*?><color=.*?>/, '');  /* Rustafied */
    tempName = tempName.replace(/<\/color><\/size>$/, '');      /* Rustafied */
    message.broadcast.teamMessage.message.name = tempName;

    tempMessage = tempMessage.replace(/^<size=.*?><color=.*?>/, '');  /* Rustafied */
    tempMessage = tempMessage.replace(/<\/color><\/size>$/, '');      /* Rustafied */
    tempMessage = tempMessage.replace(/^<color.+?<\/color>/g, '');      /* Unknown */
    message.broadcast.teamMessage.message.message = tempMessage;

    if (instance.blacklist['steamIds'].includes(`${steamId}`)) {
        rustplus.info(lm.getIntl(Config.general.language, `userPartOfBlacklistInGame`, {
            user: `${message.broadcast.teamMessage.message.name} (${steamId})`,
            message: message.broadcast.teamMessage.message.message
        }));
        await teamChatHandler(rustplus, message.broadcast.teamMessage.message);
        return;
    }

    if (rustplus.messagesSentByBot.includes(message.broadcast.teamMessage.message.message)) {
        /* Remove message from messagesSendByBot */
        for (let i = rustplus.messagesSentByBot.length - 1; i >= 0; i--) {
            if (rustplus.messagesSentByBot[i] === message.broadcast.teamMessage.message.message) {
                rustplus.messagesSentByBot.splice(i, 1);
            }
        }
        return;
    }

    const isCommand = await inGameCommandHandler(rustplus, message);
    if (isCommand) return;

    rustplus.info(lm.getIntl(Config.general.language, `logInGameMessage`, {
        message: message.broadcast.teamMessage.message.message,
        user: `${message.broadcast.teamMessage.message.name} (${steamId})`
    }));

    await teamChatHandler(rustplus, message.broadcast.teamMessage.message);
}

async function messageBroadcastEntityChanged(rustplus: typeof RustPlus, message: any) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
    const entityId = message.broadcast.entityChanged.entityId;

    if (instance.serverList[rustplus.serverId].switches.hasOwnProperty(entityId)) {
        await messageBroadcastEntityChangedSmartSwitch(rustplus, message);
    }
    else if (instance.serverList[rustplus.serverId].alarms.hasOwnProperty(entityId)) {
        await messageBroadcastEntityChangedSmartAlarm(rustplus, message);
    }
    else if (instance.serverList[rustplus.serverId].storageMonitors.hasOwnProperty(entityId)) {
        await messageBroadcastEntityChangedStorageMonitor(rustplus, message);
    }
}

async function messageBroadcastCameraRays(rustplus: typeof RustPlus, message: any) {
    /* Not implemented */
}

async function messageBroadcastEntityChangedSmartSwitch(rustplus: typeof RustPlus, message: any) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
    const serverId = rustplus.serverId;
    const entityId = message.broadcast.entityChanged.entityId;
    const server = instance.serverList[serverId];

    if (!server || (server && !server.switches[entityId])) return;

    if (rustplus.interactionSwitches.includes(`${entityId}`)) {
        rustplus.interactionSwitches = rustplus.interactionSwitches.filter((e: string) => e !== `${entityId}`);
        return;
    }

    if (rustplus.currentSwitchTimeouts.hasOwnProperty(entityId)) {
        clearTimeout(rustplus.currentSwitchTimeouts[entityId]);
        delete rustplus.currentSwitchTimeouts[entityId];
    }

    const active = message.broadcast.entityChanged.payload.value;
    server.switches[entityId].active = active;
    guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);

    await discordMessages.sendSmartSwitchMessage(rustplus.guildId, serverId, entityId);
    await updateSwitchGroupIfContainSwitch(rustplus.guildId, serverId, entityId);
}

async function messageBroadcastEntityChangedSmartAlarm(rustplus: typeof RustPlus, message: any) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
    const serverId = rustplus.serverId;
    const entityId = message.broadcast.entityChanged.entityId;
    const server = instance.serverList[serverId];

    if (!server || (server && !server.alarms[entityId])) return;

    const active = message.broadcast.entityChanged.payload.value;
    server.alarms[entityId].active = active;
    server.alarms[entityId].reachable = true;
    guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);

    if (active) {
        server.alarms[entityId].lastTrigger = Math.floor((new Date()).getTime() / 1000);
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
        await discordMessages.sendSmartAlarmTriggerMessage(rustplus.guildId, serverId, entityId);

        if (instance.generalSettings.smartAlarmNotifyInGame) {
            rustplus.sendInGameMessage(`${server.alarms[entityId].name}: ${server.alarms[entityId].message}`);
        }
    }

    await discordMessages.sendSmartAlarmMessage(rustplus.guildId, rustplus.serverId, entityId);
}

async function messageBroadcastEntityChangedStorageMonitor(rustplus: typeof RustPlus, message: any) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
    const serverId = rustplus.serverId;
    const entityId = message.broadcast.entityChanged.entityId;
    const server = instance.serverList[serverId];

    if (!server || (server && !server.storageMonitors[entityId])) return;

    if (message.broadcast.entityChanged.payload.value === true) return;

    if (server.storageMonitors[entityId].type === 'toolCupboard' ||
        message.broadcast.entityChanged.payload.capacity === constants.STORAGE_MONITOR_TOOL_CUPBOARD_CAPACITY) {
        setTimeout(updateToolCupboard.bind(null, rustplus, message), 2000);
    }
    else {
        rustplus.storageMonitors[entityId] = {
            items: message.broadcast.entityChanged.payload.items,
            expiry: message.broadcast.entityChanged.payload.protectionExpiry,
            capacity: message.broadcast.entityChanged.payload.capacity,
            hasProtection: message.broadcast.entityChanged.payload.hasProtection
        }

        const info = await rustplus.getEntityInfoAsync(entityId);
        server.storageMonitors[entityId].reachable = await rustplus.isResponseValid(info) ? true : false;

        if (server.storageMonitors[entityId].reachable) {
            if (info.entityInfo.payload.capacity === constants.STORAGE_MONITOR_VENDING_MACHINE_CAPACITY) {
                server.storageMonitors[entityId].type = 'vendingMachine';
            }
            else if (info.entityInfo.payload.capacity === constants.STORAGE_MONITOR_LARGE_WOOD_BOX_CAPACITY) {
                server.storageMonitors[entityId].type = 'largeWoodBox';
            }
        }
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);

        await discordMessages.sendStorageMonitorMessage(rustplus.guildId, serverId, entityId);
    }
}

async function updateToolCupboard(rustplus: typeof RustPlus, message: any) {
    const instance = guildInstance.readGuildInstanceFile(rustplus.guildId);
    const language = instance.generalSettings.language;
    const server = instance.serverList[rustplus.serverId];
    const entityId = message.broadcast.entityChanged.entityId;

    const info = await rustplus.getEntityInfoAsync(entityId);
    server.storageMonitors[entityId].reachable = await rustplus.isResponseValid(info) ? true : false;
    guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);

    if (server.storageMonitors[entityId].reachable) {
        rustplus.storageMonitors[entityId] = {
            items: info.entityInfo.payload.items,
            expiry: info.entityInfo.payload.protectionExpiry,
            capacity: info.entityInfo.payload.capacity,
            hasProtection: info.entityInfo.payload.hasProtection
        }

        server.storageMonitors[entityId].type = 'toolCupboard';

        if (info.entityInfo.payload.protectionExpiry === 0 && server.storageMonitors[entityId].decaying === false) {
            server.storageMonitors[entityId].decaying = true;

            await discordMessages.sendDecayingNotificationMessage(rustplus.guildId, rustplus.serverId, entityId);

            if (server.storageMonitors[entityId].inGame) {
                rustplus.sendInGameMessage(lm.getIntl(language, 'isDecaying', {
                    device: server.storageMonitors[entityId].name
                }));
            }
        }
        else if (info.entityInfo.payload.protectionExpiry !== 0) {
            server.storageMonitors[entityId].decaying = false;
        }
        guildInstance.writeGuildInstanceFile(rustplus.guildId, instance);
    }

    await discordMessages.sendStorageMonitorMessage(rustplus.guildId, rustplus.serverId, entityId);
}