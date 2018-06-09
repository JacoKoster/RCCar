const Logger = require('./logger.js');
const Config = require('./config.json');
const SerialPort = require('serialport');

const EventHandlers = function () {
    this.allClients = [];

    if(Config.ft_useArduino) {
        this.arduino = new SerialPort(Config.serialport, {
            parser: SerialPort.parsers.readline('\n')
        });
        this.arduinoConnect();
    }
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
            let message = JSON.parse(data);
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
        let remoteAddress = socket.conn.remoteAddress;

        let i = this.allClients.indexOf(socket);
        this.allClients.splice(i, 1);

        this.sendArduino('steer 0');
        this.sendArduino('speed 90');

        Logger.debug('Total clients: ' + this.allClients.length);
        Logger.debug(remoteAddress + ' disconnected');
    },
    stop: function () {
//        this.sendArduino("steer 0");
        this.sendArduino('speed 90');

        // socket.server.emit('speedEvent', 0);
    },
    go: function () {
        this.sendArduino('speed 107');
    },
    setSpeed: function (value) {
        if(!this.arduinoConnected) {
            return;
        }

        this.sendArduino('speed ' + value);

        this.io.emit('speedEvent', parseInt(value));

        Logger.debug('setSpeed event handler: ' + value);
    },
    setSteering: function (value) {
        if(!this.arduinoConnected) {
            return;
        }

        this.sendArduino('steer ' + value);
        this.io.emit('steeringEvent', parseInt(value));

        Logger.debug('steering event handler: ' + value);
    }
};

_instance = new EventHandlers();

EventHandlers.getInstance = function () {
    return _instance;
};

module.exports = EventHandlers;