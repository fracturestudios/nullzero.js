/*
 * webgl.js
 *
 * Initializes the WebGL canvas.
 * Requires the DOM to contain a <canvas> object with id="nzjsCanvas"
 */

;(function(NZJS, document, window) {
    'use strict';

    NZJS.WebGL = { };

    // The current width/height of the WebGL canvas
    var width = 0;
    var height = 0;

    NZJS.WebGL.canvasWidth = function() { return width; }
    NZJS.WebGL.canvasHeight = function() { return height; }

    // Initializes WebGL
    NZJS.WebGL.init = function() {

        var canvas = document.getElementById('nzjsCanvas');
        var gl = null;
        try {
            gl = canvas.getContext('webgl');
        } catch(e) { }

        if (!gl) {
            document.write('<h2>Your browser doesn\'t seem to support WebGL</h2>');
            document.write('<p>Please visit this page using a <a href="http://en.wikipedia.org/wiki/WebGL#Support">supported browser</a>.</p>');
            return;
        }

        NZJS.WebGL.canvas = canvas;
        NZJS.WebGL.gl = gl;

        // Always set the canvas size to the window size
        window.onresize = NZJS.WebGL.resize;
        NZJS.WebGL.resize();

        // Clear the back buffer for the first time
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    }

    // Resizes the WebGL canvas to fit the containing window
    // Adapted from http://stackoverflow.com/q/15451321/351264
    NZJS.WebGL.resize = function() {

        var body = document.documentElement || document.body;
        NZJS.WebGL.canvas.width = body.clientWidth;
        NZJS.WebGL.canvas.height = body.clientHeight;
    }

})(NZJS, document, window);
