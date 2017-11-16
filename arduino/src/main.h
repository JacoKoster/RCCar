#ifndef MAIN_H
#define MAIN_H
#include <Arduino.h>

void initialize();
void initMotor();
void initSteering();
void initLights();
void steer();
void speed();
void ping();
void lights();
void updateState();
void sendState();
void unrecognized();
void memory();
void error(int errorCode, String errorMessage);
int freeRam();

#endif
