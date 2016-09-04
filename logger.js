var Config = require('./config.json');

var log = function (level, message) {
    var threshold = Logger.levels[Config.logLevel] || Logger.levels.ERROR;

    if (level && message && level.value >= threshold.value) {
        var levelName = level.name.toLowerCase(),
            fullMessage = level.name + ' | ' + message;

        if (console[levelName]) {
            console[levelName](fullMessage);
        } else {
            console.log(fullMessage);
        }
    }

};

Logger = {
    levels: {
        DEBUG: {value: 1, name: 'DEBUG'},
        INFO: {value: 2, name: 'INFO'},
        WARN: {value: 3, name: 'WARN'},
        ERROR: {value: 4, name: 'ERROR'},
        OFF: {value: 100, name: 'OFF'}
    },

    debug: function (message) {
        log(this.levels.DEBUG, message);
    },
    info: function (message) {
        log(this.levels.INFO, message);
    },
    warn: function (message) {
        log(this.levels.WARN, message);
    },
    error: function (message) {
        log(this.levels.ERROR, message);
    }
};
module.exports = Logger;
