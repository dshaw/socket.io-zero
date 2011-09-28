
/*!
 * socket.io-zero
 * Copyright(c) 2011 Daniel Shaw <dshaw@dshaw.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var zmq = require("zmq")
  , redis = require('redis')
  , RedisClient = redis.RedisClient
  , Store = require('socket.io').Store

/**
 * Exports
 */

exports = module.exports = Zero;
Zero.Client = Client;

/**
 * Zero store.
 * Options:
 *     - nodeId (string!!!) an id that uniquely identifies this node
 
 *     - address (string) zero mq address string
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

  // initialize pubsub
  this.pub = zmq.createSocket('pub');
  this.pub.bind(opts.address, function () {});
//  this.pub.bind(opts.address, function (err) { if (err) console.error(err) });

  this.sub = zmq.createSocket('sub');
  this.sub.connect(opts.address);
  
  // initialize persistence for Zero.Client
  if (opts.redisClient instanceof RedisClient) {
    this.cmd = opts.redisClient;
  } else {
    opts.redisClient || (opts.redisClient = {});
    this.cmd = redis.createClient(opts.redisClient.port, opts.redisClient.host, opts.redisClient);
  }

  Store.call(this, opts);
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
      ch = ch.toString('utf8');
      msg = msg.toString('utf8');
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

/**
 * Client constructor
 *
 * @api private
 */

function Client (store, id) {
  Store.Client.call(this, store, id);
}

/**
 * Inherits from Store.Client
 */

Client.prototype.__proto__ = Store.Client;

/**
 * Zero hash get
 *
 * @api private
 */

Client.prototype.get = function (key, fn) {
  if (!Array.isArray(key)) {
    this.store.cmd.hget(this.id, key, fn);
  } else {
    var self = this;
    this.store.cmd.hmget.apply(this.store.cmd, [this.id].concat(key, function(err, res) {
      if (err) return fn(err);
      var hash = key.reduce(function(acc, k, i) {
          acc[k] = res[i];
          return acc;
        }, {});
      fn(null, hash);
    }));
  }

  return this;
};

/**
 * Redis persistance hash set
 *
 * @api private
 */

Client.prototype.set = function (key, value, fn) {
  fn || (fn = noop);
  this.store.cmd.hset(this.id, key, value, fn);
  return this;
};

/**
 * Redis persistance hash del
 *
 * @api private
 */

Client.prototype.del = function (key, fn) {
  this.store.cmd.hdel(this.id, key, fn);
  return this;
};

/**
 * Redis hash has
 *
 * @api private
 */

Client.prototype.has = function (key, fn) {
  this.store.cmd.hexists(this.id, key, function (err, has) {
    if (err) return fn(err);
    fn(null, !!has);
  });
  return this;
};

/**
 * Destroys client
 *
 * @param {Number} number of seconds to expire data
 * @api private
 */

Client.prototype.destroy = function (expiration) {
  if ('number' != typeof expiration) {
    this.store.cmd.del(this.id);
  } else {
    this.store.cmd.expire(this.id, expiration);
  }

  return this;
};

/** 
 * Utilities
 */

/**
 * Noop function
 * 
 * @api private
 */

function noop () {};
