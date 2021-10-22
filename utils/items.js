const Items = require('./items.json');

module.exports = {
    getName: function (id) {
        return Items[id].name;
    },

    getId: function (name) {
        return Object.keys(Items).find(key => Items[key].name === name);
    },
}