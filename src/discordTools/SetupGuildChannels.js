const DiscordTools = require('../discordTools/discordTools.js');
const { Permissions } = require('discord.js');

module.exports = async (client, guild, category) => {
    await addTextChannel('information', client, guild, category);
    await addTextChannel('servers', client, guild, category);
    await addTextChannel('settings', client, guild, category);
    await addTextChannel('events', client, guild, category);
    await addTextChannel('teamchat', client, guild, category, true);
    await addTextChannel('switches', client, guild, category);
    await addTextChannel('alarms', client, guild, category);
    await addTextChannel('storageMonitors', client, guild, category);
    await addTextChannel('activity', client, guild, category);
    await addTextChannel('trackers', client, guild, category);
};

async function addTextChannel(name, client, guild, parent, permissionWrite = false) {
    let instance = client.readInstanceFile(guild.id);

    let channel = undefined;
    if (instance.channelId[name] !== null) {
        channel = DiscordTools.getTextChannelById(guild.id, instance.channelId[name]);
    }
    if (channel === undefined) {
        channel = await DiscordTools.addTextChannel(guild.id, name);
        instance.channelId[name] = channel.id;
        client.writeInstanceFile(guild.id, instance);

        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            client.log('ERROR', `Could not set parent for channel: ${channel.id}`, 'error');
        }
    }

    if (instance.firstTime) {
        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            client.log('ERROR', `Could not set parent for channel: ${channel.id}`, 'error');
        }
    }

    let perms = [];
    let everyoneAllow = [];
    let everyoneDeny = [];
    let roleAllow = [];
    let roleDeny = [];
    if (instance.role !== null) {
        if (permissionWrite) {
            roleAllow.push(Permissions.FLAGS.SEND_MESSAGES);
        }
        else {
            roleDeny.push(Permissions.FLAGS.SEND_MESSAGES);
        }

        everyoneDeny.push(Permissions.FLAGS.VIEW_CHANNEL);
        everyoneDeny.push(Permissions.FLAGS.SEND_MESSAGES);
        roleAllow.push(Permissions.FLAGS.VIEW_CHANNEL);

        perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
        perms.push({ id: instance.role, allow: roleAllow, deny: roleDeny });
    }
    else {
        if (permissionWrite) {
            everyoneAllow.push(Permissions.FLAGS.SEND_MESSAGES);
        }
        else {
            everyoneDeny.push(Permissions.FLAGS.SEND_MESSAGES);
        }

        everyoneAllow.push(Permissions.FLAGS.VIEW_CHANNEL);

        perms.push({ id: guild.roles.everyone.id, allow: everyoneAllow, deny: everyoneDeny });
    }

    try {
        channel.permissionOverwrites.set(perms);
    }
    catch (e) {
        /* Ignore */
    }
}