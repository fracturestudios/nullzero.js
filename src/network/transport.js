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

            if (!datagram.what) {
                console.log('NZJS.Transport.Connection: packet ' + JSON.stringify(datagram));
                console.log('NJZS.Transport.Connection: is missing a "what" property');
            }
            else if (!datagram.data) {
                console.log('NZJS.Transport.Connection: packet ' + JSON.stringify(datagram));
                console.log('NJZS.Transport.Connection: is missing a "data" property');
            }
            else {
                this.onrecv(datagram.what, datagram.data);
            }
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
    // what - what type of data is being sent (e.g. 'InputState')
    // data - the data to send
    //
    Connection.prototype.onrecv = function(what, data) {
        console.log('NZJS.Transport.Connection: for: ' + what);
        console.log('NZJS.Transport.Connection: received: ' + JSON.stringify(data));
        console.log('NZJS.Transport.Connection: override onrecv() to suppress this message.');
    }

    // Sends a datagram to the other peer lossily.
    // If the packet is dropped mid-transit, it will not be retransmitted.
    // Thus, use this only for non-critical data, or when missing data
    // can be receovered from (e.g. game state frames).
    // This conection must be ready (this.ready() == true).
    // what - what type of data is being sent (e.g. 'InputState')
    // data - the data to send
    //
    Connection.prototype.send = function(what, data) {
        this.ucon.send({ what: what, data: data });
    }

    // Sends a datagram to the other peer losslessly.
    // The packet will be resent until it is acknowledged by the peer.
    // Thus, use this only for critical data, the loss of which cannot
    // be receoved from (e.g. signaling).
    // This conection must be ready (this.ready() == true).
    // what - what type of data is being sent (e.g. 'InputState')
    // data - the data to send
    //
    Connection.prototype.sendReliably = function(datagram) {
        this.rcon.send({ what: what, data: data });
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
