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

import { discordManager as dm, guildInstanceManager as gim } from '../../index';
import { RustPlusInstance } from "../managers/rustPlusManager";
import * as discordMessages from '../discordUtils/discordMessages';
import { GuildInstance } from '../managers/guildInstanceManager';

export async function handler(rpInstance: RustPlusInstance) {
    const gInstance = gim.getGuildInstance(rpInstance.guildId) as GuildInstance;
    if (gInstance.serverToView !== rpInstance.serverId) return;

    if (rpInstance.informationChannelCounter === 0) {
        // map
        await discordMessages.sendInformationChannelServerEventMessage(dm, rpInstance);
        await discordMessages.sendInformationChannelTeamMessage(dm, rpInstance);
        // battlemetricsPlayers
    }

    rpInstance.informationChannelCounter++;
    // TODO! Make this working better together with the rustplus polling interval
    if (rpInstance.informationChannelCounter >= 4) {
        rpInstance.informationChannelCounter = 0;
    }
}