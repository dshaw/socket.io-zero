var mix = require('mixture').mix('socket.io-zero_simple_example')

var count = process.argv[2] || 4 // maxes out locally at ~82
  , ioPort = 8880

// zmq broker
mix.task('broker').fork('simple-broker.js')

// socket.io instances with zmq dispatch
var socketio = mix.task('socket.io', { filename: 'simple.js' })

for (var i = 0; i < count; i++) {
  ioPort++;
  var worker = socketio.fork({ args: [ioPort] })
}
