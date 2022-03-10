const DiscordTools = require('../discordTools/discordTools.js');
const { Permissions } = require('discord.js');

module.exports = async (client, guild, category) => {
    await addTextChannel('information', client, guild, category);
    await addTextChannel('servers', client, guild, category);
    await addTextChannel('settings', client, guild, category);
    await addTextChannel('events', client, guild, category);
    await addTextChannel('teamchat', client, guild, category, true);
    await addTextChannel('switches', client, guild, category);
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
        channel.setParent(parent.id);
    }

    if (instance.firstTime) {
        channel.setParent(parent.id);
    }

    if (permissionWrite && instance.firstTime) {
        channel.permissionOverwrites.set([
            {
                id: channel.guild.roles.everyone.id,
                allow: [Permissions.FLAGS.SEND_MESSAGES]
            }
        ]);
    }
}