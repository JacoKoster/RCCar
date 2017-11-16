const Logger = require('./logger.js');
const events = require('events');
const Config = require('./config.json');
const SerialPort = require('serialport');

var EventHandlers = function () {
    this.arduino = new SerialPort(Config.serialport, {
        parser: SerialPort.parsers.readline('\n')
    });

    this.allClients = [];

    this.arduinoConnect();
};

EventHandlers.prototype = {
    allClients: null,
    io: null,
    arduino: null,
    arduinoConnected: null,
    state : null,

    arduinoConnect: function() {
        let self = this;
        this.arduino.on('open', function() {
            self.arduinoConnected = true;
            Logger.debug('Opened port!');
            self.sendArduino('init');
        });
        this.arduino.on('close', function() {
            self.arduinoConnected = false;
            Logger.debug('Port closed :-(');
        });
        this.arduino.on('data', function (data) {
            if(data == "PING") {
                Logger.debug('Received Ping');
                return self.sendArduino("PONG");
            }

            var message = JSON.parse(data);
            if(message.error) {
                return Logger.error(message);
            }

            self.state = message;
            Logger.debug(JSON.stringify(self.state));
        });
        this.arduino.on('error', function(error) {
            Logger.error(error);
        });
    },
    sendArduino: function(command) {
        if(this.arduinoConnected) {
            Logger.debug('sending: ' + command);

            return this.arduino.write(command + '\r');
        }
        return false;
    },

    connected: function (socket) {
        this.allClients.push(socket);
    },

    disconnected: function (socket) {
        var remoteAddress = socket.conn.remoteAddress;

        var i = this.allClients.indexOf(socket);
        this.allClients.splice(i, 1);

        // Car.emitter.emit('Stop');
        // Car.emitter.emit('SetSteering', 0);
        this.sendArduino('steer 0');
        this.sendArduino('speed 90');

        Logger.debug('Total clients: ' + this.allClients.length);
        Logger.debug(remoteAddress + ' disconnected');
    },
    stop: function () {
//        Car.emitter.emit('Stop');
//        this.sendArduino("steer 0");
        this.sendArduino('speed 90');

        // socket.server.emit('speedEvent', 0);
    },
    go: function () {
        this.sendArduino('speed 107');

        //Car.emitter.emit('Go');
    },
    setSpeed: function (value) {
        if(!this.arduinoConnected) {
            return;
        }

        this.sendArduino('speed ' + value);

        //Car.emitter.emit('SetMotorSpeed', value * 1);
        this.io.emit('speedEvent', value * 1);

        Logger.debug('setSpeed event handler: ' + value);
    },
    setSteering: function (value) {
        if(!this.arduinoConnected) {
            return;
        }

        this.sendArduino('steer ' + value);

        //Car.emitter.emit('SetSteering', value * 1);
        this.io.emit('steeringEvent', value * 1);

        Logger.debug('steering event handler: ' + value);
    }
};

_instance = new EventHandlers();

EventHandlers.getInstance = function () {
    return _instance;
};

module.exports = EventHandlers;