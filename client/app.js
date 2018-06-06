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


//we shall be using this to also be a client... and use the brain
let serverConnected = false;

serverSocket.on('connection', function(socket) {
    Logger.debug('connected to:' + config.server);
    serverConnected = true;

    socket.on('imageUpdate', function( data ) {
        console.log('got image update!');
    });

    socket.on('disconnect', function() {
        serverConnected = false;
    });
});

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(3000, function () {
    Logger.debug('listening on *:3000');
});