module.exports = {
    convertCrashToTime(crashPoint) {
        var c = 16666.666667;
        return c * Math.log(0.01 * crashPoint);
    },

    getCurrentGrowth(ms) {
        var r = 0.00006;
        return Math.floor(100 * Math.pow(Math.E, r * ms));
    }
}