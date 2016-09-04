var express = require('express');
var app = express();
var http = require('http').Server(app);
var eventHandlers = require('./eventHandlers.js').getInstance();
var io = require('socket.io')(http);
var Logger = require('./logger.js');


app.use(express.static('public'));

io.on('connection', function (socket) {
    eventHandlers.connected(socket);

    var remoteAddress = socket.conn.remoteAddress;
    var userAgent = socket.handshake.headers['user-agent'];

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
    })

});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, function () {
    Logger.debug('listening on *:3000');
});
