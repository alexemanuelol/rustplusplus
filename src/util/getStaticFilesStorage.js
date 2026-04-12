const RustlabsStaticStorage = require('./RustlabsStaticStorage');

let staticFilesStorage = null;

module.exports = () => {
    if (staticFilesStorage === null) {
        staticFilesStorage = new RustlabsStaticStorage();
    }

    return staticFilesStorage;
};
