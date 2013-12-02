/*
 * main.js
 *
 * The game's entry point.
 *
 * This file must be included after all the other game source files,
 * because including it begins the game loop.
 */

;(function(NZJS, window) {
    'use strict';

    var screens = [ ];
    var lastTick = 0;
    var lastDraw = 0;

    // Initializes the game
    function init() {

        // Init in-browser technologies (may not be supported by all browsers)
        NZJS.WebGL.init();
        NZJS.RTC.init();
        
        // Create and load the load screen
        var load = new NZJS.Screens.Loading();
        load.init();
        screens.push(load);

        // Create the main menu screen and set the load screen to show 
        // its load progress
        // TODO
    }

    // Schedules a future draw/tick operation.
    // tick()/draw() call this _first_, before executing the actual tick/draw
    // code. That way, the target time of the next tick/draw is independent of
    // how long the tick/draw code took to execute. 
    //
    function schedule(callback, callsPerSecond) {
        var callInterval = 1000.0 / callsPerSecond;
        setTimeout(callback, callInterval);
    }

    // When called, calls tick() on the current screen
    function tick() {
        var dt = NZJS.getTimeDelta(lastTick);
        lastTick += dt;

        schedule(tick, NZJS.Config.TicksPerSecond);

        if (screens.length > 0) {
            var screen = screens[screens.length - 1];
            if (screen.isLoaded) {
                screen.tick(dt);
            }
        }
    }

    // When called, calls draw() on the current screen
    // If there is none, displays an initialization message
    function draw() {
        var dt = NZJS.getTimeDelta(lastDraw);
        lastDraw += dt;

        schedule(draw, NZJS.Config.DrawsPerSecond);

        var screen = null;
        if (screens.length > 0) {
            screen = screens[screens.length - 1];
        }

        if (screen && screen.isLoaded) {
            screen.draw(dt);
        }
        else {
            var gl = NZJS.WebGL.gl;
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        }
    }

    // Runs the game loop
    function run() {
        setTimeout(tick, 0);
        setTimeout(draw, 0);
    }

    // The game's entry point
    NZJS.main = function() {
        init();
        run();
    }

})(NZJS, window);
