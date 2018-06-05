const eventHandlers = require('./eventHandlers.js').getInstance();
const io = require('socket.io')(3000);
const Logger = require('./logger.js');

eventHandlers.io = io;

io.on('connection', function (socket) {
    eventHandlers.connected(socket);

    let remoteAddress = socket.conn.remoteAddress;
    let userAgent = socket.handshake.headers['user-agent'];

    Logger.debug(remoteAddress + ' connected with user-agent ' + userAgent);
    Logger.debug('Total clients: ' + eventHandlers.allClients.length);

    socket.on('disconnect', function() { eventHandlers.disconnected(socket); });

    socket.on('action', function(parameters) {

        Logger.debug('Received action ' + parameters.type);
        try {
            eventHandlers[parameters.type](socket, parameters.value);
        } catch(error) {
            Logger.error(error);
        }
    });
});

Logger.debug('listening on *:3000');