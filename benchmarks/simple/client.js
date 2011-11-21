/**
 * Module dependencies
 */

var io = require('socket.io-client')

/**
 * Configuration.
 */

var host = 'localhost'
  , port = process.argv[2] || 8124
  , uri = 'http://' + host + ':' + port
  , nodeId = process.argv[3] || 0
  , clientId = process.argv[4] || 0
  , payloads = 0


/**
 * Socket.io Client
 */

var socket = io.connect(uri);

socket.on('connect', function () {
  console.log('nodeId', nodeId, 'clientId', clientId, 'connected')
})

socket.on('payload', function () {
  payloads++;
  console.log('nodeId', nodeId, 'clientId', clientId, 'payloads', payloads)
})

socket.on('complete', function () {
  socket.emit('results', {
      nodeId: nodeId
    , clientId: clientId
    , payloads: payloads
  })
  socket.disconnect()
})
