
/*!
 * socket.io-zero
 * Copyright(c) 2011 Daniel D. Shaw <dshaw@dshaw.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var zmq = require('zmq')
  , redis = require('redis')
  , RedisClient = redis.RedisClient
  , socketio = require('socket.io')
  , RedisStore = socketio.RedisStore
  , Store = socketio.Store;

/**
 * Exports
 */

exports = module.exports = Zero;
Zero.Client = RedisStore.Client;

/**
 * Zero store.
 * Options:
 *     - nodeId (string!!!) an id that uniquely identifies this node
 
 *     - pub (string) zero mq publish endpoint string
 *     - sub (string) zero mq subcribe endpoint string
 *     - redisClient (object) options to pass to the general redis client
 
 *     - pack (fn) custom packing, defaults to JSON or msgpack if installed
 *     - unpack (fn) custom packing, defaults to JSON or msgpack if installed
 *
 * @api public
 */

function Zero (opts) {
  opts = opts || {};
  this.settings = opts;

  // node id to uniquely identify this node
  this.nodeId = opts.nodeId || (function () {
    // by default, we generate a random id 
    return Math.abs(Math.random() * Math.random() * Date.now() | 0);
  })();

  // packing / unpacking mechanism
  if (opts.pack) {
    this.pack = opts.pack;
    this.unpack = opts.unpack;
  } else {
    try {
      var msgpack = require('msgpack');
      this.pack = msgpack.pack;
      this.unpack = msgpack.unpack;
    } catch (e) {
      this.pack = JSON.stringify;
      this.unpack = JSON.parse;
    }
  }

  // define socket endpoints
  this.pubEndpoint = opts.pub || 'tcp://127.0.0.1:5555';
  this.subEndpoint = opts.sub || 'tcp://127.0.0.1:5556';

  // initialize pubsub
  this.pub = zmq.createSocket('pub');
  this.pub.connect(this.pubEndpoint);

  this.sub = zmq.createSocket('sub');
  this.sub.connect(this.subEndpoint);
  
  // initialize persistence for Zero.Client
  if (opts.redisClient instanceof RedisClient) {
    this.cmd = opts.redisClient;
  } else {
    opts.redisClient || (opts.redisClient = {});
    this.cmd = redis.createClient(opts.redisClient.port, opts.redisClient.host, opts.redisClient);
  }

  Store.call(this, opts);

  this.sub.setMaxListeners(0);
  this.setMaxListeners(0);
}

/**
 * Inherits from Store.
 */

Zero.prototype.__proto__ = Store.prototype;

/**
 * Publishes a message.
 *
 * @api private
 */

Zero.prototype.publish = function (name) {
  var args = Array.prototype.slice.call(arguments, 1);
  this.pub.send(name, this.pack({ nodeId: this.nodeId, name: name, args: args }));
  this.emit.apply(this, ['publish', name].concat(args));
};

/**
 * Subscribes to a channel
 *
 * @api private
 */

Zero.prototype.subscribe = function (name, consumer, fn) {
  this.sub.subscribe(name);

  if (consumer || fn) {
    var self = this;

    function message (ch, msg) {
      ch = ch && ch.toString('utf8');
      msg = msg && msg.toString('utf8');

      if (name == ch) {
        msg = self.unpack(msg);

        // check that the message consumed wasn't emitted by this node
        if (self.nodeId != msg.nodeId) {
          consumer.apply(null, msg.args);
        }
      }
    }

    this.sub.on('message', message);
  }

  this.emit('subscribe', name, consumer, fn);
};

/**
 * Unsubscribes
 *
 * @api private
 */

Zero.prototype.unsubscribe = function (name, fn) {
  this.sub.unsubscribe(name);

  if (fn) {
    var client = this.sub;

    client.on('unsubscribe', function unsubscribe (ch) {
      if (name == ch) {
        fn();
        client.removeListener('unsubscribe', unsubscribe);
      }
    });
  }

  this.emit('unsubscribe', name, fn);
};

/**
 * Destroys the store
 *
 * @api public
 */

Zero.prototype.destroy = function () {
  Store.prototype.destroy.call(this);

  this.pub.close();
  this.sub.close();
  this.cmd.end();
};
