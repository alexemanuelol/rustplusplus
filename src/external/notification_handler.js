const EventEmitter = require('events');
const eventEmitter = new EventEmitter();

module.exports = {
    sendNotification: async function (eventName, data){
        eventEmitter.emit(eventName, data);
    },
}

eventEmitter.on('vendingMachines', function(data) {
    console.log('xxx', data);
});