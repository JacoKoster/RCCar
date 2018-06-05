const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const clientIo = require('socket.io-client');
const config = require('./config.json');
const Logger = require('./logger.js');

//const Brain = require('./theBrain.js');

const serverSocket = clientIo(config.server);

app.use(express.static('public'));

//computer action
// Brain.emitter.on('correction', function (data) {
//     Logger.debug('Received action correction:' + data.correction);
//
//     io.emit('brainEvent', data);
//     eventHandlers.setSteering(data.correction);
// });
// Brain.emitter.on('start', function () {
//     Logger.debug('Received action start');
// //    io.emit('brainEvent', 'go');
// //    eventHandlers.go();
// });
//Brain.startDetection();

let serverConnected = false;

serverSocket.on('connection', function(serverSock) {
    Logger.debug('connected to:' + config.server);
    serverConnected = true;
    serverSock.on('disconnect', function() {
        serverConnected = false;
    });
});

let clients = [];

io.on('connection', function (socket) {

    let remoteAddress = socket.conn.remoteAddress;
    let userAgent = socket.handshake.headers['user-agent'];

    clients.push(socket);

    Logger.debug(remoteAddress + ' connected with user-agent ' + userAgent);
    Logger.debug('Total clients: ' + clients.length);

    socket.on('disconnect', function() {
        let remoteAddress = socket.conn.remoteAddress;

        let i = this.allClients.indexOf(socket);
        this.allClients.splice(i, 1);

        Logger.debug('Total clients: ' + this.allClients.length);
        Logger.debug(remoteAddress + ' disconnected');
    });

    socket.on('action', function(parameters) {

        console.log(parameters);

        Logger.debug('Received action ' + parameters.type);
        serverSocket.emit('action', parameters);
    });
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, function () {
    Logger.debug('listening on *:3000');
});