module.exports = {
    getGridPosString: function (x, y, mapSize, gridDiameter = 146.25) {
        let correctedMapSize = mapSize + (gridDiameter - (mapSize % gridDiameter));

        /* Outside the grid system */
        if (x < 0 || x > correctedMapSize || y < 0 || y > (mapSize - (mapSize % gridDiameter))) {
            return null;
        }

        const gridPosLetters = module.exports.getGridPosLettersX(x, mapSize, gridDiameter);
        const gridPosNumber = module.exports.getGridPosNumberY(y, mapSize, gridDiameter);

        return gridPosLetters + gridPosNumber;
    },

    getGridPosLettersX: function (x, mapSize, gridDiameter) {
        let correctedMapSize = mapSize + (gridDiameter - (mapSize % gridDiameter));
        let num = 1;
        for (let startGrid = 0; startGrid < correctedMapSize; startGrid += gridDiameter) {
            if (x >= startGrid && x <= (startGrid + gridDiameter)) {
                /* We're at the correct grid! */
                return module.exports.toLetters(num);
            }
            num++;
        }
    },

    getGridPosNumberY: function (y, mapSize, gridDiameter) {
        let counter = 1;
        let numberOfGrids = Math.floor(mapSize / gridDiameter);
        for (let startGrid = 0; startGrid < mapSize; startGrid += gridDiameter) {
            if (y >= startGrid && y <= (startGrid + gridDiameter)) {
                /* We're at the correct grid! */
                return numberOfGrids - counter;
            }
            counter++;
        }
    },

    toLetters: function (num) {
        let mod = num % 26;
        let pow = num / 26 | 0;
        var out = mod ? String.fromCharCode(64 + mod) : (pow--, 'Z');
        return pow ? module.exports.toLetters(pow) + out : out;
    },

    getDistance: function (x1, y1, x2, y2) {
        const a = x1 - x2;
        const b = y1 - y2;
        return Math.sqrt(a * a + b * b);
    },
}