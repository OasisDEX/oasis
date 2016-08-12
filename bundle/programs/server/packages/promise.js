(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;

/* Package-scope variables */
var Promise;

var require = meteorInstall({"node_modules":{"meteor":{"promise":{"server.js":["meteor-promise","./common.js","fibers",function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/promise/server.js                                                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
require("meteor-promise").makeCompatible(
  exports.Promise = require("./common.js").Promise,
  // Allow every Promise callback to run in a Fiber drawn from a pool of
  // reusable Fibers.
  require("fibers")
);

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"common.js":["promise/lib/es6-extensions",function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// packages/promise/common.js                                                                                       //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var global = this;

if (typeof global.Promise === "function") {
  exports.Promise = global.Promise;
} else {
  exports.Promise = require("promise/lib/es6-extensions");
}

exports.Promise.prototype.done = function (onFulfilled, onRejected) {
  var self = this;

  if (arguments.length > 0) {
    self = this.then.apply(this, arguments);
  }

  self.then(null, function (err) {
    Meteor._setImmediate(function () {
      throw err;
    });
  });
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"node_modules":{"meteor-promise":{"package.json":function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// ../npm/node_modules/meteor-promise/package.json                                                                  //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
exports.name = "meteor-promise";
exports.version = "0.7.2";
exports.main = "promise_server.js";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"promise_server.js":["assert","./fiber_pool.js",function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/promise/node_modules/meteor-promise/promise_server.js                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var assert = require("assert");
var fiberPool = require("./fiber_pool.js").makePool();

exports.makeCompatible = function (Promise, Fiber) {
  var es6PromiseThen = Promise.prototype.then;

  if (typeof Fiber === "function") {
    Promise.Fiber = Fiber;
  }

  // Replace Promise.prototype.then with a wrapper that ensures the
  // onResolved and onRejected callbacks always run in a Fiber.
  Promise.prototype.then = function (onResolved, onRejected) {
    var P = this.constructor;

    if (typeof P.Fiber === "function") {
      var fiber = P.Fiber.current;
      var dynamics = cloneFiberOwnProperties(fiber);

      return es6PromiseThen.call(
        this,
        wrapCallback(onResolved, P, dynamics),
        wrapCallback(onRejected, P, dynamics)
      );
    }

    return es6PromiseThen.call(this, onResolved, onRejected);
  };

  Promise.awaitAll = function (args) {
    return awaitPromise(this.all(args));
  };

  Promise.await = function (arg) {
    return awaitPromise(this.resolve(arg));
  };

  Promise.prototype.await = function () {
    return awaitPromise(this);
  };

  // Yield the current Fiber until the given Promise has been fulfilled.
  function awaitPromise(promise) {
    var Promise = promise.constructor;
    var Fiber = Promise.Fiber;

    assert.strictEqual(
      typeof Fiber, "function",
      "Cannot await unless Promise.Fiber is defined"
    );

    var fiber = Fiber.current;

    assert.ok(
      fiber instanceof Fiber,
      "Cannot await without a Fiber"
    );

    var run = fiber.run;
    var throwInto = fiber.throwInto;

    if (process.domain) {
      run = process.domain.bind(run);
      throwInto = process.domain.bind(throwInto);
    }

    // The overridden es6PromiseThen function is adequate here because these
    // two callbacks do not need to run in a Fiber.
    es6PromiseThen.call(promise, function (result) {
      tryCatchNextTick(fiber, run, [result]);
    }, function (error) {
      tryCatchNextTick(fiber, throwInto, [error]);
    });

    return Fiber.yield();
  }

  // Return a wrapper function that returns a Promise for the eventual
  // result of the original function.
  Promise.async = function (fn, allowReuseOfCurrentFiber) {
    var Promise = this;
    return function () {
      return Promise.asyncApply(
        fn, this, arguments,
        allowReuseOfCurrentFiber
      );
    };
  };

  Promise.asyncApply = function (
    fn, context, args, allowReuseOfCurrentFiber
  ) {
    var Promise = this;
    var Fiber = Promise.Fiber;
    var fiber = Fiber && Fiber.current;

    if (fiber && allowReuseOfCurrentFiber) {
      return this.resolve(fn.apply(context, args));
    }

    return fiberPool.run({
      callback: fn,
      context: context,
      args: args,
      dynamics: cloneFiberOwnProperties(fiber)
    }, Promise);
  };
};

function wrapCallback(callback, Promise, dynamics) {
  if (! callback) {
    return callback;
  }

  return function (arg) {
    return fiberPool.run({
      callback: callback,
      args: [arg], // Avoid dealing with arguments objects.
      dynamics: dynamics
    }, Promise);
  };
}

function cloneFiberOwnProperties(fiber) {
  if (fiber) {
    var dynamics = {};

    Object.keys(fiber).forEach(function (key) {
      dynamics[key] = shallowClone(fiber[key]);
    });

    return dynamics;
  }
}

function shallowClone(value) {
  if (Array.isArray(value)) {
    return value.slice(0);
  }

  if (value && typeof value === "object") {
    var copy = Object.create(Object.getPrototypeOf(value));
    var keys = Object.keys(value);
    var keyCount = keys.length;

    for (var i = 0; i < keyCount; ++i) {
      var key = keys[i];
      copy[key] = value[key];
    }

    return copy;
  }

  return value;
}

// Invoke method with args against object in a try-catch block,
// re-throwing any exceptions in the next tick of the event loop, so that
// they won't get captured/swallowed by the caller.
function tryCatchNextTick(object, method, args) {
  try {
    return method.apply(object, args);
  } catch (error) {
    process.nextTick(function () {
      throw error;
    });
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"fiber_pool.js":["assert",function(require,exports){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/promise/node_modules/meteor-promise/fiber_pool.js                                            //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
var assert = require("assert");

function FiberPool(targetFiberCount) {
  assert.ok(this instanceof FiberPool);
  assert.strictEqual(typeof targetFiberCount, "number");

  var fiberStack = [];

  function makeNewFiber(Fiber) {
    // Just in case someone tampers with Fiber.yield, don't let that interfere
    // with our processing of the callback queue.
    var originalYield = Fiber.yield;

    var fiber = new Fiber(function () {
      while (true) {
        // Call Fiber.yield() to await further instructions.
        var entry = originalYield.call(Fiber);

        // Ensure this Fiber is no longer in the pool once it begins to
        // execute an entry.
        assert.strictEqual(fiberStack.indexOf(fiber), -1);

        if (entry.dynamics) {
          // Restore the dynamic environment of this fiber as if
          // entry.callback had been wrapped by Meteor.bindEnvironment.
          Object.keys(entry.dynamics).forEach(function (key) {
            fiber[key] = entry.dynamics[key];
          });
        }

        try {
          var result = entry.callback.apply(
            entry.context || null,
            entry.args || []
          );

          setImmediate(entry.resolve.bind(entry, result));

        } catch (error) {
          entry.reject(error);
        }

        // Remove all own properties of the fiber before returning it to
        // the pool.
        Object.keys(fiber).forEach(function (key) {
          delete fiber[key];
        });

        if (fiberStack.length < targetFiberCount) {
          fiberStack.push(fiber);
        } else {
          // If the pool has already reached the target maximum number of
          // Fibers, don't bother recycling this Fiber.
          break;
        }
      }
    });

    // Run the new Fiber up to the first yield point, so that it will be
    // ready to receive entries.
    fiber.run();

    return fiber;
  }

  // Run the entry.callback function in a Fiber either taken from the pool
  // or created anew if the pool is empty. This method returns a Promise
  // for the eventual result of the entry.callback function.
  this.run = function (entry, Promise) {
    assert.strictEqual(typeof entry, "object");
    assert.strictEqual(typeof entry.callback, "function");

    if (typeof Promise.Fiber !== "function") {
      return new Promise(function (resolve) {
        resolve(entry.callback.apply(
          entry.context || null,
          entry.args
        ));
      });
    }

    var fiber = fiberStack.pop() || makeNewFiber(Promise.Fiber);

    var promise = new Promise(function (resolve, reject) {
      entry.resolve = resolve;
      entry.reject = reject;
    });

    fiber.run(entry);

    return promise;
  };

  // Limit the maximum number of idle Fibers that may be kept in the
  // pool. Note that the run method will never refuse to create a new
  // Fiber if the pool is empty; it's just that excess Fibers might be
  // thrown away upon completion, if the pool is full.
  this.setTargetFiberCount = function (limit) {
    assert.strictEqual(typeof limit, "number");

    targetFiberCount = Math.max(limit, 0);

    if (targetFiberCount < fiberStack.length) {
      // If the requested target count is less than the current length of
      // the stack, truncate the stack and terminate any surplus Fibers.
      fiberStack.splice(targetFiberCount).forEach(function (fiber) {
        fiber.reset();
      });
    }

    return this;
  };
}

// Call pool.drain() to terminate all Fibers waiting in the pool and
// signal to any outstanding Fibers that they should exit upon completion,
// instead of reinserting themselves into the pool.
FiberPool.prototype.drain = function () {
  return this.setTargetFiberCount(0);
};

exports.makePool = function (targetFiberCount) {
  return new FiberPool(targetFiberCount || 20);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]},"promise":{"lib":{"es6-extensions.js":["./core.js",function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/promise/node_modules/promise/lib/es6-extensions.js                                           //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
'use strict';

//This file contains the ES6 extensions to the core Promises/A+ API

var Promise = require('./core.js');

module.exports = Promise;

/* Static Functions */

var TRUE = valuePromise(true);
var FALSE = valuePromise(false);
var NULL = valuePromise(null);
var UNDEFINED = valuePromise(undefined);
var ZERO = valuePromise(0);
var EMPTYSTRING = valuePromise('');

function valuePromise(value) {
  var p = new Promise(Promise._61);
  p._81 = 1;
  p._65 = value;
  return p;
}
Promise.resolve = function (value) {
  if (value instanceof Promise) return value;

  if (value === null) return NULL;
  if (value === undefined) return UNDEFINED;
  if (value === true) return TRUE;
  if (value === false) return FALSE;
  if (value === 0) return ZERO;
  if (value === '') return EMPTYSTRING;

  if (typeof value === 'object' || typeof value === 'function') {
    try {
      var then = value.then;
      if (typeof then === 'function') {
        return new Promise(then.bind(value));
      }
    } catch (ex) {
      return new Promise(function (resolve, reject) {
        reject(ex);
      });
    }
  }
  return valuePromise(value);
};

Promise.all = function (arr) {
  var args = Array.prototype.slice.call(arr);

  return new Promise(function (resolve, reject) {
    if (args.length === 0) return resolve([]);
    var remaining = args.length;
    function res(i, val) {
      if (val && (typeof val === 'object' || typeof val === 'function')) {
        if (val instanceof Promise && val.then === Promise.prototype.then) {
          while (val._81 === 3) {
            val = val._65;
          }
          if (val._81 === 1) return res(i, val._65);
          if (val._81 === 2) reject(val._65);
          val.then(function (val) {
            res(i, val);
          }, reject);
          return;
        } else {
          var then = val.then;
          if (typeof then === 'function') {
            var p = new Promise(then.bind(val));
            p.then(function (val) {
              res(i, val);
            }, reject);
            return;
          }
        }
      }
      args[i] = val;
      if (--remaining === 0) {
        resolve(args);
      }
    }
    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.reject = function (value) {
  return new Promise(function (resolve, reject) {
    reject(value);
  });
};

Promise.race = function (values) {
  return new Promise(function (resolve, reject) {
    values.forEach(function(value){
      Promise.resolve(value).then(resolve, reject);
    });
  });
};

/* Prototype Methods */

Promise.prototype['catch'] = function (onRejected) {
  return this.then(null, onRejected);
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"core.js":["asap/raw",function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/promise/node_modules/promise/lib/core.js                                                     //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
'use strict';

var asap = require('asap/raw');

function noop() {}

// States:
//
// 0 - pending
// 1 - fulfilled with _value
// 2 - rejected with _value
// 3 - adopted the state of another promise, _value
//
// once the state is no longer pending (0) it is immutable

// All `_` prefixed properties will be reduced to `_{random number}`
// at build time to obfuscate them and discourage their use.
// We don't use symbols or Object.defineProperty to fully hide them
// because the performance isn't good enough.


// to avoid using try/catch inside critical functions, we
// extract them to here.
var LAST_ERROR = null;
var IS_ERROR = {};
function getThen(obj) {
  try {
    return obj.then;
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

function tryCallOne(fn, a) {
  try {
    return fn(a);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}
function tryCallTwo(fn, a, b) {
  try {
    fn(a, b);
  } catch (ex) {
    LAST_ERROR = ex;
    return IS_ERROR;
  }
}

module.exports = Promise;

function Promise(fn) {
  if (typeof this !== 'object') {
    throw new TypeError('Promises must be constructed via new');
  }
  if (typeof fn !== 'function') {
    throw new TypeError('not a function');
  }
  this._45 = 0;
  this._81 = 0;
  this._65 = null;
  this._54 = null;
  if (fn === noop) return;
  doResolve(fn, this);
}
Promise._10 = null;
Promise._97 = null;
Promise._61 = noop;

Promise.prototype.then = function(onFulfilled, onRejected) {
  if (this.constructor !== Promise) {
    return safeThen(this, onFulfilled, onRejected);
  }
  var res = new Promise(noop);
  handle(this, new Handler(onFulfilled, onRejected, res));
  return res;
};

function safeThen(self, onFulfilled, onRejected) {
  return new self.constructor(function (resolve, reject) {
    var res = new Promise(noop);
    res.then(resolve, reject);
    handle(self, new Handler(onFulfilled, onRejected, res));
  });
};
function handle(self, deferred) {
  while (self._81 === 3) {
    self = self._65;
  }
  if (Promise._10) {
    Promise._10(self);
  }
  if (self._81 === 0) {
    if (self._45 === 0) {
      self._45 = 1;
      self._54 = deferred;
      return;
    }
    if (self._45 === 1) {
      self._45 = 2;
      self._54 = [self._54, deferred];
      return;
    }
    self._54.push(deferred);
    return;
  }
  handleResolved(self, deferred);
}

function handleResolved(self, deferred) {
  asap(function() {
    var cb = self._81 === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      if (self._81 === 1) {
        resolve(deferred.promise, self._65);
      } else {
        reject(deferred.promise, self._65);
      }
      return;
    }
    var ret = tryCallOne(cb, self._65);
    if (ret === IS_ERROR) {
      reject(deferred.promise, LAST_ERROR);
    } else {
      resolve(deferred.promise, ret);
    }
  });
}
function resolve(self, newValue) {
  // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
  if (newValue === self) {
    return reject(
      self,
      new TypeError('A promise cannot be resolved with itself.')
    );
  }
  if (
    newValue &&
    (typeof newValue === 'object' || typeof newValue === 'function')
  ) {
    var then = getThen(newValue);
    if (then === IS_ERROR) {
      return reject(self, LAST_ERROR);
    }
    if (
      then === self.then &&
      newValue instanceof Promise
    ) {
      self._81 = 3;
      self._65 = newValue;
      finale(self);
      return;
    } else if (typeof then === 'function') {
      doResolve(then.bind(newValue), self);
      return;
    }
  }
  self._81 = 1;
  self._65 = newValue;
  finale(self);
}

function reject(self, newValue) {
  self._81 = 2;
  self._65 = newValue;
  if (Promise._97) {
    Promise._97(self, newValue);
  }
  finale(self);
}
function finale(self) {
  if (self._45 === 1) {
    handle(self, self._54);
    self._54 = null;
  }
  if (self._45 === 2) {
    for (var i = 0; i < self._54.length; i++) {
      handle(self, self._54[i]);
    }
    self._54 = null;
  }
}

function Handler(onFulfilled, onRejected, promise){
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, promise) {
  var done = false;
  var res = tryCallTwo(fn, function (value) {
    if (done) return;
    done = true;
    resolve(promise, value);
  }, function (reason) {
    if (done) return;
    done = true;
    reject(promise, reason);
  })
  if (!done && res === IS_ERROR) {
    done = true;
    reject(promise, LAST_ERROR);
  }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]},"node_modules":{"asap":{"raw.js":["domain",function(require,exports,module){

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                  //
// node_modules/meteor/promise/node_modules/promise/node_modules/asap/raw.js                                        //
//                                                                                                                  //
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                    //
"use strict";

var domain; // The domain module is executed on demand
var hasSetImmediate = typeof setImmediate === "function";

// Use the fastest means possible to execute a task in its own turn, with
// priority over other events including network IO events in Node.js.
//
// An exception thrown by a task will permanently interrupt the processing of
// subsequent tasks. The higher level `asap` function ensures that if an
// exception is thrown by a task, that the task queue will continue flushing as
// soon as possible, but if you use `rawAsap` directly, you are responsible to
// either ensure that no exceptions are thrown from your task, or to manually
// call `rawAsap.requestFlush` if an exception is thrown.
module.exports = rawAsap;
function rawAsap(task) {
    if (!queue.length) {
        requestFlush();
        flushing = true;
    }
    // Avoids a function call
    queue[queue.length] = task;
}

var queue = [];
// Once a flush has been requested, no further calls to `requestFlush` are
// necessary until the next `flush` completes.
var flushing = false;
// The position of the next task to execute in the task queue. This is
// preserved between calls to `flush` so that it can be resumed if
// a task throws an exception.
var index = 0;
// If a task schedules additional tasks recursively, the task queue can grow
// unbounded. To prevent memory excaustion, the task queue will periodically
// truncate already-completed tasks.
var capacity = 1024;

// The flush function processes all tasks that have been scheduled with
// `rawAsap` unless and until one of those tasks throws an exception.
// If a task throws an exception, `flush` ensures that its state will remain
// consistent and will resume where it left off when called again.
// However, `flush` does not make any arrangements to be called again if an
// exception is thrown.
function flush() {
    while (index < queue.length) {
        var currentIndex = index;
        // Advance the index before calling the task. This ensures that we will
        // begin flushing on the next task the task throws an error.
        index = index + 1;
        queue[currentIndex].call();
        // Prevent leaking memory for long chains of recursive calls to `asap`.
        // If we call `asap` within tasks scheduled by `asap`, the queue will
        // grow, but to avoid an O(n) walk for every task we execute, we don't
        // shift tasks off the queue after they have been executed.
        // Instead, we periodically shift 1024 tasks off the queue.
        if (index > capacity) {
            // Manually shift all values starting at the index back to the
            // beginning of the queue.
            for (var scan = 0, newLength = queue.length - index; scan < newLength; scan++) {
                queue[scan] = queue[scan + index];
            }
            queue.length -= index;
            index = 0;
        }
    }
    queue.length = 0;
    index = 0;
    flushing = false;
}

rawAsap.requestFlush = requestFlush;
function requestFlush() {
    // Ensure flushing is not bound to any domain.
    // It is not sufficient to exit the domain, because domains exist on a stack.
    // To execute code outside of any domain, the following dance is necessary.
    var parentDomain = process.domain;
    if (parentDomain) {
        if (!domain) {
            // Lazy execute the domain module.
            // Only employed if the user elects to use domains.
            domain = require("domain");
        }
        domain.active = process.domain = null;
    }

    // `setImmediate` is slower that `process.nextTick`, but `process.nextTick`
    // cannot handle recursion.
    // `requestFlush` will only be called recursively from `asap.js`, to resume
    // flushing after an error is thrown into a domain.
    // Conveniently, `setImmediate` was introduced in the same version
    // `process.nextTick` started throwing recursion errors.
    if (flushing && hasSetImmediate) {
        setImmediate(flush);
    } else {
        process.nextTick(flush);
    }

    if (parentDomain) {
        domain.active = process.domain = parentDomain;
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}]}}}}}}}},{"extensions":[".js",".json"]});
var exports = require("./node_modules/meteor/promise/server.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.promise = exports, {
  Promise: Promise
});

})();

//# sourceMappingURL=promise.js.map
