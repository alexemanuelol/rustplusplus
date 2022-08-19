const DiscordTools = require('../discordTools/discordTools.js');
const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, guild) => {
    let instance = client.readInstanceFile(guild.id);

    let category = undefined;
    if (instance.channelId.category !== null) {
        category = DiscordTools.getCategoryById(guild.id, instance.channelId.category);
    }
    if (category === undefined) {
        category = await DiscordTools.addCategory(guild.id, 'rustPlusPlus');
        instance.channelId.category = category.id;
        client.writeInstanceFile(guild.id, instance);
    }

    let perms = [];
    let everyoneAllow = [];
    let everyoneDeny = [];
    let roleAllow = [];
    let roleDeny = [];
    if (instance.role !== null) {
        everyoneDeny.push(PermissionFlagsBits.ViewChannel);
        everyoneDeny.push(PermissionFlagsBits.SendMessages);
        roleAllow.push(PermissionFlagsBits.ViewChannel);
        roleDeny.push(PermissionFlagsBits.SendMessages);

        perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
        perms.push({ id: instance.role, allow: roleAllow, deny: roleDeny });
    }
    else {
        everyoneAllow.push(PermissionFlagsBits.ViewChannel);
        everyoneDeny.push(PermissionFlagsBits.SendMessages);

        perms.push({ id: guild.roles.everyone.id, allow: everyoneAllow, deny: everyoneDeny });
    }

    try {
        category.permissionOverwrites.set(perms);
    }
    catch (e) {
        /* Ignore */
    }

    return category;
};