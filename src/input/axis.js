/*
 * axis.js
 *
 * Represents an axis input (which can produce values between -1 and 1,
 * inclusively)
 */

;(function(NZJS, document) {
    'use strict';

    NZJS.Input = NZJS.Input || { };

    // Returns a new mouse movement axis
    // direction - 'horiz' or 'vert'
    // sensitivity - the ratio of pixels moved to axis values
    //
    NZJS.Input.mouse = function(direction, sensitivity) {
        return new NZJS.Input.MouseAxis(direction, sensitivity);
    }

    // Returns a new NZJS.ButtonAxis with zero attached buttons.
    // Call .withButton() to attach a button.
    // baseValue is the value of the axis before any button values are applied.
    //
    NZJS.Input.buttonAxis = function(baseValue) {
        return new NZJS.Input.ButtonAxis(baseValue);
    }

    // Acquires input from the browser
    // Uses the pointer lock API to ensure the cursor is hidden
    // and mouse moves do not actually affect the cursor
    //
    NZJS.Input.acquire = function() {
        var havePointerLock = 'pointerLockElement' in document ||
                           'mozPointerLockElement' in document ||
                        'webkitPointerLockElement' in document;

        if (!havePointerLock) {
            console.log("This browser doesn't support pointer lock!");
        }
        else {
            var canvas = document.getElementById(NZJS.Config.CanvasID);
            canvas.requestPointerLock = canvas.requestPointerLock ||
                                        canvas.mozRequestPointerLock ||
                                        canvas.webkitRequestPointerLock;

            canvas.requestPointerLock();
        }
    }

    // Releases the pointer lock
    //
    NZJS.Input.release = function() {
        document.exitPointerLock = document.exitPointerLock ||
                                document.mozExitPointerLock ||
                             document.webkitExitPointerLock;

        document.exitPointerLock();
    }

    // Base methods for an axis object
    //
    function AxisPrototype() {

        // Initializes this Axis instance
        //
        this._construct = function() {
            this.value = 0.0;
        }

        // Not required for all axis objects, but always provided for the
        // caller's convenience
        //
        this.poll = function() { }
    }

    // An axis that polls the cursor state.
    // direction can be one of 'horiz' or 'vert'.
    // sentitivity is the ratio from pixel delta to axis value
    //
    function MouseAxis(direction, sensitivity) {
        this._construct();

        var scale = 1.0 / sensitivity;
        var self = this;
        document.addEventListener('mousemove', function(ev) {

            if (direction == 'horiz') {
                self.value = ev.movementX || ev.mozMovementX || ev.webkitMovementX || 0;
            }
            else if (direction == 'vert') {
                self.value = ev.movementY || ev.mozMovementY || ev.webkitMovementY || 0;
            }

            self.value *= scale;
        });
    }
    MouseAxis.prototype = new AxisPrototype();
    NZJS.Input.MouseAxis = MouseAxis;

    // An axis composed of multiple buttons, each of which contributes some
    // amount to the axis's final value. Each button's value is added to
    // the base value, which can be thought of as the axis's neutral point.
    //
    function ButtonAxis(baseValue) {
        this._construct();
        this.buttons = [ ];
        this.baseValue = baseValue;
    }
    ButtonAxis.prototype = new AxisPrototype();
    NZJS.Input.ButtonAxis = ButtonAxis;

    // Adds a button to the axis
    // btn: The button object to poll
    // upValue: The value added to this axis when the button isn't down
    // downValue: The value added to this axis when the button is down
    //
    ButtonAxis.prototype.withButton = function(btn, upValue, downValue) {
        this.buttons.push({
            btn: btn,
            up: upValue,
            down: downValue
        });

        return this;
    }

    ButtonAxis.prototype.poll = function() {
        this.value = this.baseValue;

        for (var i = 0; i < this.buttons.length; ++i) {
            var b = this.buttons[i];
            b.btn.poll();

            this.value += b.btn.down() ? b.down : b.up;
        }
    }

})(NZJS, document);
