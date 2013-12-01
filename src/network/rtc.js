/*
 * rtc.js
 *
 * A small WebRTC wrapper for establishing and utilizing RTCDataChannel.
 *
 * Currently this wrapper only supports 'local' connections between two
 * NZJS.RTC.Connection objects running in the same tab. This is because WebRTC,
 * although peer-to-peer, requires an external 'broker' mechanism to help two
 * clients find each other. In the future, nullzero.js will use a WebSocket
 * connection to the matchmaking server as this brokering mechanism.
 */

;(function(NZJS, window) {
    'use strict';

    NZJS.RTC = { };

    // Browser-independent wrapper for creating an RTCPeerConnection
    // servers: the servers to use to establish the connection
    // opt: the options dict to pass to the constructor
    //
    function newPeerConnection(servers, opt) { 

        var RTCPeerConnection = window.RTCPeerConnection ||
                                window.webkitRTCPeerConnection ||
                                window.mozRTCPeerConnection;

        if (!RTCPeerConnection) {
            console.log('This browser does not support WebRTC! (RTCPeerConnection is undefined)');
            return null;
        }

        return new RTCPeerConnection(servers, opt);
    }

    // Initializes the nzjs WebRTC wrapper
    // Called by init() in main.js
    //
    NZJS.RTC.init = function() { 

        // Make sure WebRTC is supported
        if (!newPeerConnection(null, null)) {
            throw new Error('No WebRTC support');
        }
    }
    
    // Enumerates the possible states of an NZJS.RTC.Connection
    //
    var ConnectionState = {
        Closing: 0,
        Closed: 1,
        Opening: 2,
        Open: 3
    };
    NZJS.RTC.ConnectionState = ConnectionState;

    // Allows reliable or unreliable communication over WebRTC
    // isReliable: whether to retransmit packets that are probably lost
    //
    function Connection(isReliable) {

        var opt = { optional: [ { RtpDataChannels: true } ] };
        var conn = newPeerConnection(null, opt);
        if (!conn) {
            throw new Error('Unable to create RTCPeerConnection');
        }

        this.conn = conn;
        this.isReliable = isReliable;
        this.state = ConnectionState.Closed;
    }
    NZJS.RTC.Connection = Connection;

    // Establishes a local connection (for development/debugging) to another
    // NZJS.RTC.Connection in memory. Allows two WebRTC peers to run in the
    // same browser tab without requiring a matchmaking server.
    //
    // Connecting is an asynchronous operation. When this method returns, both
    // connections' states will be Opening. When connection completes, this
    // state will be changed to Open, meaning the connections can be used to
    // communicate with each other. No writes are allowed to the connections
    // before then.
    //
    Connection.prototype.localConnectTo = function(other) {
        this.state = ConnectionState.Opening;
        other.state = ConnectionState.Opening;

        var caller = this;
        var callee = other;

        var callerc = this.conn;
        var calleec = other.conn;

        // Create the data channels. Note createDataChannel() _must_ be called
        // before connection setup -- presumably the data channel is included
        // in the session description or something
        calleec.ondatachannel = function(ev) {
            callee._setDataChannel(ev.channel);
        }

        var opt = { reliable: this.isReliable, ordered: false };
        caller._setDataChannel(callerc.createDataChannel('nzjs', opt));

        // Set up callbacks for ICE candidate selection
        callerc.onicecandidate = function(ev) {
            if (ev.candidate) {
                calleec.addIceCandidate(ev.candidate);
            }
        }
        calleec.onicecandidate = function(ev) {
            if (ev.candidate) {
                callerc.addIceCandidate(ev.candidate);
            }
        }

        // Start establishing the connection
        function logError(err) {
            throw new Error('Problem establishing WebRTC connection: ' + 
                             err.name + ': ' + err.message);
        }

        callerc.createOffer(function(desc) {

        // Set the caller's session description
        callerc.setLocalDescription(desc, function() {
        calleec.setRemoteDescription(desc, function() {

        // Accept the connection
        calleec.createAnswer(function (desc) {

        // Set the callee's session description
        calleec.setLocalDescription(desc, function() {
        callerc.setRemoteDescription(desc, function() { 

        }, logError);
        }, logError);
        }, logError);
        }, logError);
        }, logError);
        }, logError);
    }

    // Event handler fired when a datagram is received.
    // The default stub prints a warning about the unhandled event.
    //
    Connection.prototype.onrecv = function(datagram) {
        console.log('NZJS.RTC.Connection: received: ' + JSON.stringify(datagram));
        console.log('NZJS.RTC.Connection: override onrecv() to suppress this message.');
    }

    // Sends a datagram to the other peer
    // This connection's state (NZJS.Connection.state) must be Opened
    //
    Connection.prototype.send = function(datagram) {
        this.data.send(JSON.stringify(datagram));
    }

    Connection.prototype.close = function() {
        this.state = ConnectionState.Closing;

        this.data.close();
        this.data = null;
        this.conn.close();

        this.state = ConnectionState.Closed;
    }

    // Private method. Sets this connection's data channel to [data], also
    // setting up any event handlers needed.
    //
    Connection.prototype._setDataChannel = function(data) {
        var self = this;
        self.data = data;

        data.onopen = function(e) {
            self.state = ConnectionState.Open;
        }

        data.onclose = function(e) {
            self.state = ConnectionState.Closed;
        }

        data.onmessage = function(e) {
            if (self.onrecv) {
                var datagram = JSON.parse(e.data);
                self.onrecv(datagram);
            }
        }
    }

})(NZJS, window);
