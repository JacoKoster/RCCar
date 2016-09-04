var Config = require('./config.json');
var five = require('johnny-five');
var events = require('events');
var Logger = require('./logger.js');

var boardOptions = {};

if(Config.boardType == "raspi") {
    var raspio = require('raspi-io');
    boardOptions = {
        io: new raspio(),
        repl: false
    }
}

var board = new five.Board(boardOptions);

var Car = function() {
    this.brakeThreshold = 30;
    this.lightsOn = false;
    this.leftLightOn = false;
    this.rightLightOn = false;
	this.alarm = false;
    this.speed = 0;
    this.emitter = new events.EventEmitter;

};

Car.prototype = {

};

var theCar = new Car() ;

board.on('ready', function() {
    var frontLights = new five.Led(Config.car.frontLightPin);
    var backLights = new five.Led(Config.car.backLightPin);
    var leftLight = new five.Led(Config.car.leftLightPin);
    var rightLight = new five.Led(Config.car.rightLightPin);
    var steerValue = null;

    var motor = new five.ESC({
        pin: Config.car.motor,
        neutral: 50
    });

    var steering = new five.Servo({
        pin: Config.car.steering,
        center: true
    });

    var brake = function() {
		backLights.blink(70);
		
        board.wait(1000, function() {
            backLights.stop();
            backLights[theCar.lightsOn ? "off" : "on"]();
        });
    };


    theCar.emitter.on('SetAlarm', function() {
		Logger.debug('set Alarm');

		if(!this.alarm) {
            rightLight.blink(300);
            leftLight.blink(300);
		}else{
            rightLight.stop();
            leftLight.stop();
		}
		this.alarm = !this.alarm;
    });
	
    //theCar.emitter.on('SetLeft', function(value) {
		//Logger.debug('Left Light!');
		//BlinkLeft();
    //
    //});
    //
    //
    //theCar.emitter.on('SetRight', function() {
		//Logger.debug('Right Light!');
		//BlinkRight();
    //});

    theCar.emitter.on('SwitchLights', function() {
        theCar.lightsOn = !theCar.lightsOn;

        Logger.debug(theCar.lightsOn);

        frontLights[theCar.lightsOn ? "off" : "on"]();
		backLights[theCar.lightsOn ? "off" : "on"]();
    });

    theCar.emitter.on('Stop', function() {
        brake();
        theCar.speed = 0;
        motor.speed(motor.neutral, 'forward');
    });

    theCar.emitter.on('SetSteering', function(value) {
        Logger.debug('Steering value: ' + value);
        var direction = (value + 50) / 100 * 180;

        steering.to(direction);
    });

    theCar.emitter.on('SetMotorSpeed', function(val) {
        //if(value < theCar.speed - theCar.brakeThreshold) {
        //    brake();
        //}

        motor.speed(val, 'forward');

        theCar.speed = val;
    });

    //reset
    //motor.reverse(0);
    //steering.reverse(0);
    frontLights.off().on();
    backLights.off().on();
    leftLight.off().on();
    rightLight.off().on();

    //let everyone know the car is ready.
    theCar.emitter.emit('CarReady');
});

module.exports = theCar;