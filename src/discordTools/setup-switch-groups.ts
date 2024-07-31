/*
    Copyright (C) 2024 Alexander Emanuelsson (alexemanuelol)

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

import { client } from '../../index';
import * as discordTools from './discord-tools';
const DiscordMessages = require('./discordMessages.js');
const { RustPlus } = require('../structures/RustPlus.js');

export async function setupSwitchGroups(rustplus: typeof RustPlus) {
    const guildId = rustplus.guildId;
    const instance = client.getInstance(guildId);

    if (rustplus.isNewConnection) {
        await discordTools.clearTextChannel(guildId, instance.channelIds.switchGroups, 100);
    }

    for (const groupId in instance.serverList[rustplus.serverId].switchGroups) {
        await DiscordMessages.sendSmartSwitchGroupMessage(guildId, rustplus.serverId, groupId);
    }
}