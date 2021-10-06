module.exports = {
    inGameEventHandler: function (discord, rustplus) {
        console.log('Pull information: server info, map markers, team info and time.');

        rustplus.getInfo((info) => {
            rustplus.getMapMarkers((mapMarkers) => {
                rustplus.getTeamInfo((teamInfo) => {
                    rustplus.getTime((time) => {
                        module.exports.checkEvents(discord, rustplus, info, mapMarkers, teamInfo, time);
                    });
                });
            });
        });
    },

    checkEvents: function (discord, rustplus, info, mapMarkers, teamInfo, time) {
        console.log('Check in-game events.');

        // TODO
        // Chinook 47
        // Explosion
        // Cargo Ship
        // Small Oil Rig
        // Large Oil Rig
        // Vending Machine

    },
};