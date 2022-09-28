const Builder = require('@discordjs/builders');

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
                    .setName('name')
                    .setDescription(client.intlGet(guildId, 'commandsMarketSearchNameDesc'))
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('id')
                    .setDescription(client.intlGet(guildId, 'commandsMarketSearchIdDesc'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('subscribe')
                .setDescription(client.intlGet(guildId, 'commandsMarketSubscribeDesc'))
                .addStringOption(option => option
                    .setName('name')
                    .setDescription(client.intlGet(guildId, 'commandsMarketSubscribeNameDesc'))
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('id')
                    .setDescription(client.intlGet(guildId, 'commandsMarketSubscribeIdDesc'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('unsubscribe')
                .setDescription(client.intlGet(guildId, 'commandsMarketUnsubscribeDesc'))
                .addStringOption(option => option
                    .setName('name')
                    .setDescription(client.intlGet(guildId, 'commandsMarketUnsubscribeNameDesc'))
                    .setRequired(false))
                .addStringOption(option => option
                    .setName('id')
                    .setDescription(client.intlGet(guildId, 'commandsMarketUnsubscribeIdDesc'))
                    .setRequired(false)))
            .addSubcommand(subcommand => subcommand
                .setName('list')
                .setDescription(client.intlGet(guildId, 'commandsMarketListDesc')));
    },

    async execute(client, interaction) {
        const instance = client.getInstance(interaction.guildId);
        const rustplus = client.rustplusInstances[interaction.guildId];

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

                let itemId = null;
                if (searchItemName !== null) {
                    const item = client.items.getClosestItemIdByName(searchItemName)
                    if (item === undefined) {
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
                        if (orderItemId === parseInt(itemId) || orderCurrencyId === parseInt(itemId)) {
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

                const embed = DiscordEmbeds.getEmbed({
                    color: '#ce412b',
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

                let itemId = null;
                if (subscribeItemName !== null) {
                    const item = client.items.getClosestItemIdByName(subscribeItemName)
                    if (item === undefined) {
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

                /* TODO: Set a variable in rustplus to indicate first loop
                   Which means that we should NOT notify all found items at first loop,
                   Only found items AFTER the first loop.
                   Also, Create an object in rustplus with itemId as key, content should
                   be an array of all found items in vending machines. If an item is removed
                   from the vending machine, remove it from the object. */

                if (instance.marketSubscribeItemIds.includes(itemId)) {
                    const str = client.intlGet(interaction.guildId, 'alreadySubscribedToItem', {
                        name: itemName
                    });
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log(client.intlGet(interaction.guildId, 'warningCap'), str);
                }
                else {
                    instance.marketSubscribeItemIds.push(itemId);
                    client.setInstance(interaction.guildId, instance);

                    const str = client.intlGet(interaction.guildId, 'justSubscribedToItem', {
                        name: itemName
                    });
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log(client.intlGet(interaction.guildId, 'infoCap'), str);
                }
            } break;

            case 'unsubscribe': {
                const subscribeItemName = interaction.options.getString('name');
                const subscribeItemId = interaction.options.getString('id');

                let itemId = null;
                if (subscribeItemName !== null) {
                    const item = client.items.getClosestItemIdByName(subscribeItemName)
                    if (item === undefined) {
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

                /* TODO: Remove item from object in rustplus */

                if (instance.marketSubscribeItemIds.includes(itemId)) {
                    instance.marketSubscribeItemIds = instance.marketSubscribeItemIds.filter(e => e !== itemId);
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
            } break;

            case 'list': {
                let names = '';
                let ids = '';
                for (let item of instance.marketSubscribeItemIds) {
                    names += `\`${client.items.getName(item)}\`\n`;
                    ids += `\`${item}\`\n`;
                }

                if (names === '' || ids === '') {
                    const str = client.intlGet(interaction.guildId, 'subscriptionListEmpty');
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                }
                else {
                    await client.interactionEditReply(interaction, {
                        embeds: [DiscordEmbeds.getEmbed({
                            color: '#ce412b',
                            title: client.intlGet(interaction.guildId, 'subscriptionList'),
                            footer: { text: instance.serverList[rustplus.serverId].title },
                            fields: [
                                { name: client.intlGet(interaction.guildId, 'name'), value: names, inline: true },
                                { name: 'ID', value: ids, inline: true }]
                        })],
                        ephemeral: true
                    });
                }

                rustplus.log(client.intlGet(interaction.guildId, 'infoCap'),
                    client.intlGet(interaction.guildId, 'showingSubscriptionList'));
            } break;

            default: {

            } break;
        }
    },
}