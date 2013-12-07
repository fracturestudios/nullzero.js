/*
 * button.js
 *
 * Represents a button input (which can either be up or down). NZJS can query
 * two types of buttons: key presses and mouse clicks.
 *
 * Buttons can be composed. For example, this snippet creates the variable
 * 'btn', which is considered down when the user presses ctrl+shift+click:
 *
 * var btn =     NZJS.Input.key('ctrl')
 *          .and(NZJS.Input.key('shift'))
 *          .and(NZJS.Input.mouse('leftclick'));
 *
 * Additionally, button inputs can wrap axis inputs. For example, this snippet
 * creates the variable 'btn2', which is considered down when the axis's value
 * is between 0 and .25:
 *
 * var btn2 = NZJS.Input.axisButton(myAxis, .0, .25);
 */

(function(NZJS, document) {

    NZJS.Input = NZJS.Input || { };

    //
    // Button creation shortcuts (for convenience)
    //

    NZJS.Input.key = function(key) {
        return new NZJS.Input.KeyButton(key);
    }

    NZJS.Input.mouse = function(button) {
        return new NZJS.Input.MouseButton(button);
    }

    NZJS.Input.axisButton = function(axis, downMin, downMax) {
        return new NZJS.Input.AxisButton(axis, downMin, downMax);
    }

    NZJS.Input.not = function(button) {
        return new NZJS.Input.NotButton(button);
    }

    // The base methods for a button object
    //
    function ButtonPrototype() {

        // 
        // Button aggregation
        //
        
        // Returns a new button that is considered down if and only if
        // both [this] and [other] are down
        //
        this.and = function(other) {
            return new NZJS.Input.AndButton(this, other);
        }

        // Returns a new button that is considered down if and only if
        // either [this] or [other] is down
        //
        this.or = function(other) {
            return new NZJS.Input.OrButton(this, other);
        }


        //
        // Per-button state
        //

        // Must be called in the constructor for a Button implementation
        //
        this._construct = function() {

            this.isDown = false;        // State during this tick
            this.wasDown = false;       // State during the previous tick
            this.willBeDown = false;    // State during the next tick

            // Note: for proper pressed()/released() operation, button
            // implementations should set this.willBeDown via any DOM
            // event handlers. This way the state of a button is constant
            // until a known point in time (i.e. when poll() is called)
        }

        // Returns the current state of the button
        //
        this.down = function() { 
            return this.isDown;
        }

        // Returns the current state of the button
        //
        this.up = function() { 
            return !this.isDown;
        }

        // A fire-once version of down().
        // For the first game tick the button is down, pressed() returns true.
        // On subsequent ticks, while the user continues to hold the button,
        // down() returns true button pressed() returns false.
        //
        this.pressed = function() { 
            return this.isDown && !this.wasDown;
        }

        // A fire-once version of up().
        // For the first game tick the button is up, released() returns true.
        // On subsequent ticks, while the user continues to not press the
        // button, up() returns true button released() returns false.
        //
        this.released = function() { 
            return !this.isDown && this.wasDown;
        }

        // Polls the current button state
        //
        this.poll = function() {
            this.wasDown = this.isDown;
            this.isDown = this.willBeDown;
        }
    }

    // Represents button state for a keyboard key.
    // The key parameter may be one of the following:
    //
    // - A keyboard character (A-Z, 0-9, etc)
    // - 'ctrl' for either control key
    // - 'alt' for either alt key
    // - 'shift' for either shift key
    // - 'meta' for either meta key
    //
    function KeyButton(key) {

        this.key = key.toUpperCase();

        function handleSpecialKey(btn, ev) {

            if (btn.key == 'SHIFT') {
                btn.willBeDown = ev.shiftKey;
            }
            else if (btn.key == 'CTRL') {
                btn.willBeDown = ev.ctrlKey;
            }
            else if (btn.key == 'ALT') {
                btn.willBeDown = ev.altKey;
            }
            else if (btn.key == 'META') {
                btn.willBeDown = ev.metaKey;
            }
        }

        var self = this;
        document.addEventListener('keydown', function(ev) {
            handleSpecialKey(self, ev);

            if (ev.keyCode == self.key.charCodeAt(0)) {
                self.willBeDown = true;
            }
        });

        document.addEventListener('keyup', function(ev) {
            handleSpecialKey(self, ev);

            if (ev.keyCode == self.key.charCodeAt(0)) {
                self.willBeDown = false;
            }
        });
    }
    KeyButton.prototype = new ButtonPrototype();
    NZJS.Input.KeyButton = KeyButton;

    // Represents the button state for a mouse button.
    // Valid mouse buttons are:
    //
    // - 'leftclick' for the left button
    // - 'midclick' for the middle button
    // - 'rightclick' for the right button
    //
    function MouseButton(button) {

        this.button = button;

        var self = this;
        document.addEventListener('mousedown', function(ev) {
            if ((self.button == 'leftclick' && ev.button == 0) ||
                (self.button == 'midclick' && ev.button == 1) ||
                (self.button == 'rightclick' && ev.button == 2)) {

                self.willBeDown = true;
            }
        });

        document.addEventListener('mouseup', function(ev) {
            if ((self.button == 'leftclick' && ev.button == 0) ||
                (self.button == 'midclick' && ev.button == 1) ||
                (self.button == 'rightclick' && ev.button == 2)) {

                self.willBeDown = false;
            }
        });
    }
    MouseButton.prototype = new ButtonPrototype();
    NZJS.Input.MouseButton = MouseButton;

    // A button implementation that wraps an NZJS.Input.Axis object.
    // This button is considered 'down' when the axis's value is
    // between minDown and maxDown, inclusive
    //
    function AxisButton(axis, minDown, maxDown) {
        this.axis = axis;
        this.minDown = minDown;
        this.maxDown = maxDown;
    }
    AxisButton.prototype = new ButtonPrototype();
    NZJS.Input.AxisButton = AxisButton;

    AxisButton.prototype.poll = function() {
        var val = this.axis.value();
        this.willBeDown = val >= this.minDown && val <= this.maxDown;
        this.isDown = this.willBeDown;
        this.wasDown = this.isDown;
    }

    // A button that is 'down' when both of the buttons supplied to the
    // constructor are down
    //
    function AndButton(btn1, btn2) {
        this.left = btn1;
        this.right = btn2;
    }
    AndButton.prototype = new ButtonPrototype();
    NZJS.Input.AndButton = AndButton;

    AndButton.prototype.poll = function() {
        this.left.poll();
        this.right.poll();

        this.willBeDown = this.left.willBeDown && this.right.willBeDown;
        this.isDown = this.left.isDown && this.right.isDown;
        this.wasDown = this.left.wasDown && this.right.wasDown;
    }

    // A button that is 'down' when either of the buttons supplied to the
    // constructor are down
    //
    function OrButton(btn1, btn2) {
        this.left = btn1;
        this.right = btn2;
    }
    OrButton.prototype = new ButtonPrototype();
    NZJS.Input.OrButton = OrButton;

    OrButton.prototype.poll = function() {
        this.left.poll();
        this.right.poll();

        this.willBeDown = this.left.willBeDown || this.right.willBeDown;
        this.isDown = this.left.isDown || this.right.isDown;
        this.wasDown = this.left.wasDown || this.right.wasDown;
    }

    // A button that is 'down' when the button supplied to the constructor is
    // up
    //
    function NotButton(btn) {
        this.btn = btn;
    }
    NotButton.prototype = new ButtonPrototype();
    NZJS.Input.NotButton = NotButton;

    NotButton.prototype.poll = function() {
        this.btn.poll();

        this.willBeDown = !this.btn.willBeDown;
        this.isDown = !this.btn.isDown;
        this.wasDown = !this.btn.wasDown;
    }

})(NZJS, document);
