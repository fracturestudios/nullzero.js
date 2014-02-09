/*
 * record.js
 *
 * A derivation of NZJS.Replay.Record that allows you to record and replay
 * NZJS.Input.State object states over time.
 */

;(function(NZJS) {

    NZJS.Input = NZJS.Input || { };

    // A NZJS.Replay.Record diff() function implementation that works on
    // NZJS.Input.State objects. Given a base and target input state, produces
    // a changelist from base to target, which can be passed to applyInputDiff
    // along with the base input state to produce the target input state.
    //
    function diffInputStates(base, target) {

        var changelist = [ ];

        // Diff buttons
        var keys = Object.keys(target.buttons);
        for (var i = 0; i < keys.length; ++i) { 
            var name = keys[i];

            if (target.down(name) != base.down(name)) {
                changelist.push({ type: 'btn', name: name, down: target.down(name) });
            }
        }

        // Diff axes
        keys = Object.keys(target.axes);
        for (var i = 0; i < keys.length; ++i) {
            var name = keys[i];

            // n.b. we don't elide any axis data from the input record
            // If we have bandwidth problems, this is a way to optimize.
            // One idea: take fewer samples and interpolate between them.
            // Make sure to take another sample if the axis changes direction.

            changelist.push({ type: 'axis', name: name, value: target.value(name) });
        }

        return changelist;
    }

    // A NZJS.Replay.Record apply() function implementation that works on
    // NZJS.Input.State objects and the output of diffInputStates(). Maintains
    // the following invariant:
    //
    //     applyInputDiff(base, diffInputStates(base, target)) == target
    //
    function applyInputDiff(base, diff) {

        // Start with a copy of the base state
        var target = new NZJS.Input.State();
        for (var name in base.buttons) {
            if (base.buttons.hasOwnProperty(name)) {

                var button = base.buttons[name];
                target.buttons[name] = NZJS.Input.buttonSnapshot(button);
            }
        }
        for (var name in base.axes) {
            if (base.axes.hasOwnProperty(name)) {

                var axis = base.axes[name];
                target.axes[name] = NZJS.Input.axisSnapshot(axis);
            }
        }

        // Apply the diff
        for (var i = 0; i < diff.length; ++i) {
            var change = diff[i];
            var name = change.name;

            if (change.type == 'btn') {

                target.buttons[name] = target.buttons[name] ||
                                       new NZJS.Input.ButtonSnapshot();

                target.buttons[name].wasDown = change.down;
                target.buttons[name].wasPressed = change.down;
                target.buttons[name].wasReleased = !change.down;
            }
            else if (change.type == 'axis') {

                target.axes[name] = target.axes[name] || 
                                    new NZJS.Input.AxisSnapshot();

                target.axes[name].value = change.value;
            }
        }

        return target;
    }

    // Called by NZJS.Replay.Walk before the input state is advanced.
    // We use this to clear the wasPressed/wasReleased flags from every button
    // in the state
    //
    function walkInputRecord(state) {

        // Clear wasPressed/wasReleased on every button in the state
        var keys = Object.keys(state.buttons);
        for (var i = 0; i < keys.length; ++i) { 
            var name = keys[i];

            state.buttons[name].wasPressed = false;
            state.buttons[name].wasReleased = false;
        }
    }

    function Record(window) {

        NZJS.Replay.Record.call(this, 
            diffInputStates, 
            applyInputDiff, 
            walkInputRecord,
            window,
            new NZJS.Input.State()
            );
    }

    NZJS.Input.Record = Record;
    Record.prototype = new NZJS.Replay.Record();

})(NZJS);

