const Builder = require('@discordjs/builders');

const DiscordEmbeds = require('../discordTools/discordEmbeds.js');

module.exports = {
    data: new Builder.SlashCommandBuilder()
        .setName('market')
        .setDescription('Operations for In-Game Vending Machines.')
        .addSubcommand(subcommand => subcommand
            .setName('search')
            .setDescription('Search for an item in Vending Machines.')
            .addStringOption(option => option
                .setName('name')
                .setDescription('The name of the item to search for.')
                .setRequired(false))
            .addStringOption(option => option
                .setName('id')
                .setDescription('The ID of the item to search for.')
                .setRequired(false)))
        .addSubcommand(subcommand => subcommand
            .setName('subscribe')
            .setDescription('Subscribe to an item in Vending Machines.')
            .addStringOption(option => option
                .setName('name')
                .setDescription('The name of the item to subscribe to.')
                .setRequired(false))
            .addStringOption(option => option
                .setName('id')
                .setDescription('The ID of the item to subscribe to.')
                .setRequired(false)))
        .addSubcommand(subcommand => subcommand
            .setName('unsubscribe')
            .setDescription('Unsubscribe to an item in Vending Machines.')
            .addStringOption(option => option
                .setName('name')
                .setDescription('The name of the item to unsubscribe to.')
                .setRequired(false))
            .addStringOption(option => option
                .setName('id')
                .setDescription('The ID of the item to unsubscribe to.')
                .setRequired(false)))
        .addSubcommand(subcommand => subcommand
            .setName('list')
            .setDescription('Display the subscription list.')),

    async execute(client, interaction) {
        const instance = client.readInstanceFile(interaction.guildId);
        const rustplus = client.rustplusInstances[interaction.guildId];

        if (!await client.validatePermissions(interaction)) return;
        await interaction.deferReply({ ephemeral: true });

        if (!rustplus || (rustplus && !rustplus.isOperational)) {
            const str = 'Not currently connected to a rust server.';
            await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
            client.log('WARNING', str);
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
                        const str = `No item with name '${searchItemName}' could be found.`;
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log('WARNING', str);
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
                        const str = `No item with id '${searchItemId}' could be found.`;
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                }
                else if (searchItemName === null && searchItemId === null) {
                    const str = `No 'name' or 'id' was given.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    rustplus.log('WARNING', str);
                    return;
                }
                const itemName = client.items.getName(itemId);

                let full = false;
                let foundLines = '';
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

                        const orderItemName = (orderItemId !== null) ? client.items.getName(orderItemId) : 'Unknown';
                        const orderCurrencyName = (orderCurrencyId !== null) ?
                            client.items.getName(orderCurrencyId) : 'Unknown';

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
                            foundLines += `(${orderAmountInStock} left)\n`;

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
                    foundLines = `Item could not be found in any Vending Machines...`;
                }
                else {
                    foundLines += '```'
                }

                const embed = DiscordEmbeds.getEmbed({
                    color: '#ce412b',
                    title: `Search result for item: **${itemName}**`,
                    description: foundLines,
                    footer: { text: `${instance.serverList[rustplus.serverId].title}` }
                });

                await client.interactionEditReply(interaction, { embeds: [embed] });
                rustplus.log('INFO', `Showing the result for item: ${itemName}`);
            } break;

            case 'subscribe': {
                const subscribeItemName = interaction.options.getString('name');
                const subscribeItemId = interaction.options.getString('id');

                let itemId = null;
                if (subscribeItemName !== null) {
                    const item = client.items.getClosestItemIdByName(subscribeItemName)
                    if (item === undefined) {
                        const str = `No item with name '${subscribeItemName}' could be found.`;
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log('WARNING', str);
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
                        const str = `No item with id '${subscribeItemId}' could be found.`;
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                }
                else if (subscribeItemName === null && subscribeItemId === null) {
                    const str = `No 'name' or 'id' was given.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    rustplus.log('WARNING', str);
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
                    const str = `Already subscribed to item '${itemName}'.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                }
                else {
                    instance.marketSubscribeItemIds.push(itemId);
                    client.writeInstanceFile(interaction.guildId, instance);

                    const str = `Just subscribed to item '${itemName}'.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('INFO', str);
                }
            } break;

            case 'unsubscribe': {
                const subscribeItemName = interaction.options.getString('name');
                const subscribeItemId = interaction.options.getString('id');

                let itemId = null;
                if (subscribeItemName !== null) {
                    const item = client.items.getClosestItemIdByName(subscribeItemName)
                    if (item === undefined) {
                        const str = `No item with name '${subscribeItemName}' could be found.`;
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log('WARNING', str);
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
                        const str = `No item with id '${subscribeItemId}' could be found.`;
                        await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                }
                else if (subscribeItemName === null && subscribeItemId === null) {
                    const str = `No 'name' or 'id' was given.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str));
                    rustplus.log('WARNING', str);
                    return;
                }
                const itemName = client.items.getName(itemId);

                /* TODO: Remove item from object in rustplus */

                if (instance.marketSubscribeItemIds.includes(itemId)) {
                    instance.marketSubscribeItemIds = instance.marketSubscribeItemIds.filter(e => e !== itemId);
                    client.writeInstanceFile(interaction.guildId, instance);

                    const str = `Item '${itemName}' have been removed from subscription.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('INFO', str);
                }
                else {
                    const str = `Item '${itemName}' does not exist in subscription list.`;
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
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
                    const str = 'Item subscription list is empty.';
                    await client.interactionEditReply(interaction, DiscordEmbeds.getActionInfoEmbed(1, str,
                        instance.serverList[rustplus.serverId].title));
                }
                else {
                    await client.interactionEditReply(interaction, {
                        embeds: [DiscordEmbeds.getEmbed({
                            color: '#ce412b',
                            title: 'Subscription list',
                            footer: { text: instance.serverList[rustplus.serverId].title },
                            fields: [
                                { name: 'Name', value: names, inline: true },
                                { name: 'ID', value: ids, inline: true }]
                        })],
                        ephemeral: true
                    });
                }

                rustplus.log('INFO', 'Showing the subscription list.');
            } break;

            default: {

            } break;
        }
    },
}