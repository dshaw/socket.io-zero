/**
 * Module dependencies.
 */

var sio = require('socket.io')
  , RedisStore = sio.RedisStore
  , payload = require('./payload.json')

/**
 * Configuration.
 */

var port = parseInt(process.argv[2]) || 8124
  , nodeId = parseInt(process.argv[3]) || 0
  , io = sio.listen(port)

/**
 * Socket.io server
 */

io.on('listening', function () {
  console.log('NodeId %d listening on :%d', nodeId, port);
  io.sockets.emit('socket.io node ' + nodeId + 'ready');
});

io.configure(function () {
  io.set('store', new RedisStore({ nodeId: function () { return nodeId } }));
});

if (nodeId == 1) {
  io.sockets.once('connection', function (socket) {
    var runInterval = setInterval(function () {
      socket.emit('payload', payload)
    }, 250) // as fast as you can

    console.log(runInterval)
    clearInterval(runInterval)
    
    setTimeout(function () {
      clearInterval(runInterval)
      socket.emit('complete')
    }, 1000) // 1 minutes
  });
}

io.sockets.on('connection', function (socket) {
  socket.on('results', function (data) {
    console.log(data)
  });
});
