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
            self.sendArduino('status');
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
            self.io.emit('status', self.state);
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
        socket.emit('status',this.state);
    },
    init: function (socket) {
        this.sendArduino('init');
    },
    status: function (socket) {
        this.emit('status');
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
    },
    go: function () {
        this.sendArduino('speed 107');
    },
    setSpeed: function (value) {
        if(!this.arduinoConnected) {
            return;
        }

        this.sendArduino('speed ' + value);

        Logger.debug('setSpeed event handler: ' + value);
    },
    setSteering: function (value) {
        if(!this.arduinoConnected) {
            return;
        }

        this.sendArduino('steer ' + value);

        Logger.debug('steering event handler: ' + value);
    }
};

_instance = new EventHandlers();

EventHandlers.getInstance = function () {
    return _instance;
};

module.exports = EventHandlers;