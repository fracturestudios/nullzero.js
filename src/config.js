/*
 * config.js
 *
 * Global, hardcoded configuration options
 */

;(function(NZJS) {
    'use strict';

    NZJS.Config = { };

    // How many times per second to run Screen.tick()
    NZJS.Config.TicksPerSecond = 60;

    // How many times per second to run Screen.draw()
    NZJS.Config.DrawsPerSecond = 60;

    // How often the clock time is queried, in milliseconds. For Nyquist /
    // sampling reasons, the interval should cause NZJS.getTime() to be
    // updated more than twice as often as max(TicksPerSecond,
    // DrawsPerSecond); otherwise you can end up in a situation where
    // tick/draw receives a time delta of 0.
    //
    NZJS.Config.TimeSamplingInterval = 1000.0 / 60.0;

    // When true, goes to the NetDebug screen instead of the Load screen during
    // game boot (temporary flag for development)
    NZJS.Config.DebugNetworking = true;

})(NZJS);
