module.exports = {
    name: 'guildCreate',
    async execute(client, guild) {
        console.log("HELLO");
        require("../utils/RegisterSlashCommands")(guild.id);
    },
}