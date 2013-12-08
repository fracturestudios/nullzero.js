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
 * To replay input states in an input record, retrieve the input state for the
 * desired time via .stateAt(time) method:
 *
 *      currentState = inputRecord.stateAt(currentTime);
 *
 * Once data is known to no longer be needed, call forgetAllBefore(time) to
 * prune the unneeded state information:
 *
 *      this.simulate(currentTime);
 *      this.inputRecord.forgetAllBefore(currentTime);
 *
 * This is done automatically when inputs are recorded based on the length of
 * the recording (see the [length] parameter passed to the constructor).
 *
 * TODO we may eventually want to factor out the keyframing/epoch parts of this
 * object, since we're going to need very similar behavior for world diffs. We
 * can basically publish the base prototype somewhere and have both inherit and
 * add type-specific code (instantiation, interpolation, diffing)
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

        // TODO 
        // - Implement diffing logic (should be fun)
        //   - First, just create keyframes for each input
        //   - Then figure out when we can omit keyframes
        //     - Simple for buttons; matching up/down state
        //     - Harder for axes: direction heuristics and required keyframe
        //       intervals
        // - Finally, discard old information:
        //   - If there are keyframes from before NZJS.getTime() - this.length
        //     - this.epochTime = NZJS.getTime()
        //     - this.epochState = this.stateAt(NZJS.getTime() - this.length)
        //     - Remove the outdated keyframes
    }

    // Gets the recorded input state as an NZJS.Input.State object
    // time - The time for which the state should be retrieved
    //
    InputRecord.prototype.stateAt = function(time) {
        // TODO
        // - Start with a state that copies the epoch state
        //   - n.b. we probably want to factor out the
        //    SnapshotButton/SnapshotAxis objects from state.js and publish
        //    them via NZJS.Input
        //
        // - Walk the keyframes until we get to the current time
        //   At each keyframe
        //   - Overwrite the relevant state in the output state with the state
        //     found in the keyframe
        //
        // - Return the output state
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
            now: now,
            keyframes: [ ];
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
                this.keyframes.push(keyframe);
            }
        }
    }

})(NZJS);
