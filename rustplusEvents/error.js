module.exports = {
    name: 'error',
    async execute(rustplus, err) {
        console.log(`ERROR:\n${err}`);

    },
};