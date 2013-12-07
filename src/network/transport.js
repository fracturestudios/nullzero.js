/*
 * transport.js
 *
 * Implements the WebRTC-driven Transport Layer of the layered multiplayer
 * model. 
 */

;(function(NZJS) {

    NZJS.Transport = { };

    // A transport-layer connection, which allows packets to optionally
    // be sent reliably or unreliably. Under the hood, this is accomplished
    // by wrapping two WebRTC connections: a reliable one and an unreliable
    // one.
    //
    function Connection(reliableConn, unreliableConn) {

        this.rcon = reliableConn;
        this.ucon = unreliableConn;

        this.rcon.onrecv = this.ucon.onrecv = function(datagram) {
            this.onrecv(datagram);
        }
    }

    NZJS.Transport.Connection = Connection;

    // Gets a value indicating whether this connection is ready to
    // send/receive data. If this connection is not ready, you 
    // should not use it to send data (the data may not be sent,
    // even if you call sendReliabily())
    //
    Connection.prototype.ready = function() {
        return this.ucon.state == NZJS.RTC.ConnectionState.Opened &&
               this.rcon.state == NZJS.RTC.ConnectionState.Opened;
    }

    // Event handler fired when a datagram is received.
    // The default stub prints a warning about the unhandled event.
    //
    Connection.prototype.onrecv = function(datagram) {
        console.log('NZJS.Transport.Connection: received: ' + JSON.stringify(datagram));
        console.log('NZJS.Transport.Connection: override onrecv() to suppress this message.');
    }

    // Sends a datagram to the other peer lossily.
    // If the packet is dropped mid-transit, it will not be retransmitted.
    // Thus, use this only for non-critical data, or when missing data
    // can be receovered from (e.g. game state frames).
    // This conection must be ready (this.ready() == true).
    //
    Connection.prototype.send = function(datagram) {
        this.ucon.send(datagram);
    }

    // Sends a datagram to the other peer losslessly.
    // The packet will be resent until it is acknowledged by the peer.
    // Thus, use this only for critical data, the loss of which cannot
    // be receoved from (e.g. signaling).
    // This conection must be ready (this.ready() == true).
    //
    Connection.prototype.sendReliably = function(datagram) {
        this.rcon.send(datagram);
    }

    // Closes this connection permanently
    //
    Connection.prototype.close = function() {
        this.ucon.close();
        this.rcon.close();
    }

    // Creates two NZJS.Transport.Connection objects connected to
    // each other via a local connection. Returns a two-element
    // list containing the connection objects created.
    //
    NZJS.Transport.createLocalConnections = function() {

        var left = new Connection(new NZJS.RTC.Connection(true),
                                  new NZJS.RTC.Connection(false));

        var right = new Connection(new NZJS.RTC.Connection(true),
                                   new NZJS.RTC.Connection(false));

        left.ucon.localConnectTo(right.ucon);
        left.rcon.localConnectTo(right.rcon);

        return [ left, right ];
    }

})(NZJS);
