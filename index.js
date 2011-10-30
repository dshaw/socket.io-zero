
/*!
 * socket.io-zero
 * Copyright(c) 2011 Daniel D. Shaw <dshaw@dshaw.com>
 * MIT Licensed
 */

/**
 * ZeroStore
 */

exports = module.exports = require('./lib/zero.js');

/**
 * Version
 */

exports.version = '0.1.0';

/**
 * ZeroStore Broker
 */

exports.Broker = require('./lib/broker.js');

/**
 * ZeroStore create Broker
 */

exports.createBroker = exports.Broker.createBroker;
