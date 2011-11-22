/**
 * Module dependencies.
 */


var fs = require('fs')
  , http = require('http')
  , sio = require('socket.io')
  , RedisStore = sio.RedisStore
  , payload = require('./payload.json')

/**
 * Configuration.
 */

var port = parseInt(process.argv[2]) || 8124
  , nodeId = parseInt(process.argv[3]) || 0
  , html = fs.readFileSync(__dirname + '/client.html')
  , server = http.createServer(function(req, res) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(html);
    })
  , io = sio.listen(server)

server.listen(port)

/**
 * Socket.io server
 */

server.on('listening', function () {
  console.log('NodeId %d listening on :%d', nodeId, port);
  io.sockets.emit('socket.io node ' + nodeId + 'ready');
});

io.configure(function () {
  io.set('store', new RedisStore({ nodeId: function () { return nodeId } }));
  io.set('log level', false);
});


io.sockets.on('connection', function (socket) {
  if (nodeId == 1) {
    var runInterval = setInterval(function () {
      io.sockets.emit('payload', payload)
    }, 0) // as fast as you can

    setTimeout(function () {
      clearInterval(runInterval)
      io.sockets.emit('complete')
    }, 60*1000) // 1 minutes
  }

  socket.on('results', function (data) {
    console.log(data)
  });
});
