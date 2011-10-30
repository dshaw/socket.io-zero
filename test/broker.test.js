var zmq = require('zmq')
  , broker = require('..').createBroker()
  , tap = require('tap')
  , test = tap.test;

test('data brokered from source to destination', function (t) {
    t.plan(2);

    var event = 'dispatch'
      , data = '{"nodeId":1,"name":"dispatch","args":["","5:::{\"name\":\"socket.io zmq node ready\",\"args\":[1]}",null,[]]}';

    var pub = zmq.createSocket('pub')
      , sub = zmq.createSocket('sub');

    pub.connect(broker.source);
    sub.connect(broker.dest);

    sub.subscribe('');
    sub.on('message', function (name, msg) {
      t.equal(name.toString('utf8'), event);
      t.equal(data.toString('utf8'), data);
      t.end();
    });

    pub.send(event, data);
});
