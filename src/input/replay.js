/*
 * replay.js
 *
 * A non-rewindable walk through an input record (NZJS.Input.Record,
 * in src/input/record.js). Generally you don't create this object manually --
 * instead, you call beginReplay() on a NZJS.Input.Record object:
 *
 *      var replay = inputRecord.beginReplay();
 *
 * Once you have a replay object, you can query the input state for a recording
 * at an arbitrary time:
 *
 *      currentState = replay.stateAt(currentTime);
 *
 * The currentTime parameter must be monotonically increasing: if you need to
 * go back in time, you must start a new replay by calling
 * inputRecord.beginReplay() again.
 */

;(function(NZJS) {

    NZJS.Input = NZJS.Input || { };

    // A non-rewindable walk through an input recording made using an 
    // NZJS.Input.Record object. 
    // record -- The NZJS.Input.Record this object plays back
    // 
    function InputReplay(record) {
        this.record = record;      // The input record to retrieve state from
        this.time = 0;                           // The current playback time
        this.handled = { }; // Set of record.keyframes that have been handled
                            // i.e. for buttons, pressed()/released() = false
    }
    NZJS.Input.Replay = InputReplay;

    // Gets the recorded input state as an NZJS.Input.State object
    // time - The time for which the state should be retrieved.
    //        Must be monotonically creasing for consecutive calls
    //
    InputReplay.prototype.stateAt = function(time) {

        // Bit of sanity checking
        if (this.time > time) {
            console.log('Warning: NZJS.Input.Replay was rewound!');
            console.log('Last call: t=' + this.time);
            console.log('This call: t=' + time);
        }

        this.time = time;

        // Start with a copy of the epoch state
        var state = new NZJS.Input.State();
        for (var name in this.record.epochState.buttons) {
            if (this.record.epochState.buttons.hasOwnProperty(name)) {

                var button = this.record.epochState.buttons[name];
                state.buttons[name] = NZJS.Input.buttonSnapshot(button);
            }
        }
        for (var name in this.record.epochState.axes) {
            if (this.record.epochState.axes.hasOwnProperty(name)) {

                var axis = this.record.epochState.axes[name];
                state.axes[name] = NZJS.Input.axisSnapshot(button);
            }
        }

        // Fast forward to the given time
        for (var i = 0; i < this.record.keyframes.length; ++i) {

            // Get the keyframe
            var keyframe = this.record.keyframes[i];
            if (keyframe.time > time) {
                break;
            }

            // Check if we've already handled this keyframe
            var key = keyframe.time.toString();
            var handled = !!this.handled[key];
            this.handled[key] = true;

            // Apply the keyframe to the output state
            var deltas = keyframe.deltas;

            for (var name in deltas.button) {
                if (deltas.button.hasOwnProperty(name)) {
                    state.buttons[name] = state.buttons[name] ||
                                          new NZJS.Input.ButtonSnapshot();

                    state.buttons[name].wasDown = deltas.button[name];
                    state.buttons[name].wasPressed = false;
                    state.buttons[name].wasReleased = false;

                    if (!handled) {

                        // This is the first time we processed the keyframe
                        // So if the button is down, it was also pressed;
                        // likewise, if the button is up, it was also released
                        //
                        if (state.buttons[name].wasDown) {
                            state.buttons[name].wasPressed = true;
                        }
                        else {
                            state.buttons[name].wasReleased = true;
                        }
                    }
                }
            }

            for (var name in deltas.axis) {
                if (deltas.axis.hasOwnProperty(name)) {
                    state.axes[name] = state.axes[name] || 
                                       new NZJS.Input.AxisSnapshot();

                    state.axes[name].value = deltas.axis[name];
                }
            }
        }

        return state;
    }

})(NZJS);
