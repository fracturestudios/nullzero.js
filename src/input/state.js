/*
 * state.js
 *
 * Represents the state of the user's input at a given time.
 * Gives a semantic string name to each input; for example, you can map the 'W'
 * key to 'WalkForward' like this:
 *
 *      state.addButton('WalkForward', NZJS.Input.key('w'));
 *
 * You can then query this button later like this:
 *
 *      if (state.down('WalkForward')) { ... }
 *
 * States may not actually be polling client-side information. For example, the
 * multiplayer server uses the input record (NZJS.Input.Record) to retrieve the
 * client's input state frames. Hence, you should never call .poll() on the
 * individual axes and buttons associated with a state; instead, simply call
 * state.pollNext().
 *
 * State objects are immutable once polled. This means you must capture the
 * return value of myState.pollNext():
 *
 *      currentState = currentState.pollNext();
 *
 * This behavior also helps support NZJS.Input.Record.
 */

;(function(NZJS) {
    'use strict';

    NZJS.Input = NZJS.Input || { };

    // Encapsulates the state of the game's inputs at a point in time
    //
    function InputState() { 

        this.pollTime = NZJS.getTime();
        this.buttons = { };
        this.axes = { };
    }
    NZJS.Input.State = InputState;

    // Adds a button to the input state
    // name - A programmer-friendly name (like 'WalkForward')
    // btn - The NZJS.Input button object to add
    //
    InputState.prototype.addButton = function(name, btn) {
        this.buttons[name] = btn;
    }

    // Adds an axis to the input state
    // name - A programmer-friendly name (like 'HorizStrafe')
    // axis - The NZJS.Axis button object to add
    //
    InputState.prototype.addAxis = function(name, axis) {
        this.axes[name] = axis;
    }

    // Removes a named button from the input state
    // name - The name of the button to remove
    //
    InputState.prototype.removeButton = function(name) {
        delete this.buttons[name];
    }

    // Removes a named axis from the input state
    // name - The name of the axis to remove
    //
    InputState.prototype.removeAxis = function(name) {
        delete this.axes[name];
    }

    // Indicates whether this state has a button with the given name
    //
    InputState.prototype.hasButtonNamed = function(name) {
        return this.buttons[name] !== undefined;
    }

    // Indicates whether this state has an axis with the given name
    //
    InputState.prototype.hasAxisNamed = function(name) {
        return this.axes[name] !== undefined;
    }

    // Indicates whether a named button is being pressed
    //
    InputState.prototype.down = function(name) {
        return this.buttons[name].down();
    }

    // Indicates whether a named button is not being pressed
    //
    InputState.prototype.up = function(name) {
        return this.buttons[name].up();
    }

    // Indicates whether this is the first tick a given named button is being
    // pressed
    //
    InputState.prototype.pressed = function(name) {
        return this.buttons[name].pressed();
    }

    // Indicates whether this is the first tick a given named button is no
    // longer being pressed
    //
    InputState.prototype.released = function(name) {
        return this.buttons[name].released();
    }

    // Gets the value of a named axis
    //
    InputState.prototype.value = function(name) {
        return this.axes[name].value;
    }

    // Produces the next input state snapshot by polling the underlying inputs
    // that were previously added to this input state
    //
    InputState.prototype.pollNext = function() {

        var next = new NZJS.Input.State();
        next.buttons = this.buttons;
        next.axes = this.axes;

        var buttonNames = Object.keys(this.buttons);
        this.buttons = { };
        for (var i = 0; i < buttonNames.length; ++i) {
            var name = buttonNames[i];

            // Store the snapshot of the button's state in this state
            this.buttons[name] = NZJS.Input.buttonSnapshot(next.buttons[name]);

            // Poll the button to get the button's state in the next state
            next.buttons[name].poll();
        }

        var axisNames = Object.keys(this.axes);
        this.axes = { };
        for (var i = 0; i < axisNames.length; ++i) {
            var name = axisNames[i];

            this.axes[name] = NZJS.Input.axisSnapshot(next.axes[name]);
            next.axes[name].poll();
        }

        return next;
    }

})(NZJS);
