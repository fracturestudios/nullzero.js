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

    // Initializes the game
    function init() {

        // Init browser-specific technologies
        NZJS.WebGL.init();
        NZJS.RTC.init();
        
        // Create and load the load screen
        var load = new NZJS.Screens.Loading();
        load.init();
        screens.push(load);

        // Create the main menu screen
        // TODO figure out how to load the menu without threads :D
    }

    // Runs the game loop
    function run() {
        // TODO figure out how to poll elapsed time
        // TODO call things in a loop :D
    }

    // The game's entry point
    NZJS.main = function() {
        init();
        run();
    }

})(NZJS, window);
