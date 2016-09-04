var socket = io();

var controller = false;
var powerButton = $(".icon.power-button");

socket.on('connect', function() {
    var engineLight = $('.icons .engine');
    engineLight.removeClass('on blinking');
    updatePower(1);
});

socket.on('reconnect_error', function() {
    var engineLight = $('.icons .engine');
    engineLight.addClass('on blinking');
    updatePower(0);
    updateProgress(0);
});

socket.on('connect_error', function() {
    var engineLight = $('.icons .engine');
    engineLight.addClass('on blinking');
    updatePower(0);
    updateProgress(0);
});

socket.on('dataReceived', function (data) {
    console.log(data);
});

socket.on('lightEvent', function(value) {
    var lightButton = $('.icons .lights');
    lightButton.toggleClass('on', value);
});

socket.on('speedEvent', function(value) {
    value = value / 100;

    updateProgress(value);
});

socket.on('emergencyEvent', function(value){
    var emergencyLights = $('.signal-container .emergency');
    emergencyLights.toggleClass('on blinking', value);

    var leftLight = $('.signal-container .arrow-left');
    leftLight.toggleClass('on blinking', value);

    var rightLight = $('.signal-container .arrow-right');
    rightLight.toggleClass('on blinking', value);
});

socket.on('batteryEvent', function(value) {
    updatePower(value);
});

socket.on('leftEvent', function(value) {
    var leftLight = $('.signal-container .arrow-left');
    leftLight.toggleClass('on blinking', value);
});

socket.on('rightEvent', function(value) {
    var rightLight = $('.signal-container .arrow-right');
    rightLight.toggleClass('on blinking', value);
});

socket.on('controlEvent', function(value) {
   if(value) {
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

var handleButtons = function(event) {
    event.preventDefault();
    var object = {
        type: event.target.getAttribute('data-action')
    };
    if(object.type == "requestControl"){
        if(!controller) {
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
body.on('click','[data-action]', handleButtons);


var speedObject = {
    type: "setSpeed",
    value: 0
};
var steeringObject = {
    type: "setSteering",
    value: 0
};

var moveCar = function(event) {
    var controller = event.currentTarget;
    var controllerTop = controller.offsetTop;
    var controllerLeft = controller.offsetLeft;

    var touches = event.originalEvent.touches[0];

    var direction = (touches.pageX - controllerLeft) / 1.5;
    var speed = (touches.pageY - controllerTop) / 1.5;

    if(direction > 0 && direction < 101 && speed > 0 && speed < 101) {
        if(speed > 0 && speed < 50) {
            speedObject.value = 60;
            //speedObject.value = Math.floor(100 - speed * 2);
        } else if (speed >= 50 && speed < 101) {
            speedObject.value = 40;
            //speedObject.value = Math.floor(100 - speed * 2);
        } else {
            speedObject.value = 0;
        }

        steeringObject.value = (direction / 101 * 100) - 50;

        console.log('DIRECTION: ' + direction);

        socket.emit('action', steeringObject);
        socket.emit('action', speedObject);
    }

    console.log(steeringObject.value + " , " + speedObject.value);
};

body.on('touchstart', '.controller', moveCar);
body.on('touchmove', '.controller', moveCar);
body.on('touchend', '.controller', function() {
    steeringObject.value = 0;
    speedObject.value = 50;
    socket.emit('action', steeringObject);
    socket.emit('action', speedObject);

    console.log("controller stopped");
});