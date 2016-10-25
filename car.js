var Config = require('./config.json');
var five = require('johnny-five');
var events = require('events');
var Logger = require('./logger.js');

var boardOptions = {};

if (Config.boardType == "raspi") {
    var raspio = require('raspi-io');
    boardOptions = {
        io: new raspio(),
        repl: false
    }
}

var board = new five.Board(boardOptions);

var Car = function () {
    this.speed = 0;
    this.emitter = new events.EventEmitter;

};

Car.prototype = {};

var theCar = new Car();

board.on('ready', function () {
    const ENGINE_MIN = 43,
        ENGINE_MAX = 93,
        BRAKE_TIME = 900,
        BRAKE_INTERVAL = 300,
        ACCELERATION_TIME = 1000,
        ACCELERATION_INTERVAL = 200;

    var motor, steering;

    init();

    function init() {
        motor = new five.ESC({
            pin: Config.car.motor,
            device: 'FORWARD_REVERSE',
            range: [0, ENGINE_MAX],
            neutral: ENGINE_MIN
        });

        steering = new five.Servo({
            pin: Config.car.steering,
            center: true
        });

        //let everyone know the car is ready.
        theCar.emitter.emit('CarReady');
    }

    theCar.emitter.on('Stop', function () {
        stop();
    });

    theCar.emitter.on('Go', function () {
        go();
    });

    theCar.emitter.on('SetSteering', function (value) {
        Logger.debug('Steering value: ' + value);
        var direction = (value + 50) / 100 * 180;

        steering.to(direction);
    });

    theCar.emitter.on('SetMotorSpeed', setSpeed);

    function setSpeed(value) {
        theCar.speed = value;

        var actualSpeed = translateSpeed(value);

        Logger.debug('Speed value: ' + actualSpeed);
        motor.speed(actualSpeed);
    }

    /**
     * Translates the speed percentage to an actual value to be sent to the ESC.
     * @param speed Speed in percentage (0-100%)
     * @returns {number} Translated speed value adjusted to the scale of the ESC.
     */
    function translateSpeed(speed) {
        return speed / 100 * (ENGINE_MAX - ENGINE_MIN) + ENGINE_MIN
    }

    function stop() {
        console.log('Stopping car');

        var currentSpeed = theCar.speed,
            brakeStepSize = currentSpeed / (BRAKE_TIME / BRAKE_INTERVAL);

        slowDown();

        function slowDown() {
            setTimeout(function () {
                var newSpeed = currentSpeed - brakeStepSize;

                console.log('Slowing down to: ' + newSpeed);

                setSpeed(newSpeed);
                currentSpeed = theCar.speed;

                if (currentSpeed > 0) {
                    slowDown();
                }
            }, BRAKE_INTERVAL);
        }
    }

    function go() {
        console.log('Speeding car');

        var MAX_SPEED = 100,
            currentSpeed = theCar.speed,
            accelerateStepSize = MAX_SPEED / (ACCELERATION_TIME / ACCELERATION_INTERVAL);

        speedUp();

        function speedUp() {
            setTimeout(function () {
                var newSpeed = currentSpeed + accelerateStepSize;

                console.log('Speeding up to: ' + newSpeed);

                setSpeed(newSpeed);
                currentSpeed = theCar.speed;

                if (currentSpeed < MAX_SPEED) {
                    speedUp();
                }
            }, ACCELERATION_INTERVAL);
        }
    }
});

module.exports = theCar;