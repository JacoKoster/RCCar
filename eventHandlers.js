var Logger = require('./logger.js');
var events = require('events');
var Car = require('./car.js');

var EventHandlers = function () {
    this.allClients = [];
};

EventHandlers.prototype = {
    allClients: null,
    io: null,

    connected: function (socket) {
        this.allClients.push(socket);
    },

    disconnected: function (socket) {
        var remoteAddress = socket.conn.remoteAddress;

        var i = this.allClients.indexOf(socket);
        this.allClients.splice(i, 1);

        Car.emitter.emit('Stop');
        Car.emitter.emit('SetSteering', 0);

        Logger.debug('Total clients: ' + this.allClients.length);
        Logger.debug(remoteAddress + ' disconnected');
    },
    stop: function (socket) {
        Car.emitter.emit('Stop');

        // socket.server.emit('speedEvent', 0);
    },
    go: function (socket) {
        Car.emitter.emit('Go');
    },
    setSpeed: function (socket, value) {
        Car.emitter.emit('SetMotorSpeed', value * 1);
        socket.server.emit('speedEvent', value * 1)

        console.log('setSpeed event handler: ' + value);
    },
    setSteering: function (socket, value) {
        Car.emitter.emit('SetSteering', value * 1);
        socket.server.emit('steeringEvent', value * 1);
    }
};

_instance = new EventHandlers();

EventHandlers.getInstance = function () {
    return _instance;
};

module.exports = EventHandlers;