/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)
    Copyright (C) 2023 FaiThiX

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

const Builder = require('@discordjs/builders');

const Scrape = require('../util/scrape.js');
const DiscordMessages = require('../discordTools/discordMessages.js');

module.exports = {
    name: 'research',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('research')
            .setDescription(client.intlGet(guildId, 'commandsResearchDesc'))
            .addStringOption(option => option
                .setName('item')
                .setDescription(client.intlGet(guildId, 'commandsResearchItemDesc'))
                .setRequired(true))
    },

    async execute(client, interaction) {
        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });
        
        const item = client.items.getName(client.items.getClosestItemIdByName(interaction.options.getString('item')));
        const itemData = await getItemData(client, item);
        await DiscordMessages.sendResearchMessage(interaction, item, itemData);


    }
}

async function getItemData (client, item){
    const itemData = await Scrape.scrapeRustLabs(client, item);
    return itemData;
}