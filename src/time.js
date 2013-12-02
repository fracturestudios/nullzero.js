/*
 * time.js
 *
 * Manages game time measurement
 */

(function(NZJS) {

    var epoch = new Date().getTime();
    var now = 0;

    // Gets the current game time, in partial seconds [float].
    // For performance reasons, this value is only updated periodically (see
    // Config.TimePrecision). If you need more precise metrics (e.g. profile
    // function call execution time), use NZJS.getExactTime().
    //
    function getTime() {
        return now;
    }
    NZJS.getTime = getTime;

    // Gets the current game time, in partial seconds [float].
    // This object creates garbage in order to query the current time. 
    // Thus, if you plan on calling this often, see if NZJS.getTime suits your
    // needs.
    //
    function getExactTime() {
        return (new Date().getTime() - epoch) / 1000.0;
    }
    NZJS.getExactTime = getExactTime;

    // Gets the amount of time that has passed since the given time. 
    // If NZJS.getTime() hasn't been sampled recently, this resamples the time
    // immediately so that the delta will be non-zero.
    //
    function getTimeDelta(since) {
        if (now == since) {
            now = getExactTime();
        }

        return now - since;
    }
    NZJS.getTimeDelta = getTimeDelta;

    // Periodically updates the cached game time
    function updateTime() {
        now = getExactTime();
        setTimeout(updateTime, Math.floor(NZJS.Config.TimeSamplingInterval));
    }

    updateTime(); // Start the update loop

})(NZJS);
