const ffmpeg = require('fluent-ffmpeg');
const v4l2camera = require('v4l2camera');
const sharp = require('sharp');
const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const Logger = require('./logger.js');
const eventHandlers = require('./eventHandlers.js').getInstance();
eventHandlers.io = io;

io.on('connection', function (socket) {
    eventHandlers.connected(socket);

    let remoteAddress = socket.conn.remoteAddress;
    let userAgent = socket.handshake.headers['user-agent'];

    Logger.debug(remoteAddress + ' connected with user-agent ' + userAgent);
    Logger.debug('Total clients: ' + eventHandlers.allClients.length);

    socket.on('disconnect', function() {
        eventHandlers.disconnected(socket);

        if (eventHandlers.allClients.length === 0) {
            Logger.info('everybody is gone, lets stop doing things...');
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

app.get('/', function (req, res) {
    res.send('ok');
});

let ffObj = {};
let ffStream = {};
const availableCams = {
    0 : '/dev/video0',
    1 : '/dev/video1'
};
let v412camera = {
    0 : null,
    1: null
};

function startImages(camId) {
    if(!availableCams[camId]) {
        return false;
    }
    if(v412camera[camId] === null) {
        v412camera[camId] = new v4l2camera.Camera(availableCams[camId]);
        v412camera[camId].loop = true;
        v412camera[camId].configSet({width: 640, height: 480});
        v412camera[camId].start();
        v412camera[camId].capture(function loop() {
            if (v412camera[camId].loop) {
                v412camera[camId].capture(loop);
            }
        });
    }
}

function stopImages(camId) {
    if(v412camera[camId]) {
        v412camera[camId].stop();
        v412camera[camId] = null;
    }
}

function startVideo(camId) {
    if(!availableCams[camId]) {
        return false;
    }
    stopImages(camId);

    if(!ffObj[camId]) {
        ffObj[camId] = ffmpeg(availableCams[camId])
            .inputFormat('v4l2')
            .inputOptions([
                '-avioflags direct',
                '-analyzeduration 0',
                '-fflags nobuffer',
                '-probesize 500000'
                ]
            )
            .format('flv')
            .flvmeta()
            .size('640x480')
            .videoBitrate('512k')
            .videoCodec('libx264')
            .fps(24)
            .withNoAudio()
            .on('stderr', function(stderrLine) {
                console.log('Stderr output: ' + stderrLine);
            })
            .on('error', function(err, stdout, stderr) {
                console.log('Cannot process video: ' + err.message);
            });
        ffStream[camId] = ffObj[camId].pipe();
        return true;
    } else {
        return false;
    }
}
function stopVideo(camId) {
    if(ffObj[camId]) {
        ffObj[camId].kill();
        ffObj[camId] = null;
        return true;
    }
    return false;
}

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/image/:id', function(req,res) {
    const camId = req.params.id;
    if(!v412camera[camId]) {
        startImages(camId);
    }

    let buf = Buffer(v412camera[camId].toYUYV());

    res.writeHead(200, {
        "content-type": "image/vnd-raw",
        "content-length": buf.length,
    });

    res.end(buf);
});

app.post('/camera/:id', function (req, res) {
    const camId = req.params.id;

    if(startVideo(camId)) {
        res.sendStatus(200);
    } else {
        res.sendStatus(400);
    }
});

app.delete('/camera/:id', function (req, res) {
    const camId = req.params.id;
    if(stopVideo(camId)) {
        return res.sendStatus(200);
    } else {
        return res.sendStatus(400);
    }
});

let webcamViewers = {
    0 : 0,
    1 : 0
};

app.get('/camera/:id', function (req, res) {
    const camId = req.params.id;
    res.contentType('video/x-flv');

    if(!ffObj[camId]) {
        if(startVideo(camId)) {
            webcamViewers[camId]++;
            ffStream[camId].on('data', function(chunk) {
                res.write(chunk);
                console.log('cam '+ camId +' just wrote ' + chunk.length + ' bytes');
            });
            ffStream[camId].on('end', function() {
                res.end();
            });
            res.on('close', function() {
                webcamViewers[camId]--;
                if(webcamViewers[camId] === 0) {
                    stopVideo(camId);
                }
            });
        } else {
            res.sendStatus(400);
        }
    }
});

http.listen(3000, function () {
    Logger.debug('listening on *:3000');
});