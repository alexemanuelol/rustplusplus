const Client = require('../../index.ts');

module.exports = {
    gridDiameter: 146.25,

    getPos: function (x, y, mapSize, rustplus) {
        const correctedMapSize = module.exports.getCorrectedMapSize(mapSize);
        const pos = { location: null, monument: null, string: null }

        if (module.exports.isOutsideGridSystem(x, y, correctedMapSize)) {
            if (module.exports.isOutsideRowOrColumn(x, y, correctedMapSize)) {
                if (x < 0 && y > correctedMapSize) {
                    pos.location = Client.client.intlGet(rustplus.guildId, 'northWest');
                }
                else if (x < 0 && y < 0) {
                    pos.location = Client.client.intlGet(rustplus.guildId, 'southWest');
                }
                else if (x > correctedMapSize && y > correctedMapSize) {
                    pos.location = Client.client.intlGet(rustplus.guildId, 'northEast');
                }
                else {
                    pos.location = Client.client.intlGet(rustplus.guildId, 'southEast');
                }
            }
            else {
                let str = '';
                if (x < 0 || x > correctedMapSize) {
                    str += (x < 0) ? Client.client.intlGet(rustplus.guildId, 'westOfGrid') :
                        Client.client.intlGet(rustplus.guildId, 'eastOfGrid');
                    str += ` ${module.exports.getGridPosNumberY(y, correctedMapSize)}`;
                }
                else {
                    str += (y < 0) ? Client.client.intlGet(rustplus.guildId, 'southOfGrid') :
                        Client.client.intlGet(rustplus.guildId, 'northOfGrid');
                    str += ` ${module.exports.getGridPosLettersX(x, correctedMapSize)}`;
                }
                pos.location = str;
            }
        }
        else {
            pos.location = module.exports.getGridPos(x, y, mapSize);
        }

        for (const monument of rustplus.map.monuments) {
            if (monument.token === 'DungeonBase' || !(monument.token in rustplus.map.monumentInfo)) continue;
            if (module.exports.getDistance(x, y, monument.x, monument.y) <=
                rustplus.map.monumentInfo[monument.token].radius) {
                pos.monument = rustplus.map.monumentInfo[monument.token].clean;
                break;
            }
        }

        pos.string = `${pos.location}${pos.monument !== null ? ` (${pos.monument})` : ''}`;

        return pos;
    },

    getGridPos: function (x, y, mapSize) {
        const correctedMapSize = module.exports.getCorrectedMapSize(mapSize);

        /* Outside the grid system */
        if (module.exports.isOutsideGridSystem(x, y, correctedMapSize)) {
            return null;
        }

        const gridPosLetters = module.exports.getGridPosLettersX(x, correctedMapSize);
        const gridPosNumber = module.exports.getGridPosNumberY(y, correctedMapSize);

        return gridPosLetters + gridPosNumber;
    },

    getGridPosLettersX: function (x, mapSize) {
        let counter = 1;
        for (let startGrid = 0; startGrid < mapSize; startGrid += module.exports.gridDiameter) {
            if (x >= startGrid && x <= (startGrid + module.exports.gridDiameter)) {
                /* We're at the correct grid! */
                return module.exports.numberToLetters(counter);
            }
            counter++;
        }
    },

    getGridPosNumberY: function (y, mapSize) {
        let counter = 1;
        const numberOfGrids = Math.floor(mapSize / module.exports.gridDiameter);
        for (let startGrid = 0; startGrid < mapSize; startGrid += module.exports.gridDiameter) {
            if (y >= startGrid && y <= (startGrid + module.exports.gridDiameter)) {
                /* We're at the correct grid! */
                return numberOfGrids - counter;
            }
            counter++;
        }
    },

    numberToLetters: function (num) {
        const mod = num % 26;
        let pow = num / 26 | 0;
        const out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
        return pow ? module.exports.numberToLetters(pow) + out : out;
    },

    getCorrectedMapSize: function (mapSize) {
        const remainder = mapSize % module.exports.gridDiameter;
        const offset = module.exports.gridDiameter - remainder;
        return (remainder < 120) ? mapSize - remainder : mapSize + offset;
    },

    getAngleBetweenPoints: function (x1, y1, x2, y2) {
        let angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        if (angle < 0) {
            angle = 360 + angle;
        }

        return Math.floor((Math.abs(angle - 360) + 90) % 360);
    },

    getDistance: function (x1, y1, x2, y2) {
        /* Pythagoras is the man! */
        const a = x1 - x2;
        const b = y1 - y2;
        return Math.sqrt(a * a + b * b);
    },

    isOutsideGridSystem: function (x, y, mapSize, offset = 0) {
        if (x < -offset || x > (mapSize + offset) || y < -offset || y > (mapSize + offset)) {
            return true;
        }
        return false;
    },

    isOutsideRowOrColumn: function (x, y, mapSize) {
        if ((x < 0 && y > mapSize) || (x < 0 && y < 0) || (x > mapSize && y > mapSize) || (x > mapSize && y < 0)) {
            return true;
        }
        return false;
    },
}