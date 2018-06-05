var socket = io();

var controller = false;
var powerButton = $(".icon.power-button");
var videoElement = $(".video-output");
var videoFPSElement = $(".video-fps");

var lastTime = 0;

socket.on('connect', function () {
    var engineLight = $('.icons .engine');
    engineLight.removeClass('on blinking');
    updatePower(1);
});

socket.on('reconnect_error', function () {
    var engineLight = $('.icons .engine');
    engineLight.addClass('on blinking');
    updatePower(0);
    updateProgress(0);
});

socket.on('connect_error', function () {
    var engineLight = $('.icons .engine');
    engineLight.addClass('on blinking');
    updatePower(0);
    updateProgress(0);
});

socket.on('dataReceived', function (data) {

});

socket.on('speedEvent', function (value) {
    value = value / 100;

    updateProgress(value);
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

socket.on('batteryEvent', function (value) {
    updatePower(value);
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