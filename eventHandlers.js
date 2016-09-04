var Logger = require('./logger.js');
var events = require('events');
var Car = require('./car.js');

var EventHandlers = function() {
    this.allClients = [];
};

EventHandlers.prototype = {
    allClients : null,
    io : null,

    connected: function(socket) {
        this.allClients.push(socket);
    },

    disconnected : function (socket) {
        var remoteAddress = socket.conn.remoteAddress;

        var i = this.allClients.indexOf(socket);
        this.allClients.splice(i, 1);

        Car.emitter.emit('Stop');
        Car.emitter.emit('SetSteering', 0);

        Logger.debug('Total clients: ' + this.allClients.length);
        Logger.debug(remoteAddress + ' disconnected');
    },
    switchLights : function(socket) {
        Logger.debug('Switching lights');

        Car.emitter.emit('SwitchLights');

        socket.server.emit('lightEvent', !Car.lightsOn);
    },
    stop : function(socket) {
        Car.emitter.emit('Stop');

        socket.server.emit('speedEvent', 0);
    },
    setSpeed : function(socket, value) {
        Car.emitter.emit('SetMotorSpeed', value * 1);
        socket.server.emit('speedEvent', value * 1)
    },
    setSteering: function(socket, value) {
        Car.emitter.emit('SetSteering', value * 1);
        socket.server.emit('steeringEvent', value * 1);
    },
    setLeft : function(socket, value) {
        Car.emitter.emit('SetLeft', value * 1);
        socket.server.emit('leftEvent', value * 1);
    },
    setRight : function(socket, value) {
        Car.emitter.emit('SetRight', value * 1);
        socket.server.emit('rightEvent', value * 1);
    }
};

_instance = new EventHandlers();

EventHandlers.getInstance = function () {
    return _instance;
};



//Car.on('event', EventHandlers.getInstance().);
//emitter.emit


module.exports = EventHandlers;