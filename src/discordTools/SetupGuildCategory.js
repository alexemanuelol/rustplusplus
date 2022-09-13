const Discord = require('discord.js');

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, guild) => {
    const instance = client.readInstanceFile(guild.id);

    let category = undefined;
    if (instance.channelId.category !== null) {
        category = DiscordTools.getCategoryById(guild.id, instance.channelId.category);
    }
    if (category === undefined) {
        category = await DiscordTools.addCategory(guild.id, 'rustPlusPlus');
        instance.channelId.category = category.id;
        client.writeInstanceFile(guild.id, instance);
    }

    const perms = [];
    const everyoneAllow = [];
    const everyoneDeny = [];
    const roleAllow = [];
    const roleDeny = [];
    if (instance.role !== null) {
        everyoneDeny.push(Discord.PermissionFlagsBits.ViewChannel);
        everyoneDeny.push(Discord.PermissionFlagsBits.SendMessages);
        roleAllow.push(Discord.PermissionFlagsBits.ViewChannel);
        roleDeny.push(Discord.PermissionFlagsBits.SendMessages);

        perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
        perms.push({ id: instance.role, allow: roleAllow, deny: roleDeny });
    }
    else {
        everyoneAllow.push(Discord.PermissionFlagsBits.ViewChannel);
        everyoneDeny.push(Discord.PermissionFlagsBits.SendMessages);

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