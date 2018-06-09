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

socket.on('imageUpdate', function( data ) {
    console.log('got image update!');
    videoElement.attr('src', "data:image/jpg;base64," + data);
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