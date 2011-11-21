var mix = require('mixture').mix('zero.bench')

var count = process.argv[2] || 2
  , clients = process.argv[3] || 1
  , ioPort = 8880
  , nodeId = 0
  , clientId = 0
  , ports = []

// zmq broker
mix.task('broker').fork('../zero-broker.js')

// socket.io instances with zmq dispatch
var socketio = mix.task('socket.io', { filename: 'zero.js' })

// socket.io clients
var client = mix.task('socket.io client', { filename: 'client.js' })

for (var i = 0; i < count; i++) {
  ioPort++;
  nodeId++;
  socketio.fork({ args: [ioPort, nodeId] })
  setTimeout(function (ioPort, nodeId, clientId) {
    for (var j = 0; j < clients; j++) {
      console.log(ioPort, nodeId, clientId)
      client.fork({ args: [ioPort, nodeId, clientId] })
    }
  }, 1000, ioPort, nodeId, clientId)
}
