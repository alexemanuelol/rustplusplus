module.exports = {
    gridDiameter: 146.25,

    getPos: function (x, y, mapSize, showMonument = true, rustplus = null) {
        let correctedMapSize = module.exports.getCorrectedMapSize(mapSize);
        let pos = null;

        let isOutside = false;
        if (module.exports.isOutsideGridSystem(x, y, correctedMapSize)) {
            isOutside = true;
            if (module.exports.isOutsideRowOrColumn(x, y, correctedMapSize)) {
                if (x < 0 && y > correctedMapSize) {
                    pos = 'North West';
                }
                else if (x < 0 && y < 0) {
                    pos = 'South West';
                }
                else if (x > correctedMapSize && y > correctedMapSize) {
                    pos = 'North East';
                }
                else {
                    pos = 'South East';
                }
            }
            else {
                let str = '';
                if (x < 0 || x > correctedMapSize) {
                    str += (x < 0) ? 'West of grid ' : 'East of grid ';
                    str += `${module.exports.getGridPosNumberY(y, correctedMapSize)}`;
                }
                else {
                    str += (y < 0) ? 'South of grid ' : 'North of grid ';
                    str += `${module.exports.getGridPosLettersX(x, correctedMapSize)}`;
                }
                pos = str;
            }
        }
        else {
            pos = module.exports.getGridPos(x, y, mapSize);
        }

        if (showMonument) {
            if (rustplus === null || (rustplus && !rustplus.ready)) return pos;

            let monumentObj = null;
            for (let monument of rustplus.map.monuments) {
                if (monument.token === 'DungeonBase') continue;
                if (module.exports.getDistance(x, y, monument.x, monument.y) <=
                    rustplus.map.monumentInfo[monument.token].radius) {
                    monumentObj = rustplus.map.monumentInfo[monument.token];
                    break;
                }
            }

            if (monumentObj !== null && isOutside) {
                return `${monumentObj.clean}`;
            }
            else if (monumentObj !== null) {
                return `${pos} (${monumentObj.clean})`;
            }
            else {
                return pos;
            }
        }

        return pos;
    },

    getGridPos: function (x, y, mapSize) {
        let correctedMapSize = module.exports.getCorrectedMapSize(mapSize);

        /* Outside the grid system */
        if (module.exports.isOutsideGridSystem(x, y, correctedMapSize)) {
            return null;
        }

        const gridPosLetters = module.exports.getGridPosLettersX(x, correctedMapSize);
        const gridPosNumber = module.exports.getGridPosNumberY(y, correctedMapSize);

        return gridPosLetters + gridPosNumber;
    },

    getGridPosLettersX: function (x, mapSize) {
        let num = 1;
        for (let startGrid = 0; startGrid < mapSize; startGrid += module.exports.gridDiameter) {
            if (x >= startGrid && x <= (startGrid + module.exports.gridDiameter)) {
                /* We're at the correct grid! */
                return module.exports.numberToLetters(num);
            }
            num++;
        }
    },

    getGridPosNumberY: function (y, mapSize) {
        let counter = 1;
        let numberOfGrids = Math.floor(mapSize / module.exports.gridDiameter);
        for (let startGrid = 0; startGrid < mapSize; startGrid += module.exports.gridDiameter) {
            if (y >= startGrid && y <= (startGrid + module.exports.gridDiameter)) {
                /* We're at the correct grid! */
                return numberOfGrids - counter;
            }
            counter++;
        }
    },

    numberToLetters: function (num) {
        let mod = num % 26;
        let pow = num / 26 | 0;
        var out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
        return pow ? module.exports.numberToLetters(pow) + out : out;
    },

    getCorrectedMapSize: function (mapSize) {
        let remainder = mapSize % module.exports.gridDiameter;
        let offset = module.exports.gridDiameter - remainder;
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
        if (x < -offset || x > (mapSize + offset) ||
            y < -offset || y > (mapSize + offset)) {
            return true;
        }
        return false;
    },

    isOutsideRowOrColumn: function (x, y, mapSize) {
        if ((x < 0 && y > mapSize) || (x < 0 && y < 0) ||
            (x > mapSize && y > mapSize) || (x > mapSize && y < 0)) {
            return true;
        }
        return false;
    },
}