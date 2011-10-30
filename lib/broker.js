
/*!
 * socket.io-zero
 * Copyright(c) 2011 Daniel D. Shaw <dshaw@dshaw.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var zmq = require('zmq');

/**
 * Exports
 */

exports = module.exports = Broker;
exports.createBroker = function (opts) { return new Broker(opts); };

/**
 * Broker
 * 
 * @param opts
 * @api public
 */

function Broker (opts) {
  opts = opts || {};
  this.settings = opts;
  this.debug = ('undefined' != typeof opts.debug) ? opts.debug : true;

  // configure endpoints
  this.source = opts.source || 'tcp://127.0.0.1:5555';
  this.dest = opts.dest || 'tcp://127.0.0.1:5556';

  // initialize pubsub
  this.pub = zmq.createSocket('pub');
  this.sub = zmq.createSocket('sub');

  this.init();
}

/**
 * Init broker.
 */

Broker.prototype.init = function () {
  var self = this;

  // bind subscriber
  this.sub.bind(this.source, function(err) {
    if (err) console.error(err);
    self.sub.subscribe('');
    self.sub.on('message', function(name, data) {
      if (self.debug) console.log('BSUB:', name.toString('utf8'), data.toString('utf8'));
      self.pub.send(name, data);
	  });
  });

  // bind publisher
  this.pub.bind(this.dest, function(err) {
    if (err) console.error(err);
    self.pub.on('message', function(name, data) {
      if (self.debug) console.log('BPUB:', name.toString('utf8'), data.toString('utf8'));
    });
  });

  console.log('Broker initialized.');
};
