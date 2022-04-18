module.exports = {
    commands: [
        'afk',
        'alive',
        'bradley',
        'cargo',
        'chinook',
        'crate',
        'heli',
        'large',
        'leader',
        'marker',
        'mute',
        'offline',
        'online',
        'pop',
        'small',
        'time',
        'timer',
        'unmute',
        'wipe'
    ],

    getListOfUsedKeywords(client, guildId, serverId = null) {
        let instance = client.readInstanceFile(guildId);
        let list = [];
        list = [...module.exports.commands];

        for (const [id, value] of Object.entries(instance.switches)) {
            if (serverId === null) {
                list.push(value.command);
            }
            else {
                if (value.serverId === serverId) {
                    list.push(value.command);
                }
            }
        }

        if (serverId) {
            for (const [id, value] of Object.entries(instance.serverList[serverId].switchGroups)) {
                list.push(value.command);
            }
        }

        return list;
    }
}