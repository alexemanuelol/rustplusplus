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

const Builder = require('@discordjs/builders');

const Constants = require('../../dist/util/constants.js');
const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
    name: 'market',

    getData(client, guildId) {
        return new Builder.SlashCommandBuilder()
            .setName('market')
            .setDescription(client.intlGet(guildId, 'commandsMarketDesc'))
            .addSubcommand(subcommand => subcommand
                .setName('search')
                .setDescription(client.intlGet(guildId, 'commandsMarketSearchDesc'))
                .addStringOption(option => option
                    .setName('order')
                    .setDescription(client.intlGet(guildId, 'commandsMarketOrderDesc'))
                    .setRequired(true)
                    .addChoices(
                        { name: client.intlGet(guildId, 'all'), value: 'all' },
                        { name: client.intlGet(guildId, 'buy'), value: 'buy' },
                        { name: client.intlGet(guildId, 'sell'), value: 'sell' }))
                .addStringOption(option => option
                    .setName('name')
                    .setDescription(client.intlGet(guildId, 'theNameOfTheItem'))
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('id')
                    .setDescription(client.intlGet(guildId, 'theIdOfTheItem'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('subscribe')
                .setDescription(client.intlGet(guildId, 'commandsMarketSubscribeDesc'))
                .addStringOption(option => option
                    .setName('order')
                    .setDescription(client.intlGet(guildId, 'commandsMarketOrderDesc'))
                    .setRequired(true)
                    .addChoices(
                        { name: client.intlGet(guildId, 'all'), value: 'all' },
                        { name: client.intlGet(guildId, 'buy'), value: 'buy' },
                        { name: client.intlGet(guildId, 'sell'), value: 'sell' }))
                .addStringOption(option => option
                    .setName('name')
                    .setDescription(client.intlGet(guildId, 'theNameOfTheItem'))
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('id')
                    .setDescription(client.intlGet(guildId, 'theIdOfTheItem'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('unsubscribe')
                .setDescription(client.intlGet(guildId, 'commandsMarketUnsubscribeDesc'))
                .addStringOption(option => option
                    .setName('order')
                    .setDescription(client.intlGet(guildId, 'commandsMarketOrderDesc'))
                    .setRequired(true)
                    .addChoices(
                        { name: client.intlGet(guildId, 'all'), value: 'all' },
                        { name: client.intlGet(guildId, 'buy'), value: 'buy' },
                        { name: client.intlGet(guildId, 'sell'), value: 'sell' }))
                .addStringOption(option => option
                    .setName('name')
                    .setDescription(client.intlGet(guildId, 'theNameOfTheItem'))
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('id')
                    .setDescription(client.intlGet(guildId, 'theIdOfTheItem'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('list')
                .setDescription(client.intlGet(guildId, 'commandsMarketListDesc')));
    },

    async execute(client, interaction) {
        const instance = client.getInstance(interaction.guildId);
        const rustplus = client.rustplusInstances[interaction.guildId];

        const verifyId = Math.floor(100000 + Math.random() * 900000);
        client.logInteraction(interaction, verifyId, 'slashCommand');

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        if (!rustplus || (rustplus && !rustplus.isOperational)) {
            const str = client.intlGet(interaction.guildId, 'notConnectedToRustServer');
            await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log(client.intlGet(null, 'warningCap'), str);
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case 'search': {
                const searchItemName = interaction.options.getString('name');
                const searchItemId = interaction.options.getString('id');
                const orderType = interaction.options.getString('order');

                let itemId = null;
                if (searchItemName !== null) {
                    const item = client.items.getClosestItemIdByName(searchItemName)
                    if (item === null) {
                        const str = client.intlGet(interaction.guildId, 'noItemWithNameFound', {
                            name: searchItemName
                        });
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                        return;
                    }
                    else {
                        itemId = item;
                    }
                }
                else if (searchItemId !== null) {
                    if (client.items.itemExist(searchItemId)) {
                        itemId = searchItemId;
                    }
                    else {
                        const str = client.intlGet(interaction.guildId, 'noItemWithIdFound', {
                            id: searchItemId
                        });
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                        return;
                    }
                }
                else if (searchItemName === null && searchItemId === null) {
                    const str = client.intlGet(interaction.guildId, 'noNameIdGiven');
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                    return;
                }
                const itemName = client.items.getName(itemId);

                let full = false;
                let foundLines = '';
                const unknownString = client.intlGet(interaction.guildId, 'unknown');
                const leftString = client.intlGet(interaction.guildId, 'remain');
                for (const vendingMachine of rustplus.mapMarkers.vendingMachines) {
                    if (full) break;
                    if (!vendingMachine.hasOwnProperty('sellOrders')) continue;

                    for (const order of vendingMachine.sellOrders) {
                        if (order.amountInStock === 0) continue;

                        const orderItemId = (Object.keys(client.items.items).includes(order.itemId.toString())) ?
                            order.itemId : null;
                        const orderQuantity = order.quantity;
                        const orderCurrencyId = (Object.keys(client.items.items)
                            .includes(order.currencyId.toString())) ? order.currencyId : null;
                        const orderCostPerItem = order.costPerItem;
                        const orderAmountInStock = order.amountInStock;
                        const orderItemIsBlueprint = order.itemIsBlueprint;
                        const orderCurrencyIsBlueprint = order.currencyIsBlueprint;

                        const orderItemName = (orderItemId !== null) ?
                            client.items.getName(orderItemId) : unknownString;
                        const orderCurrencyName = (orderCurrencyId !== null) ?
                            client.items.getName(orderCurrencyId) : unknownString;

                        const prevFoundLines = foundLines;

                        if ((orderType === 'all' &&
                            (orderItemId === parseInt(itemId) || orderCurrencyId === parseInt(itemId))) ||
                            (orderType === 'buy' && orderCurrencyId === parseInt(itemId)) ||
                            (orderType === 'sell' && orderItemId === parseInt(itemId))) {
                            if (foundLines === '') {
                                foundLines += '```diff\n';
                            }

                            foundLines += `+ [${vendingMachine.location.string}] `;
                            foundLines += `${orderQuantity}x ${orderItemName}`;
                            foundLines += `${(orderItemIsBlueprint) ? ' (BP)' : ''} for `;
                            foundLines += `${orderCostPerItem}x ${orderCurrencyName}`;
                            foundLines += `${(orderCurrencyIsBlueprint) ? ' (BP)' : ''} `;
                            foundLines += `(${orderAmountInStock} ${leftString})\n`;

                            if (foundLines.length >= 4000) {
                                foundLines = prevFoundLines;
                                foundLines += `...\n`;
                                full = true;
                                break;
                            }
                        }
                    }
                }

                if (foundLines === '') {
                    foundLines = client.intlGet(interaction.guildId, 'noItemFound');
                }
                else {
                    foundLines += '```'
                }

                client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
                    id: `${verifyId}`,
                    value: `search, ${searchItemName}, ${searchItemId}, ${orderType}`
                }));

                const embed = DiscordEmbeds.getEmbed({
                    color: Constants.COLOR_DEFAULT,
                    title: client.intlGet(interaction.guildId, 'searchResult', { name: itemName }),
                    description: foundLines,
                    footer: { text: `${instance.serverList[rustplus.serverId].title}` }
                });

                await client.interactionEditReply(interaction, { embeds: [embed] });
                rustplus.log(client.intlGet(interaction.guildId, 'infoCap'),
                    client.intlGet(interaction.guildId, 'searchResult', { name: itemName }));
            } break;

            case 'subscribe': {
                const subscribeItemName = interaction.options.getString('name');
                const subscribeItemId = interaction.options.getString('id');
                const orderType = interaction.options.getString('order');

                let itemId = null;
                if (subscribeItemName !== null) {
                    const item = client.items.getClosestItemIdByName(subscribeItemName)
                    if (item === null) {
                        const str = client.intlGet(interaction.guildId, 'noItemWithNameFound', {
                            name: subscribeItemName
                        });
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                        return;
                    }
                    else {
                        itemId = item;
                    }
                }
                else if (subscribeItemId !== null) {
                    if (client.items.itemExist(subscribeItemId)) {
                        itemId = subscribeItemId;
                    }
                    else {
                        const str = client.intlGet(interaction.guildId, 'noItemWithIdFound', {
                            id: subscribeItemId
                        });
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                        return;
                    }
                }
                else if (subscribeItemName === null && subscribeItemId === null) {
                    const str = client.intlGet(interaction.guildId, 'noNameIdGiven');
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                    return;
                }
                const itemName = client.items.getName(itemId);

                if (instance.marketSubscriptionList[orderType].includes(itemId)) {
                    const str = client.intlGet(interaction.guildId, 'alreadySubscribedToItem', {
                        name: itemName
                    });
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                }
                else {
                    instance.marketSubscriptionList[orderType].push(itemId);
                    rustplus.firstPollItems[orderType].push(itemId);
                    client.setInstance(interaction.guildId, instance);

                    const str = client.intlGet(interaction.guildId, 'justSubscribedToItem', {
                        name: itemName
                    });
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log(client.intlGet(interaction.guildId, 'infoCap'), str);
                }

                client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
                    id: `${verifyId}`,
                    value: `subscribe, ${subscribeItemName}, ${subscribeItemId}, ${orderType}`
                }));
            } break;

            case 'unsubscribe': {
                const subscribeItemName = interaction.options.getString('name');
                const subscribeItemId = interaction.options.getString('id');
                const orderType = interaction.options.getString('order');

                let itemId = null;
                if (subscribeItemName !== null) {
                    const item = client.items.getClosestItemIdByName(subscribeItemName)
                    if (item === null) {
                        const str = client.intlGet(interaction.guildId, 'noItemWithNameFound', {
                            name: subscribeItemName
                        });
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                        return;
                    }
                    else {
                        itemId = item;
                    }
                }
                else if (subscribeItemId !== null) {
                    if (client.items.itemExist(subscribeItemId)) {
                        itemId = subscribeItemId;
                    }
                    else {
                        const str = client.intlGet(interaction.guildId, 'noItemWithIdFound', {
                            id: subscribeItemId
                        });
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                        return;
                    }
                }
                else if (subscribeItemName === null && subscribeItemId === null) {
                    const str = client.intlGet(interaction.guildId, 'noNameIdGiven');
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                    return;
                }
                const itemName = client.items.getName(itemId);

                if (instance.marketSubscriptionList[orderType].includes(itemId)) {
                    instance.marketSubscriptionList[orderType] =
                        instance.marketSubscriptionList[orderType].filter(e => e !== itemId);
                    client.setInstance(interaction.guildId, instance);

                    const str = client.intlGet(interaction.guildId, 'removedSubscribeItem', {
                        name: itemName
                    });
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log(client.intlGet(interaction.guildId, 'infoCap'), str);
                }
                else {
                    const str = client.intlGet(interaction.guildId, 'notExistInSubscription', {
                        name: itemName
                    });
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                }

                client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
                    id: `${verifyId}`,
                    value: `subscribe, ${subscribeItemName}, ${subscribeItemId}, ${orderType}`
                }));
            } break;

            case 'list': {
                const names = { all: '', buy: '', sell: '' };
                for (const [orderType, itemIds] of Object.entries(instance.marketSubscriptionList)) {
                    for (const itemId of itemIds) {
                        names[orderType] += `\`${client.items.getName(itemId)} (${itemId})\`\n`;
                    }
                }

                client.log(client.intlGet(null, 'infoCap'), client.intlGet(null, 'slashCommandValueChange', {
                    id: `${verifyId}`,
                    value: `list`
                }));

                await client.interactionEditReply(interaction, {
                    embeds: [DiscordEmbeds.getEmbed({
                        color: Constants.COLOR_DEFAULT,
                        title: client.intlGet(interaction.guildId, 'subscriptionList'),
                        footer: { text: instance.serverList[rustplus.serverId].title },
                        fields: [
                            {
                                name: client.intlGet(interaction.guildId, 'all'),
                                value: names['all'] === '' ? '\u200B' : names['all'],
                                inline: true
                            },
                            {
                                name: client.intlGet(interaction.guildId, 'buy'),
                                value: names['buy'] === '' ? '\u200B' : names['buy'],
                                inline: true
                            },
                            {
                                name: client.intlGet(interaction.guildId, 'sell'),
                                value: names['sell'] === '' ? '\u200B' : names['sell'],
                                inline: true
                            }]
                    })],
                    ephemeral: true
                });

                rustplus.log(client.intlGet(interaction.guildId, 'infoCap'),
                    client.intlGet(interaction.guildId, 'showingSubscriptionList'));
            } break;

            default: {

            } break;
        }
    },
}