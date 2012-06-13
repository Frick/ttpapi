#Turntable Plus API (TTPAPI)

A simple wrapper for socket.io to interact with TT+ clients

## Installation
    npm install ttpapi

## Example Usage

This responds to a "help" event

### Client-side

```js
if (ttpapi.bot !== undefined && ttpapi.bot.auth === true) {
    // Send "help" event
    ttpapi.bot.emit('help', 'commands', function (data) {
        console.log(data);
    });
}
```

### Server-side

```js
var TTPAPI = require('ttpapi');
var ttpapi = new TTPAPI(port, options);

ttpapi.on('help', function (data, fn) {
    // Respond to "help" event
    if (data == 'commands') {
        fn({"help": "This command", "bonus": "Award an extra point to a deserving DJ"});
    } else if (data == 'something else') {
        fn("Appropriate Response");
    }
});
```

The above example would simply log to the console the "help" object passed to 'fn'.

In the client-side script, 'help' (the eventType) is the only required field.
The 'commands' parameter is data (string or JSON) that is to be passed to the server and can be ommitted.
The last paramter, a function, is a callback that can accept data returned by the server. This parameter is optional and can also be the second parameter if no data is to be sent to the server.


# Documentation

## Events

There are no out-of-the-box events... you create your own!

### on ( event:str, listener:fn )

Listen for the specified event and execute the listener with any supplied data (up to you!)
The scope of the listener function is the socket which triggered the event (this = socket)


## Actions

### new TTPAPI ( port=80:int [, options:obj] )

Returns a ttpapi instance and starts socket.io listening on 'port' (defaults to port 80)  
The 'options' object can contain any options that may be used with socket.io (ex: 'cert' and 'key' for SSL)
Additionally, 'room_url' and 'auth' fields may be supplied to enhance security
options.room_url can be a string representing the URL of the Turntable room that TTPAPI is listening for
options.auth can be a function that accepts a string containing the userid of the user connecting - this can be used to validate that a bot does see the user in the room before allowing a connection

### emit ( userid:str , event:str [, data:str|obj [, callback:fn]] )

Send "event" to "userid", optionally including some data or a callback function

### broadcast ( event:str [, data:str|obj] )

Send "event" to all users, optionally including some data

### getSocket ( userid:str )

Returns the socket for the specified userid or boolean false if that socket cannot be found

### getUserid ( socket:socket )

Returns the userid for the specified socket.io socket object
