const express = require('express');
const app = express();
const http = require('http').Server(app);
const clientIo = require('socket.io-client');
const config = require('./config.json');
const Logger = require('./logger.js');

//const Brain = require('./theBrain.js');

const serverSocket = clientIo(config.server, { autoConnect : false, transports: ['websocket'] });

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

serverSocket.on('connect', function() {
    Logger.debug(`connected to: ${config.server}`);
    serverConnected = true;
});
serverSocket.on('disconnect', function() {
    serverConnected = false;
});
serverSocket.on('status', function(data) {
    console.log(data);
});
function socketError( error ) {
    if(error) {
        Logger.error(error);
    } else {
        Logger.error('I think the pipe is broken');
    }
}

serverSocket.on('connect_error', socketError);
serverSocket.on('connect_timeout', socketError);
serverSocket.on('reconnect_error', socketError);
serverSocket.on('error', socketError);


serverSocket.on('imageUpdate', function( data ) {
    Logger.info('got image update!');
});

serverSocket.open();

app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

http.listen(8080, function () {
    Logger.debug('listening on *:3000');
});