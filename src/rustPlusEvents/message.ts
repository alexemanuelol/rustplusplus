/*
    Copyright (C) 2025 Alexander Emanuelsson (alexemanuelol)

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

import * as rp from 'rustplus-ts';

import { log, guildInstanceManager as gim, discordManager as dm } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import { GuildInstance } from '../managers/guildInstanceManager';
import * as discordMessages from '../discordUtils/discordMessages';

export const name = 'message';

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
export async function execute(rpInstance: RustPlusInstance, appMessage: rp.AppMessage, handled: boolean) {
    const fn = `[rustPlusEvent: ${name}]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    if (!rp.isValidAppMessage(appMessage, log)) {
        log.warn(`${fn} rp.AppMessage invalid: ${JSON.stringify(appMessage)}.`, logParam);
        return;
    }

    if (Object.hasOwn(appMessage, 'response')) {
        appMessageResponse(rpInstance, appMessage.response as rp.AppResponse);
    }
    else if (Object.hasOwn(appMessage, 'broadcast')) {
        appMessageBroadcast(rpInstance, appMessage.broadcast as rp.AppBroadcast);
    }
}


/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function appMessageResponse(rpInstance: RustPlusInstance, appResponse: rp.AppResponse) {
    /* Not used */
}

async function appMessageBroadcast(rpInstance: RustPlusInstance, appBroadcast: rp.AppBroadcast) {
    if (Object.hasOwn(appBroadcast, 'teamChanged')) {
        appMessageBroadcastTeamChanged(rpInstance, appBroadcast.teamChanged as rp.AppTeamChanged);
    }
    else if (Object.hasOwn(appBroadcast, 'teamMessage')) {
        appMessageBroadcastNewTeamMessage(rpInstance, appBroadcast.teamMessage as rp.AppNewTeamMessage);
    }
    else if (Object.hasOwn(appBroadcast, 'entityChanged')) {
        appMessageBroadcastEntityChanged(rpInstance, appBroadcast.entityChanged as rp.AppEntityChanged);
    }
    else if (Object.hasOwn(appBroadcast, 'clanChanged')) {
        appMessageBroadcastClanChanged(rpInstance, appBroadcast.clanChanged as rp.AppClanChanged);
    }
    else if (Object.hasOwn(appBroadcast, 'clanMessage')) {
        appMessageBroadcastNewClanMessage(rpInstance, appBroadcast.clanMessage as rp.AppNewClanMessage);
    }
    else if (Object.hasOwn(appBroadcast, 'cameraRays')) {
        appMessageBroadcastCameraRays(rpInstance, appBroadcast.cameraRays as rp.AppCameraRays);
    }
}


/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function appMessageBroadcastTeamChanged(rpInstance: RustPlusInstance, appTeamChanged: rp.AppTeamChanged) {
    // TODO! Update team structure
}

async function appMessageBroadcastNewTeamMessage(rpInstance: RustPlusInstance,
    appNewTeamMessage: rp.AppNewTeamMessage) {
    const fn = `[rustPlusEvent: appMessageBroadcastNewTeamMessage]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    const gInstance = gim.getGuildInstance(rpInstance.guildId) as GuildInstance;
    const server = gInstance.serverInfoMap[rpInstance.serverId];
    const teamMessage = appNewTeamMessage.message as rp.AppTeamMessage;

    teamMessage.name = teamMessage.name
        .replace(/^<size=.*?><color=.*?>/, '')
        .replace(/<\/color><\/size>$/, '')

    teamMessage.message = teamMessage.message
        .replace(/^<size=.*?><color=.*?>/, '')
        .replace(/<\/color><\/size>$/, '')
        .replace(/^<color.+?<\/color>/g, '')


    /* Check if the message was sent from the bot */
    if (teamMessage.steamId === server.requesterSteamId &&
        rpInstance.inGameTeamChatMessagesSentByBot.includes((teamMessage.message))) {
        for (let i = rpInstance.inGameTeamChatMessagesSentByBot.length - 1; i >= 0; i--) {
            if (rpInstance.inGameTeamChatMessagesSentByBot[i] === teamMessage.message) {
                rpInstance.inGameTeamChatMessagesSentByBot.splice(i, 1);
            }
        }
        return;
    }

    /* If the requester sent a message, reset the message queue timeout */
    if (teamMessage.steamId === server.requesterSteamId) {
        rpInstance.inGameTeamChatResetMessageQueueTimeout();
    }

    if (gInstance.blacklist.steamIds.includes(teamMessage.steamId)) {
        await discordMessages.sendTeamChatMessage(dm, rpInstance.guildId, teamMessage);
        log.info(`${fn} In-Game message: ${teamMessage.name}: ${teamMessage.message}.`, logParam);
        return;
    }

    const isCommand = await rpInstance.prefixCommandHandler(teamMessage);
    if (isCommand) return;

    await discordMessages.sendTeamChatMessage(dm, rpInstance.guildId, teamMessage);
    log.info(`${fn} In-Game message: ${teamMessage.name}: ${teamMessage.message}.`, logParam);
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function appMessageBroadcastEntityChanged(rpInstance: RustPlusInstance, appEntityChanged: rp.AppEntityChanged) {
    // TODO! entity changed
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function appMessageBroadcastClanChanged(rpInstance: RustPlusInstance, appClanChanged: rp.AppClanChanged) {
    /* Not implemented */
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function appMessageBroadcastNewClanMessage(rpInstance: RustPlusInstance,
    appNewClanMessage: rp.AppNewClanMessage) { /* eslint-disable-line @typescript-eslint/no-unused-vars */
    /* Not implemented */
}

/* eslint-disable-next-line @typescript-eslint/no-unused-vars */
async function appMessageBroadcastCameraRays(rpInstance: RustPlusInstance, appCameraRays: rp.AppCameraRays) {
    // TODO! camera rays
}