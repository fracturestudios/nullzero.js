/*
 * walk.js
 *
 * The replaying half of the record-replay data structure. Replays allow you to
 * get the recorded state over time. You can advance a walk at any rate you
 * want; the walk does not have to occur in real time.
 *
 * You may not rewind a walk: once advanced to a given time, you cannot query
 * the same walk object for a time before the time currently advanced to.
 * Instead, you must start a new walk using NZJS.Replay.Record.getWalk().
 *
 * Walks internally store a reference to the record data structure. This means
 * that if you store new data in the record that was used to start a walk,
 * every walk spawned from that record will automatically see the new history
 * information when being advanced. Thus, as long as there's new information,
 * you can continue a single walk indefinitely.
 */

;(function(NZJS) {
    'use strict';

    NZJS.Replay = NZJS.Replay || { };

    function Walk(record, start) {

        // The NZJS.Replay.Record object that spawned this object.
        //
        this._record = record;

        // The current state of this walk
        //
        this.state = this._record._base;

        // The current time position of this walk
        //
        this.time = this._record._basetime;

        this.advanceTo(start);
    }
    NZJS.Replay.Walk = Walk;

    // Advances this walk to the given time. It is an error to pass a time
    // earlier than this.time
    //
    Walk.prototype.advanceTo = function(time) {

        if (time < this.time) {
            throw new Error('You cannot rewind a Walk');
        }

        this._record.walk(this.state);

        for (var i = 0; i < this._record._record.length; ++i) {
            var entry = this._record._record[i];

            if (entry.time > time) {
                // Advanced as far as we need to
                break;
            }
            else if (entry.time > this.time) {
                this.state = this._record.apply(this.state, entry.diff);
            }
        }

        this.time = time;
    }

})(NZJS);
