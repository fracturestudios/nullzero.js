/*
 * record.js
 *
 * The recording half of the record-replay data structure. Records compose a
 * series of state snapshots into a serializable, delta-compressed record of
 * these states. You can replay a the states in a record using the Walk object
 * (see src/replay/walk.js).
 *
 * The record-replay data structure is generic; it is used by the game in 
 * several places:
 *
 * - Clients track the user's input state in a record object, which is then
 *   serialized and sent to the server, who walks the record to replay the
 *   inputs to the game layer
 *
 * - Clients also replay the inputs locally to predict game state.
 *
 * - The server tracks the game world state in a record object, which is then
 *   serialized and sent to clients, who walk the record to replay the game
 *   state to the player.
 *
 * - For debugging purposes, the transport layer allows packets to be logged to
 *   a record object, which can then be replayed asynchronously in order to
 *   reproduce networking issues.
 */

;(function(NZJS) {
    'use strict';

    NZJS.Replay = NZJS.Replay || { };

    // Creates a new Record object
    //
    // diff: A function(state, state) -> [ change, change, ... ].
    //       The 'state' and 'change' objects are opaque to Record.
    //       The diff function must take two state objects and produce a list
    //       of change objects that describe how to go from the first state
    //       object to the second.
    //       If the two states are identical, diff() should return [ ].
    //
    // apply: A function(state, [ change, change, ... ]) -> state
    //        The 'state' and 'change' objects are opaque to Record.
    //        The change list is guaranteed to be produced by calling diff().
    //        apply() must not modify the state object that was passed in.
    //        The apply function must take a state object and a change list,
    //        and produce a new state with the changes applied.
    //
    // The diff() and apply() functions you specify must maintain the following
    // invariant:
    //
    // iff      diff(state1, state2) == changelist
    // then     apply(state1, changelist) == state2
    //
    // walk: A function(state) -> void. The `state` object is opaque to Record.
    //       Makes any necessary modifications needed whenever a Walk through a
    //       replay record is advanced.
    //
    // window: The number of seconds of history to maintain.
    //         The farthest back a record can walk is `window` seconds before
    //         the latest recorded state.
    //         Larger values of window require more memory usage.
    //
    // base: The base state at which to begin. If omitted, { } is used.
    //
    function Record(diff, apply, walk, window, base) {

        this.diff = diff;
        this.apply = apply;
        this.walk = walk;
        this.window = window;

        // Each item of the array below is an object
        // { time: <Number>, diff: <Change list> }
        // where
        // - time is the time at which the changelist was added
        // - diff is a changelist produced by diff()
        //
        this._record = [ ];

        // The base state, containing the oldest known state information.
        // The is the state from which all walks begin.
        //
        this._base = base || { };

        // The time the base state was recorded
        //
        this._basetime = 0.0;

        // The current state, against which new changes are diffed
        //
        this._current = this._base;

        // The time at which the current state was recorded
        //
        this._curtime = 0.0;

        // The time at which pack() was last called
        //
        this._lastpack = 0.0;

    }
    NZJS.Replay.Record = Record;

    // Adds new history to this record. 
    // Any history older than (time - this.window) will be automatically
    // deleted before new history is appended to this object.
    //
    // state: The state to add to this state _record
    // time: The simulation time at which to add the state to the _record.
    //       If omitted, the current time (NZJS.getTime()) is used.
    //
    Record.prototype.record = function(state, time) {

        if (time === undefined || time === null) {
            time = NZJS.getTime();
        }

        var changes = this.diff(this._current, state);

        if (changes.length > 0) {
            this._curtime = time;
            this._current = this.apply(this._current, changes);

            this._advanceBaseTo(time - this.window);
            this._insertEntry({ time: time, diff: changes });
        }
    }

    // Serializes history into a string and returns it. You can pass this
    // string to NZJS.Replay.Record.unpack() in order to copy this record's
    // state into another record, even if the other record is on a different
    // machine.
    //
    // since: The time at which to begin serializing. All history that was
    //        recorded after the time in this parameter will be serialized.
    //        If omitted, all history recorded since the last call to pack()
    //        will be serialized.
    //
    Record.prototype.pack = function(since) {

        if (since === undefined) {
            since = this._lastpack;
        }
        this._lastpack = NZJS.getTime();

        var output = [ ];
        for (var i = 0; i < this._record.length; ++i) {
            var entry = this._record[i];

            if (entry.time >= since) {
                output.push({ t:entry.time, d:entry.diff });
            }
        }

        return JSON.stringify(output);
    }

    // Deserializes history and stores it in this object.
    //
    // changes: History information generated by calling pack()
    //
    Record.prototype.unpack = function(changes) {

        var packed = JSON.parse(changes);

        for (var i = 0; i < packed.length; ++i) {

            var entry = packed[i];
            this._insertEntry({ time: entry.t, diff: entry.d });
        }
    }

    // Begins a non-rewindable walk of this record's state information over
    // time. The NZJS.Replay.Walk object returned allows you to get the
    // recorded state as it changed over time.
    //
    // start: The time at which to begin the walk. This value is a best effort:
    //        if there is no history information old enough to satisfy this
    //        value, the oldest available history information will be used.
    //
    Record.prototype.beginWalk = function(start) {

        return new NZJS.Replay.Walk(this, start);
    }

    // Advances this._base to the given time, deleting old history if needed
    //
    Record.prototype._advanceBaseTo = function(time) {

        if (this._record.length == 0) {
            // Nothing to do
            return;
        }

        this._basetime = this._record[0].time;

        while (this._record.length > 0 && this._record[0].time < time) {

            this._base = this.apply(this._base, this._record[0].diff);
            this._record.splice(0, 1);
        }
    }

    // Inserts an entry into this._record, making sure that entries are stored
    // in order of increaing time
    //
    Record.prototype._insertEntry = function(entry) {

        // Check if we can insert at the end (fast exit)
        var last = this._record[this._record.length - 1];
        if (last === undefined || last.time < entry.time) {

            this._record.push(entry);
            return;
        }

        // Figure out where in the _record to place the entry
        for (var i = this._record.length - 1; i >= 0; --i) {
            var other = this._record[i];

            if (other.time > entry.time) {
                this._record.splice(i, 0, entry);
                return;
            }
        }
    }

})(NZJS);
