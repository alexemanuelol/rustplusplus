const Builder = require('@discordjs/builders');
const Discord = require('discord.js');

module.exports = {
    data: new Builder.SlashCommandBuilder()
        .setName('market')
        .setDescription('Operations for In-Game Vending Machines.')
        .addSubcommand(subcommand =>
            subcommand.setName('search')
                .setDescription('Search for an item in Vending Machines.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the item to search for.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the item to search for.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('subscribe')
                .setDescription('Subscribe to an item in Vending Machines.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the item to subscribe to.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the item to subscribe to.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('unsubscribe')
                .setDescription('Unsubscribe to an item in Vending Machines.')
                .addStringOption(option =>
                    option.setName('name')
                        .setDescription('The name of the item to unsubscribe to.')
                        .setRequired(false))
                .addStringOption(option =>
                    option.setName('id')
                        .setDescription('The ID of the item to unsubscribe to.')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand.setName('list')
                .setDescription('Display the subscription list.')),

    async execute(client, interaction) {
        let instance = client.readInstanceFile(interaction.guildId);

        if (!await client.validatePermissions(interaction)) return;

        await interaction.deferReply({ ephemeral: true });

        let rustplus = client.rustplusInstances[interaction.guildId];
        if (!rustplus || (rustplus && !rustplus.ready)) {
            let str = 'Not currently connected to a rust server.';
            await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
            client.log('WARNING', str);
            return;
        }

        switch (interaction.options.getSubcommand()) {
            case 'search': {
                let searchItemName = interaction.options.getString('name');
                let searchItemId = interaction.options.getString('id');

                let itemId = null;
                if (searchItemName !== null) {
                    let item = rustplus.items.getClosestItemIdByName(searchItemName)
                    if (item === undefined) {
                        let str = `No item with name '${searchItemName}' could be found.`;
                        await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                    else {
                        itemId = item;
                    }
                }
                else if (searchItemId !== null) {
                    if (rustplus.items.itemExist(searchItemId)) {
                        itemId = searchItemId;
                    }
                    else {
                        let str = `No item with id '${searchItemId}' could be found.`;
                        await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                }
                else if (searchItemName === null && searchItemId === null) {
                    let str = `No 'name' or 'id' was given.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                    rustplus.log('WARNING', str);
                    return;
                }
                let itemName = rustplus.items.getName(itemId);

                let full = false;
                let foundLines = '';
                for (let vendingMachine of rustplus.mapMarkers.vendingMachines) {
                    if (full) break;
                    if (!vendingMachine.hasOwnProperty('sellOrders')) continue;

                    for (let order of vendingMachine.sellOrders) {
                        if (order.amountInStock === 0) continue;

                        let orderItemId = (Object.keys(rustplus.items.items).includes(order.itemId.toString())) ?
                            order.itemId : null;
                        let orderQuantity = order.quantity;
                        let orderCurrencyId = (Object.keys(rustplus.items.items).includes(order.currencyId.toString())) ?
                            order.currencyId : null;
                        let orderCostPerItem = order.costPerItem;
                        let orderAmountInStock = order.amountInStock;
                        let orderItemIsBlueprint = order.itemIsBlueprint;
                        let orderCurrencyIsBlueprint = order.currencyIsBlueprint;

                        let orderItemName = (orderItemId !== null) ? rustplus.items.getName(orderItemId) : 'Unknown';
                        let orderCurrencyName = (orderCurrencyId !== null) ?
                            rustplus.items.getName(orderCurrencyId) : 'Unknown';

                        let prevFoundLines = foundLines;
                        if (orderItemId === parseInt(itemId) || orderCurrencyId === parseInt(itemId)) {
                            if (foundLines === '') {
                                foundLines += '```diff\n';
                            }

                            foundLines += `+ [${vendingMachine.location}] `;
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

                let embed = new Discord.EmbedBuilder()
                    .setColor('#ce412b')
                    .setTitle(`Search result for item: **${itemName}**`)
                    .setDescription(foundLines)
                    .setFooter({ text: `${instance.serverList[rustplus.serverId].title}` });

                await client.interactionEditReply(interaction, { embeds: [embed] });
                rustplus.log('INFO', `Showing the result for item: ${itemName}`);
            } break;

            case 'subscribe': {
                let subscribeItemName = interaction.options.getString('name');
                let subscribeItemId = interaction.options.getString('id');

                let itemId = null;
                if (subscribeItemName !== null) {
                    let item = rustplus.items.getClosestItemIdByName(subscribeItemName)
                    if (item === undefined) {
                        let str = `No item with name '${subscribeItemName}' could be found.`;
                        await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                    else {
                        itemId = item;
                    }
                }
                else if (subscribeItemId !== null) {
                    if (rustplus.items.itemExist(subscribeItemId)) {
                        itemId = subscribeItemId;
                    }
                    else {
                        let str = `No item with id '${subscribeItemId}' could be found.`;
                        await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                }
                else if (subscribeItemName === null && subscribeItemId === null) {
                    let str = `No 'name' or 'id' was given.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                    rustplus.log('WARNING', str);
                    return;
                }
                let itemName = rustplus.items.getName(itemId);

                /* TODO: Set a variable in rustplus to indicate first loop
                   Which means that we should NOT notify all found items at first loop,
                   Only found items AFTER the first loop.
                   Also, Create an object in rustplus with itemId as key, content should
                   be an array of all found items in vending machines. If an item is removed
                   from the vending machine, remove it from the object. */

                if (instance.marketSubscribeItemIds.includes(itemId)) {
                    let str = `Already subscribed to item '${itemName}'.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                }
                else {
                    instance.marketSubscribeItemIds.push(itemId);
                    client.writeInstanceFile(interaction.guildId, instance);

                    let str = `Just subscribed to item '${itemName}'.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('INFO', str);
                }
            } break;

            case 'unsubscribe': {
                let subscribeItemName = interaction.options.getString('name');
                let subscribeItemId = interaction.options.getString('id');

                let itemId = null;
                if (subscribeItemName !== null) {
                    let item = rustplus.items.getClosestItemIdByName(subscribeItemName)
                    if (item === undefined) {
                        let str = `No item with name '${subscribeItemName}' could be found.`;
                        await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                    else {
                        itemId = item;
                    }
                }
                else if (subscribeItemId !== null) {
                    if (rustplus.items.itemExist(subscribeItemId)) {
                        itemId = subscribeItemId;
                    }
                    else {
                        let str = `No item with id '${subscribeItemId}' could be found.`;
                        await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                        rustplus.log('WARNING', str);
                        return;
                    }
                }
                else if (subscribeItemName === null && subscribeItemId === null) {
                    let str = `No 'name' or 'id' was given.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str));
                    rustplus.log('WARNING', str);
                    return;
                }
                let itemName = rustplus.items.getName(itemId);

                /* TODO: Remove item from object in rustplus */

                if (instance.marketSubscribeItemIds.includes(itemId)) {
                    instance.marketSubscribeItemIds = instance.marketSubscribeItemIds.filter(e => e !== itemId);
                    client.writeInstanceFile(interaction.guildId, instance);

                    let str = `Item '${itemName}' have been removed from subscription.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(0, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('INFO', str);
                }
                else {
                    let str = `Item '${itemName}' does not exist in subscription list.`;
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
                        instance.serverList[rustplus.serverId].title));
                    rustplus.log('WARNING', str);
                }
            } break;

            case 'list': {
                let names = '';
                let ids = '';
                for (let item of instance.marketSubscribeItemIds) {
                    names += `\`${rustplus.items.getName(item)}\`\n`;
                    ids += `\`${item}\`\n`;
                }

                if (names === '' || ids === '') {
                    let str = 'Item subscription list is empty.';
                    await client.interactionEditReply(interaction, client.getEmbedActionInfo(1, str,
                        instance.serverList[rustplus.serverId].title));
                }
                else {
                    await client.interactionEditReply(interaction, {
                        embeds: [new Discord.EmbedBuilder()
                            .setColor('#ce412b')
                            .setTitle('Subscription list')
                            .addFields(
                                { name: 'Name', value: names, inline: true },
                                { name: 'ID', value: ids, inline: true })
                            .setFooter({ text: instance.serverList[rustplus.serverId].title })],
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