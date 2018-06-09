var carServer = "http://192.168.178.200:3000";

var socket = io(carServer);

var controller = false;
var powerButton = $(".icon.power-button");
var videoElement = $(".video-output");
var videoFPSElement = $(".video-fps");

var lastTime = 0;

var haveEvents = 'ongamepadconnected' in window;
var controllers = {};


function isMoved(axe) {
    var axeVal = axe.toFixed(4);
    return (axeVal > 0.0039  || axeVal < -0.0039 );
}
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
var turbo = false;

function updateStatus() {
    if (!haveEvents) {
        scangamepads();
    }
    var i = 0;
    var j;

    for (j in controllers) {
        var controller = controllers[j];
        if(!controller.cache) {
            controller.cache = {
                axes : {},
                buttons : {}
            };
        }
        for (i = 0; i < controller.buttons.length; i++) {
            var val = controller.buttons[i];
            var pressed = val == 1.0;
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
        for (i = 0; i < controller.axes.length; i++) {
            var value = Math.floor(controller.axes[i].toFixed(4) * 30);
            if (controller.cache.axes[i] !== value) {
                if(i === AXES.HORIZONTAL.RIGHT) {
                    steeringObject.value = value;

                    socket.emit('action', steeringObject);
                }
                if(i === AXES.VERTICAL.RIGHT) {
                    var multiplier = 0.9;
                    if(turbo) {
                        multiplier = 3;
                    }

                    if(value === -1) {
                        speedObject.value = 90;
                    } else {
                        if(Math.sign(value) === -1) {
                            speedObject.value = 110 + Math.abs((value+10) * multiplier);
                        } else {
                            speedObject.value = 80 - ((value-10) * multiplier);
                        }
                    }
                    //console.log(speedObject);
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
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
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

socket.on('status', function (value) {
    console.log(value);
});

socket.on('connect', function () {
    var engineLight = $('.icons .engine');
    engineLight.removeClass('on blinking');
    console.log('connected');
});

socket.on('reconnect_error', function () {
    var engineLight = $('.icons .engine');
    engineLight.addClass('on blinking');
});

socket.on('connect_error', function () {
    var engineLight = $('.icons .engine');
    engineLight.addClass('on blinking');
});

socket.on('imageUpdate', function( data ) {
    console.log('got image update!');
    videoElement.attr('src', "data:image/jpg;base64," + data);
});

socket.on('brainEvent', function (data) {

    if(data.camera) {
        videoElement.attr('src', "data:image/jpg;base64," + data.camera.output);
    }

    var now = performance.now();

    var fps = (1 / ((now - lastTime) / 1000)).toFixed(2);
    videoFPSElement.text('FPS: ' + fps);

    lastTime = now;
});



socket.on('controlEvent', function (value) {
    if (value) {
        powerButton.addClass("on");
        powerButton.removeClass("blinking");
        window.removeEventListener("deviceorientation", orientationChecker, true);
        window.addEventListener("deviceorientation", handleOrientation, true);
    } else {
        powerButton.removeClass("on");
        window.removeEventListener("deviceorientation", handleOrientation, true);
        window.addEventListener("deviceorientation", orientationChecker, true);
    }
});

var handleButtons = function (event) {
    event.preventDefault();
    var object = {
        type: event.target.getAttribute('data-action')
    };
    if (object.type == "requestControl") {
        if (!controller) {
            powerButton.addClass("on");
            powerButton.removeClass("blinking");
            window.removeEventListener("deviceorientation", orientationChecker, true);
            window.addEventListener("deviceorientation", handleOrientation, true);
        } else {
            powerButton.removeClass("on");
            window.removeEventListener("deviceorientation", handleOrientation, true);
            window.addEventListener("deviceorientation", orientationChecker, true);
        }

        controller = !controller;
        return;
    }

    socket.emit('action', object);
};
var body = $("body");
body.on('click', '[data-action]', handleButtons);

var speedObject = {
    type: "setSpeed",
    value: 0
};
var steeringObject = {
    type: "setSteering",
    value: 0
};

// var moveCar = function (event) {
//     var controller = event.currentTarget;
//     var controllerTop = controller.offsetTop;
//     var controllerLeft = controller.offsetLeft;
//
//     var touches = event.originalEvent.touches[0];
//
//     var direction = (touches.pageX - controllerLeft) / 1.5;
//
//     var speedControllerHeight = $(controller).outerHeight();
//     var speedControllerValue = speedControllerHeight - (touches.pageY - ((event.originalEvent.view.outerHeight - speedControllerHeight) / 2));
//     var speed = speedControllerValue / speedControllerHeight * 100;
//
//     if (direction > 0 && direction < 101 && speed > 0 && speed <= 100) {
//         speedObject.value = speed;
//
//         console.log('SPEED: ' + speedObject.value);
//
//         steeringObject.value = (direction / 101 * 100) - 50;
//
//         console.log('DIRECTION: ' + direction);
//
//         socket.emit('action', steeringObject);
//         socket.emit('action', speedObject);
//     }
//
//     console.log(steeringObject.value + " , " + speedObject.value);
// };

body.on('keydown', function (event) {
    if (event.keyCode === 27) {
        // Handle Escape key
        console.log('STOP');

        socket.emit('action', {type: 'stop'});
    } else if (event.keyCode === 32) {
        // Handle Space bar key
        console.log('GO');

        socket.emit('action', {type: 'go'});
    } else if (event.keyCode === 37) { //  left
        if(steeringObject.value >= -29) {
            steeringObject.value -= 10;
            socket.emit('action', steeringObject);
        }
    } else if (event.keyCode === 39) { // right
        if (steeringObject.value <= 31) {
            steeringObject.value += 10;
            socket.emit('action', steeringObject);
        }
    }
});

body.on('change', '#speed-amount', function (event) {
    speedObject.value = Number(event.target.value);
    console.log('SPEED: ' + speedObject.value);

    socket.emit('action', speedObject);
});
body.on('click', '#button-stop', function () {
    console.log('STOP');

    socket.emit('action', {type: 'stop'});
});
body.on('click', '#button-go', function () {
    console.log('GO');

    socket.emit('action', {type: 'go'});
});
//body.on('touchstart', '.controller', moveCar);
//body.on('touchmove', '.controller', moveCar);
// body.on('touchend', '.controller', function () {
//     steeringObject.value = 0;
//     speedObject.value = 0;
//     socket.emit('action', steeringObject);
//     socket.emit('action', speedObject);
//
//     console.log("controller stopped");
// });