const cv = require('opencv');
const events = require('events');
const Config = require('./config.json');

var TheBrain = function () {
    this.emitter = new events.EventEmitter;
    this.carDriving = false;
    this.debug = Config.logLevel === 'DEBUG';
    this.vid = new cv.VideoCapture(0);
};

TheBrain.prototype = {
    RED: [0, 0, 255],
    GREEN: [0, 255, 0],
    BLUE : [255, 0, 0],
    error: false,


    detectLine : function(im) {
        var nIters = 2;
        var self = this;

        var minArea = 200;
        var lowThresh = 150;
        var highThresh = 300;

        var middleRadius = 100;

        var width = im.width();
        var height = im.height();

        var middle = {
            x: width / 2,
            y: height / 2
        };

        var im_canny = im.copy();
        //make it gray so we can see the edges better
        im_canny.convertGrayscale();

        //filter to edge-detection
        im_canny.canny(lowThresh, highThresh);
        im_canny.dilate(nIters);

        var contours = im_canny.findContours();

        var lines = [];

        var out = new cv.Matrix(height, width);
        for (var i = 0; i < contours.size(); i++) {

             if (contours.area(i) > minArea) {
                var moments = contours.moments(i);
                var cgx = Math.round(moments.m10 / moments.m00);
                var cgy = Math.round(moments.m01 / moments.m00);

                im.drawContour(contours, i, this.BLUE);

                if(Math.pow(cgx - middle.x,2) + Math.pow(cgy - middle.y,2) < Math.pow(middleRadius,2)) {
                    lines.push({
                        x: cgx,
                        y: cgy
                    });
                }
             }
        }

        var correction = null;

        if(lines.length) {
            //reduce the lines into one combined X
            var projectedX = lines[0].x;

            for (let i = 1, lineLength = lines.length; i < lineLength; i++) {
                projectedX += lines[i].x;
            }
            projectedX /= lines.length;

            //now we know the center and the supposed center, let's give a correction on scale from -30 to 30
            correction = Math.round(((middle.x - projectedX) / middle.x) * 100);
        }

        lines.forEach(function(line) {
            im.line([line.x - 15, line.y], [line.x + 15, line.y], self.RED);
            im.line([line.x, line.y - 15], [line.x, line.y + 15], self.RED);
        });

        //the boundary check
        im.ellipse(middle.x, middle.y, middleRadius, middleRadius);

        //the center
        im.line([middle.x - 5, middle.y], [middle.x + 5, middle.y], this.RED);
        im.line([middle.x, middle.y - 5], [middle.x, middle.y + 5], this.RED);

        if(lines.length) {
            //the calculated center
            im.line([projectedX - 5, middle.y], [projectedX + 5, middle.y], this.RED);
            im.line([projectedX, middle.y - 5], [projectedX, middle.y + 5], this.RED);
        }

        var returnObject = {
            correction : (correction * 2) * -1
        };

        if(this.debug) {
            returnObject.camera = {
                output: im.toBuffer().toString('base64')
            };
        }

        return returnObject
    },

    detectLight: function(im) {
        var lowThresh = 50;
        var highThresh = 250;
        var nIters = 2;

        var lower_threshold = [40, 40, 150];
        var upper_threshold = [70, 70, 255];

        im.inRange(lower_threshold, upper_threshold);

        if(this.debug == true) {
            im.save('./tmp/top_step1.jpg');
        }

        var im_canny = im.copy();
        im_canny.canny(lowThresh, highThresh);
        im_canny.dilate(nIters);

        var contours = im_canny.findContours();

        if(this.debug == true) {
            im_canny.save('./tmp/top_step2.jpg');
        }

        return contours.size() > 0 && contours.area(0) > 100;
    },
    startDetection: function() {
        var brainz = this;

        this.vid.read(function(err, im){
            if (err) {
                brainz.error = true;
                throw err;
            }

            if(brainz.debug == true) {
                im.save('./tmp/original.jpg');
            }

            var width = im.width();
            var height = im.height();
            if (width < 1 || height < 1) {
                brainz.error = true;
                throw new Error('Image has no size');
            }
           // var bottom = im.crop(0,height/2,width,height/2);
           // var top = im.crop(0,0,width,height/2);

            // if(!brainz.carDriving) {
            //     var lightOn = brainz.detectLight(top);
            //     if (!lightOn) {
            //         brainz.carDriving = true;
            //         brainz.emitter.emit('start');
            //     } else {
            //         if(brainz.debug == true) {
            //             console.log('waiting...');
            //         }
            //     }
            // }
            var output = brainz.detectLine(im);

            brainz.emitter.emit('correction', output);

            if(brainz.debug == true) {
                console.log('correction needed:' + output.correction);
            }
        });

        if(!this.error) {
            setTimeout(function(){brainz.startDetection()}, 200);
        }
    }
};

var theBrain = new TheBrain();

module.exports = theBrain;