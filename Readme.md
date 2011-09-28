Prototype 0MQ "Store" for Socket.io
=====================================

Since Socket.io Stores are actually a combination of dispatch and data store, this more precisely ZeroMQ dispatch and Redis-based persistance.

Caveat Emptor
--------

Until I can get [0MQ Forwarding Device](http://api.zeromq.org/2-1:zmq-device) support in `zeromq.node`, only one Socket.io server instance can publish!

Why?
--------

Because I was told that I shouldn't. :-)

Should I use it?
--------

Yes, hack with it.

Should I use it in production?
--------

No. Use the native RedisStore.

If you don't recommend this, why build it?
--------

To further test the extensibility of Socket.io Store.

Socket.io .7 introduced the concept of pluggable stores. When I implemented the first Redis Store, it quickly became apparent that asyncronous data operations and cross node pubsub were not possible within the context of the exsisting Store architecture. @guille rewrote RedisStore along with much of the internals that interact with the Stores. What we have now is a stronger foundation to build on, so this the first pass at doing so.


How do I use it?
--------

Check out the examples directory.
