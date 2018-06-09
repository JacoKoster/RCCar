#include <Arduino.h>

// Some of the code is ripped, with love, from https://github.com/scogswell/ArduinoSerialCommand

#include <SoftwareSerial.h>   // We need this even if we're not using a SoftwareSerial object, due to the way the Arduino IDE compiles
#include <SerialCommand.h>
#include <ArduinoJson.h>
#include <Servo.h>
#include "main.h"

#define LED_PIN 13   // Arduino LED on board
#define MOTOR_PIN 10
#define MOTOR_MIN 0
#define MOTOR_MAX 180
#define STEER_PIN 9
#define STEER_MIN 60
#define STEER_DEFAULT 90
#define STEER_MAX 120
#define MIN_PULSE 1000
#define MAX_PULSE 2000
#define CHANGE_DELAY 20

SerialCommand SCmd;   // The SerialCommand object

Servo steeringServo;
Servo motor;

// Memory pool for JSON object tree.
// Inside the brackets, 200 is the size of the pool in bytes.
StaticJsonBuffer<200> jsonBuffer;

JsonObject& state = jsonBuffer.createObject();

void setup()
{
  Serial.begin(9600);

  //Initialize the components of the car
  initLights();
  //initMotor();

  // Setup callbacks for SerialCommand commands
  SCmd.addCommand( "lights", lights );       // Switch Led On / OF
  SCmd.addCommand( "status", sendState ); //returns the current state
  SCmd.addCommand( "memory", memory );
  SCmd.addCommand( "steer", steer );
  SCmd.addCommand( "init", initialize );
  SCmd.addCommand( "speed", speed );
  SCmd.addCommand( "PONG", ping ); // returns ping
  SCmd.addDefaultHandler(unrecognized);  // Handler for command that isn't matched

  state["initialized"] = 0;
}

void loop() {
  SCmd.readSerial();     // We don't do much, just process serial commands
}

void initLights() {
  pinMode(LED_PIN,OUTPUT);      // Configure the onboard LED for output
  digitalWrite(LED_PIN,HIGH);    // default to LED off
  delay(500);
  digitalWrite(LED_PIN,LOW);    // default to LED off
  delay(500);
  digitalWrite(LED_PIN,HIGH);    // default to LED off
  delay(500);
  digitalWrite(LED_PIN,LOW);    // default to LED off

  state["lights"] = 0;
}

void initialize() {
  initSteering();
  initMotor();
  state["initialized"] = 1;
}

void initMotor() {
  motor.attach(MOTOR_PIN, MIN_PULSE, MAX_PULSE);
  delay(500);
  motor.write(90); //the ESC can go forward and backwards, we are now setting 90 as neutral, which makes 0 full-throttle backward and 180 forward

  state["speed"] = 90;
  sendState();
}

void initSteering() {
  steeringServo.attach(STEER_PIN);
  steeringServo.write(STEER_MIN);
  delay(300);
  steeringServo.write(STEER_MAX);
  delay(300);
  steeringServo.write(STEER_DEFAULT);

  state["direction"] = STEER_DEFAULT;
}

/**
 * Accepts any number between 0 (hard left) and 90 (hard right)
 */
void steer() {
  char *arg;
  arg = SCmd.next(); // Get the next argustment from the SerialCommand object buffer

  if (arg != NULL) {
    int value = atoi(arg);

    if(value >= -30 && value <= 30) {
      int angle = map(value, -30, 30, STEER_MIN, STEER_MAX);

      steeringServo.write(angle);
      state["direction"] = value;

      sendState();
    } else {
      error(400, "Value should be between -30 and 30");
    }
  } else {
    error(400, "Missing argument: value (-30 & 30)");
  }
}

/**
 * Accepts any number between 0 (full throttle backward) and 180 (full throttle forward)
 * 90 = neutral
 */
void speed() {
  char *arg;
  arg = SCmd.next(); // Get the next argument from the SerialCommand object buffer

  if (arg != NULL) {
    int value = atoi(arg);

    if(value >= MOTOR_MIN && value <= MOTOR_MAX) {

      int currentThrottle = motor.read();

      // Are we going up or down?
      int step = 1;

      if( value < currentThrottle ) {
        step = -1;
      }

      // Slowly move to the new throttle value
      while( currentThrottle != value ) {
        motor.write(currentThrottle + step);
        currentThrottle = motor.read();
        delay(CHANGE_DELAY);
      }

      state["speed"] = value;
      sendState();
    } else {
      error(400, "Value should be between 0 and 180");
    }
  } else {
    error(400, "Missing argument: value (0-180)");
  }
}

void ping() {
  //this resets the shutdown-timer...

  //Serial.println("PONG");
}

void lights() {
  char *arg;
  arg = SCmd.next(); // Get the next argument from the SerialCommand object buffer

  if (arg != NULL) {
    int value = atoi(arg);
    if (value == 0 || value == 1) {
      if(value == 0) {
        digitalWrite(LED_PIN,LOW);
      } else if (value == 1) {
        digitalWrite(LED_PIN,HIGH);
      }
      state["light"] = value;
      sendState();
    } else {
      error(400, "Invalid argument: value (0-1)");
    }
  } else {
    error(400, "Missing argument: value (0-1)");
  }
}

void sendState() {
  char buffer[200];
  state.printTo(buffer, sizeof(buffer));
  Serial.println(buffer);
}

// This gets set as the default handler, and gets called when no other command matches.
void unrecognized() {
  error(400, "Unknown command");
}

void memory() {
  Serial.println(freeRam());
}

/**
 * Helper functions
 */

void error(int errorCode, String errorMessage) {
  StaticJsonBuffer<200> theBuffer;
  JsonObject& response = theBuffer.createObject();

  response["code"] = errorCode;
  response["message"] = errorMessage;

  char buffer[200];
  response.printTo(buffer, sizeof(buffer));
  Serial.println(buffer);
}

int freeRam () {
  extern int __heap_start, *__brkval;
  int v;
  return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
}
