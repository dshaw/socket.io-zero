  var fs = require('fs')
  , http = require('http')
  , sio = require('socket.io')
  , ZeroStore = require('../')

  , simple = fs.readFileSync(__dirname + '/simple.html')
  , server = http.createServer(function(req, res) {
      res.writeHead(200, {"Content-Type": "text/html"});
      res.end(simple);
    })
  , io = sio.listen(server)
  , port = process.argv[2] || 8124
  , zmqAddr = 'tcp://127.0.0.1:9000'

server.listen(port);

console.log('version', sio.version);

io.configure(function () {
  io.set('store', new ZeroStore({ address: zmqAddr }));
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
