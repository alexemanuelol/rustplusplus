const Discord = require('discord.js');

const DiscordTools = require('../discordTools/discordTools.js');

module.exports = async (client, guild, category) => {
    await addTextChannel('information', client, guild, category);
    await addTextChannel('servers', client, guild, category);
    await addTextChannel('settings', client, guild, category);
    await addTextChannel('commands', client, guild, category, true);
    await addTextChannel('events', client, guild, category);
    await addTextChannel('teamchat', client, guild, category, true);
    await addTextChannel('switches', client, guild, category);
    await addTextChannel('alarms', client, guild, category);
    await addTextChannel('storageMonitors', client, guild, category);
    await addTextChannel('activity', client, guild, category);
    await addTextChannel('trackers', client, guild, category);
};

async function addTextChannel(name, client, guild, parent, permissionWrite = false) {
    const instance = client.getInstance(guild.id);

    let channel = undefined;
    if (instance.channelId[name] !== null) {
        channel = DiscordTools.getTextChannelById(guild.id, instance.channelId[name]);
    }
    if (channel === undefined) {
        channel = await DiscordTools.addTextChannel(guild.id, name);
        instance.channelId[name] = channel.id;
        client.setInstance(guild.id, instance);

        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            client.log(client.intlGet(null, 'errorCap'),
                client.intlGet(null, 'couldNotSetParent', { channelId: channel.id }), 'error');
        }
    }

    if (instance.firstTime) {
        try {
            channel.setParent(parent.id);
        }
        catch (e) {
            client.log(client.intlGet(null, 'errorCap'),
                client.intlGet(null, 'couldNotSetParent', { channelId: channel.id }), 'error');
        }
    }

    const perms = [];
    const everyoneAllow = [];
    const everyoneDeny = [];
    const roleAllow = [];
    const roleDeny = [];
    if (instance.role !== null) {
        if (permissionWrite) {
            roleAllow.push(Discord.PermissionFlagsBits.SendMessages);
        }
        else {
            roleDeny.push(Discord.PermissionFlagsBits.SendMessages);
        }

        everyoneDeny.push(Discord.PermissionFlagsBits.ViewChannel);
        everyoneDeny.push(Discord.PermissionFlagsBits.SendMessages);
        roleAllow.push(Discord.PermissionFlagsBits.ViewChannel);

        perms.push({ id: guild.roles.everyone.id, deny: everyoneDeny });
        perms.push({ id: instance.role, allow: roleAllow, deny: roleDeny });
    }
    else {
        if (permissionWrite) {
            everyoneAllow.push(Discord.PermissionFlagsBits.SendMessages);
        }
        else {
            everyoneDeny.push(Discord.PermissionFlagsBits.SendMessages);
        }

        everyoneAllow.push(Discord.PermissionFlagsBits.ViewChannel);

        perms.push({ id: guild.roles.everyone.id, allow: everyoneAllow, deny: everyoneDeny });
    }

    try {
        channel.permissionOverwrites.set(perms);
    }
    catch (e) {
        /* Ignore */
    }
}