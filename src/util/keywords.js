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

    getListOfUsedKeywords(client, guildId) {
        let instance = client.readInstanceFile(guildId);
        let list = [];
        list = [...module.exports.commands];

        for (const [id, value] of Object.entries(instance.switches)) {
            list.push(value.command);
        }

        return list;
    }
}