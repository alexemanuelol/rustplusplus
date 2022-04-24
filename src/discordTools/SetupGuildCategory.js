const DiscordTools = require('../discordTools/discordTools.js');
const { Permissions } = require('discord.js');

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
        everyoneDeny.push(Permissions.FLAGS.VIEW_CHANNEL);
        everyoneDeny.push(Permissions.FLAGS.SEND_MESSAGES);
        roleAllow.push(Permissions.FLAGS.VIEW_CHANNEL);
        roleDeny.push(Permissions.FLAGS.SEND_MESSAGES);

        perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
        perms.push({ id: instance.role, allow: roleAllow, deny: roleDeny });
    }
    else {
        everyoneAllow.push(Permissions.FLAGS.VIEW_CHANNEL);
        everyoneDeny.push(Permissions.FLAGS.SEND_MESSAGES);

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