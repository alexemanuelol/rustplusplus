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

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, guild) => {
    const instance = client.getInstance(guild.id);

    let categoryId = null;
    for (const [channelName, channelId] of Object.entries(instance.channelId)) {
        if (channelName === 'category') {
            categoryId = channelId;
            continue;
        }

        await DiscordTools.removeTextChannel(guild.id, channelId);
        instance.channelId[channelName] = null;
    }

    await DiscordTools.removeCategory(guild.id, categoryId);
    instance.channelId['category'] = null;

    client.setInstance(guild.id, instance);
};