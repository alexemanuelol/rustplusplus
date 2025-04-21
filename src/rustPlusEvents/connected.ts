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

import { log, discordManager as dm, guildInstanceManager as gim } from '../../index';
import { RustPlusInstance, ConnectionStatus } from "../managers/rustPlusManager";
import { sendServerMessage } from '../discordUtils/discordMessages';
import { GuildInstance } from '../managers/guildInstanceManager';

export const name = 'connected';

export async function execute(rpInstance: RustPlusInstance) {
    const funcName = `[rustPlusEvent: ${name}]`;
    const logParam = {
        guildId: rpInstance.guildId,
        serverId: rpInstance.serverId,
        serverName: rpInstance.serverName
    };

    log.info(`${funcName} CONNECTED.`, logParam);

    rpInstance.stopReconnectionTimer();

    // TODO! Retrieve map to see if map wipe

    rpInstance.setupSmartDevices();

    rpInstance.startServerPollingHandler();

    //const gInstance = gim.getGuildInstance(rpInstance.guildId) as GuildInstance;
    //const pairingData = gInstance.pairingDataMap[rpInstance.serverId]?.[rpInstance.mainSteamId] ?? null;

    //if (!pairingData) {
    //    // TODO! Change mainSteamId because current dont work anymore.
    //    return;
    //}

    //const response = await rpInstance.rustPlus.getInfoAsync(pairingData.steamId + '1', pairingData.playerToken);
    //const isValidResponse = rp.isValidAppResponse(response, log);
    //if (isValidResponse) {
    //    if (rp.isValidAppError(response.error, log)) {
    //        const error = response.error.error;
    //    }
    //    else if (!rp.isValidAppInfo(response.info, log)) {

    //    }
    //}
    //else {
    //    /* Error or rp.ConsumeTokensError */
    //}




    //console.log(response)
    //if (!(rp.isValidAppResponse(response, log) && rp.isValidAppInfo(response.info, log))) {
    //    if (rp.isValidAppResponse(response, log) && rp.isValidAppError(response.error, log)) {
    //        console.log(response.error.error)
    //    }
    //    console.log('INVALID')
    //}



    rpInstance.connectionStatus = ConnectionStatus.Connected;
    await sendServerMessage(dm, rpInstance.guildId, rpInstance.serverId, ConnectionStatus.Connected);
}