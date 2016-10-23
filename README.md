# double-meh

Design:
https://www.lucidchart.com/invitations/accept/2f5559df-391a-4dcc-befb-66869472d291

Car: 
- Connect the car to a RPI
- Use a library (johnny-five or more low-level) to setup the steering and Speed Controller
- Have a "virtual" car object to which the car responds to, which has information about the steering-degree and current set speed. Any changes to this virtual car, changes the actual car. (This makes it possible to decouple the work on the car and the actual steering)
- http://www.berryterminal.com/doku.php/berryboot ?

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
- https://www.conrad.nl/nl/reely-110-body-audi-s5-coupe-geverfd-gesneden-beplakt-237992.html?sc.ref=Product%20Details


Links:

- https://www.sitepoint.com/face-detection-nodejs-opencv/
- http://www.pyimagesearch.com/2015/03/30/accessing-the-raspberry-pi-camera-with-opencv-and-python/
- https://github.com/peterbraden/node-opencv
- https://www.raspberrypi.org/documentation/usage/camera/raspicam/raspistill.md
- https://github.com/silvanmelchior/userland/tree/master/host_applications/linux/apps/raspicam
- http://docs.opencv.org/2.4/modules/highgui/doc/reading_and_writing_images_and_video.html
- http://www.vision.caltech.edu/malaa/research/lane-detection/
- http://www.vision.caltech.edu/malaa/software/research/caltech-lane-detection/
- https://www.raspberrypi.org/forums/viewtopic.php?t=68247&p=498140
``` sudo modprobe bcm2835-v4l2 # to load it and create /dev/video0 ```
