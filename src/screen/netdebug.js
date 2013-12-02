/*
 * netdebug.js
 *
 * A screen implementation for initial network debugging
 */

(function(NZJS) {
    'use strict';

    function NetDebugScreen(screens) {
        this.screens = screens;
    }
    NZJS.Screens = NZJS.Screens || { };
    NZJS.Screens.NetDebug = NetDebugScreen;

    // Loads assets needed by this screen
    NetDebugScreen.prototype.init = function() { 
        this.isLoaded = true; // No assets required
    }

    // Updates the screen's logic
    NetDebugScreen.prototype.tick = function(dt) { }

    // Renders this screen
    NetDebugScreen.prototype.draw = function(dt) { 
        var gl = NZJS.WebGL.gl;
        gl.clearColor(0.0, 0.5, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // Called before a screen is pushed above this screen
    NetDebugScreen.prototype.suspend = function() { }

    // Called when this screen is resumed after a screen above is popped
    NetDebugScreen.prototype.resume = function() { }


})(NZJS);
