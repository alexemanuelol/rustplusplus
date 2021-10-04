module.exports = {
    name: 'error',
    async execute(err) {
        console.log(`Error: ${err}`);
    },
};