var fs = require('fs')
  , http = require('http')
  , sio = require('socket.io')
  , ZeroStore = require('..')
  , simple = fs.readFileSync(__dirname + '/simple.html')
  , server = http.createServer(function(req, res) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(simple);
    })
  , io = sio.listen(server)
  , port = process.argv[2] || 8124;

server.listen(port);

server.on('listening', function () {
  var nodeId = io.sockets.manager.store.nodeId;
  console.log('NodeId %d listening on :%d', nodeId, port);
  io.sockets.emit('socket.io node ' + nodeId + 'ready');
});

io.configure(function () {
  io.set('store', new ZeroStore);
});

io.sockets.on('connection', function (socket) {
  socket.send('>> simple socket.io server');
  socket.broadcast.send('new connection ' + socket.id);

  socket.on('message', function (data) {
    console.log('message:', data);
    // echo it back to the client
    socket.send(data);
    socket.broadcast.emit('broadcast', data);
  });
  
  socket.on('disconnect', function () {
    console.log('disconnect', arguments);
  });
});
