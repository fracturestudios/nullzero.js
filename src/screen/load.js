/*
 * load.js
 *
 * Shows the loading status
 */

;(function(NZJS) {
    'use strict';

    /** Initializes a load screen
     *
     * @param screens The screen stack to push the next screen to
     */
    function LoadScreen(screens) {

        this.caption = "Loading ...";
        this.progress = 0.0;
        this.screens = screens;
    }
    NZJS.Screens = NZJS.Screens || { };
    NZJS.Screens.Loading = LoadScreen;

    // Loads assets needed by this screen
    LoadScreen.prototype.init = function() { 
        this.isLoaded = true; // No assets required
    }

    // Updates the screen's logic
    LoadScreen.prototype.tick = function(dt) { }

    // Renders this screen
    LoadScreen.prototype.draw = function(dt) { }

    // Called before a screen is pushed above this screen
    LoadScreen.prototype.suspend = function() { }

    // Called when this screen is resumed after a screen above is popped
    LoadScreen.prototype.resume = function() { }

})(NZJS);
