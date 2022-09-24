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
        'note',
        'notes',
        'offline',
        'online',
        'player',
        'players',
        'pop',
        'prox',
        'small',
        'time',
        'timer',
        'tr',
        'trf',
        'tts',
        'unmute',
        'upkeep',
        'wipe'
    ],

    getListOfUsedKeywords: function (client, guildId, serverId) {
        const instance = client.getInstance(guildId);

        let list = [];
        list = [...module.exports.commands];
        for (const [id, value] of Object.entries(instance.serverList[serverId].switches)) {
            list.push(value.command);
        }

        for (const [id, value] of Object.entries(instance.serverList[serverId].switchGroups)) {
            list.push(value.command);
        }

        return list;
    }
}