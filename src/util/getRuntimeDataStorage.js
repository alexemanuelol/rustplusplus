const RuntimeDataStorage = require('./RuntimeDataStorage');

let runtimeDataStorage = null;

module.exports = () => {
    if (runtimeDataStorage === null) {
        runtimeDataStorage = new RuntimeDataStorage();
    }

    return runtimeDataStorage;
};
