const childProcess = require('child_process');

const eventHandlers = require('./eventHandlers.js').getInstance();
const io = require('socket.io')(3000);
const Logger = require('./logger.js');

eventHandlers.io = io;
let webcamTimerOn = false;

io.on('connection', function (socket) {
    eventHandlers.connected(socket);

    let remoteAddress = socket.conn.remoteAddress;
    let userAgent = socket.handshake.headers['user-agent'];

    Logger.debug(remoteAddress + ' connected with user-agent ' + userAgent);
    Logger.debug('Total clients: ' + eventHandlers.allClients.length);

    if(!webcamTimerOn) {
        Logger.info('first client connected, starting cam updater');

        webcamTimerOn = true;
        webcam();
    }

    socket.on('disconnect', function() {
        eventHandlers.disconnected(socket);

        if (eventHandlers.allClients.length === 0) {
            Logger.info('everybody is gone, lets stop doing things...');
            webcamTimerOn = false;
        }
    });

    socket.on('action', function(parameters) {

        Logger.debug('Received action ' + parameters.type);
        Logger.debug('Received value ' + parameters.value);
        try {
            eventHandlers[parameters.type](parameters.value);
        } catch(error) {
            Logger.error(error);
        }
    });
});

var webcam = function() {
//Needs to have fswebcam installed
    Logger.info('calling webcam');
    childProcess.exec("fswebcam -q -d /dev/video0 -r 640x480 -S 10 --jpeg 90 --no-banner --save '-' | base64", {maxBuffer: 640 * 480}, receivedFrame);
};
var receivedFrame = function (err, stdout, stderr) {
    if (err || stderr) {
        Logger.error(err || stderr);
    }
    if(webcamTimerOn) {
        setTimeout(webcam, 500);
    }

    Logger.info('sending new image update');
    io.local.emit('imageUpdate', stdout);
    //stdout;
};
Logger.debug('listening on *:3000');