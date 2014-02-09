/*
 * netdebug.js
 *
 * A screen implementation for initial network debugging
 */

(function(NZJS) {
    'use strict';

    function NetDebugScreen(screens) {
        this.screens = screens;
    }
    NZJS.Screens = NZJS.Screens || { };
    NZJS.Screens.NetDebug = NetDebugScreen;

    function recordTest() {

        /*
         * ============================================
         * Input        ||  b1      b2      a1      a2
         * ============================================
         *              ||
         * State @t=0.0 ||  up      down    0.0     1.0
         * State @t=0.1 ||  up      down    0.1     0.7
         * State @t=0.2 ||  down    up      0.2     0.8
         * State @t=0.3 ||  up      down    0.1     0.9
         * State @t=0.4 ||  down    up      0.0     1.0
         *              ||
         * ============================================
         */

        // Create the input state
        var state = new NZJS.Input.State();
        state.addButton('b1', new NZJS.Input.ButtonSnapshot(false, false, false, false));
        state.addButton('b2', new NZJS.Input.ButtonSnapshot(true, false, false, false));
        state.addAxis('a1', new NZJS.Input.AxisSnapshot(0.0));
        state.addAxis('a2', new NZJS.Input.AxisSnapshot(1.0));

        // Record a few well-defined states
        var record = new NZJS.Input.Record(60.0);
        var otherRecord = new NZJS.Input.Record(60.0);

        record.record(state, 0.001);

        state.buttons['b1'].wasDown = false;
        state.buttons['b2'].wasDown = true;
        state.axes['a1'].value = 0.1;
        state.axes['a2'].value = 0.9;
        record.record(state, 0.1);

        otherRecord.unpack(record.pack(-.1));

        state.buttons['b1'].wasDown = true;
        state.buttons['b2'].wasDown = false;
        state.axes['a1'].value = 0.2;
        state.axes['a2'].value = 0.8;
        record.record(state, 0.2);

        state.buttons['b1'].wasDown = false;
        state.buttons['b2'].wasDown = true;
        state.axes['a1'].value = 0.1;
        state.axes['a2'].value = 0.9;
        record.record(state, 0.3);

        otherRecord.unpack(record.pack(0.1));

        state.buttons['b1'].wasDown = true;
        state.buttons['b2'].wasDown = false;
        state.axes['a1'].value = 0.0;
        state.axes['a2'].value = 1.0;
        record.record(state, 0.4);

        otherRecord.unpack(record.pack(0.3));
        record = otherRecord;

        // Make sure the walk has the right data
        var walk = record.beginWalk(0.0);
        var state = walk.state;

        if (state.down('b1')) throw new Error();
        if (state.down('b2')) throw new Error();
        if (state.value('a1')) throw new Error();
        if (state.value('a2')) throw new Error();

        walk.advanceTo(0.01);
        state = walk.state;
        if (!state.up('b1')) throw new Error();
        if (!state.down('b2')) throw new Error();
        if (state.value('a1') != 0.0) throw new Error();
        if (state.value('a2') != 1.0) throw new Error();

        walk.advanceTo(0.05);
        state = walk.state;
        if (!state.up('b1')) throw new Error();
        if (state.released('b1')) throw new Error();
        if (!state.down('b2')) throw new Error();
        if (state.pressed('b2')) throw new Error();
        if (state.value('a1') != 0.0) throw new Error();
        if (state.value('a2') != 1.0) throw new Error();

        walk.advanceTo(0.1);
        state = walk.state;
        if (!state.up('b1')) throw new Error();
        if (state.released('b1')) throw new Error();
        if (!state.down('b2')) throw new Error();
        if (state.pressed('b2')) throw new Error();
        if (state.value('a1') != 0.1) throw new Error();
        if (state.value('a2') != 0.9) throw new Error();

        walk.advanceTo(0.15);
        state = walk.state;
        if (!state.up('b1')) throw new Error();
        if (state.released('b1')) throw new Error();
        if (!state.down('b2')) throw new Error();
        if (state.pressed('b2')) throw new Error();
        if (state.value('a1') != 0.1) throw new Error();
        if (state.value('a2') != 0.9) throw new Error();

        walk.advanceTo(0.2);
        state = walk.state;
        if (!state.down('b1')) throw new Error();
        if (!state.pressed('b1')) throw new Error();
        if (!state.up('b2')) throw new Error();
        if (!state.released('b2')) throw new Error();
        if (state.value('a1') != 0.2) throw new Error();
        if (state.value('a2') != 0.8) throw new Error();

        walk.advanceTo(0.25);
        state = walk.state;
        if (!state.down('b1')) throw new Error();
        if (state.pressed('b1')) throw new Error();
        if (!state.up('b2')) throw new Error();
        if (state.released('b2')) throw new Error();
        if (state.value('a1') != 0.2) throw new Error();
        if (state.value('a2') != 0.8) throw new Error();

        walk.advanceTo(0.3);
        state = walk.state;
        if (!state.up('b1')) throw new Error();
        if (!state.released('b1')) throw new Error();
        if (!state.down('b2')) throw new Error();
        if (!state.pressed('b2')) throw new Error();
        if (state.value('a1') != 0.1) throw new Error();
        if (state.value('a2') != 0.9) throw new Error();

        walk.advanceTo(0.35);
        state = walk.state;
        if (!state.up('b1')) throw new Error();
        if (state.released('b1')) throw new Error();
        if (!state.down('b2')) throw new Error();
        if (state.pressed('b2')) throw new Error();
        if (state.value('a1') != 0.1) throw new Error();
        if (state.value('a2') != 0.9) throw new Error();

        walk.advanceTo(0.4);
        state = walk.state;
        if (!state.down('b1')) throw new Error();
        if (!state.pressed('b1')) throw new Error();
        if (!state.up('b2')) throw new Error();
        if (!state.released('b2')) throw new Error();
        if (state.value('a1') != 0.0) throw new Error();
        if (state.value('a2') != 1.0) throw new Error();

        walk.advanceTo(0.45);
        state = walk.state;
        if (!state.down('b1')) throw new Error();
        if (state.pressed('b1')) throw new Error();
        if (!state.up('b2')) throw new Error();
        if (state.released('b2')) throw new Error();
        if (state.value('a1') != 0.0) throw new Error();
        if (state.value('a2') != 1.0) throw new Error();
    }

    // Loads assets needed by this screen
    NetDebugScreen.prototype.init = function() { 
        this.isLoaded = true; // No assets required
        recordTest();
    }

    // Updates the screen's logic
    NetDebugScreen.prototype.tick = function(dt) { }

    // Renders this screen
    NetDebugScreen.prototype.draw = function(dt) { 
        var gl = NZJS.WebGL.gl;
        gl.clearColor(0.0, 0.5, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    }

    // Called before a screen is pushed above this screen
    NetDebugScreen.prototype.suspend = function() { }

    // Called when this screen is resumed after a screen above is popped
    NetDebugScreen.prototype.resume = function() { }


})(NZJS);
