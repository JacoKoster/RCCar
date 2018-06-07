const sharp = require('sharp');
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

const v4l2camera = require('v4l2camera');
const cam = new v4l2camera.Camera("/dev/video0");
cam.configSet({width: 640, height: 480});
cam.start();
cam.capture(function loop() {
    cam.capture(loop);
});


function webcam() {
    console.time('frame');

    let buf = Buffer(cam.toYUYV());
    io.emit('imageUpdateRaw', buf.toString('base64'));

    console.timeEnd('frame');
    console.time('encode');
    sharp(buf, {
        raw: {
            width:640,
            height:480,
            channels:3
        }
    }).jpeg({
        quality: 90
    }).toBuffer().then(data => {
        io.emit('imageUpdate',data.toString('base64'));
        console.timeEnd('encode');
    }).catch(err => {
        console.error(err);
    });
}
Logger.debug('listening on *:3000');