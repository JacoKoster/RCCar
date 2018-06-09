const carServer = "http://192.168.178.200:3000";
const socket = io(carServer);

const controller = false;
const powerIcon = $(".icon.power-button");
const engineIcon = $('.icon.engine');
const lightsIcon = $('.icon.lights');
const arrowLeftIcon = $('.icon.arrow-left');
const arrowRightIcon = $('.icon.arrow-right');
const videoElement = $(".video-output");
const videoFPSElement = $(".video-fps");

const lastTime = 0;
const BUTTONS = {
    A : 0,
    B: 1,
    X: 2,
    Y: 3,
    LB: 4,
    RB: 5,
    LT: 6,
    RT: 7,
    BACK: 8,
    START: 9,
    LEFTTHUMB: 10,
    RIGHTTHUMB: 11,
    UP: 12,
    DOWN: 13,
    LEFT: 14,
    RIGHT: 15
};
const AXES = {
    HORIZONTAL : {
        LEFT : 0,
        RIGHT : 2
    },
    VERTICAL : {
        LEFT: 1,
        RIGHT : 3
    }
};

let haveEvents = 'ongamepadconnected' in window;
let controllers = {};
let speedObject = {
    type: "setSpeed",
    value: 0
};
let steeringObject = {
    type: "setSteering",
    value: 0
};

let turbo = false;

function updateStatus() {
    if (!haveEvents) {
        scangamepads();
    }

    for (let j in controllers) {
        let controller = controllers[j];
        if(!controller.cache) {
            controller.cache = {
                axes : {},
                buttons : {}
            };
        }
        for (let i = 0; i < controller.buttons.length; i++) {
            let val = controller.buttons[i];
            let pressed = val === 1.0;
            if (typeof(val) === "object") {
                pressed = val.pressed;
                val = val.value;
            }
            if (controller.cache.buttons[i] !== pressed) {
                console.log(`${i} button change to ${pressed} `);
                controller.cache.buttons[i] = pressed;

                if(i === BUTTONS.START && pressed === true) {
                    socket.emit('action', {type: 'init'});
                }
                if(i === BUTTONS.RIGHTTHUMB) {
                    turbo = pressed;
                    console.log('TURBO: ' + pressed);
                }
            }

        }
        for (let i = 0; i < controller.axes.length; i++) {
            let value = controller.axes[i].toFixed(4);
            if (controller.cache.axes[i] !== value) {
                if(i === AXES.HORIZONTAL.RIGHT) {
                    steeringObject.value = Math.floor(value * 30);

                    socket.emit('action', steeringObject);
                }
                if(i === AXES.VERTICAL.RIGHT) {
                    let multiplier = 0.3;
                    if(turbo) {
                        multiplier = 1;
                    }
                    if(value === -0.0039) {
                        speedObject.value = 90;
                        updateProgress(0);
                    } else {
                        if(Math.sign(value) === -1) {
                            speedObject.value = Math.floor(90 + ((Math.abs(value) * 90)*multiplier));
                            updateProgress(-value * multiplier);
                        } else {
                            speedObject.value = 90 - Math.floor((value*90) * multiplier);
                            updateProgress(-value * multiplier);
                        }
                    }
                    socket.emit('action', speedObject);
                }

                controller.cache.axes[i] = value;
            }
        }
    }
    requestAnimationFrame(updateStatus);
}

function connecthandler(e) {
    controllers[e.gamepad.index] = e.gamepad;
    requestAnimationFrame(updateStatus);
}
function disconnecthandler(e) {
    delete controllers[e.gamepad.index];
}
window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

function scangamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
            if (gamepads[i].index in controllers) {
                controllers[gamepads[i].index] = gamepads[i];
            } else {
                connecthandler({gamepad:gamepads[i]});
            }
        }
    }
}

if (!haveEvents) {
    setInterval(scangamepads, 500);
}

socket.on('status', function (data) {
    lightsIcon.toggleClass('on', data.lights === 1);
    powerIcon.toggleClass('blinking', data.initialized === 0);

    arrowRightIcon.toggleClass('on', data.direction > 1);
    arrowLeftIcon.toggleClass('on', data.direction < -2);

    console.log(data);
});

socket.on('connect', function () {
    engineIcon.removeClass('on blinking').addClass('dimmed');
});

socket.on('reconnect_error', function () {
    engineIcon.addClass('on blinking');
});

socket.on('connect_error', function () {
    engineIcon.addClass('on blinking');
});

socket.on('brainEvent', function (data) {

    if(data.camera) {
        videoElement.attr('src', "data:image/jpg;base64," + data.camera.output);
    }

    let now = performance.now();

    let fps = (1 / ((now - lastTime) / 1000)).toFixed(2);
    videoFPSElement.text('FPS: ' + fps);

    lastTime = now;
});




/** needs some cleanup.... **/
var minmax = function (min, v, max) {
    return (v < min) ? min : (max < v) ? max : v;
};
var yuv2r = function (y, u, v) {
    return minmax(0, (y + 359 * v) >> 8, 255);
};
var yuv2g = function (y, u, v) {
    return minmax(0, (y + 88 * v - 183 * u) >> 8, 255);
};
var yuv2b = function (y, u, v) {
    return minmax(0, (y + 454 * u) >> 8, 255);
};
var yuyv2rgba = function (yuyv, rgba, width, height) {
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j += 2) {
            var index = i * width + j;
            var y0 = yuyv[index * 2 + 0] << 8;
            var u = yuyv[index * 2 + 1] - 128;
            var y1 = yuyv[index * 2 + 2] << 8;
            var v = yuyv[index * 2 + 3] - 128;
            rgba[index * 4 + 0] = yuv2r(y0, u, v);
            rgba[index * 4 + 1] = yuv2g(y0, u, v);
            rgba[index * 4 + 2] = yuv2b(y0, u, v);
            rgba[index * 4 + 3] = 255;
            rgba[index * 4 + 4] = yuv2r(y1, u, v);
            rgba[index * 4 + 5] = yuv2g(y1, u, v);
            rgba[index * 4 + 6] = yuv2b(y1, u, v);
            rgba[index * 4 + 7] = 255;
        }
    }
    return rgba;
};
var rgb2rgba = function (rgb, rgba, width, height) {
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var index = i * width + j;
            rgba[index * 4 + 0] = rgb[index * 3 + 0];
            rgba[index * 4 + 1] = rgb[index * 3 + 1];
            rgba[index * 4 + 2] = rgb[index * 3 + 2];
            rgba[index * 4 + 3] = 255;
        }
    }
    return rgba;
};
var cameraObjects = {
    0 : {},
    1 : {}
};

cameraObjects[0].context = document.getElementById("cam0").getContext("2d");
cameraObjects[0].image = cameraObjects[0].context.createImageData(640, 480);
cameraObjects[1].context = document.getElementById("cam1").getContext("2d");
cameraObjects[1].image = cameraObjects[1].context.createImageData(640, 480);

function loadCameras() {
    loadCamera(0);
    loadCamera(1);

    setTimeout(loadCameras, 100);
}

function loadCamera(camId) {
    let req = new XMLHttpRequest();
    let image = cameraObjects[camId].image;
    req.responseType = "arraybuffer";
    req.addEventListener("load", function (ev) {
        let yuyv = new Uint8Array(req.response);
        yuyv2rgba(yuyv, image.data, image.width, image.height);
        cameraObjects[camId].context.putImageData(image, 0, 0);
    }, false);
    req.open("GET", carServer + "/image/"+ camId +"?cache=" + Date.now(), true);
    req.send();
}
loadCameras();