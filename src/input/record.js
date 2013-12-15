/*
 * record.js
 *
 * A delta-compressed record of input states (input/state.js) over time.
 * This is primarily used to synchronize input information between the
 * multiplayer client and server.
 *
 * Client-side:
 *
 * To record input states in an input record, pass each input state object
 * (received via NZJS.Input.State.pollNext()) to the .record() method:
 *
 *      currentState = currentState.pollNext();
 *      inputRecord.record(currentState);
 *
 * To send recorded information to the server, use .diff() to get a diff object
 * that represents what happened to the input record since the last time
 * .diff() was called. Then send the diff object to the server:
 *
 *      var changes = inputRecord.diff();
 *      serverConn.send(changes);
 *
 * Server-side:
 *
 * To apply diff information received from the client, use .apply():
 *
 *      .. .prototype.oninput = function (diff) {
 *          this.inputRecord.apply(diff);
 *      }
 *
 * To replay input states in an input record, create a replay of the recording.
 * See the documentation for NZJS.Input.Replay for more information about the
 * replay object:
 *
 *      var replay = inputRecord.beginReplay();
 *      currentState = inputRecord.stateAt(currentTime);
 *
 * Once data is known to no longer be needed, call forgetAllBefore(time) to
 * prune the unneeded state information and free up memory:
 *
 *      this.simulate(currentTime);
 *      this.inputRecord.forgetAllBefore(currentTime);
 *
 * This is done automatically when inputs are recorded based on the length of
 * the recording (see the [length] parameter passed to the constructor).
 * However, you must  manually prune unneeded information if you are only using
 * a record object for replaying data (without recording it).
 */

;(function(NZJS) {
    'use strict';

    NZJS.Input = NZJS.Input || { };

    // Allows input states to be recorded over time and replayed.
    // Can be serialized to allow playback on a different machine than the one
    // that recorded the original input states.
    // length - The number of seconds of input state to record.
    //          This record will only contain state data as old as
    //          (NZJS.getTime() - [length]) seconds ago.
    //
    function InputRecord(length) {
        this.length = length;    // The max number of seconds of data to record
        this.epochState = new NZJS.Input.State();  // The oldest recorded state
        this.epochTime = NZJS.getTime();    // The time epochState was recorded
        this.diffTime = this.epochTime;     // The time of the last diff() call
        this.keyframes = [ ];                               // The state record
    }
    NZJS.Input.Record = InputRecord;

    // Adds an input state to this record.
    // state - The state to add
    // time [optional] - The time at which the state should be inserted.
    //                   If omitted, NZJS.getTime() will be used.
    // 
    InputRecord.prototype.record = function(state, time) {
        if (time === undefined) {
            time = NZJS.getTime();
        }

        // Get the up-to-date state without the state being recorded
        var baseline = this.stateAt(time);

        // Will receive the diff data generated by this method
        var keyframe = { 
            time: time,
            deltas: {
                button: { },
                axis: { },
            },
        };

        // Diff buttons
        var keys = Object.keys(state.buttons);
        for (var i = 0; i < keys.length; ++i) {
            var name = keys[i];

            if (state.down(name) != baseline.down(name)) {
                keyframe.deltas.button[name] = state.down(name);
            }
        }

        // Diff axes
        keys = Object.keys(state.axes);
        for (var i = 0; i < keys.length; ++i) {

            // n.b. we don't elide any axis data from the input record
            // If we have bandwidth problems, this is a way to optimize.
            // One idea: take fewer samples and interpolate between them.
            // Make sure to take another sample if the axis changes direction.
            
            var name = keys[i];
            keyframe.deltas.axis[name] = state.value(name);
        }

        // Insert the keyframe
        if (Object.keys(this.keyframe.deltas.button).length > 0 ||
            Object.keys(this.keyframe.deltas.axis).length > 0) {

            this._insertKeyframe(keyframe);
        }

        // Garbage collection
        this.forgetAllBefore(time - this.window);
    }

    // Returns the part of the recording that occured between [since] and [now]
    // (by default, everything since the last call to .diff()).
    //
    // The object returned can be passed to apply() on another input record,
    // even if the record is on a different machine.
    //
    // since [optional] - The beginning time of the diff. If omitted, this
    //                    method returns everything since the last call to
    //                    this.diff()
    // now [optional] - The end time of the diff. If omitted, this method
    //                  returns everything until NZJS.getTime()
    //
    InputRecord.prototype.diff = function(since, now) {
        if (since == undefined) {
            since = this.diffTime;
        }
        if (now == undefined) {
            now = NZJS.getTime();
        }

        var diff = {
            since: since,
            until: now,
            keyframes: [ ],
        };

        for (var i = 0; i < this.keyframes.length; ++i) {
            if (this.keyframes[i].time >= since &&
                this.keyframes[i].time <= now) {

                diff.keyframes.push(this.keyframes[i]);
            }
        }

        this.diffTime = now;
        return diff;
    }

    // Applies a diff created by a different input record to this input record.
    // diff - The diff to apply
    //
    InputRecord.prototype.apply = function(diff) {

        for (var i = 0; i < diff.keyframes.length; ++i) {
            var keyframe = diff.keyframes[i];

            if (keyframe.time >= this.epochTime) {
                this._insertKeyframe(keyframe);
            }
        }
    }

    // Starts a new replay of this input record
    // 
    InputRecord.prototype.beginReplay = function() {

        return new NZJS.Input.Replay(this);
    }

    // Forgets all recorded input state that occurred before the given time.
    //
    InputRecord.prototype.forgetAllBefore = function(time) {

        if (time > this.epochTime) {
            this.epochTime = time;
            this.epochState = this.stateAt(time);

            while (this.keyframes.length > 0 &&
                   this.keyframes[0].time < time) {

                this.keyframes.splice(0, 1);
            }
        }
    }

    // Inserts a keyframe into this.keyframes, preserving the invariant that
    // keyframes are sorted ascending by time
    //
    InputRecord.prototype._insertKeyframe = function(keyframe) {
        for (var i = this.keyframes.length - 1; i >= 0; --i) {

            var other = this.keyframes[i];
            if (other.time < keyframe.time) {

                this.keyframes.splice(i, 0, keyframe);
                return;
            }
        }
    }

})(NZJS);
