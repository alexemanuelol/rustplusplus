const DiscordTools = require('../discordTools/discordTools.js');

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
        return category;
    }
    else {
        return category;
    }
};