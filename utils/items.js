const Items = require('./items.json');

module.exports = {
    getName: function (id) {
        return Items[id].name;
    },

    getId: function (name) {
        return Object.keys(Items).find(key => Items[key].name === name);
    },

    getClosestItemIdByName: function (name, similarity = 0.9) {
        return Object.keys(Items).find(key => module.exports.similarity(Items[key].name, name) >= similarity);
    },

    similarity: function (str1, str2) {
        var longer = str1, shorter = str2;
        if (str1.length < str2.length) {
            longer = str2;
            shorter = str1;
        }

        var longerLength = longer.length;
        if (longerLength == 0) {
            return 1.0;
        }

        return (longerLength - module.exports.editDistance(longer, shorter)) / parseFloat(longerLength);
    },

    editDistance: function (str1, str2) {
        str1 = str1.toLowerCase();
        str2 = str2.toLowerCase();

        var costs = new Array();
        for (var i = 0; i <= str1.length; i++) {
            var lastValue = i;
            for (var j = 0; j <= str2.length; j++) {
                if (i == 0) {
                    costs[j] = j;
                }
                else {
                    if (j > 0) {
                        var newValue = costs[j - 1];
                        if (str1.charAt(i - 1) != str2.charAt(j - 1)) {
                            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                        }
                        costs[j - 1] = lastValue;
                        lastValue = newValue;
                    }
                }
            }

            if (i > 0) {
                costs[str2.length] = lastValue;
            }
        }

        return costs[str2.length];
    },

}