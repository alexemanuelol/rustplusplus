const DiscordTools = require('../discordTools/discordTools');
const { MessageEmbed } = require('discord.js');


export const validatePermissions = (client, interaction, instanceConfig = None) => {
    /* Use provided config, or read it in from the interaction */
    const instance = instanceConfig ?? client.readInstanceFile(interaction.guildId);

    /* If we don't have a role setup yet, lets just validate true */
    if (instance.role === null) {
        return true;
    }
    
    if (!interaction.member.permissions.has('ADMINISTRATOR') &&
        !interaction.member.roles.cache.has(instance.role)) {
        let role = DiscordTools.getRole(interaction.guildId, instance.role);
        let str = `You are not part of the '${role.name}' role, therefore you can't run bot commands.`;
        await client.interactionReply(interaction, {
            embeds: [new MessageEmbed()
                .setColor('#ff0040')
                .setDescription(`\`\`\`diff\n- ${str}\n\`\`\``)],
            ephemeral: true
        });
        client.log('WARNING', str);
        return false;
    }
    return true;
};
