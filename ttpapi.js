var https  = require('https')
  , io     = require('socket.io');

var TTPAPI = function () {
    var self      = this;
    this._port    = (typeof arguments[0] === 'number' && arguments[0] % 1 === 0) ? arguments[0] : 80;
    this._options = (Object.prototype.toString.call(arguments[1]) === '[object Object]') ? arguments[1] : {};
    this._io      = io.listen(this._port, this._options);
    this._users   = {};
    this._events  = [];

    this._io.disable('browser client');
    this._io.set('log level', 1);
    this._io.set('transports', ['websocket', 'xhr-polling']);
    this._io.set('authorization', function (data, callback) {
        if (self._options.room_url !== undefined && data.headers.referer.substr(data.headers.referer.lastIndexOf('/') + 1) !== self._options.room_url) {
			callback(null, false);
		} else {
			callback(null, true);
		}
    });

    this._io.sockets.on('connection', function (socket) {
        var id = socket.id,
            x;

        self._users[id] = {
            socket: socket,
            auth:   false,
            userid: null
        };

        socket.on('disconnect', function() {
            delete self._users[id];
        });

        socket.on('auth', function (data, resObj) {
            var authValid;
            if (resObj === undefined) {
                socket.emit('message', {success: false, re: 'auth', error: "You require an update to TT+. Please install - http://turntableplus.fm/downloads/latest.crx", log: true, alert: true});
                socket.disconnect();
                return;
            }
            if (typeof self._options.auth === 'function' && self._options.auth(data.userid) !== true) {
                resObj({success: false, error: "Bot-level authentication failed.", log: true, alert: false});
                socket.disconnect();
                return;
            } else if (typeof data.auth !== "string" || data.auth.length !== 40) {
                resObj({success: false, error: "Auth is not valid.", log: true, alert: false});
                socket.disconnect();
                return;
            }
            https.get({host: "bots.turntableplus.fm", port: 443, path: "/auth/u/" + data.userid + "/a/" + data.auth}, function (authResponse) {
                var json = '';
                authResponse.on('data', function (chunk) {
                    json += chunk.toString();
                });
                authResponse.on('end', function () {
                    try {
                        json = JSON.parse(json);
                        if (json.success === true) {
                            self._users[id].auth = true;
                            self._users[id].userid = data.userid;
                            socket.set('auth', true);
                            socket.set('userid', data.userid);
                            resObj({success: true});
                        } else {
                            json.log = true;
                            json.alert = false;
                            resObj(json);
                            socket.disconnect();
                        }
                    } catch (e) {
                        resObj({success: false, error: "Unknown authentication error.", log: true, alert: false});
                        socket.disconnect();
                    }
                });
            });
        });
    });
};

TTPAPI.prototype.on = function (eventType, listener) {
    this._io.on('connection', function (socket) {
        socket.on(eventType, function () {
            listener.apply(socket, arguments);
        });
    });
};

TTPAPI.prototype.emit = function () {
    var args = [].slice.call(arguments), socket;
    socket = this.getSocket(args.shift());
    if (socket !== null) {
        socket.emit(args);
    }
};

TTPAPI.prototype.broadcast = function () {
    this._io.sockets.emit(arguments);
};

TTPAPI.prototype.getSocket = function (userid) {
    var x, user;
    for (x in this._users) {
        user = this._users[x];
        if (user.hasOwnProperty('userid') === true && user.userid === userid && user.hasOwnProperty('auth') === true && user.auth === true) {
            return user.socket;
        }
    }
    return null;
};

TTPAPI.prototype.getUserid = function (socket) {
    if (typeof socket === 'object' && socket.hasOwnProperty('id') === true && this._users[socket.id] !== undefined) {
        return this._users[socket.id].userid;
    } else {
        return false;
    }
}

exports.TTPAPI = TTPAPI;
