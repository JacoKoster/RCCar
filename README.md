# double-meh

Car: 
- Connect the car to a RPI
- Use a library (johnny-five or more low-level) to setup the steering and Speed Controller
- Have a "virtual" car object to which the car responds to, which has information about the steering-degree and current set speed. Any changes to this virtual car, changes the actual car. (This makes it possible to decouple the work on the car and the actual steering)

Lane Assist:
- Get image (stream) from the camera ( https://github.com/troyth/node-raspicam )
- Use OpenCV to analyze the image ( http://www.pyimagesearch.com/2015/02/23/install-opencv-and-python-on-your-raspberry-pi-2-and-b/ and http://peterbraden.github.io/node-opencv/ )
- Define if the car is within the parameters, if not, steer accordingly

Emergency shutdown
- Have a switch to remotely turn of the power of the car, when control is lost

Monitoring:
- Have a way to remotely monitor the status of the car, preferably with video and real-time changes made by the car itself

Next steps:
- Car detection, with radar or use the camera?
- Making the car bad-ass, lighting, cover, stickers, sound, etc :)
