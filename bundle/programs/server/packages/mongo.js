(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var NpmModuleMongodb = Package['npm-mongo'].NpmModuleMongodb;
var NpmModuleMongodbVersion = Package['npm-mongo'].NpmModuleMongodbVersion;
var AllowDeny = Package['allow-deny'].AllowDeny;
var Random = Package.random.Random;
var EJSON = Package.ejson.EJSON;
var _ = Package.underscore._;
var LocalCollection = Package.minimongo.LocalCollection;
var Minimongo = Package.minimongo.Minimongo;
var DDP = Package['ddp-client'].DDP;
var DDPServer = Package['ddp-server'].DDPServer;
var Tracker = Package.tracker.Tracker;
var Deps = Package.tracker.Deps;
var DiffSequence = Package['diff-sequence'].DiffSequence;
var MongoID = Package['mongo-id'].MongoID;
var check = Package.check.check;
var Match = Package.check.Match;
var ECMAScript = Package.ecmascript.ECMAScript;
var MaxHeap = Package['binary-heap'].MaxHeap;
var MinHeap = Package['binary-heap'].MinHeap;
var MinMaxHeap = Package['binary-heap'].MinMaxHeap;
var Hook = Package['callback-hook'].Hook;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;
var Symbol = Package['ecmascript-runtime'].Symbol;
var Map = Package['ecmascript-runtime'].Map;
var Set = Package['ecmascript-runtime'].Set;
var meteorBabelHelpers = Package['babel-runtime'].meteorBabelHelpers;
var Promise = Package.promise.Promise;

/* Package-scope variables */
var MongoInternals, MongoTest, MongoConnection, mongoResult, CursorDescription, Cursor, listenAll, forEachTrigger, OPLOG_COLLECTION, idForOp, OplogHandle, ObserveMultiplexer, ObserveHandle, DocFetcher, PollingObserveDriver, OplogObserveDriver, LocalCollectionDriver, Mongo;

var require = meteorInstall({"node_modules":{"meteor":{"mongo":{"mongo_driver.js":["babel-runtime/helpers/typeof",function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/mongo_driver.js                                                                                     //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var _typeof;module.import('babel-runtime/helpers/typeof',{"default":function(v){_typeof=v}});                         //
/**                                                                                                                   //
 * Provide a synchronous Collection API using fibers, backed by                                                       //
 * MongoDB.  This is only for use on the server, and mostly identical                                                 //
 * to the client API.                                                                                                 //
 *                                                                                                                    //
 * NOTE: the public API methods must be run within a fiber. If you call                                               //
 * these outside of a fiber they will explode!                                                                        //
 */                                                                                                                   //
                                                                                                                      //
var path = Npm.require('path');                                                                                       // 10
var MongoDB = NpmModuleMongodb;                                                                                       // 11
var Fiber = Npm.require('fibers');                                                                                    // 12
var Future = Npm.require(path.join('fibers', 'future'));                                                              // 13
                                                                                                                      //
MongoInternals = {};                                                                                                  // 15
MongoTest = {};                                                                                                       // 16
                                                                                                                      //
MongoInternals.NpmModules = {                                                                                         // 18
  mongodb: {                                                                                                          // 19
    version: NpmModuleMongodbVersion,                                                                                 // 20
    module: MongoDB                                                                                                   // 21
  }                                                                                                                   // 19
};                                                                                                                    // 18
                                                                                                                      //
// Older version of what is now available via                                                                         //
// MongoInternals.NpmModules.mongodb.module.  It was never documented, but                                            //
// people do use it.                                                                                                  //
// XXX COMPAT WITH 1.0.3.2                                                                                            //
MongoInternals.NpmModule = MongoDB;                                                                                   // 29
                                                                                                                      //
// This is used to add or remove EJSON from the beginning of everything nested                                        //
// inside an EJSON custom type. It should only be called on pure JSON!                                                //
var replaceNames = function replaceNames(filter, thing) {                                                             // 33
  if ((typeof thing === 'undefined' ? 'undefined' : _typeof(thing)) === "object") {                                   // 34
    if (_.isArray(thing)) {                                                                                           // 35
      return _.map(thing, _.bind(replaceNames, null, filter));                                                        // 36
    }                                                                                                                 // 37
    var ret = {};                                                                                                     // 38
    _.each(thing, function (value, key) {                                                                             // 39
      ret[filter(key)] = replaceNames(filter, value);                                                                 // 40
    });                                                                                                               // 41
    return ret;                                                                                                       // 42
  }                                                                                                                   // 43
  return thing;                                                                                                       // 44
};                                                                                                                    // 45
                                                                                                                      //
// Ensure that EJSON.clone keeps a Timestamp as a Timestamp (instead of just                                          //
// doing a structural clone).                                                                                         //
// XXX how ok is this? what if there are multiple copies of MongoDB loaded?                                           //
MongoDB.Timestamp.prototype.clone = function () {                                                                     // 50
  // Timestamps should be immutable.                                                                                  //
  return this;                                                                                                        // 52
};                                                                                                                    // 53
                                                                                                                      //
var makeMongoLegal = function makeMongoLegal(name) {                                                                  // 55
  return "EJSON" + name;                                                                                              // 55
};                                                                                                                    // 55
var unmakeMongoLegal = function unmakeMongoLegal(name) {                                                              // 56
  return name.substr(5);                                                                                              // 56
};                                                                                                                    // 56
                                                                                                                      //
var replaceMongoAtomWithMeteor = function replaceMongoAtomWithMeteor(document) {                                      // 58
  if (document instanceof MongoDB.Binary) {                                                                           // 59
    var buffer = document.value(true);                                                                                // 60
    return new Uint8Array(buffer);                                                                                    // 61
  }                                                                                                                   // 62
  if (document instanceof MongoDB.ObjectID) {                                                                         // 63
    return new Mongo.ObjectID(document.toHexString());                                                                // 64
  }                                                                                                                   // 65
  if (document["EJSON$type"] && document["EJSON$value"] && _.size(document) === 2) {                                  // 66
    return EJSON.fromJSONValue(replaceNames(unmakeMongoLegal, document));                                             // 68
  }                                                                                                                   // 69
  if (document instanceof MongoDB.Timestamp) {                                                                        // 70
    // For now, the Meteor representation of a Mongo timestamp type (not a date!                                      //
    // this is a weird internal thing used in the oplog!) is the same as the                                          //
    // Mongo representation. We need to do this explicitly or else we would do a                                      //
    // structural clone and lose the prototype.                                                                       //
    return document;                                                                                                  // 75
  }                                                                                                                   // 76
  return undefined;                                                                                                   // 77
};                                                                                                                    // 78
                                                                                                                      //
var replaceMeteorAtomWithMongo = function replaceMeteorAtomWithMongo(document) {                                      // 80
  if (EJSON.isBinary(document)) {                                                                                     // 81
    // This does more copies than we'd like, but is necessary because                                                 //
    // MongoDB.BSON only looks like it takes a Uint8Array (and doesn't actually                                       //
    // serialize it correctly).                                                                                       //
    return new MongoDB.Binary(new Buffer(document));                                                                  // 85
  }                                                                                                                   // 86
  if (document instanceof Mongo.ObjectID) {                                                                           // 87
    return new MongoDB.ObjectID(document.toHexString());                                                              // 88
  }                                                                                                                   // 89
  if (document instanceof MongoDB.Timestamp) {                                                                        // 90
    // For now, the Meteor representation of a Mongo timestamp type (not a date!                                      //
    // this is a weird internal thing used in the oplog!) is the same as the                                          //
    // Mongo representation. We need to do this explicitly or else we would do a                                      //
    // structural clone and lose the prototype.                                                                       //
    return document;                                                                                                  // 95
  }                                                                                                                   // 96
  if (EJSON._isCustomType(document)) {                                                                                // 97
    return replaceNames(makeMongoLegal, EJSON.toJSONValue(document));                                                 // 98
  }                                                                                                                   // 99
  // It is not ordinarily possible to stick dollar-sign keys into mongo                                               //
  // so we don't bother checking for things that need escaping at this time.                                          //
  return undefined;                                                                                                   // 102
};                                                                                                                    // 103
                                                                                                                      //
var replaceTypes = function replaceTypes(document, atomTransformer) {                                                 // 105
  if ((typeof document === 'undefined' ? 'undefined' : _typeof(document)) !== 'object' || document === null) return document;
                                                                                                                      //
  var replacedTopLevelAtom = atomTransformer(document);                                                               // 109
  if (replacedTopLevelAtom !== undefined) return replacedTopLevelAtom;                                                // 110
                                                                                                                      //
  var ret = document;                                                                                                 // 113
  _.each(document, function (val, key) {                                                                              // 114
    var valReplaced = replaceTypes(val, atomTransformer);                                                             // 115
    if (val !== valReplaced) {                                                                                        // 116
      // Lazy clone. Shallow copy.                                                                                    //
      if (ret === document) ret = _.clone(document);                                                                  // 118
      ret[key] = valReplaced;                                                                                         // 120
    }                                                                                                                 // 121
  });                                                                                                                 // 122
  return ret;                                                                                                         // 123
};                                                                                                                    // 124
                                                                                                                      //
MongoConnection = function MongoConnection(url, options) {                                                            // 127
  var self = this;                                                                                                    // 128
  options = options || {};                                                                                            // 129
  self._observeMultiplexers = {};                                                                                     // 130
  self._onFailoverHook = new Hook();                                                                                  // 131
                                                                                                                      //
  var mongoOptions = _.extend({ db: { safe: true }, server: {}, replSet: {} }, Mongo._connectionOptions);             // 133
                                                                                                                      //
  // Set autoReconnect to true, unless passed on the URL. Why someone                                                 //
  // would want to set autoReconnect to false, I'm not really sure, but                                               //
  // keeping this for backwards compatibility for now.                                                                //
  if (!/[\?&]auto_?[rR]econnect=/.test(url)) {                                                                        // 139
    mongoOptions.server.auto_reconnect = true;                                                                        // 140
  }                                                                                                                   // 141
                                                                                                                      //
  // Disable the native parser by default, unless specifically enabled                                                //
  // in the mongo URL.                                                                                                //
  // - The native driver can cause errors which normally would be                                                     //
  //   thrown, caught, and handled into segfaults that take down the                                                  //
  //   whole app.                                                                                                     //
  // - Binary modules don't yet work when you bundle and move the bundle                                              //
  //   to a different platform (aka deploy)                                                                           //
  // We should revisit this after binary npm module support lands.                                                    //
  if (!/[\?&]native_?[pP]arser=/.test(url)) {                                                                         // 151
    mongoOptions.db.native_parser = false;                                                                            // 152
  }                                                                                                                   // 153
                                                                                                                      //
  // Internally the oplog connections specify their own poolSize                                                      //
  // which we don't want to overwrite with any user defined value                                                     //
  if (_.has(options, 'poolSize')) {                                                                                   // 157
    // If we just set this for "server", replSet will override it. If we just                                         //
    // set it for replSet, it will be ignored if we're not using a replSet.                                           //
    mongoOptions.server.poolSize = options.poolSize;                                                                  // 160
    mongoOptions.replSet.poolSize = options.poolSize;                                                                 // 161
  }                                                                                                                   // 162
                                                                                                                      //
  self.db = null;                                                                                                     // 164
  // We keep track of the ReplSet's primary, so that we can trigger hooks when                                        //
  // it changes.  The Node driver's joined callback seems to fire way too                                             //
  // often, which is why we need to track it ourselves.                                                               //
  self._primary = null;                                                                                               // 168
  self._oplogHandle = null;                                                                                           // 169
  self._docFetcher = null;                                                                                            // 170
                                                                                                                      //
  var connectFuture = new Future();                                                                                   // 173
  MongoDB.connect(url, mongoOptions, Meteor.bindEnvironment(function (err, db) {                                      // 174
    if (err) {                                                                                                        // 179
      throw err;                                                                                                      // 180
    }                                                                                                                 // 181
                                                                                                                      //
    // First, figure out what the current primary is, if any.                                                         //
    if (db.serverConfig.isMasterDoc) {                                                                                // 184
      self._primary = db.serverConfig.isMasterDoc.primary;                                                            // 185
    }                                                                                                                 // 186
                                                                                                                      //
    db.serverConfig.on('joined', Meteor.bindEnvironment(function (kind, doc) {                                        // 188
      if (kind === 'primary') {                                                                                       // 190
        if (doc.primary !== self._primary) {                                                                          // 191
          self._primary = doc.primary;                                                                                // 192
          self._onFailoverHook.each(function (callback) {                                                             // 193
            callback();                                                                                               // 194
            return true;                                                                                              // 195
          });                                                                                                         // 196
        }                                                                                                             // 197
      } else if (doc.me === self._primary) {                                                                          // 198
        // The thing we thought was primary is now something other than                                               //
        // primary.  Forget that we thought it was primary.  (This means                                              //
        // that if a server stops being primary and then starts being                                                 //
        // primary again without another server becoming primary in the                                               //
        // middle, we'll correctly count it as a failover.)                                                           //
        self._primary = null;                                                                                         // 204
      }                                                                                                               // 205
    }));                                                                                                              // 206
                                                                                                                      //
    // Allow the constructor to return.                                                                               //
    connectFuture['return'](db);                                                                                      // 209
  }, connectFuture.resolver() // onException                                                                          // 210
  ));                                                                                                                 // 177
                                                                                                                      //
  // Wait for the connection to be successful; throws on failure.                                                     //
  self.db = connectFuture.wait();                                                                                     // 216
                                                                                                                      //
  if (options.oplogUrl && !Package['disable-oplog']) {                                                                // 218
    self._oplogHandle = new OplogHandle(options.oplogUrl, self.db.databaseName);                                      // 219
    self._docFetcher = new DocFetcher(self);                                                                          // 220
  }                                                                                                                   // 221
};                                                                                                                    // 222
                                                                                                                      //
MongoConnection.prototype.close = function () {                                                                       // 224
  var self = this;                                                                                                    // 225
                                                                                                                      //
  if (!self.db) throw Error("close called before Connection created?");                                               // 227
                                                                                                                      //
  // XXX probably untested                                                                                            //
  var oplogHandle = self._oplogHandle;                                                                                // 231
  self._oplogHandle = null;                                                                                           // 232
  if (oplogHandle) oplogHandle.stop();                                                                                // 233
                                                                                                                      //
  // Use Future.wrap so that errors get thrown. This happens to                                                       //
  // work even outside a fiber since the 'close' method is not                                                        //
  // actually asynchronous.                                                                                           //
  Future.wrap(_.bind(self.db.close, self.db))(true).wait();                                                           // 239
};                                                                                                                    // 240
                                                                                                                      //
// Returns the Mongo Collection object; may yield.                                                                    //
MongoConnection.prototype.rawCollection = function (collectionName) {                                                 // 243
  var self = this;                                                                                                    // 244
                                                                                                                      //
  if (!self.db) throw Error("rawCollection called before Connection created?");                                       // 246
                                                                                                                      //
  var future = new Future();                                                                                          // 249
  self.db.collection(collectionName, future.resolver());                                                              // 250
  return future.wait();                                                                                               // 251
};                                                                                                                    // 252
                                                                                                                      //
MongoConnection.prototype._createCappedCollection = function (collectionName, byteSize, maxDocuments) {               // 254
  var self = this;                                                                                                    // 256
                                                                                                                      //
  if (!self.db) throw Error("_createCappedCollection called before Connection created?");                             // 258
                                                                                                                      //
  var future = new Future();                                                                                          // 261
  self.db.createCollection(collectionName, { capped: true, size: byteSize, max: maxDocuments }, future.resolver());   // 262
  future.wait();                                                                                                      // 266
};                                                                                                                    // 267
                                                                                                                      //
// This should be called synchronously with a write, to create a                                                      //
// transaction on the current write fence, if any. After we can read                                                  //
// the write, and after observers have been notified (or at least,                                                    //
// after the observer notifiers have added themselves to the write                                                    //
// fence), you should call 'committed()' on the object returned.                                                      //
MongoConnection.prototype._maybeBeginWrite = function () {                                                            // 274
  var self = this;                                                                                                    // 275
  var fence = DDPServer._CurrentWriteFence.get();                                                                     // 276
  if (fence) return fence.beginWrite();else return { committed: function committed() {} };                            // 277
};                                                                                                                    // 281
                                                                                                                      //
// Internal interface: adds a callback which is called when the Mongo primary                                         //
// changes. Returns a stop handle.                                                                                    //
MongoConnection.prototype._onFailover = function (callback) {                                                         // 285
  return this._onFailoverHook.register(callback);                                                                     // 286
};                                                                                                                    // 287
                                                                                                                      //
//////////// Public API //////////                                                                                    //
                                                                                                                      //
// The write methods block until the database has confirmed the write (it may                                         //
// not be replicated or stable on disk, but one server has confirmed it) if no                                        //
// callback is provided. If a callback is provided, then they call the callback                                       //
// when the write is confirmed. They return nothing on success, and raise an                                          //
// exception on failure.                                                                                              //
//                                                                                                                    //
// After making a write (with insert, update, remove), observers are                                                  //
// notified asynchronously. If you want to receive a callback once all                                                //
// of the observer notifications have landed for your write, do the                                                   //
// writes inside a write fence (set DDPServer._CurrentWriteFence to a new                                             //
// _WriteFence, and then set a callback on the write fence.)                                                          //
//                                                                                                                    //
// Since our execution environment is single-threaded, this is                                                        //
// well-defined -- a write "has been made" if it's returned, and an                                                   //
// observer "has been notified" if its callback has returned.                                                         //
                                                                                                                      //
var writeCallback = function writeCallback(write, refresh, callback) {                                                // 308
  return function (err, result) {                                                                                     // 309
    if (!err) {                                                                                                       // 310
      // XXX We don't have to run this on error, right?                                                               //
      try {                                                                                                           // 312
        refresh();                                                                                                    // 313
      } catch (refreshErr) {                                                                                          // 314
        if (callback) {                                                                                               // 315
          callback(refreshErr);                                                                                       // 316
          return;                                                                                                     // 317
        } else {                                                                                                      // 318
          throw refreshErr;                                                                                           // 319
        }                                                                                                             // 320
      }                                                                                                               // 321
    }                                                                                                                 // 322
    write.committed();                                                                                                // 323
    if (callback) callback(err, result);else if (err) throw err;                                                      // 324
  };                                                                                                                  // 328
};                                                                                                                    // 329
                                                                                                                      //
var bindEnvironmentForWrite = function bindEnvironmentForWrite(callback) {                                            // 331
  return Meteor.bindEnvironment(callback, "Mongo write");                                                             // 332
};                                                                                                                    // 333
                                                                                                                      //
MongoConnection.prototype._insert = function (collection_name, document, callback) {                                  // 335
  var self = this;                                                                                                    // 337
                                                                                                                      //
  var sendError = function sendError(e) {                                                                             // 339
    if (callback) return callback(e);                                                                                 // 340
    throw e;                                                                                                          // 342
  };                                                                                                                  // 343
                                                                                                                      //
  if (collection_name === "___meteor_failure_test_collection") {                                                      // 345
    var e = new Error("Failure test");                                                                                // 346
    e.expected = true;                                                                                                // 347
    sendError(e);                                                                                                     // 348
    return;                                                                                                           // 349
  }                                                                                                                   // 350
                                                                                                                      //
  if (!(LocalCollection._isPlainObject(document) && !EJSON._isCustomType(document))) {                                // 352
    sendError(new Error("Only plain objects may be inserted into MongoDB"));                                          // 354
    return;                                                                                                           // 356
  }                                                                                                                   // 357
                                                                                                                      //
  var write = self._maybeBeginWrite();                                                                                // 359
  var refresh = function refresh() {                                                                                  // 360
    Meteor.refresh({ collection: collection_name, id: document._id });                                                // 361
  };                                                                                                                  // 362
  callback = bindEnvironmentForWrite(writeCallback(write, refresh, callback));                                        // 363
  try {                                                                                                               // 364
    var collection = self.rawCollection(collection_name);                                                             // 365
    collection.insert(replaceTypes(document, replaceMeteorAtomWithMongo), { safe: true }, callback);                  // 366
  } catch (e) {                                                                                                       // 368
    write.committed();                                                                                                // 369
    throw e;                                                                                                          // 370
  }                                                                                                                   // 371
};                                                                                                                    // 372
                                                                                                                      //
// Cause queries that may be affected by the selector to poll in this write                                           //
// fence.                                                                                                             //
MongoConnection.prototype._refresh = function (collectionName, selector) {                                            // 376
  var self = this;                                                                                                    // 377
  var refreshKey = { collection: collectionName };                                                                    // 378
  // If we know which documents we're removing, don't poll queries that are                                           //
  // specific to other documents. (Note that multiple notifications here should                                       //
  // not cause multiple polls, since all our listener is doing is enqueueing a                                        //
  // poll.)                                                                                                           //
  var specificIds = LocalCollection._idsMatchedBySelector(selector);                                                  // 383
  if (specificIds) {                                                                                                  // 384
    _.each(specificIds, function (id) {                                                                               // 385
      Meteor.refresh(_.extend({ id: id }, refreshKey));                                                               // 386
    });                                                                                                               // 387
  } else {                                                                                                            // 388
    Meteor.refresh(refreshKey);                                                                                       // 389
  }                                                                                                                   // 390
};                                                                                                                    // 391
                                                                                                                      //
MongoConnection.prototype._remove = function (collection_name, selector, callback) {                                  // 393
  var self = this;                                                                                                    // 395
                                                                                                                      //
  if (collection_name === "___meteor_failure_test_collection") {                                                      // 397
    var e = new Error("Failure test");                                                                                // 398
    e.expected = true;                                                                                                // 399
    if (callback) return callback(e);else throw e;                                                                    // 400
  }                                                                                                                   // 404
                                                                                                                      //
  var write = self._maybeBeginWrite();                                                                                // 406
  var refresh = function refresh() {                                                                                  // 407
    self._refresh(collection_name, selector);                                                                         // 408
  };                                                                                                                  // 409
  callback = bindEnvironmentForWrite(writeCallback(write, refresh, callback));                                        // 410
                                                                                                                      //
  try {                                                                                                               // 412
    var collection = self.rawCollection(collection_name);                                                             // 413
    var wrappedCallback = function wrappedCallback(err, driverResult) {                                               // 414
      callback(err, transformResult(driverResult).numberAffected);                                                    // 415
    };                                                                                                                // 416
    collection.remove(replaceTypes(selector, replaceMeteorAtomWithMongo), { safe: true }, wrappedCallback);           // 417
  } catch (e) {                                                                                                       // 419
    write.committed();                                                                                                // 420
    throw e;                                                                                                          // 421
  }                                                                                                                   // 422
};                                                                                                                    // 423
                                                                                                                      //
MongoConnection.prototype._dropCollection = function (collectionName, cb) {                                           // 425
  var self = this;                                                                                                    // 426
                                                                                                                      //
  var write = self._maybeBeginWrite();                                                                                // 428
  var refresh = function refresh() {                                                                                  // 429
    Meteor.refresh({ collection: collectionName, id: null,                                                            // 430
      dropCollection: true });                                                                                        // 431
  };                                                                                                                  // 432
  cb = bindEnvironmentForWrite(writeCallback(write, refresh, cb));                                                    // 433
                                                                                                                      //
  try {                                                                                                               // 435
    var collection = self.rawCollection(collectionName);                                                              // 436
    collection.drop(cb);                                                                                              // 437
  } catch (e) {                                                                                                       // 438
    write.committed();                                                                                                // 439
    throw e;                                                                                                          // 440
  }                                                                                                                   // 441
};                                                                                                                    // 442
                                                                                                                      //
// For testing only.  Slightly better than `c.rawDatabase().dropDatabase()`                                           //
// because it lets the test's fence wait for it to be complete.                                                       //
MongoConnection.prototype._dropDatabase = function (cb) {                                                             // 446
  var self = this;                                                                                                    // 447
                                                                                                                      //
  var write = self._maybeBeginWrite();                                                                                // 449
  var refresh = function refresh() {                                                                                  // 450
    Meteor.refresh({ dropDatabase: true });                                                                           // 451
  };                                                                                                                  // 452
  cb = bindEnvironmentForWrite(writeCallback(write, refresh, cb));                                                    // 453
                                                                                                                      //
  try {                                                                                                               // 455
    self.db.dropDatabase(cb);                                                                                         // 456
  } catch (e) {                                                                                                       // 457
    write.committed();                                                                                                // 458
    throw e;                                                                                                          // 459
  }                                                                                                                   // 460
};                                                                                                                    // 461
                                                                                                                      //
MongoConnection.prototype._update = function (collection_name, selector, mod, options, callback) {                    // 463
  var self = this;                                                                                                    // 465
                                                                                                                      //
  if (!callback && options instanceof Function) {                                                                     // 467
    callback = options;                                                                                               // 468
    options = null;                                                                                                   // 469
  }                                                                                                                   // 470
                                                                                                                      //
  if (collection_name === "___meteor_failure_test_collection") {                                                      // 472
    var e = new Error("Failure test");                                                                                // 473
    e.expected = true;                                                                                                // 474
    if (callback) return callback(e);else throw e;                                                                    // 475
  }                                                                                                                   // 479
                                                                                                                      //
  // explicit safety check. null and undefined can crash the mongo                                                    //
  // driver. Although the node driver and minimongo do 'support'                                                      //
  // non-object modifier in that they don't crash, they are not                                                       //
  // meaningful operations and do not do anything. Defensively throw an                                               //
  // error here.                                                                                                      //
  if (!mod || (typeof mod === 'undefined' ? 'undefined' : _typeof(mod)) !== 'object') throw new Error("Invalid modifier. Modifier must be an object.");
                                                                                                                      //
  if (!(LocalCollection._isPlainObject(mod) && !EJSON._isCustomType(mod))) {                                          // 489
    throw new Error("Only plain objects may be used as replacement" + " documents in MongoDB");                       // 491
    return;                                                                                                           // 494
  }                                                                                                                   // 495
                                                                                                                      //
  if (!options) options = {};                                                                                         // 497
                                                                                                                      //
  var write = self._maybeBeginWrite();                                                                                // 499
  var refresh = function refresh() {                                                                                  // 500
    self._refresh(collection_name, selector);                                                                         // 501
  };                                                                                                                  // 502
  callback = writeCallback(write, refresh, callback);                                                                 // 503
  try {                                                                                                               // 504
    var collection = self.rawCollection(collection_name);                                                             // 505
    var mongoOpts = { safe: true };                                                                                   // 506
    // explictly enumerate options that minimongo supports                                                            //
    if (options.upsert) mongoOpts.upsert = true;                                                                      // 508
    if (options.multi) mongoOpts.multi = true;                                                                        // 509
    // Lets you get a more more full result from MongoDB. Use with caution:                                           //
    // might not work with C.upsert (as opposed to C.update({upsert:true}) or                                         //
    // with simulated upsert.                                                                                         //
    if (options.fullResult) mongoOpts.fullResult = true;                                                              // 513
                                                                                                                      //
    var mongoSelector = replaceTypes(selector, replaceMeteorAtomWithMongo);                                           // 515
    var mongoMod = replaceTypes(mod, replaceMeteorAtomWithMongo);                                                     // 516
                                                                                                                      //
    var isModify = isModificationMod(mongoMod);                                                                       // 518
    var knownId = selector._id || mod._id;                                                                            // 519
                                                                                                                      //
    if (options._forbidReplace && !isModify) {                                                                        // 521
      var e = new Error("Invalid modifier. Replacements are forbidden.");                                             // 522
      if (callback) {                                                                                                 // 523
        return callback(e);                                                                                           // 524
      } else {                                                                                                        // 525
        throw e;                                                                                                      // 526
      }                                                                                                               // 527
    }                                                                                                                 // 528
                                                                                                                      //
    if (options.upsert && !knownId && options.insertedId) {                                                           // 530
      // XXX If we know we're using Mongo 2.6 (and this isn't a replacement)                                          //
      //     we should be able to just use $setOnInsert instead of this                                               //
      //     simulated upsert thing. (We can't use $setOnInsert with                                                  //
      //     replacements because there's nowhere to write it, and $setOnInsert                                       //
      //     can't set _id on Mongo 2.4.)                                                                             //
      //                                                                                                              //
      //     Also, in the future we could do a real upsert for the mongo id                                           //
      //     generation case, if the the node mongo driver gives us back the id                                       //
      //     of the upserted doc (which our current version does not).                                                //
      //                                                                                                              //
      //     For more context, see                                                                                    //
      //     https://github.com/meteor/meteor/issues/2278#issuecomment-64252706                                       //
      simulateUpsertWithInsertedId(collection, mongoSelector, mongoMod, isModify, options,                            // 543
      // This callback does not need to be bindEnvironment'ed because                                                 //
      // simulateUpsertWithInsertedId() wraps it and then passes it through                                           //
      // bindEnvironmentForWrite.                                                                                     //
      function (err, result) {                                                                                        // 549
        // If we got here via a upsert() call, then options._returnObject will                                        //
        // be set and we should return the whole object. Otherwise, we should                                         //
        // just return the number of affected docs to match the mongo API.                                            //
        if (result && !options._returnObject) callback(err, result.numberAffected);else callback(err, result);        // 553
      });                                                                                                             // 557
    } else {                                                                                                          // 559
      collection.update(mongoSelector, mongoMod, mongoOpts, bindEnvironmentForWrite(function (err, result) {          // 560
        if (!err) {                                                                                                   // 563
          var meteorResult = transformResult(result);                                                                 // 564
          if (meteorResult && options._returnObject) {                                                                // 565
            // If this was an upsert() call, and we ended up                                                          //
            // inserting a new doc and we know its id, then                                                           //
            // return that id as well.                                                                                //
                                                                                                                      //
            if (options.upsert && meteorResult.insertedId && knownId) {                                               // 570
              meteorResult.insertedId = knownId;                                                                      // 571
            }                                                                                                         // 572
            callback(err, meteorResult);                                                                              // 573
          } else {                                                                                                    // 574
            callback(err, meteorResult.numberAffected);                                                               // 575
          }                                                                                                           // 576
        } else {                                                                                                      // 577
          callback(err);                                                                                              // 578
        }                                                                                                             // 579
      }));                                                                                                            // 580
    }                                                                                                                 // 581
  } catch (e) {                                                                                                       // 582
    write.committed();                                                                                                // 583
    throw e;                                                                                                          // 584
  }                                                                                                                   // 585
};                                                                                                                    // 586
                                                                                                                      //
var isModificationMod = function isModificationMod(mod) {                                                             // 588
  var isReplace = false;                                                                                              // 589
  var isModify = false;                                                                                               // 590
  for (var k in mod) {                                                                                                // 591
    if (k.substr(0, 1) === '$') {                                                                                     // 592
      isModify = true;                                                                                                // 593
    } else {                                                                                                          // 594
      isReplace = true;                                                                                               // 595
    }                                                                                                                 // 596
  }                                                                                                                   // 597
  if (isModify && isReplace) {                                                                                        // 598
    throw new Error("Update parameter cannot have both modifier and non-modifier fields.");                           // 599
  }                                                                                                                   // 601
  return isModify;                                                                                                    // 602
};                                                                                                                    // 603
                                                                                                                      //
var transformResult = function transformResult(driverResult) {                                                        // 605
  var meteorResult = { numberAffected: 0 };                                                                           // 606
  if (driverResult) {                                                                                                 // 607
    mongoResult = driverResult.result;                                                                                // 608
                                                                                                                      //
    // On updates with upsert:true, the inserted values come as a list of                                             //
    // upserted values -- even with options.multi, when the upsert does insert,                                       //
    // it only inserts one element.                                                                                   //
    if (mongoResult.upserted) {                                                                                       // 613
      meteorResult.numberAffected += mongoResult.upserted.length;                                                     // 614
                                                                                                                      //
      if (mongoResult.upserted.length == 1) {                                                                         // 616
        meteorResult.insertedId = mongoResult.upserted[0]._id;                                                        // 617
      }                                                                                                               // 618
    } else {                                                                                                          // 619
      meteorResult.numberAffected = mongoResult.n;                                                                    // 620
    }                                                                                                                 // 621
  }                                                                                                                   // 622
                                                                                                                      //
  return meteorResult;                                                                                                // 624
};                                                                                                                    // 625
                                                                                                                      //
var NUM_OPTIMISTIC_TRIES = 3;                                                                                         // 628
                                                                                                                      //
// exposed for testing                                                                                                //
MongoConnection._isCannotChangeIdError = function (err) {                                                             // 631
  // First check for what this error looked like in Mongo 2.4.  Either of these                                       //
  // checks should work, but just to be safe...                                                                       //
  if (err.code === 13596) return true;                                                                                // 634
  if (err.errmsg.indexOf("cannot change _id of a document") === 0) return true;                                       // 636
                                                                                                                      //
  // Now look for what it looks like in Mongo 2.6.  We don't use the error code                                       //
  // here, because the error code we observed it producing (16837) appears to be                                      //
  // a far more generic error code based on examining the source.                                                     //
  if (err.errmsg.indexOf("The _id field cannot be changed") === 0) return true;                                       // 642
                                                                                                                      //
  return false;                                                                                                       // 645
};                                                                                                                    // 646
                                                                                                                      //
var simulateUpsertWithInsertedId = function simulateUpsertWithInsertedId(collection, selector, mod, isModify, options, callback) {
  // STRATEGY:  First try doing a plain update.  If it affected 0 documents,                                          //
  // then without affecting the database, we know we should probably do an                                            //
  // insert.  We then do a *conditional* insert that will fail in the case                                            //
  // of a race condition.  This conditional insert is actually an                                                     //
  // upsert-replace with an _id, which will never successfully update an                                              //
  // existing document.  If this upsert fails with an error saying it                                                 //
  // couldn't change an existing _id, then we know an intervening write has                                           //
  // caused the query to match something.  We go back to step one and repeat.                                         //
  // Like all "optimistic write" schemes, we rely on the fact that it's                                               //
  // unlikely our writes will continue to be interfered with under normal                                             //
  // circumstances (though sufficiently heavy contention with writers                                                 //
  // disagreeing on the existence of an object will cause writes to fail                                              //
  // in theory).                                                                                                      //
                                                                                                                      //
  var newDoc;                                                                                                         // 664
  // Run this code up front so that it fails fast if someone uses                                                     //
  // a Mongo update operator we don't support.                                                                        //
  if (isModify) {                                                                                                     // 667
    // We've already run replaceTypes/replaceMeteorAtomWithMongo on                                                   //
    // selector and mod.  We assume it doesn't matter, as far as                                                      //
    // the behavior of modifiers is concerned, whether `_modify`                                                      //
    // is run on EJSON or on mongo-converted EJSON.                                                                   //
    var selectorDoc = LocalCollection._removeDollarOperators(selector);                                               // 672
                                                                                                                      //
    newDoc = selectorDoc;                                                                                             // 674
                                                                                                                      //
    // Convert dotted keys into objects. (Resolves issue #4522).                                                      //
    _.each(newDoc, function (value, key) {                                                                            // 677
      var trail = key.split(".");                                                                                     // 678
                                                                                                                      //
      if (trail.length > 1) {                                                                                         // 680
        //Key is dotted. Convert it into an object.                                                                   //
        delete newDoc[key];                                                                                           // 682
                                                                                                                      //
        var obj = newDoc,                                                                                             // 684
            leaf = trail.pop();                                                                                       // 684
                                                                                                                      //
        // XXX It is not quite certain what should be done if there are clashing                                      //
        // keys on the trail of the dotted key. For now we will just override it                                      //
        // It wouldn't be a very sane query in the first place, but should look                                       //
        // up what mongo does in this case.                                                                           //
                                                                                                                      //
        while (key = trail.shift()) {                                                                                 // 692
          if (_typeof(obj[key]) !== "object") {                                                                       // 693
            obj[key] = {};                                                                                            // 694
          }                                                                                                           // 695
                                                                                                                      //
          obj = obj[key];                                                                                             // 697
        }                                                                                                             // 698
                                                                                                                      //
        obj[leaf] = value;                                                                                            // 700
      }                                                                                                               // 701
    });                                                                                                               // 702
                                                                                                                      //
    LocalCollection._modify(newDoc, mod, { isInsert: true });                                                         // 704
  } else {                                                                                                            // 705
    newDoc = mod;                                                                                                     // 706
  }                                                                                                                   // 707
                                                                                                                      //
  var insertedId = options.insertedId; // must exist                                                                  // 709
  var mongoOptsForUpdate = {                                                                                          // 710
    safe: true,                                                                                                       // 711
    multi: options.multi                                                                                              // 712
  };                                                                                                                  // 710
  var mongoOptsForInsert = {                                                                                          // 714
    safe: true,                                                                                                       // 715
    upsert: true                                                                                                      // 716
  };                                                                                                                  // 714
                                                                                                                      //
  var tries = NUM_OPTIMISTIC_TRIES;                                                                                   // 719
                                                                                                                      //
  var doUpdate = function doUpdate() {                                                                                // 721
    tries--;                                                                                                          // 722
    if (!tries) {                                                                                                     // 723
      callback(new Error("Upsert failed after " + NUM_OPTIMISTIC_TRIES + " tries."));                                 // 724
    } else {                                                                                                          // 725
      collection.update(selector, mod, mongoOptsForUpdate, bindEnvironmentForWrite(function (err, result) {           // 726
        if (err) {                                                                                                    // 728
          callback(err);                                                                                              // 729
        } else if (result && result.result.n != 0) {                                                                  // 730
          callback(null, {                                                                                            // 731
            numberAffected: result.result.n                                                                           // 732
          });                                                                                                         // 731
        } else {                                                                                                      // 734
          doConditionalInsert();                                                                                      // 735
        }                                                                                                             // 736
      }));                                                                                                            // 737
    }                                                                                                                 // 738
  };                                                                                                                  // 739
                                                                                                                      //
  var doConditionalInsert = function doConditionalInsert() {                                                          // 741
    var replacementWithId = _.extend(replaceTypes({ _id: insertedId }, replaceMeteorAtomWithMongo), newDoc);          // 742
    collection.update(selector, replacementWithId, mongoOptsForInsert, bindEnvironmentForWrite(function (err, result) {
      if (err) {                                                                                                      // 747
        // figure out if this is a                                                                                    //
        // "cannot change _id of document" error, and                                                                 //
        // if so, try doUpdate() again, up to 3 times.                                                                //
        if (MongoConnection._isCannotChangeIdError(err)) {                                                            // 751
          doUpdate();                                                                                                 // 752
        } else {                                                                                                      // 753
          callback(err);                                                                                              // 754
        }                                                                                                             // 755
      } else {                                                                                                        // 756
        callback(null, {                                                                                              // 757
          numberAffected: result.result.upserted.length,                                                              // 758
          insertedId: insertedId                                                                                      // 759
        });                                                                                                           // 757
      }                                                                                                               // 761
    }));                                                                                                              // 762
  };                                                                                                                  // 763
                                                                                                                      //
  doUpdate();                                                                                                         // 765
};                                                                                                                    // 766
                                                                                                                      //
_.each(["insert", "update", "remove", "dropCollection", "dropDatabase"], function (method) {                          // 768
  MongoConnection.prototype[method] = function () /* arguments */{                                                    // 769
    var self = this;                                                                                                  // 770
    return Meteor.wrapAsync(self["_" + method]).apply(self, arguments);                                               // 771
  };                                                                                                                  // 772
});                                                                                                                   // 773
                                                                                                                      //
// XXX MongoConnection.upsert() does not return the id of the inserted document                                       //
// unless you set it explicitly in the selector or modifier (as a replacement                                         //
// doc).                                                                                                              //
MongoConnection.prototype.upsert = function (collectionName, selector, mod, options, callback) {                      // 778
  var self = this;                                                                                                    // 780
  if (typeof options === "function" && !callback) {                                                                   // 781
    callback = options;                                                                                               // 782
    options = {};                                                                                                     // 783
  }                                                                                                                   // 784
                                                                                                                      //
  return self.update(collectionName, selector, mod, _.extend({}, options, {                                           // 786
    upsert: true,                                                                                                     // 788
    _returnObject: true                                                                                               // 789
  }), callback);                                                                                                      // 787
};                                                                                                                    // 791
                                                                                                                      //
MongoConnection.prototype.find = function (collectionName, selector, options) {                                       // 793
  var self = this;                                                                                                    // 794
                                                                                                                      //
  if (arguments.length === 1) selector = {};                                                                          // 796
                                                                                                                      //
  return new Cursor(self, new CursorDescription(collectionName, selector, options));                                  // 799
};                                                                                                                    // 801
                                                                                                                      //
MongoConnection.prototype.findOne = function (collection_name, selector, options) {                                   // 803
  var self = this;                                                                                                    // 805
  if (arguments.length === 1) selector = {};                                                                          // 806
                                                                                                                      //
  options = options || {};                                                                                            // 809
  options.limit = 1;                                                                                                  // 810
  return self.find(collection_name, selector, options).fetch()[0];                                                    // 811
};                                                                                                                    // 812
                                                                                                                      //
// We'll actually design an index API later. For now, we just pass through to                                         //
// Mongo's, but make it synchronous.                                                                                  //
MongoConnection.prototype._ensureIndex = function (collectionName, index, options) {                                  // 816
  var self = this;                                                                                                    // 818
                                                                                                                      //
  // We expect this function to be called at startup, not from within a method,                                       //
  // so we don't interact with the write fence.                                                                       //
  var collection = self.rawCollection(collectionName);                                                                // 822
  var future = new Future();                                                                                          // 823
  var indexName = collection.ensureIndex(index, options, future.resolver());                                          // 824
  future.wait();                                                                                                      // 825
};                                                                                                                    // 826
MongoConnection.prototype._dropIndex = function (collectionName, index) {                                             // 827
  var self = this;                                                                                                    // 828
                                                                                                                      //
  // This function is only used by test code, not within a method, so we don't                                        //
  // interact with the write fence.                                                                                   //
  var collection = self.rawCollection(collectionName);                                                                // 832
  var future = new Future();                                                                                          // 833
  var indexName = collection.dropIndex(index, future.resolver());                                                     // 834
  future.wait();                                                                                                      // 835
};                                                                                                                    // 836
                                                                                                                      //
// CURSORS                                                                                                            //
                                                                                                                      //
// There are several classes which relate to cursors:                                                                 //
//                                                                                                                    //
// CursorDescription represents the arguments used to construct a cursor:                                             //
// collectionName, selector, and (find) options.  Because it is used as a key                                         //
// for cursor de-dup, everything in it should either be JSON-stringifiable or                                         //
// not affect observeChanges output (eg, options.transform functions are not                                          //
// stringifiable but do not affect observeChanges).                                                                   //
//                                                                                                                    //
// SynchronousCursor is a wrapper around a MongoDB cursor                                                             //
// which includes fully-synchronous versions of forEach, etc.                                                         //
//                                                                                                                    //
// Cursor is the cursor object returned from find(), which implements the                                             //
// documented Mongo.Collection cursor API.  It wraps a CursorDescription and a                                        //
// SynchronousCursor (lazily: it doesn't contact Mongo until you call a method                                        //
// like fetch or forEach on it).                                                                                      //
//                                                                                                                    //
// ObserveHandle is the "observe handle" returned from observeChanges. It has a                                       //
// reference to an ObserveMultiplexer.                                                                                //
//                                                                                                                    //
// ObserveMultiplexer allows multiple identical ObserveHandles to be driven by a                                      //
// single observe driver.                                                                                             //
//                                                                                                                    //
// There are two "observe drivers" which drive ObserveMultiplexers:                                                   //
//   - PollingObserveDriver caches the results of a query and reruns it when                                          //
//     necessary.                                                                                                     //
//   - OplogObserveDriver follows the Mongo operation log to directly observe                                         //
//     database changes.                                                                                              //
// Both implementations follow the same simple interface: when you create them,                                       //
// they start sending observeChanges callbacks (and a ready() invocation) to                                          //
// their ObserveMultiplexer, and you stop them by calling their stop() method.                                        //
                                                                                                                      //
CursorDescription = function CursorDescription(collectionName, selector, options) {                                   // 871
  var self = this;                                                                                                    // 872
  self.collectionName = collectionName;                                                                               // 873
  self.selector = Mongo.Collection._rewriteSelector(selector);                                                        // 874
  self.options = options || {};                                                                                       // 875
};                                                                                                                    // 876
                                                                                                                      //
Cursor = function Cursor(mongo, cursorDescription) {                                                                  // 878
  var self = this;                                                                                                    // 879
                                                                                                                      //
  self._mongo = mongo;                                                                                                // 881
  self._cursorDescription = cursorDescription;                                                                        // 882
  self._synchronousCursor = null;                                                                                     // 883
};                                                                                                                    // 884
                                                                                                                      //
_.each(['forEach', 'map', 'fetch', 'count'], function (method) {                                                      // 886
  Cursor.prototype[method] = function () {                                                                            // 887
    var self = this;                                                                                                  // 888
                                                                                                                      //
    // You can only observe a tailable cursor.                                                                        //
    if (self._cursorDescription.options.tailable) throw new Error("Cannot call " + method + " on a tailable cursor");
                                                                                                                      //
    if (!self._synchronousCursor) {                                                                                   // 894
      self._synchronousCursor = self._mongo._createSynchronousCursor(self._cursorDescription, {                       // 895
        // Make sure that the "self" argument to forEach/map callbacks is the                                         //
        // Cursor, not the SynchronousCursor.                                                                         //
        selfForIteration: self,                                                                                       // 899
        useTransform: true                                                                                            // 900
      });                                                                                                             // 896
    }                                                                                                                 // 902
                                                                                                                      //
    return self._synchronousCursor[method].apply(self._synchronousCursor, arguments);                                 // 904
  };                                                                                                                  // 906
});                                                                                                                   // 907
                                                                                                                      //
// Since we don't actually have a "nextObject" interface, there's really no                                           //
// reason to have a "rewind" interface.  All it did was make multiple calls                                           //
// to fetch/map/forEach return nothing the second time.                                                               //
// XXX COMPAT WITH 0.8.1                                                                                              //
Cursor.prototype.rewind = function () {};                                                                             // 913
                                                                                                                      //
Cursor.prototype.getTransform = function () {                                                                         // 916
  return this._cursorDescription.options.transform;                                                                   // 917
};                                                                                                                    // 918
                                                                                                                      //
// When you call Meteor.publish() with a function that returns a Cursor, we need                                      //
// to transmute it into the equivalent subscription.  This is the function that                                       //
// does that.                                                                                                         //
                                                                                                                      //
Cursor.prototype._publishCursor = function (sub) {                                                                    // 924
  var self = this;                                                                                                    // 925
  var collection = self._cursorDescription.collectionName;                                                            // 926
  return Mongo.Collection._publishCursor(self, sub, collection);                                                      // 927
};                                                                                                                    // 928
                                                                                                                      //
// Used to guarantee that publish functions return at most one cursor per                                             //
// collection. Private, because we might later have cursors that include                                              //
// documents from multiple collections somehow.                                                                       //
Cursor.prototype._getCollectionName = function () {                                                                   // 933
  var self = this;                                                                                                    // 934
  return self._cursorDescription.collectionName;                                                                      // 935
};                                                                                                                    // 936
                                                                                                                      //
Cursor.prototype.observe = function (callbacks) {                                                                     // 938
  var self = this;                                                                                                    // 939
  return LocalCollection._observeFromObserveChanges(self, callbacks);                                                 // 940
};                                                                                                                    // 941
                                                                                                                      //
Cursor.prototype.observeChanges = function (callbacks) {                                                              // 943
  var self = this;                                                                                                    // 944
  var ordered = LocalCollection._observeChangesCallbacksAreOrdered(callbacks);                                        // 945
  return self._mongo._observeChanges(self._cursorDescription, ordered, callbacks);                                    // 946
};                                                                                                                    // 948
                                                                                                                      //
MongoConnection.prototype._createSynchronousCursor = function (cursorDescription, options) {                          // 950
  var self = this;                                                                                                    // 952
  options = _.pick(options || {}, 'selfForIteration', 'useTransform');                                                // 953
                                                                                                                      //
  var collection = self.rawCollection(cursorDescription.collectionName);                                              // 955
  var cursorOptions = cursorDescription.options;                                                                      // 956
  var mongoOptions = {                                                                                                // 957
    sort: cursorOptions.sort,                                                                                         // 958
    limit: cursorOptions.limit,                                                                                       // 959
    skip: cursorOptions.skip                                                                                          // 960
  };                                                                                                                  // 957
                                                                                                                      //
  // Do we want a tailable cursor (which only works on capped collections)?                                           //
  if (cursorOptions.tailable) {                                                                                       // 964
    // We want a tailable cursor...                                                                                   //
    mongoOptions.tailable = true;                                                                                     // 966
    // ... and for the server to wait a bit if any getMore has no data (rather                                        //
    // than making us put the relevant sleeps in the client)...                                                       //
    mongoOptions.awaitdata = true;                                                                                    // 969
    // ... and to keep querying the server indefinitely rather than just 5 times                                      //
    // if there's no more data.                                                                                       //
    mongoOptions.numberOfRetries = -1;                                                                                // 972
    // And if this is on the oplog collection and the cursor specifies a 'ts',                                        //
    // then set the undocumented oplog replay flag, which does a special scan to                                      //
    // find the first document (instead of creating an index on ts). This is a                                        //
    // very hard-coded Mongo flag which only works on the oplog collection and                                        //
    // only works with the ts field.                                                                                  //
    if (cursorDescription.collectionName === OPLOG_COLLECTION && cursorDescription.selector.ts) {                     // 978
      mongoOptions.oplogReplay = true;                                                                                // 980
    }                                                                                                                 // 981
  }                                                                                                                   // 982
                                                                                                                      //
  var dbCursor = collection.find(replaceTypes(cursorDescription.selector, replaceMeteorAtomWithMongo), cursorOptions.fields, mongoOptions);
                                                                                                                      //
  return new SynchronousCursor(dbCursor, cursorDescription, options);                                                 // 988
};                                                                                                                    // 989
                                                                                                                      //
var SynchronousCursor = function SynchronousCursor(dbCursor, cursorDescription, options) {                            // 991
  var self = this;                                                                                                    // 992
  options = _.pick(options || {}, 'selfForIteration', 'useTransform');                                                // 993
                                                                                                                      //
  self._dbCursor = dbCursor;                                                                                          // 995
  self._cursorDescription = cursorDescription;                                                                        // 996
  // The "self" argument passed to forEach/map callbacks. If we're wrapped                                            //
  // inside a user-visible Cursor, we want to provide the outer cursor!                                               //
  self._selfForIteration = options.selfForIteration || self;                                                          // 999
  if (options.useTransform && cursorDescription.options.transform) {                                                  // 1000
    self._transform = LocalCollection.wrapTransform(cursorDescription.options.transform);                             // 1001
  } else {                                                                                                            // 1003
    self._transform = null;                                                                                           // 1004
  }                                                                                                                   // 1005
                                                                                                                      //
  // Need to specify that the callback is the first argument to nextObject,                                           //
  // since otherwise when we try to call it with no args the driver will                                              //
  // interpret "undefined" first arg as an options hash and crash.                                                    //
  self._synchronousNextObject = Future.wrap(dbCursor.nextObject.bind(dbCursor), 0);                                   // 1010
  self._synchronousCount = Future.wrap(dbCursor.count.bind(dbCursor));                                                // 1012
  self._visitedIds = new LocalCollection._IdMap();                                                                    // 1013
};                                                                                                                    // 1014
                                                                                                                      //
_.extend(SynchronousCursor.prototype, {                                                                               // 1016
  _nextObject: function _nextObject() {                                                                               // 1017
    var self = this;                                                                                                  // 1018
                                                                                                                      //
    while (true) {                                                                                                    // 1020
      var doc = self._synchronousNextObject().wait();                                                                 // 1021
                                                                                                                      //
      if (!doc) return null;                                                                                          // 1023
      doc = replaceTypes(doc, replaceMongoAtomWithMeteor);                                                            // 1024
                                                                                                                      //
      if (!self._cursorDescription.options.tailable && _.has(doc, '_id')) {                                           // 1026
        // Did Mongo give us duplicate documents in the same cursor? If so,                                           //
        // ignore this one. (Do this before the transform, since transform might                                      //
        // return some unrelated value.) We don't do this for tailable cursors,                                       //
        // because we want to maintain O(1) memory usage. And if there isn't _id                                      //
        // for some reason (maybe it's the oplog), then we don't do this either.                                      //
        // (Be careful to do this for falsey but existing _id, though.)                                               //
        if (self._visitedIds.has(doc._id)) continue;                                                                  // 1033
        self._visitedIds.set(doc._id, true);                                                                          // 1034
      }                                                                                                               // 1035
                                                                                                                      //
      if (self._transform) doc = self._transform(doc);                                                                // 1037
                                                                                                                      //
      return doc;                                                                                                     // 1040
    }                                                                                                                 // 1041
  },                                                                                                                  // 1042
                                                                                                                      //
  forEach: function forEach(callback, thisArg) {                                                                      // 1044
    var self = this;                                                                                                  // 1045
                                                                                                                      //
    // Get back to the beginning.                                                                                     //
    self._rewind();                                                                                                   // 1048
                                                                                                                      //
    // We implement the loop ourself instead of using self._dbCursor.each,                                            //
    // because "each" will call its callback outside of a fiber which makes it                                        //
    // much more complex to make this function synchronous.                                                           //
    var index = 0;                                                                                                    // 1053
    while (true) {                                                                                                    // 1054
      var doc = self._nextObject();                                                                                   // 1055
      if (!doc) return;                                                                                               // 1056
      callback.call(thisArg, doc, index++, self._selfForIteration);                                                   // 1057
    }                                                                                                                 // 1058
  },                                                                                                                  // 1059
                                                                                                                      //
  // XXX Allow overlapping callback executions if callback yields.                                                    //
  map: function map(callback, thisArg) {                                                                              // 1062
    var self = this;                                                                                                  // 1063
    var res = [];                                                                                                     // 1064
    self.forEach(function (doc, index) {                                                                              // 1065
      res.push(callback.call(thisArg, doc, index, self._selfForIteration));                                           // 1066
    });                                                                                                               // 1067
    return res;                                                                                                       // 1068
  },                                                                                                                  // 1069
                                                                                                                      //
  _rewind: function _rewind() {                                                                                       // 1071
    var self = this;                                                                                                  // 1072
                                                                                                                      //
    // known to be synchronous                                                                                        //
    self._dbCursor.rewind();                                                                                          // 1075
                                                                                                                      //
    self._visitedIds = new LocalCollection._IdMap();                                                                  // 1077
  },                                                                                                                  // 1078
                                                                                                                      //
  // Mostly usable for tailable cursors.                                                                              //
  close: function close() {                                                                                           // 1081
    var self = this;                                                                                                  // 1082
                                                                                                                      //
    self._dbCursor.close();                                                                                           // 1084
  },                                                                                                                  // 1085
                                                                                                                      //
  fetch: function fetch() {                                                                                           // 1087
    var self = this;                                                                                                  // 1088
    return self.map(_.identity);                                                                                      // 1089
  },                                                                                                                  // 1090
                                                                                                                      //
  count: function count(applySkipLimit) {                                                                             // 1092
    var self = this;                                                                                                  // 1093
    return self._synchronousCount(applySkipLimit).wait();                                                             // 1094
  },                                                                                                                  // 1095
                                                                                                                      //
  // This method is NOT wrapped in Cursor.                                                                            //
  getRawObjects: function getRawObjects(ordered) {                                                                    // 1098
    var self = this;                                                                                                  // 1099
    if (ordered) {                                                                                                    // 1100
      return self.fetch();                                                                                            // 1101
    } else {                                                                                                          // 1102
      var results = new LocalCollection._IdMap();                                                                     // 1103
      self.forEach(function (doc) {                                                                                   // 1104
        results.set(doc._id, doc);                                                                                    // 1105
      });                                                                                                             // 1106
      return results;                                                                                                 // 1107
    }                                                                                                                 // 1108
  }                                                                                                                   // 1109
});                                                                                                                   // 1016
                                                                                                                      //
MongoConnection.prototype.tail = function (cursorDescription, docCallback) {                                          // 1112
  var self = this;                                                                                                    // 1113
  if (!cursorDescription.options.tailable) throw new Error("Can only tail a tailable cursor");                        // 1114
                                                                                                                      //
  var cursor = self._createSynchronousCursor(cursorDescription);                                                      // 1117
                                                                                                                      //
  var stopped = false;                                                                                                // 1119
  var lastTS = undefined;                                                                                             // 1120
  var loop = function loop() {                                                                                        // 1121
    while (true) {                                                                                                    // 1122
      if (stopped) return;                                                                                            // 1123
      try {                                                                                                           // 1125
        var doc = cursor._nextObject();                                                                               // 1126
      } catch (err) {                                                                                                 // 1127
        // There's no good way to figure out if this was actually an error                                            //
        // from Mongo. Ah well. But either way, we need to retry the cursor                                           //
        // (unless the failure was because the observe got stopped).                                                  //
        doc = null;                                                                                                   // 1131
      }                                                                                                               // 1132
      // Since cursor._nextObject can yield, we need to check again to see if                                         //
      // we've been stopped before calling the callback.                                                              //
      if (stopped) return;                                                                                            // 1135
      if (doc) {                                                                                                      // 1137
        // If a tailable cursor contains a "ts" field, use it to recreate the                                         //
        // cursor on error. ("ts" is a standard that Mongo uses internally for                                        //
        // the oplog, and there's a special flag that lets you do binary search                                       //
        // on it instead of needing to use an index.)                                                                 //
        lastTS = doc.ts;                                                                                              // 1142
        docCallback(doc);                                                                                             // 1143
      } else {                                                                                                        // 1144
        var newSelector = _.clone(cursorDescription.selector);                                                        // 1145
        if (lastTS) {                                                                                                 // 1146
          newSelector.ts = { $gt: lastTS };                                                                           // 1147
        }                                                                                                             // 1148
        cursor = self._createSynchronousCursor(new CursorDescription(cursorDescription.collectionName, newSelector, cursorDescription.options));
        // Mongo failover takes many seconds.  Retry in a bit.  (Without this                                         //
        // setTimeout, we peg the CPU at 100% and never notice the actual                                             //
        // failover.                                                                                                  //
        Meteor.setTimeout(loop, 100);                                                                                 // 1156
        break;                                                                                                        // 1157
      }                                                                                                               // 1158
    }                                                                                                                 // 1159
  };                                                                                                                  // 1160
                                                                                                                      //
  Meteor.defer(loop);                                                                                                 // 1162
                                                                                                                      //
  return {                                                                                                            // 1164
    stop: function stop() {                                                                                           // 1165
      stopped = true;                                                                                                 // 1166
      cursor.close();                                                                                                 // 1167
    }                                                                                                                 // 1168
  };                                                                                                                  // 1164
};                                                                                                                    // 1170
                                                                                                                      //
MongoConnection.prototype._observeChanges = function (cursorDescription, ordered, callbacks) {                        // 1172
  var self = this;                                                                                                    // 1174
                                                                                                                      //
  if (cursorDescription.options.tailable) {                                                                           // 1176
    return self._observeChangesTailable(cursorDescription, ordered, callbacks);                                       // 1177
  }                                                                                                                   // 1178
                                                                                                                      //
  // You may not filter out _id when observing changes, because the id is a core                                      //
  // part of the observeChanges API.                                                                                  //
  if (cursorDescription.options.fields && (cursorDescription.options.fields._id === 0 || cursorDescription.options.fields._id === false)) {
    throw Error("You may not observe a cursor with {fields: {_id: 0}}");                                              // 1185
  }                                                                                                                   // 1186
                                                                                                                      //
  var observeKey = JSON.stringify(_.extend({ ordered: ordered }, cursorDescription));                                 // 1188
                                                                                                                      //
  var multiplexer, observeDriver;                                                                                     // 1191
  var firstHandle = false;                                                                                            // 1192
                                                                                                                      //
  // Find a matching ObserveMultiplexer, or create a new one. This next block is                                      //
  // guaranteed to not yield (and it doesn't call anything that can observe a                                         //
  // new query), so no other calls to this function can interleave with it.                                           //
  Meteor._noYieldsAllowed(function () {                                                                               // 1197
    if (_.has(self._observeMultiplexers, observeKey)) {                                                               // 1198
      multiplexer = self._observeMultiplexers[observeKey];                                                            // 1199
    } else {                                                                                                          // 1200
      firstHandle = true;                                                                                             // 1201
      // Create a new ObserveMultiplexer.                                                                             //
      multiplexer = new ObserveMultiplexer({                                                                          // 1203
        ordered: ordered,                                                                                             // 1204
        onStop: function onStop() {                                                                                   // 1205
          delete self._observeMultiplexers[observeKey];                                                               // 1206
          observeDriver.stop();                                                                                       // 1207
        }                                                                                                             // 1208
      });                                                                                                             // 1203
      self._observeMultiplexers[observeKey] = multiplexer;                                                            // 1210
    }                                                                                                                 // 1211
  });                                                                                                                 // 1212
                                                                                                                      //
  var observeHandle = new ObserveHandle(multiplexer, callbacks);                                                      // 1214
                                                                                                                      //
  if (firstHandle) {                                                                                                  // 1216
    var matcher, sorter;                                                                                              // 1217
    var canUseOplog = _.all([function () {                                                                            // 1218
      // At a bare minimum, using the oplog requires us to have an oplog, to                                          //
      // want unordered callbacks, and to not want a callback on the polls                                            //
      // that won't happen.                                                                                           //
      return self._oplogHandle && !ordered && !callbacks._testOnlyPollCallback;                                       // 1223
    }, function () {                                                                                                  // 1225
      // We need to be able to compile the selector. Fall back to polling for                                         //
      // some newfangled $selector that minimongo doesn't support yet.                                                //
      try {                                                                                                           // 1228
        matcher = new Minimongo.Matcher(cursorDescription.selector);                                                  // 1229
        return true;                                                                                                  // 1230
      } catch (e) {                                                                                                   // 1231
        // XXX make all compilation errors MinimongoError or something                                                //
        //     so that this doesn't ignore unrelated exceptions                                                       //
        return false;                                                                                                 // 1234
      }                                                                                                               // 1235
    }, function () {                                                                                                  // 1236
      // ... and the selector itself needs to support oplog.                                                          //
      return OplogObserveDriver.cursorSupported(cursorDescription, matcher);                                          // 1238
    }, function () {                                                                                                  // 1239
      // And we need to be able to compile the sort, if any.  eg, can't be                                            //
      // {$natural: 1}.                                                                                               //
      if (!cursorDescription.options.sort) return true;                                                               // 1242
      try {                                                                                                           // 1244
        sorter = new Minimongo.Sorter(cursorDescription.options.sort, { matcher: matcher });                          // 1245
        return true;                                                                                                  // 1247
      } catch (e) {                                                                                                   // 1248
        // XXX make all compilation errors MinimongoError or something                                                //
        //     so that this doesn't ignore unrelated exceptions                                                       //
        return false;                                                                                                 // 1251
      }                                                                                                               // 1252
    }], function (f) {                                                                                                // 1253
      return f();                                                                                                     // 1253
    }); // invoke each function                                                                                       // 1253
                                                                                                                      //
    var driverClass = canUseOplog ? OplogObserveDriver : PollingObserveDriver;                                        // 1255
    observeDriver = new driverClass({                                                                                 // 1256
      cursorDescription: cursorDescription,                                                                           // 1257
      mongoHandle: self,                                                                                              // 1258
      multiplexer: multiplexer,                                                                                       // 1259
      ordered: ordered,                                                                                               // 1260
      matcher: matcher, // ignored by polling                                                                         // 1261
      sorter: sorter, // ignored by polling                                                                           // 1262
      _testOnlyPollCallback: callbacks._testOnlyPollCallback                                                          // 1263
    });                                                                                                               // 1256
                                                                                                                      //
    // This field is only set for use in tests.                                                                       //
    multiplexer._observeDriver = observeDriver;                                                                       // 1267
  }                                                                                                                   // 1268
                                                                                                                      //
  // Blocks until the initial adds have been sent.                                                                    //
  multiplexer.addHandleAndSendInitialAdds(observeHandle);                                                             // 1271
                                                                                                                      //
  return observeHandle;                                                                                               // 1273
};                                                                                                                    // 1274
                                                                                                                      //
// Listen for the invalidation messages that will trigger us to poll the                                              //
// database for changes. If this selector specifies specific IDs, specify them                                        //
// here, so that updates to different specific IDs don't cause us to poll.                                            //
// listenCallback is the same kind of (notification, complete) callback passed                                        //
// to InvalidationCrossbar.listen.                                                                                    //
                                                                                                                      //
listenAll = function listenAll(cursorDescription, listenCallback) {                                                   // 1282
  var listeners = [];                                                                                                 // 1283
  forEachTrigger(cursorDescription, function (trigger) {                                                              // 1284
    listeners.push(DDPServer._InvalidationCrossbar.listen(trigger, listenCallback));                                  // 1285
  });                                                                                                                 // 1287
                                                                                                                      //
  return {                                                                                                            // 1289
    stop: function stop() {                                                                                           // 1290
      _.each(listeners, function (listener) {                                                                         // 1291
        listener.stop();                                                                                              // 1292
      });                                                                                                             // 1293
    }                                                                                                                 // 1294
  };                                                                                                                  // 1289
};                                                                                                                    // 1296
                                                                                                                      //
forEachTrigger = function forEachTrigger(cursorDescription, triggerCallback) {                                        // 1298
  var key = { collection: cursorDescription.collectionName };                                                         // 1299
  var specificIds = LocalCollection._idsMatchedBySelector(cursorDescription.selector);                                // 1300
  if (specificIds) {                                                                                                  // 1302
    _.each(specificIds, function (id) {                                                                               // 1303
      triggerCallback(_.extend({ id: id }, key));                                                                     // 1304
    });                                                                                                               // 1305
    triggerCallback(_.extend({ dropCollection: true, id: null }, key));                                               // 1306
  } else {                                                                                                            // 1307
    triggerCallback(key);                                                                                             // 1308
  }                                                                                                                   // 1309
  // Everyone cares about the database being dropped.                                                                 //
  triggerCallback({ dropDatabase: true });                                                                            // 1311
};                                                                                                                    // 1312
                                                                                                                      //
// observeChanges for tailable cursors on capped collections.                                                         //
//                                                                                                                    //
// Some differences from normal cursors:                                                                              //
//   - Will never produce anything other than 'added' or 'addedBefore'. If you                                        //
//     do update a document that has already been produced, this will not notice                                      //
//     it.                                                                                                            //
//   - If you disconnect and reconnect from Mongo, it will essentially restart                                        //
//     the query, which will lead to duplicate results. This is pretty bad,                                           //
//     but if you include a field called 'ts' which is inserted as                                                    //
//     new MongoInternals.MongoTimestamp(0, 0) (which is initialized to the                                           //
//     current Mongo-style timestamp), we'll be able to find the place to                                             //
//     restart properly. (This field is specifically understood by Mongo with an                                      //
//     optimization which allows it to find the right place to start without                                          //
//     an index on ts. It's how the oplog works.)                                                                     //
//   - No callbacks are triggered synchronously with the call (there's no                                             //
//     differentiation between "initial data" and "later changes"; everything                                         //
//     that matches the query gets sent asynchronously).                                                              //
//   - De-duplication is not implemented.                                                                             //
//   - Does not yet interact with the write fence. Probably, this should work by                                      //
//     ignoring removes (which don't work on capped collections) and updates                                          //
//     (which don't affect tailable cursors), and just keeping track of the ID                                        //
//     of the inserted object, and closing the write fence once you get to that                                       //
//     ID (or timestamp?).  This doesn't work well if the document doesn't match                                      //
//     the query, though.  On the other hand, the write fence can close                                               //
//     immediately if it does not match the query. So if we trust minimongo                                           //
//     enough to accurately evaluate the query against the write fence, we                                            //
//     should be able to do this...  Of course, minimongo doesn't even support                                        //
//     Mongo Timestamps yet.                                                                                          //
MongoConnection.prototype._observeChangesTailable = function (cursorDescription, ordered, callbacks) {                // 1342
  var self = this;                                                                                                    // 1344
                                                                                                                      //
  // Tailable cursors only ever call added/addedBefore callbacks, so it's an                                          //
  // error if you didn't provide them.                                                                                //
  if (ordered && !callbacks.addedBefore || !ordered && !callbacks.added) {                                            // 1348
    throw new Error("Can't observe an " + (ordered ? "ordered" : "unordered") + " tailable cursor without a " + (ordered ? "addedBefore" : "added") + " callback");
  }                                                                                                                   // 1353
                                                                                                                      //
  return self.tail(cursorDescription, function (doc) {                                                                // 1355
    var id = doc._id;                                                                                                 // 1356
    delete doc._id;                                                                                                   // 1357
    // The ts is an implementation detail. Hide it.                                                                   //
    delete doc.ts;                                                                                                    // 1359
    if (ordered) {                                                                                                    // 1360
      callbacks.addedBefore(id, doc, null);                                                                           // 1361
    } else {                                                                                                          // 1362
      callbacks.added(id, doc);                                                                                       // 1363
    }                                                                                                                 // 1364
  });                                                                                                                 // 1365
};                                                                                                                    // 1366
                                                                                                                      //
// XXX We probably need to find a better way to expose this. Right now                                                //
// it's only used by tests, but in fact you need it in normal                                                         //
// operation to interact with capped collections.                                                                     //
MongoInternals.MongoTimestamp = MongoDB.Timestamp;                                                                    // 1371
                                                                                                                      //
MongoInternals.Connection = MongoConnection;                                                                          // 1373
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}],"oplog_tailing.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/oplog_tailing.js                                                                                    //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Future = Npm.require('fibers/future');                                                                            // 1
                                                                                                                      //
OPLOG_COLLECTION = 'oplog.rs';                                                                                        // 3
                                                                                                                      //
var TOO_FAR_BEHIND = process.env.METEOR_OPLOG_TOO_FAR_BEHIND || 2000;                                                 // 5
                                                                                                                      //
var showTS = function showTS(ts) {                                                                                    // 7
  return "Timestamp(" + ts.getHighBits() + ", " + ts.getLowBits() + ")";                                              // 8
};                                                                                                                    // 9
                                                                                                                      //
idForOp = function idForOp(op) {                                                                                      // 11
  if (op.op === 'd') return op.o._id;else if (op.op === 'i') return op.o._id;else if (op.op === 'u') return op.o2._id;else if (op.op === 'c') throw Error("Operator 'c' doesn't supply an object with id: " + EJSON.stringify(op));else throw Error("Unknown op: " + EJSON.stringify(op));
};                                                                                                                    // 23
                                                                                                                      //
OplogHandle = function OplogHandle(oplogUrl, dbName) {                                                                // 25
  var self = this;                                                                                                    // 26
  self._oplogUrl = oplogUrl;                                                                                          // 27
  self._dbName = dbName;                                                                                              // 28
                                                                                                                      //
  self._oplogLastEntryConnection = null;                                                                              // 30
  self._oplogTailConnection = null;                                                                                   // 31
  self._stopped = false;                                                                                              // 32
  self._tailHandle = null;                                                                                            // 33
  self._readyFuture = new Future();                                                                                   // 34
  self._crossbar = new DDPServer._Crossbar({                                                                          // 35
    factPackage: "mongo-livedata", factName: "oplog-watchers"                                                         // 36
  });                                                                                                                 // 35
  self._baseOplogSelector = {                                                                                         // 38
    ns: new RegExp('^' + Meteor._escapeRegExp(self._dbName) + '\\.'),                                                 // 39
    $or: [{ op: { $in: ['i', 'u', 'd'] } },                                                                           // 40
    // drop collection                                                                                                //
    { op: 'c', 'o.drop': { $exists: true } }, { op: 'c', 'o.dropDatabase': 1 }]                                       // 43
  };                                                                                                                  // 38
                                                                                                                      //
  // Data structures to support waitUntilCaughtUp(). Each oplog entry has a                                           //
  // MongoTimestamp object on it (which is not the same as a Date --- it's a                                          //
  // combination of time and an incrementing counter; see                                                             //
  // http://docs.mongodb.org/manual/reference/bson-types/#timestamps).                                                //
  //                                                                                                                  //
  // _catchingUpFutures is an array of {ts: MongoTimestamp, future: Future}                                           //
  // objects, sorted by ascending timestamp. _lastProcessedTS is the                                                  //
  // MongoTimestamp of the last oplog entry we've processed.                                                          //
  //                                                                                                                  //
  // Each time we call waitUntilCaughtUp, we take a peek at the final oplog                                           //
  // entry in the db.  If we've already processed it (ie, it is not greater than                                      //
  // _lastProcessedTS), waitUntilCaughtUp immediately returns. Otherwise,                                             //
  // waitUntilCaughtUp makes a new Future and inserts it along with the final                                         //
  // timestamp entry that it read, into _catchingUpFutures. waitUntilCaughtUp                                         //
  // then waits on that future, which is resolved once _lastProcessedTS is                                            //
  // incremented to be past its timestamp by the worker fiber.                                                        //
  //                                                                                                                  //
  // XXX use a priority queue or something else that's faster than an array                                           //
  self._catchingUpFutures = [];                                                                                       // 66
  self._lastProcessedTS = null;                                                                                       // 67
                                                                                                                      //
  self._onSkippedEntriesHook = new Hook({                                                                             // 69
    debugPrintExceptions: "onSkippedEntries callback"                                                                 // 70
  });                                                                                                                 // 69
                                                                                                                      //
  self._entryQueue = new Meteor._DoubleEndedQueue();                                                                  // 73
  self._workerActive = false;                                                                                         // 74
                                                                                                                      //
  self._startTailing();                                                                                               // 76
};                                                                                                                    // 77
                                                                                                                      //
_.extend(OplogHandle.prototype, {                                                                                     // 79
  stop: function stop() {                                                                                             // 80
    var self = this;                                                                                                  // 81
    if (self._stopped) return;                                                                                        // 82
    self._stopped = true;                                                                                             // 84
    if (self._tailHandle) self._tailHandle.stop();                                                                    // 85
    // XXX should close connections too                                                                               //
  },                                                                                                                  // 88
  onOplogEntry: function onOplogEntry(trigger, callback) {                                                            // 89
    var self = this;                                                                                                  // 90
    if (self._stopped) throw new Error("Called onOplogEntry on stopped handle!");                                     // 91
                                                                                                                      //
    // Calling onOplogEntry requires us to wait for the tailing to be ready.                                          //
    self._readyFuture.wait();                                                                                         // 95
                                                                                                                      //
    var originalCallback = callback;                                                                                  // 97
    callback = Meteor.bindEnvironment(function (notification) {                                                       // 98
      // XXX can we avoid this clone by making oplog.js careful?                                                      //
      originalCallback(EJSON.clone(notification));                                                                    // 100
    }, function (err) {                                                                                               // 101
      Meteor._debug("Error in oplog callback", err.stack);                                                            // 102
    });                                                                                                               // 103
    var listenHandle = self._crossbar.listen(trigger, callback);                                                      // 104
    return {                                                                                                          // 105
      stop: function stop() {                                                                                         // 106
        listenHandle.stop();                                                                                          // 107
      }                                                                                                               // 108
    };                                                                                                                // 105
  },                                                                                                                  // 110
  // Register a callback to be invoked any time we skip oplog entries (eg,                                            //
  // because we are too far behind).                                                                                  //
  onSkippedEntries: function onSkippedEntries(callback) {                                                             // 113
    var self = this;                                                                                                  // 114
    if (self._stopped) throw new Error("Called onSkippedEntries on stopped handle!");                                 // 115
    return self._onSkippedEntriesHook.register(callback);                                                             // 117
  },                                                                                                                  // 118
  // Calls `callback` once the oplog has been processed up to a point that is                                         //
  // roughly "now": specifically, once we've processed all ops that are                                               //
  // currently visible.                                                                                               //
  // XXX become convinced that this is actually safe even if oplogConnection                                          //
  // is some kind of pool                                                                                             //
  waitUntilCaughtUp: function waitUntilCaughtUp() {                                                                   // 124
    var self = this;                                                                                                  // 125
    if (self._stopped) throw new Error("Called waitUntilCaughtUp on stopped handle!");                                // 126
                                                                                                                      //
    // Calling waitUntilCaughtUp requries us to wait for the oplog connection to                                      //
    // be ready.                                                                                                      //
    self._readyFuture.wait();                                                                                         // 131
                                                                                                                      //
    while (!self._stopped) {                                                                                          // 133
      // We need to make the selector at least as restrictive as the actual                                           //
      // tailing selector (ie, we need to specify the DB name) or else we might                                       //
      // find a TS that won't show up in the actual tail stream.                                                      //
      try {                                                                                                           // 137
        var lastEntry = self._oplogLastEntryConnection.findOne(OPLOG_COLLECTION, self._baseOplogSelector, { fields: { ts: 1 }, sort: { $natural: -1 } });
        break;                                                                                                        // 141
      } catch (e) {                                                                                                   // 142
        // During failover (eg) if we get an exception we should log and retry                                        //
        // instead of crashing.                                                                                       //
        Meteor._debug("Got exception while reading last entry: " + e);                                                // 145
        Meteor._sleepForMs(100);                                                                                      // 146
      }                                                                                                               // 147
    }                                                                                                                 // 148
                                                                                                                      //
    if (self._stopped) return;                                                                                        // 150
                                                                                                                      //
    if (!lastEntry) {                                                                                                 // 153
      // Really, nothing in the oplog? Well, we've processed everything.                                              //
      return;                                                                                                         // 155
    }                                                                                                                 // 156
                                                                                                                      //
    var ts = lastEntry.ts;                                                                                            // 158
    if (!ts) throw Error("oplog entry without ts: " + EJSON.stringify(lastEntry));                                    // 159
                                                                                                                      //
    if (self._lastProcessedTS && ts.lessThanOrEqual(self._lastProcessedTS)) {                                         // 162
      // We've already caught up to here.                                                                             //
      return;                                                                                                         // 164
    }                                                                                                                 // 165
                                                                                                                      //
    // Insert the future into our list. Almost always, this will be at the end,                                       //
    // but it's conceivable that if we fail over from one primary to another,                                         //
    // the oplog entries we see will go backwards.                                                                    //
    var insertAfter = self._catchingUpFutures.length;                                                                 // 171
    while (insertAfter - 1 > 0 && self._catchingUpFutures[insertAfter - 1].ts.greaterThan(ts)) {                      // 172
      insertAfter--;                                                                                                  // 174
    }                                                                                                                 // 175
    var f = new Future();                                                                                             // 176
    self._catchingUpFutures.splice(insertAfter, 0, { ts: ts, future: f });                                            // 177
    f.wait();                                                                                                         // 178
  },                                                                                                                  // 179
  _startTailing: function _startTailing() {                                                                           // 180
    var self = this;                                                                                                  // 181
    // First, make sure that we're talking to the local database.                                                     //
    var mongodbUri = Npm.require('mongodb-uri');                                                                      // 183
    if (mongodbUri.parse(self._oplogUrl).database !== 'local') {                                                      // 184
      throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of " + "a Mongo replica set");                // 185
    }                                                                                                                 // 187
                                                                                                                      //
    // We make two separate connections to Mongo. The Node Mongo driver                                               //
    // implements a naive round-robin connection pool: each "connection" is a                                         //
    // pool of several (5 by default) TCP connections, and each request is                                            //
    // rotated through the pools. Tailable cursor queries block on the server                                         //
    // until there is some data to return (or until a few seconds have                                                //
    // passed). So if the connection pool used for tailing cursors is the same                                        //
    // pool used for other queries, the other queries will be delayed by seconds                                      //
    // 1/5 of the time.                                                                                               //
    //                                                                                                                //
    // The tail connection will only ever be running a single tail command, so                                        //
    // it only needs to make one underlying TCP connection.                                                           //
    self._oplogTailConnection = new MongoConnection(self._oplogUrl, { poolSize: 1 });                                 // 200
    // XXX better docs, but: it's to get monotonic results                                                            //
    // XXX is it safe to say "if there's an in flight query, just use its                                             //
    //     results"? I don't think so but should consider that                                                        //
    self._oplogLastEntryConnection = new MongoConnection(self._oplogUrl, { poolSize: 1 });                            // 205
                                                                                                                      //
    // Now, make sure that there actually is a repl set here. If not, oplog                                           //
    // tailing won't ever find anything!                                                                              //
    // More on the isMasterDoc                                                                                        //
    // https://docs.mongodb.com/manual/reference/command/isMaster/                                                    //
    var f = new Future();                                                                                             // 212
    self._oplogLastEntryConnection.db.admin().command({ ismaster: 1 }, f.resolver());                                 // 213
    var isMasterDoc = f.wait();                                                                                       // 215
                                                                                                                      //
    if (!(isMasterDoc && isMasterDoc.setName)) {                                                                      // 217
      throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of " + "a Mongo replica set");                // 218
    }                                                                                                                 // 220
                                                                                                                      //
    // Find the last oplog entry.                                                                                     //
    var lastOplogEntry = self._oplogLastEntryConnection.findOne(OPLOG_COLLECTION, {}, { sort: { $natural: -1 }, fields: { ts: 1 } });
                                                                                                                      //
    var oplogSelector = _.clone(self._baseOplogSelector);                                                             // 226
    if (lastOplogEntry) {                                                                                             // 227
      // Start after the last entry that currently exists.                                                            //
      oplogSelector.ts = { $gt: lastOplogEntry.ts };                                                                  // 229
      // If there are any calls to callWhenProcessedLatest before any other                                           //
      // oplog entries show up, allow callWhenProcessedLatest to call its                                             //
      // callback immediately.                                                                                        //
      self._lastProcessedTS = lastOplogEntry.ts;                                                                      // 233
    }                                                                                                                 // 234
                                                                                                                      //
    var cursorDescription = new CursorDescription(OPLOG_COLLECTION, oplogSelector, { tailable: true });               // 236
                                                                                                                      //
    self._tailHandle = self._oplogTailConnection.tail(cursorDescription, function (doc) {                             // 239
      self._entryQueue.push(doc);                                                                                     // 241
      self._maybeStartWorker();                                                                                       // 242
    });                                                                                                               // 243
    self._readyFuture['return']();                                                                                    // 245
  },                                                                                                                  // 246
                                                                                                                      //
  _maybeStartWorker: function _maybeStartWorker() {                                                                   // 248
    var self = this;                                                                                                  // 249
    if (self._workerActive) return;                                                                                   // 250
    self._workerActive = true;                                                                                        // 252
    Meteor.defer(function () {                                                                                        // 253
      try {                                                                                                           // 254
        while (!self._stopped && !self._entryQueue.isEmpty()) {                                                       // 255
          // Are we too far behind? Just tell our observers that they need to                                         //
          // repoll, and drop our queue.                                                                              //
          if (self._entryQueue.length > TOO_FAR_BEHIND) {                                                             // 258
            var lastEntry = self._entryQueue.pop();                                                                   // 259
            self._entryQueue.clear();                                                                                 // 260
                                                                                                                      //
            self._onSkippedEntriesHook.each(function (callback) {                                                     // 262
              callback();                                                                                             // 263
              return true;                                                                                            // 264
            });                                                                                                       // 265
                                                                                                                      //
            // Free any waitUntilCaughtUp() calls that were waiting for us to                                         //
            // pass something that we just skipped.                                                                   //
            self._setLastProcessedTS(lastEntry.ts);                                                                   // 269
            continue;                                                                                                 // 270
          }                                                                                                           // 271
                                                                                                                      //
          var doc = self._entryQueue.shift();                                                                         // 273
                                                                                                                      //
          if (!(doc.ns && doc.ns.length > self._dbName.length + 1 && doc.ns.substr(0, self._dbName.length + 1) === self._dbName + '.')) {
            throw new Error("Unexpected ns");                                                                         // 278
          }                                                                                                           // 279
                                                                                                                      //
          var trigger = { collection: doc.ns.substr(self._dbName.length + 1),                                         // 281
            dropCollection: false,                                                                                    // 282
            dropDatabase: false,                                                                                      // 283
            op: doc };                                                                                                // 284
                                                                                                                      //
          // Is it a special command and the collection name is hidden somewhere                                      //
          // in operator?                                                                                             //
          if (trigger.collection === "$cmd") {                                                                        // 288
            if (doc.o.dropDatabase) {                                                                                 // 289
              delete trigger.collection;                                                                              // 290
              trigger.dropDatabase = true;                                                                            // 291
            } else if (_.has(doc.o, 'drop')) {                                                                        // 292
              trigger.collection = doc.o.drop;                                                                        // 293
              trigger.dropCollection = true;                                                                          // 294
              trigger.id = null;                                                                                      // 295
            } else {                                                                                                  // 296
              throw Error("Unknown command " + JSON.stringify(doc));                                                  // 297
            }                                                                                                         // 298
          } else {                                                                                                    // 299
            // All other ops have an id.                                                                              //
            trigger.id = idForOp(doc);                                                                                // 301
          }                                                                                                           // 302
                                                                                                                      //
          self._crossbar.fire(trigger);                                                                               // 304
                                                                                                                      //
          // Now that we've processed this operation, process pending                                                 //
          // sequencers.                                                                                              //
          if (!doc.ts) throw Error("oplog entry without ts: " + EJSON.stringify(doc));                                // 308
          self._setLastProcessedTS(doc.ts);                                                                           // 310
        }                                                                                                             // 311
      } finally {                                                                                                     // 312
        self._workerActive = false;                                                                                   // 313
      }                                                                                                               // 314
    });                                                                                                               // 315
  },                                                                                                                  // 316
  _setLastProcessedTS: function _setLastProcessedTS(ts) {                                                             // 317
    var self = this;                                                                                                  // 318
    self._lastProcessedTS = ts;                                                                                       // 319
    while (!_.isEmpty(self._catchingUpFutures) && self._catchingUpFutures[0].ts.lessThanOrEqual(self._lastProcessedTS)) {
      var sequencer = self._catchingUpFutures.shift();                                                                // 323
      sequencer.future['return']();                                                                                   // 324
    }                                                                                                                 // 325
  },                                                                                                                  // 326
                                                                                                                      //
  //Methods used on tests to dinamically change TOO_FAR_BEHIND                                                        //
  _defineTooFarBehind: function _defineTooFarBehind(value) {                                                          // 329
    TOO_FAR_BEHIND = value;                                                                                           // 330
  },                                                                                                                  // 331
  _resetTooFarBehind: function _resetTooFarBehind() {                                                                 // 332
    TOO_FAR_BEHIND = process.env.METEOR_OPLOG_TOO_FAR_BEHIND || 2000;                                                 // 333
  }                                                                                                                   // 334
});                                                                                                                   // 79
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"observe_multiplex.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/observe_multiplex.js                                                                                //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Future = Npm.require('fibers/future');                                                                            // 1
                                                                                                                      //
ObserveMultiplexer = function ObserveMultiplexer(options) {                                                           // 3
  var self = this;                                                                                                    // 4
                                                                                                                      //
  if (!options || !_.has(options, 'ordered')) throw Error("must specified ordered");                                  // 6
                                                                                                                      //
  Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-multiplexers", 1);              // 9
                                                                                                                      //
  self._ordered = options.ordered;                                                                                    // 12
  self._onStop = options.onStop || function () {};                                                                    // 13
  self._queue = new Meteor._SynchronousQueue();                                                                       // 14
  self._handles = {};                                                                                                 // 15
  self._readyFuture = new Future();                                                                                   // 16
  self._cache = new LocalCollection._CachingChangeObserver({                                                          // 17
    ordered: options.ordered });                                                                                      // 18
  // Number of addHandleAndSendInitialAdds tasks scheduled but not yet                                                //
  // running. removeHandle uses this to know if it's time to call the onStop                                          //
  // callback.                                                                                                        //
  self._addHandleTasksScheduledButNotPerformed = 0;                                                                   // 22
                                                                                                                      //
  _.each(self.callbackNames(), function (callbackName) {                                                              // 24
    self[callbackName] = function () /* ... */{                                                                       // 25
      self._applyCallback(callbackName, _.toArray(arguments));                                                        // 26
    };                                                                                                                // 27
  });                                                                                                                 // 28
};                                                                                                                    // 29
                                                                                                                      //
_.extend(ObserveMultiplexer.prototype, {                                                                              // 31
  addHandleAndSendInitialAdds: function addHandleAndSendInitialAdds(handle) {                                         // 32
    var self = this;                                                                                                  // 33
                                                                                                                      //
    // Check this before calling runTask (even though runTask does the same                                           //
    // check) so that we don't leak an ObserveMultiplexer on error by                                                 //
    // incrementing _addHandleTasksScheduledButNotPerformed and never                                                 //
    // decrementing it.                                                                                               //
    if (!self._queue.safeToRunTask()) throw new Error("Can't call observeChanges from an observe callback on the same query");
    ++self._addHandleTasksScheduledButNotPerformed;                                                                   // 42
                                                                                                                      //
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-handles", 1);                 // 44
                                                                                                                      //
    self._queue.runTask(function () {                                                                                 // 47
      self._handles[handle._id] = handle;                                                                             // 48
      // Send out whatever adds we have so far (whether or not we the                                                 //
      // multiplexer is ready).                                                                                       //
      self._sendAdds(handle);                                                                                         // 51
      --self._addHandleTasksScheduledButNotPerformed;                                                                 // 52
    });                                                                                                               // 53
    // *outside* the task, since otherwise we'd deadlock                                                              //
    self._readyFuture.wait();                                                                                         // 55
  },                                                                                                                  // 56
                                                                                                                      //
  // Remove an observe handle. If it was the last observe handle, call the                                            //
  // onStop callback; you cannot add any more observe handles after this.                                             //
  //                                                                                                                  //
  // This is not synchronized with polls and handle additions: this means that                                        //
  // you can safely call it from within an observe callback, but it also means                                        //
  // that we have to be careful when we iterate over _handles.                                                        //
  removeHandle: function removeHandle(id) {                                                                           // 64
    var self = this;                                                                                                  // 65
                                                                                                                      //
    // This should not be possible: you can only call removeHandle by having                                          //
    // access to the ObserveHandle, which isn't returned to user code until the                                       //
    // multiplex is ready.                                                                                            //
    if (!self._ready()) throw new Error("Can't remove handles until the multiplex is ready");                         // 70
                                                                                                                      //
    delete self._handles[id];                                                                                         // 73
                                                                                                                      //
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-handles", -1);                // 75
                                                                                                                      //
    if (_.isEmpty(self._handles) && self._addHandleTasksScheduledButNotPerformed === 0) {                             // 78
      self._stop();                                                                                                   // 80
    }                                                                                                                 // 81
  },                                                                                                                  // 82
  _stop: function _stop(options) {                                                                                    // 83
    var self = this;                                                                                                  // 84
    options = options || {};                                                                                          // 85
                                                                                                                      //
    // It shouldn't be possible for us to stop when all our handles still                                             //
    // haven't been returned from observeChanges!                                                                     //
    if (!self._ready() && !options.fromQueryError) throw Error("surprising _stop: not ready");                        // 89
                                                                                                                      //
    // Call stop callback (which kills the underlying process which sends us                                          //
    // callbacks and removes us from the connection's dictionary).                                                    //
    self._onStop();                                                                                                   // 94
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-multiplexers", -1);           // 95
                                                                                                                      //
    // Cause future addHandleAndSendInitialAdds calls to throw (but the onStop                                        //
    // callback should make our connection forget about us).                                                          //
    self._handles = null;                                                                                             // 100
  },                                                                                                                  // 101
                                                                                                                      //
  // Allows all addHandleAndSendInitialAdds calls to return, once all preceding                                       //
  // adds have been processed. Does not block.                                                                        //
  ready: function ready() {                                                                                           // 105
    var self = this;                                                                                                  // 106
    self._queue.queueTask(function () {                                                                               // 107
      if (self._ready()) throw Error("can't make ObserveMultiplex ready twice!");                                     // 108
      self._readyFuture['return']();                                                                                  // 110
    });                                                                                                               // 111
  },                                                                                                                  // 112
                                                                                                                      //
  // If trying to execute the query results in an error, call this. This is                                           //
  // intended for permanent errors, not transient network errors that could be                                        //
  // fixed. It should only be called before ready(), because if you called ready                                      //
  // that meant that you managed to run the query once. It will stop this                                             //
  // ObserveMultiplex and cause addHandleAndSendInitialAdds calls (and thus                                           //
  // observeChanges calls) to throw the error.                                                                        //
  queryError: function queryError(err) {                                                                              // 120
    var self = this;                                                                                                  // 121
    self._queue.runTask(function () {                                                                                 // 122
      if (self._ready()) throw Error("can't claim query has an error after it worked!");                              // 123
      self._stop({ fromQueryError: true });                                                                           // 125
      self._readyFuture['throw'](err);                                                                                // 126
    });                                                                                                               // 127
  },                                                                                                                  // 128
                                                                                                                      //
  // Calls "cb" once the effects of all "ready", "addHandleAndSendInitialAdds"                                        //
  // and observe callbacks which came before this call have been propagated to                                        //
  // all handles. "ready" must have already been called on this multiplexer.                                          //
  onFlush: function onFlush(cb) {                                                                                     // 133
    var self = this;                                                                                                  // 134
    self._queue.queueTask(function () {                                                                               // 135
      if (!self._ready()) throw Error("only call onFlush on a multiplexer that will be ready");                       // 136
      cb();                                                                                                           // 138
    });                                                                                                               // 139
  },                                                                                                                  // 140
  callbackNames: function callbackNames() {                                                                           // 141
    var self = this;                                                                                                  // 142
    if (self._ordered) return ["addedBefore", "changed", "movedBefore", "removed"];else return ["added", "changed", "removed"];
  },                                                                                                                  // 147
  _ready: function _ready() {                                                                                         // 148
    return this._readyFuture.isResolved();                                                                            // 149
  },                                                                                                                  // 150
  _applyCallback: function _applyCallback(callbackName, args) {                                                       // 151
    var self = this;                                                                                                  // 152
    self._queue.queueTask(function () {                                                                               // 153
      // If we stopped in the meantime, do nothing.                                                                   //
      if (!self._handles) return;                                                                                     // 155
                                                                                                                      //
      // First, apply the change to the cache.                                                                        //
      // XXX We could make applyChange callbacks promise not to hang on to any                                        //
      // state from their arguments (assuming that their supplied callbacks                                           //
      // don't) and skip this clone. Currently 'changed' hangs on to state                                            //
      // though.                                                                                                      //
      self._cache.applyChange[callbackName].apply(null, EJSON.clone(args));                                           // 163
                                                                                                                      //
      // If we haven't finished the initial adds, then we should only be getting                                      //
      // adds.                                                                                                        //
      if (!self._ready() && callbackName !== 'added' && callbackName !== 'addedBefore') {                             // 167
        throw new Error("Got " + callbackName + " during initial adds");                                              // 169
      }                                                                                                               // 170
                                                                                                                      //
      // Now multiplex the callbacks out to all observe handles. It's OK if                                           //
      // these calls yield; since we're inside a task, no other use of our queue                                      //
      // can continue until these are done. (But we do have to be careful to not                                      //
      // use a handle that got removed, because removeHandle does not use the                                         //
      // queue; thus, we iterate over an array of keys that we control.)                                              //
      _.each(_.keys(self._handles), function (handleId) {                                                             // 177
        var handle = self._handles && self._handles[handleId];                                                        // 178
        if (!handle) return;                                                                                          // 179
        var callback = handle['_' + callbackName];                                                                    // 181
        // clone arguments so that callbacks can mutate their arguments                                               //
        callback && callback.apply(null, EJSON.clone(args));                                                          // 183
      });                                                                                                             // 184
    });                                                                                                               // 185
  },                                                                                                                  // 186
                                                                                                                      //
  // Sends initial adds to a handle. It should only be called from within a task                                      //
  // (the task that is processing the addHandleAndSendInitialAdds call). It                                           //
  // synchronously invokes the handle's added or addedBefore; there's no need to                                      //
  // flush the queue afterwards to ensure that the callbacks get out.                                                 //
  _sendAdds: function _sendAdds(handle) {                                                                             // 192
    var self = this;                                                                                                  // 193
    if (self._queue.safeToRunTask()) throw Error("_sendAdds may only be called from within a task!");                 // 194
    var add = self._ordered ? handle._addedBefore : handle._added;                                                    // 196
    if (!add) return;                                                                                                 // 197
    // note: docs may be an _IdMap or an OrderedDict                                                                  //
    self._cache.docs.forEach(function (doc, id) {                                                                     // 200
      if (!_.has(self._handles, handle._id)) throw Error("handle got removed before sending initial adds!");          // 201
      var fields = EJSON.clone(doc);                                                                                  // 203
      delete fields._id;                                                                                              // 204
      if (self._ordered) add(id, fields, null); // we're going in order, so add at end                                // 205
      else add(id, fields);                                                                                           // 205
    });                                                                                                               // 209
  }                                                                                                                   // 210
});                                                                                                                   // 31
                                                                                                                      //
var nextObserveHandleId = 1;                                                                                          // 214
ObserveHandle = function ObserveHandle(multiplexer, callbacks) {                                                      // 215
  var self = this;                                                                                                    // 216
  // The end user is only supposed to call stop().  The other fields are                                              //
  // accessible to the multiplexer, though.                                                                           //
  self._multiplexer = multiplexer;                                                                                    // 219
  _.each(multiplexer.callbackNames(), function (name) {                                                               // 220
    if (callbacks[name]) {                                                                                            // 221
      self['_' + name] = callbacks[name];                                                                             // 222
    } else if (name === "addedBefore" && callbacks.added) {                                                           // 223
      // Special case: if you specify "added" and "movedBefore", you get an                                           //
      // ordered observe where for some reason you don't get ordering data on                                         //
      // the adds.  I dunno, we wrote tests for it, there must have been a                                            //
      // reason.                                                                                                      //
      self._addedBefore = function (id, fields, before) {                                                             // 228
        callbacks.added(id, fields);                                                                                  // 229
      };                                                                                                              // 230
    }                                                                                                                 // 231
  });                                                                                                                 // 232
  self._stopped = false;                                                                                              // 233
  self._id = nextObserveHandleId++;                                                                                   // 234
};                                                                                                                    // 235
ObserveHandle.prototype.stop = function () {                                                                          // 236
  var self = this;                                                                                                    // 237
  if (self._stopped) return;                                                                                          // 238
  self._stopped = true;                                                                                               // 240
  self._multiplexer.removeHandle(self._id);                                                                           // 241
};                                                                                                                    // 242
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"doc_fetcher.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/doc_fetcher.js                                                                                      //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');                                                                                    // 1
var Future = Npm.require('fibers/future');                                                                            // 2
                                                                                                                      //
DocFetcher = function DocFetcher(mongoConnection) {                                                                   // 4
  var self = this;                                                                                                    // 5
  self._mongoConnection = mongoConnection;                                                                            // 6
  // Map from cache key -> [callback]                                                                                 //
  self._callbacksForCacheKey = {};                                                                                    // 8
};                                                                                                                    // 9
                                                                                                                      //
_.extend(DocFetcher.prototype, {                                                                                      // 11
  // Fetches document "id" from collectionName, returning it or null if not                                           //
  // found.                                                                                                           //
  //                                                                                                                  //
  // If you make multiple calls to fetch() with the same cacheKey (a string),                                         //
  // DocFetcher may assume that they all return the same document. (It does                                           //
  // not check to see if collectionName/id match.)                                                                    //
  //                                                                                                                  //
  // You may assume that callback is never called synchronously (and in fact                                          //
  // OplogObserveDriver does so).                                                                                     //
  fetch: function fetch(collectionName, id, cacheKey, callback) {                                                     // 21
    var self = this;                                                                                                  // 22
                                                                                                                      //
    check(collectionName, String);                                                                                    // 24
    // id is some sort of scalar                                                                                      //
    check(cacheKey, String);                                                                                          // 26
                                                                                                                      //
    // If there's already an in-progress fetch for this cache key, yield until                                        //
    // it's done and return whatever it returns.                                                                      //
    if (_.has(self._callbacksForCacheKey, cacheKey)) {                                                                // 30
      self._callbacksForCacheKey[cacheKey].push(callback);                                                            // 31
      return;                                                                                                         // 32
    }                                                                                                                 // 33
                                                                                                                      //
    var callbacks = self._callbacksForCacheKey[cacheKey] = [callback];                                                // 35
                                                                                                                      //
    Fiber(function () {                                                                                               // 37
      try {                                                                                                           // 38
        var doc = self._mongoConnection.findOne(collectionName, { _id: id }) || null;                                 // 39
        // Return doc to all relevant callbacks. Note that this array can                                             //
        // continue to grow during callback excecution.                                                               //
        while (!_.isEmpty(callbacks)) {                                                                               // 43
          // Clone the document so that the various calls to fetch don't return                                       //
          // objects that are intertwingled with each other. Clone before                                             //
          // popping the future, so that if clone throws, the error gets passed                                       //
          // to the next callback.                                                                                    //
          var clonedDoc = EJSON.clone(doc);                                                                           // 48
          callbacks.pop()(null, clonedDoc);                                                                           // 49
        }                                                                                                             // 50
      } catch (e) {                                                                                                   // 51
        while (!_.isEmpty(callbacks)) {                                                                               // 52
          callbacks.pop()(e);                                                                                         // 53
        }                                                                                                             // 54
      } finally {                                                                                                     // 55
        // XXX consider keeping the doc around for a period of time before                                            //
        // removing from the cache                                                                                    //
        delete self._callbacksForCacheKey[cacheKey];                                                                  // 58
      }                                                                                                               // 59
    }).run();                                                                                                         // 60
  }                                                                                                                   // 61
});                                                                                                                   // 11
                                                                                                                      //
MongoTest.DocFetcher = DocFetcher;                                                                                    // 64
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"polling_observe_driver.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/polling_observe_driver.js                                                                           //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
PollingObserveDriver = function PollingObserveDriver(options) {                                                       // 1
  var self = this;                                                                                                    // 2
                                                                                                                      //
  self._cursorDescription = options.cursorDescription;                                                                // 4
  self._mongoHandle = options.mongoHandle;                                                                            // 5
  self._ordered = options.ordered;                                                                                    // 6
  self._multiplexer = options.multiplexer;                                                                            // 7
  self._stopCallbacks = [];                                                                                           // 8
  self._stopped = false;                                                                                              // 9
                                                                                                                      //
  self._synchronousCursor = self._mongoHandle._createSynchronousCursor(self._cursorDescription);                      // 11
                                                                                                                      //
  // previous results snapshot.  on each poll cycle, diffs against                                                    //
  // results drives the callbacks.                                                                                    //
  self._results = null;                                                                                               // 16
                                                                                                                      //
  // The number of _pollMongo calls that have been added to self._taskQueue but                                       //
  // have not started running. Used to make sure we never schedule more than one                                      //
  // _pollMongo (other than possibly the one that is currently running). It's                                         //
  // also used by _suspendPolling to pretend there's a poll scheduled. Usually,                                       //
  // it's either 0 (for "no polls scheduled other than maybe one currently                                            //
  // running") or 1 (for "a poll scheduled that isn't running yet"), but it can                                       //
  // also be 2 if incremented by _suspendPolling.                                                                     //
  self._pollsScheduledButNotStarted = 0;                                                                              // 25
  self._pendingWrites = []; // people to notify when polling completes                                                // 26
                                                                                                                      //
  // Make sure to create a separately throttled function for each                                                     //
  // PollingObserveDriver object.                                                                                     //
  self._ensurePollIsScheduled = _.throttle(self._unthrottledEnsurePollIsScheduled, self._cursorDescription.options.pollingThrottleMs || 50 /* ms */);
                                                                                                                      //
  // XXX figure out if we still need a queue                                                                          //
  self._taskQueue = new Meteor._SynchronousQueue();                                                                   // 35
                                                                                                                      //
  var listenersHandle = listenAll(self._cursorDescription, function (notification) {                                  // 37
    // When someone does a transaction that might affect us, schedule a poll                                          //
    // of the database. If that transaction happens inside of a write fence,                                          //
    // block the fence until we've polled and notified observers.                                                     //
    var fence = DDPServer._CurrentWriteFence.get();                                                                   // 42
    if (fence) self._pendingWrites.push(fence.beginWrite());                                                          // 43
    // Ensure a poll is scheduled... but if we already know that one is,                                              //
    // don't hit the throttled _ensurePollIsScheduled function (which might                                           //
    // lead to us calling it unnecessarily in <pollingThrottleMs> ms).                                                //
    if (self._pollsScheduledButNotStarted === 0) self._ensurePollIsScheduled();                                       // 48
  });                                                                                                                 // 50
  self._stopCallbacks.push(function () {                                                                              // 52
    listenersHandle.stop();                                                                                           // 52
  });                                                                                                                 // 52
                                                                                                                      //
  // every once and a while, poll even if we don't think we're dirty, for                                             //
  // eventual consistency with database writes from outside the Meteor                                                //
  // universe.                                                                                                        //
  //                                                                                                                  //
  // For testing, there's an undocumented callback argument to observeChanges                                         //
  // which disables time-based polling and gets called at the beginning of each                                       //
  // poll.                                                                                                            //
  if (options._testOnlyPollCallback) {                                                                                // 61
    self._testOnlyPollCallback = options._testOnlyPollCallback;                                                       // 62
  } else {                                                                                                            // 63
    var pollingInterval = self._cursorDescription.options.pollingIntervalMs || self._cursorDescription.options._pollingInterval || // COMPAT with 1.2
    10 * 1000;                                                                                                        // 67
    var intervalHandle = Meteor.setInterval(_.bind(self._ensurePollIsScheduled, self), pollingInterval);              // 68
    self._stopCallbacks.push(function () {                                                                            // 70
      Meteor.clearInterval(intervalHandle);                                                                           // 71
    });                                                                                                               // 72
  }                                                                                                                   // 73
                                                                                                                      //
  // Make sure we actually poll soon!                                                                                 //
  self._unthrottledEnsurePollIsScheduled();                                                                           // 76
                                                                                                                      //
  Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-polling", 1);           // 78
};                                                                                                                    // 80
                                                                                                                      //
_.extend(PollingObserveDriver.prototype, {                                                                            // 82
  // This is always called through _.throttle (except once at startup).                                               //
  _unthrottledEnsurePollIsScheduled: function _unthrottledEnsurePollIsScheduled() {                                   // 84
    var self = this;                                                                                                  // 85
    if (self._pollsScheduledButNotStarted > 0) return;                                                                // 86
    ++self._pollsScheduledButNotStarted;                                                                              // 88
    self._taskQueue.queueTask(function () {                                                                           // 89
      self._pollMongo();                                                                                              // 90
    });                                                                                                               // 91
  },                                                                                                                  // 92
                                                                                                                      //
  // test-only interface for controlling polling.                                                                     //
  //                                                                                                                  //
  // _suspendPolling blocks until any currently running and scheduled polls are                                       //
  // done, and prevents any further polls from being scheduled. (new                                                  //
  // ObserveHandles can be added and receive their initial added callbacks,                                           //
  // though.)                                                                                                         //
  //                                                                                                                  //
  // _resumePolling immediately polls, and allows further polls to occur.                                             //
  _suspendPolling: function _suspendPolling() {                                                                       // 102
    var self = this;                                                                                                  // 103
    // Pretend that there's another poll scheduled (which will prevent                                                //
    // _ensurePollIsScheduled from queueing any more polls).                                                          //
    ++self._pollsScheduledButNotStarted;                                                                              // 106
    // Now block until all currently running or scheduled polls are done.                                             //
    self._taskQueue.runTask(function () {});                                                                          // 108
                                                                                                                      //
    // Confirm that there is only one "poll" (the fake one we're pretending to                                        //
    // have) scheduled.                                                                                               //
    if (self._pollsScheduledButNotStarted !== 1) throw new Error("_pollsScheduledButNotStarted is " + self._pollsScheduledButNotStarted);
  },                                                                                                                  // 115
  _resumePolling: function _resumePolling() {                                                                         // 116
    var self = this;                                                                                                  // 117
    // We should be in the same state as in the end of _suspendPolling.                                               //
    if (self._pollsScheduledButNotStarted !== 1) throw new Error("_pollsScheduledButNotStarted is " + self._pollsScheduledButNotStarted);
    // Run a poll synchronously (which will counteract the                                                            //
    // ++_pollsScheduledButNotStarted from _suspendPolling).                                                          //
    self._taskQueue.runTask(function () {                                                                             // 124
      self._pollMongo();                                                                                              // 125
    });                                                                                                               // 126
  },                                                                                                                  // 127
                                                                                                                      //
  _pollMongo: function _pollMongo() {                                                                                 // 129
    var self = this;                                                                                                  // 130
    --self._pollsScheduledButNotStarted;                                                                              // 131
                                                                                                                      //
    if (self._stopped) return;                                                                                        // 133
                                                                                                                      //
    var first = false;                                                                                                // 136
    var oldResults = self._results;                                                                                   // 137
    if (!oldResults) {                                                                                                // 138
      first = true;                                                                                                   // 139
      // XXX maybe use OrderedDict instead?                                                                           //
      oldResults = self._ordered ? [] : new LocalCollection._IdMap();                                                 // 141
    }                                                                                                                 // 142
                                                                                                                      //
    self._testOnlyPollCallback && self._testOnlyPollCallback();                                                       // 144
                                                                                                                      //
    // Save the list of pending writes which this round will commit.                                                  //
    var writesForCycle = self._pendingWrites;                                                                         // 147
    self._pendingWrites = [];                                                                                         // 148
                                                                                                                      //
    // Get the new query results. (This yields.)                                                                      //
    try {                                                                                                             // 151
      var newResults = self._synchronousCursor.getRawObjects(self._ordered);                                          // 152
    } catch (e) {                                                                                                     // 153
      if (first && typeof e.code === 'number') {                                                                      // 154
        // This is an error document sent to us by mongod, not a connection                                           //
        // error generated by the client. And we've never seen this query work                                        //
        // successfully. Probably it's a bad selector or something, so we should                                      //
        // NOT retry. Instead, we should halt the observe (which ends up calling                                      //
        // `stop` on us).                                                                                             //
        self._multiplexer.queryError(new Error("Exception while polling query " + JSON.stringify(self._cursorDescription) + ": " + e.message));
        return;                                                                                                       // 164
      }                                                                                                               // 165
                                                                                                                      //
      // getRawObjects can throw if we're having trouble talking to the                                               //
      // database.  That's fine --- we will repoll later anyway. But we should                                        //
      // make sure not to lose track of this cycle's writes.                                                          //
      // (It also can throw if there's just something invalid about this query;                                       //
      // unfortunately the ObserveDriver API doesn't provide a good way to                                            //
      // "cancel" the observe from the inside in this case.                                                           //
      Array.prototype.push.apply(self._pendingWrites, writesForCycle);                                                // 173
      Meteor._debug("Exception while polling query " + JSON.stringify(self._cursorDescription) + ": " + e.stack);     // 174
      return;                                                                                                         // 176
    }                                                                                                                 // 177
                                                                                                                      //
    // Run diffs.                                                                                                     //
    if (!self._stopped) {                                                                                             // 180
      LocalCollection._diffQueryChanges(self._ordered, oldResults, newResults, self._multiplexer);                    // 181
    }                                                                                                                 // 183
                                                                                                                      //
    // Signals the multiplexer to allow all observeChanges calls that share this                                      //
    // multiplexer to return. (This happens asynchronously, via the                                                   //
    // multiplexer's queue.)                                                                                          //
    if (first) self._multiplexer.ready();                                                                             // 188
                                                                                                                      //
    // Replace self._results atomically.  (This assignment is what makes `first`                                      //
    // stay through on the next cycle, so we've waited until after we've                                              //
    // committed to ready-ing the multiplexer.)                                                                       //
    self._results = newResults;                                                                                       // 194
                                                                                                                      //
    // Once the ObserveMultiplexer has processed everything we've done in this                                        //
    // round, mark all the writes which existed before this call as                                                   //
    // commmitted. (If new writes have shown up in the meantime, there'll                                             //
    // already be another _pollMongo task scheduled.)                                                                 //
    self._multiplexer.onFlush(function () {                                                                           // 200
      _.each(writesForCycle, function (w) {                                                                           // 201
        w.committed();                                                                                                // 202
      });                                                                                                             // 203
    });                                                                                                               // 204
  },                                                                                                                  // 205
                                                                                                                      //
  stop: function stop() {                                                                                             // 207
    var self = this;                                                                                                  // 208
    self._stopped = true;                                                                                             // 209
    _.each(self._stopCallbacks, function (c) {                                                                        // 210
      c();                                                                                                            // 210
    });                                                                                                               // 210
    // Release any write fences that are waiting on us.                                                               //
    _.each(self._pendingWrites, function (w) {                                                                        // 212
      w.committed();                                                                                                  // 213
    });                                                                                                               // 214
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-polling", -1);        // 215
  }                                                                                                                   // 217
});                                                                                                                   // 82
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"oplog_observe_driver.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/oplog_observe_driver.js                                                                             //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
var Fiber = Npm.require('fibers');                                                                                    // 1
var Future = Npm.require('fibers/future');                                                                            // 2
                                                                                                                      //
var PHASE = {                                                                                                         // 4
  QUERYING: "QUERYING",                                                                                               // 5
  FETCHING: "FETCHING",                                                                                               // 6
  STEADY: "STEADY"                                                                                                    // 7
};                                                                                                                    // 4
                                                                                                                      //
// Exception thrown by _needToPollQuery which unrolls the stack up to the                                             //
// enclosing call to finishIfNeedToPollQuery.                                                                         //
var SwitchedToQuery = function SwitchedToQuery() {};                                                                  // 12
var finishIfNeedToPollQuery = function finishIfNeedToPollQuery(f) {                                                   // 13
  return function () {                                                                                                // 14
    try {                                                                                                             // 15
      f.apply(this, arguments);                                                                                       // 16
    } catch (e) {                                                                                                     // 17
      if (!(e instanceof SwitchedToQuery)) throw e;                                                                   // 18
    }                                                                                                                 // 20
  };                                                                                                                  // 21
};                                                                                                                    // 22
                                                                                                                      //
var currentId = 0;                                                                                                    // 24
                                                                                                                      //
// OplogObserveDriver is an alternative to PollingObserveDriver which follows                                         //
// the Mongo operation log instead of just re-polling the query. It obeys the                                         //
// same simple interface: constructing it starts sending observeChanges                                               //
// callbacks (and a ready() invocation) to the ObserveMultiplexer, and you stop                                       //
// it by calling the stop() method.                                                                                   //
OplogObserveDriver = function OplogObserveDriver(options) {                                                           // 31
  var self = this;                                                                                                    // 32
  self._usesOplog = true; // tests look at this                                                                       // 33
                                                                                                                      //
  self._id = currentId;                                                                                               // 35
  currentId++;                                                                                                        // 36
                                                                                                                      //
  self._cursorDescription = options.cursorDescription;                                                                // 38
  self._mongoHandle = options.mongoHandle;                                                                            // 39
  self._multiplexer = options.multiplexer;                                                                            // 40
                                                                                                                      //
  if (options.ordered) {                                                                                              // 42
    throw Error("OplogObserveDriver only supports unordered observeChanges");                                         // 43
  }                                                                                                                   // 44
                                                                                                                      //
  var sorter = options.sorter;                                                                                        // 46
  // We don't support $near and other geo-queries so it's OK to initialize the                                        //
  // comparator only once in the constructor.                                                                         //
  var comparator = sorter && sorter.getComparator();                                                                  // 49
                                                                                                                      //
  if (options.cursorDescription.options.limit) {                                                                      // 51
    // There are several properties ordered driver implements:                                                        //
    // - _limit is a positive number                                                                                  //
    // - _comparator is a function-comparator by which the query is ordered                                           //
    // - _unpublishedBuffer is non-null Min/Max Heap,                                                                 //
    //                      the empty buffer in STEADY phase implies that the                                         //
    //                      everything that matches the queries selector fits                                         //
    //                      into published set.                                                                       //
    // - _published - Min Heap (also implements IdMap methods)                                                        //
                                                                                                                      //
    var heapOptions = { IdMap: LocalCollection._IdMap };                                                              // 61
    self._limit = self._cursorDescription.options.limit;                                                              // 62
    self._comparator = comparator;                                                                                    // 63
    self._sorter = sorter;                                                                                            // 64
    self._unpublishedBuffer = new MinMaxHeap(comparator, heapOptions);                                                // 65
    // We need something that can find Max value in addition to IdMap interface                                       //
    self._published = new MaxHeap(comparator, heapOptions);                                                           // 67
  } else {                                                                                                            // 68
    self._limit = 0;                                                                                                  // 69
    self._comparator = null;                                                                                          // 70
    self._sorter = null;                                                                                              // 71
    self._unpublishedBuffer = null;                                                                                   // 72
    self._published = new LocalCollection._IdMap();                                                                   // 73
  }                                                                                                                   // 74
                                                                                                                      //
  // Indicates if it is safe to insert a new document at the end of the buffer                                        //
  // for this query. i.e. it is known that there are no documents matching the                                        //
  // selector those are not in published or buffer.                                                                   //
  self._safeAppendToBuffer = false;                                                                                   // 79
                                                                                                                      //
  self._stopped = false;                                                                                              // 81
  self._stopHandles = [];                                                                                             // 82
                                                                                                                      //
  Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-oplog", 1);             // 84
                                                                                                                      //
  self._registerPhaseChange(PHASE.QUERYING);                                                                          // 87
                                                                                                                      //
  var selector = self._cursorDescription.selector;                                                                    // 89
  self._matcher = options.matcher;                                                                                    // 90
  var projection = self._cursorDescription.options.fields || {};                                                      // 91
  self._projectionFn = LocalCollection._compileProjection(projection);                                                // 92
  // Projection function, result of combining important fields for selector and                                       //
  // existing fields projection                                                                                       //
  self._sharedProjection = self._matcher.combineIntoProjection(projection);                                           // 95
  if (sorter) self._sharedProjection = sorter.combineIntoProjection(self._sharedProjection);                          // 96
  self._sharedProjectionFn = LocalCollection._compileProjection(self._sharedProjection);                              // 98
                                                                                                                      //
  self._needToFetch = new LocalCollection._IdMap();                                                                   // 101
  self._currentlyFetching = null;                                                                                     // 102
  self._fetchGeneration = 0;                                                                                          // 103
                                                                                                                      //
  self._requeryWhenDoneThisQuery = false;                                                                             // 105
  self._writesToCommitWhenWeReachSteady = [];                                                                         // 106
                                                                                                                      //
  // If the oplog handle tells us that it skipped some entries (because it got                                        //
  // behind, say), re-poll.                                                                                           //
  self._stopHandles.push(self._mongoHandle._oplogHandle.onSkippedEntries(finishIfNeedToPollQuery(function () {        // 110
    self._needToPollQuery();                                                                                          // 112
  })));                                                                                                               // 113
                                                                                                                      //
  forEachTrigger(self._cursorDescription, function (trigger) {                                                        // 116
    self._stopHandles.push(self._mongoHandle._oplogHandle.onOplogEntry(trigger, function (notification) {             // 117
      Meteor._noYieldsAllowed(finishIfNeedToPollQuery(function () {                                                   // 119
        var op = notification.op;                                                                                     // 120
        if (notification.dropCollection || notification.dropDatabase) {                                               // 121
          // Note: this call is not allowed to block on anything (especially                                          //
          // on waiting for oplog entries to catch up) because that will block                                        //
          // onOplogEntry!                                                                                            //
          self._needToPollQuery();                                                                                    // 125
        } else {                                                                                                      // 126
          // All other operators should be handled depending on phase                                                 //
          if (self._phase === PHASE.QUERYING) self._handleOplogEntryQuerying(op);else self._handleOplogEntrySteadyOrFetching(op);
        }                                                                                                             // 132
      }));                                                                                                            // 133
    }));                                                                                                              // 134
  });                                                                                                                 // 136
                                                                                                                      //
  // XXX ordering w.r.t. everything else?                                                                             //
  self._stopHandles.push(listenAll(self._cursorDescription, function (notification) {                                 // 139
    // If we're not in a pre-fire write fence, we don't have to do anything.                                          //
    var fence = DDPServer._CurrentWriteFence.get();                                                                   // 142
    if (!fence || fence.fired) return;                                                                                // 143
                                                                                                                      //
    if (fence._oplogObserveDrivers) {                                                                                 // 146
      fence._oplogObserveDrivers[self._id] = self;                                                                    // 147
      return;                                                                                                         // 148
    }                                                                                                                 // 149
                                                                                                                      //
    fence._oplogObserveDrivers = {};                                                                                  // 151
    fence._oplogObserveDrivers[self._id] = self;                                                                      // 152
                                                                                                                      //
    fence.onBeforeFire(function () {                                                                                  // 154
      var drivers = fence._oplogObserveDrivers;                                                                       // 155
      delete fence._oplogObserveDrivers;                                                                              // 156
                                                                                                                      //
      // This fence cannot fire until we've caught up to "this point" in the                                          //
      // oplog, and all observers made it back to the steady state.                                                   //
      self._mongoHandle._oplogHandle.waitUntilCaughtUp();                                                             // 160
                                                                                                                      //
      _.each(drivers, function (driver) {                                                                             // 162
        if (driver._stopped) return;                                                                                  // 163
                                                                                                                      //
        var write = fence.beginWrite();                                                                               // 166
        if (driver._phase === PHASE.STEADY) {                                                                         // 167
          // Make sure that all of the callbacks have made it through the                                             //
          // multiplexer and been delivered to ObserveHandles before committing                                       //
          // writes.                                                                                                  //
          driver._multiplexer.onFlush(function () {                                                                   // 171
            write.committed();                                                                                        // 172
          });                                                                                                         // 173
        } else {                                                                                                      // 174
          driver._writesToCommitWhenWeReachSteady.push(write);                                                        // 175
        }                                                                                                             // 176
      });                                                                                                             // 177
    });                                                                                                               // 178
  }));                                                                                                                // 179
                                                                                                                      //
  // When Mongo fails over, we need to repoll the query, in case we processed an                                      //
  // oplog entry that got rolled back.                                                                                //
  self._stopHandles.push(self._mongoHandle._onFailover(finishIfNeedToPollQuery(function () {                          // 184
    self._needToPollQuery();                                                                                          // 186
  })));                                                                                                               // 187
                                                                                                                      //
  // Give _observeChanges a chance to add the new ObserveHandle to our                                                //
  // multiplexer, so that the added calls get streamed.                                                               //
  Meteor.defer(finishIfNeedToPollQuery(function () {                                                                  // 191
    self._runInitialQuery();                                                                                          // 192
  }));                                                                                                                // 193
};                                                                                                                    // 194
                                                                                                                      //
_.extend(OplogObserveDriver.prototype, {                                                                              // 196
  _addPublished: function _addPublished(id, doc) {                                                                    // 197
    var self = this;                                                                                                  // 198
    Meteor._noYieldsAllowed(function () {                                                                             // 199
      var fields = _.clone(doc);                                                                                      // 200
      delete fields._id;                                                                                              // 201
      self._published.set(id, self._sharedProjectionFn(doc));                                                         // 202
      self._multiplexer.added(id, self._projectionFn(fields));                                                        // 203
                                                                                                                      //
      // After adding this document, the published set might be overflowed                                            //
      // (exceeding capacity specified by limit). If so, push the maximum                                             //
      // element to the buffer, we might want to save it in memory to reduce the                                      //
      // amount of Mongo lookups in the future.                                                                       //
      if (self._limit && self._published.size() > self._limit) {                                                      // 209
        // XXX in theory the size of published is no more than limit+1                                                //
        if (self._published.size() !== self._limit + 1) {                                                             // 211
          throw new Error("After adding to published, " + (self._published.size() - self._limit) + " documents are overflowing the set");
        }                                                                                                             // 215
                                                                                                                      //
        var overflowingDocId = self._published.maxElementId();                                                        // 217
        var overflowingDoc = self._published.get(overflowingDocId);                                                   // 218
                                                                                                                      //
        if (EJSON.equals(overflowingDocId, id)) {                                                                     // 220
          throw new Error("The document just added is overflowing the published set");                                // 221
        }                                                                                                             // 222
                                                                                                                      //
        self._published.remove(overflowingDocId);                                                                     // 224
        self._multiplexer.removed(overflowingDocId);                                                                  // 225
        self._addBuffered(overflowingDocId, overflowingDoc);                                                          // 226
      }                                                                                                               // 227
    });                                                                                                               // 228
  },                                                                                                                  // 229
  _removePublished: function _removePublished(id) {                                                                   // 230
    var self = this;                                                                                                  // 231
    Meteor._noYieldsAllowed(function () {                                                                             // 232
      self._published.remove(id);                                                                                     // 233
      self._multiplexer.removed(id);                                                                                  // 234
      if (!self._limit || self._published.size() === self._limit) return;                                             // 235
                                                                                                                      //
      if (self._published.size() > self._limit) throw Error("self._published got too big");                           // 238
                                                                                                                      //
      // OK, we are publishing less than the limit. Maybe we should look in the                                       //
      // buffer to find the next element past what we were publishing before.                                         //
                                                                                                                      //
      if (!self._unpublishedBuffer.empty()) {                                                                         // 244
        // There's something in the buffer; move the first thing in it to                                             //
        // _published.                                                                                                //
        var newDocId = self._unpublishedBuffer.minElementId();                                                        // 247
        var newDoc = self._unpublishedBuffer.get(newDocId);                                                           // 248
        self._removeBuffered(newDocId);                                                                               // 249
        self._addPublished(newDocId, newDoc);                                                                         // 250
        return;                                                                                                       // 251
      }                                                                                                               // 252
                                                                                                                      //
      // There's nothing in the buffer.  This could mean one of a few things.                                         //
                                                                                                                      //
      // (a) We could be in the middle of re-running the query (specifically, we                                      //
      // could be in _publishNewResults). In that case, _unpublishedBuffer is                                         //
      // empty because we clear it at the beginning of _publishNewResults. In                                         //
      // this case, our caller already knows the entire answer to the query and                                       //
      // we don't need to do anything fancy here.  Just return.                                                       //
      if (self._phase === PHASE.QUERYING) return;                                                                     // 261
                                                                                                                      //
      // (b) We're pretty confident that the union of _published and                                                  //
      // _unpublishedBuffer contain all documents that match selector. Because                                        //
      // _unpublishedBuffer is empty, that means we're confident that _published                                      //
      // contains all documents that match selector. So we have nothing to do.                                        //
      if (self._safeAppendToBuffer) return;                                                                           // 268
                                                                                                                      //
      // (c) Maybe there are other documents out there that should be in our                                          //
      // buffer. But in that case, when we emptied _unpublishedBuffer in                                              //
      // _removeBuffered, we should have called _needToPollQuery, which will                                          //
      // either put something in _unpublishedBuffer or set _safeAppendToBuffer                                        //
      // (or both), and it will put us in QUERYING for that whole time. So in                                         //
      // fact, we shouldn't be able to get here.                                                                      //
                                                                                                                      //
      throw new Error("Buffer inexplicably empty");                                                                   // 278
    });                                                                                                               // 279
  },                                                                                                                  // 280
  _changePublished: function _changePublished(id, oldDoc, newDoc) {                                                   // 281
    var self = this;                                                                                                  // 282
    Meteor._noYieldsAllowed(function () {                                                                             // 283
      self._published.set(id, self._sharedProjectionFn(newDoc));                                                      // 284
      var projectedNew = self._projectionFn(newDoc);                                                                  // 285
      var projectedOld = self._projectionFn(oldDoc);                                                                  // 286
      var changed = DiffSequence.makeChangedFields(projectedNew, projectedOld);                                       // 287
      if (!_.isEmpty(changed)) self._multiplexer.changed(id, changed);                                                // 289
    });                                                                                                               // 291
  },                                                                                                                  // 292
  _addBuffered: function _addBuffered(id, doc) {                                                                      // 293
    var self = this;                                                                                                  // 294
    Meteor._noYieldsAllowed(function () {                                                                             // 295
      self._unpublishedBuffer.set(id, self._sharedProjectionFn(doc));                                                 // 296
                                                                                                                      //
      // If something is overflowing the buffer, we just remove it from cache                                         //
      if (self._unpublishedBuffer.size() > self._limit) {                                                             // 299
        var maxBufferedId = self._unpublishedBuffer.maxElementId();                                                   // 300
                                                                                                                      //
        self._unpublishedBuffer.remove(maxBufferedId);                                                                // 302
                                                                                                                      //
        // Since something matching is removed from cache (both published set and                                     //
        // buffer), set flag to false                                                                                 //
        self._safeAppendToBuffer = false;                                                                             // 306
      }                                                                                                               // 307
    });                                                                                                               // 308
  },                                                                                                                  // 309
  // Is called either to remove the doc completely from matching set or to move                                       //
  // it to the published set later.                                                                                   //
  _removeBuffered: function _removeBuffered(id) {                                                                     // 312
    var self = this;                                                                                                  // 313
    Meteor._noYieldsAllowed(function () {                                                                             // 314
      self._unpublishedBuffer.remove(id);                                                                             // 315
      // To keep the contract "buffer is never empty in STEADY phase unless the                                       //
      // everything matching fits into published" true, we poll everything as                                         //
      // soon as we see the buffer becoming empty.                                                                    //
      if (!self._unpublishedBuffer.size() && !self._safeAppendToBuffer) self._needToPollQuery();                      // 319
    });                                                                                                               // 321
  },                                                                                                                  // 322
  // Called when a document has joined the "Matching" results set.                                                    //
  // Takes responsibility of keeping _unpublishedBuffer in sync with _published                                       //
  // and the effect of limit enforced.                                                                                //
  _addMatching: function _addMatching(doc) {                                                                          // 326
    var self = this;                                                                                                  // 327
    Meteor._noYieldsAllowed(function () {                                                                             // 328
      var id = doc._id;                                                                                               // 329
      if (self._published.has(id)) throw Error("tried to add something already published " + id);                     // 330
      if (self._limit && self._unpublishedBuffer.has(id)) throw Error("tried to add something already existed in buffer " + id);
                                                                                                                      //
      var limit = self._limit;                                                                                        // 335
      var comparator = self._comparator;                                                                              // 336
      var maxPublished = limit && self._published.size() > 0 ? self._published.get(self._published.maxElementId()) : null;
      var maxBuffered = limit && self._unpublishedBuffer.size() > 0 ? self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId()) : null;
      // The query is unlimited or didn't publish enough documents yet or the                                         //
      // new document would fit into published set pushing the maximum element                                        //
      // out, then we need to publish the doc.                                                                        //
      var toPublish = !limit || self._published.size() < limit || comparator(doc, maxPublished) < 0;                  // 345
                                                                                                                      //
      // Otherwise we might need to buffer it (only in case of limited query).                                        //
      // Buffering is allowed if the buffer is not filled up yet and all                                              //
      // matching docs are either in the published set or in the buffer.                                              //
      var canAppendToBuffer = !toPublish && self._safeAppendToBuffer && self._unpublishedBuffer.size() < limit;       // 351
                                                                                                                      //
      // Or if it is small enough to be safely inserted to the middle or the                                          //
      // beginning of the buffer.                                                                                     //
      var canInsertIntoBuffer = !toPublish && maxBuffered && comparator(doc, maxBuffered) <= 0;                       // 356
                                                                                                                      //
      var toBuffer = canAppendToBuffer || canInsertIntoBuffer;                                                        // 359
                                                                                                                      //
      if (toPublish) {                                                                                                // 361
        self._addPublished(id, doc);                                                                                  // 362
      } else if (toBuffer) {                                                                                          // 363
        self._addBuffered(id, doc);                                                                                   // 364
      } else {                                                                                                        // 365
        // dropping it and not saving to the cache                                                                    //
        self._safeAppendToBuffer = false;                                                                             // 367
      }                                                                                                               // 368
    });                                                                                                               // 369
  },                                                                                                                  // 370
  // Called when a document leaves the "Matching" results set.                                                        //
  // Takes responsibility of keeping _unpublishedBuffer in sync with _published                                       //
  // and the effect of limit enforced.                                                                                //
  _removeMatching: function _removeMatching(id) {                                                                     // 374
    var self = this;                                                                                                  // 375
    Meteor._noYieldsAllowed(function () {                                                                             // 376
      if (!self._published.has(id) && !self._limit) throw Error("tried to remove something matching but not cached " + id);
                                                                                                                      //
      if (self._published.has(id)) {                                                                                  // 380
        self._removePublished(id);                                                                                    // 381
      } else if (self._unpublishedBuffer.has(id)) {                                                                   // 382
        self._removeBuffered(id);                                                                                     // 383
      }                                                                                                               // 384
    });                                                                                                               // 385
  },                                                                                                                  // 386
  _handleDoc: function _handleDoc(id, newDoc) {                                                                       // 387
    var self = this;                                                                                                  // 388
    Meteor._noYieldsAllowed(function () {                                                                             // 389
      var matchesNow = newDoc && self._matcher.documentMatches(newDoc).result;                                        // 390
                                                                                                                      //
      var publishedBefore = self._published.has(id);                                                                  // 392
      var bufferedBefore = self._limit && self._unpublishedBuffer.has(id);                                            // 393
      var cachedBefore = publishedBefore || bufferedBefore;                                                           // 394
                                                                                                                      //
      if (matchesNow && !cachedBefore) {                                                                              // 396
        self._addMatching(newDoc);                                                                                    // 397
      } else if (cachedBefore && !matchesNow) {                                                                       // 398
        self._removeMatching(id);                                                                                     // 399
      } else if (cachedBefore && matchesNow) {                                                                        // 400
        var oldDoc = self._published.get(id);                                                                         // 401
        var comparator = self._comparator;                                                                            // 402
        var minBuffered = self._limit && self._unpublishedBuffer.size() && self._unpublishedBuffer.get(self._unpublishedBuffer.minElementId());
                                                                                                                      //
        if (publishedBefore) {                                                                                        // 406
          // Unlimited case where the document stays in published once it                                             //
          // matches or the case when we don't have enough matching docs to                                           //
          // publish or the changed but matching doc will stay in published                                           //
          // anyways.                                                                                                 //
          //                                                                                                          //
          // XXX: We rely on the emptiness of buffer. Be sure to maintain the                                         //
          // fact that buffer can't be empty if there are matching documents not                                      //
          // published. Notably, we don't want to schedule repoll and continue                                        //
          // relying on this property.                                                                                //
          var staysInPublished = !self._limit || self._unpublishedBuffer.size() === 0 || comparator(newDoc, minBuffered) <= 0;
                                                                                                                      //
          if (staysInPublished) {                                                                                     // 420
            self._changePublished(id, oldDoc, newDoc);                                                                // 421
          } else {                                                                                                    // 422
            // after the change doc doesn't stay in the published, remove it                                          //
            self._removePublished(id);                                                                                // 424
            // but it can move into buffered now, check it                                                            //
            var maxBuffered = self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId());                    // 426
                                                                                                                      //
            var toBuffer = self._safeAppendToBuffer || maxBuffered && comparator(newDoc, maxBuffered) <= 0;           // 429
                                                                                                                      //
            if (toBuffer) {                                                                                           // 432
              self._addBuffered(id, newDoc);                                                                          // 433
            } else {                                                                                                  // 434
              // Throw away from both published set and buffer                                                        //
              self._safeAppendToBuffer = false;                                                                       // 436
            }                                                                                                         // 437
          }                                                                                                           // 438
        } else if (bufferedBefore) {                                                                                  // 439
          oldDoc = self._unpublishedBuffer.get(id);                                                                   // 440
          // remove the old version manually instead of using _removeBuffered so                                      //
          // we don't trigger the querying immediately.  if we end this block                                         //
          // with the buffer empty, we will need to trigger the query poll                                            //
          // manually too.                                                                                            //
          self._unpublishedBuffer.remove(id);                                                                         // 445
                                                                                                                      //
          var maxPublished = self._published.get(self._published.maxElementId());                                     // 447
          var maxBuffered = self._unpublishedBuffer.size() && self._unpublishedBuffer.get(self._unpublishedBuffer.maxElementId());
                                                                                                                      //
          // the buffered doc was updated, it could move to published                                                 //
          var toPublish = comparator(newDoc, maxPublished) < 0;                                                       // 454
                                                                                                                      //
          // or stays in buffer even after the change                                                                 //
          var staysInBuffer = !toPublish && self._safeAppendToBuffer || !toPublish && maxBuffered && comparator(newDoc, maxBuffered) <= 0;
                                                                                                                      //
          if (toPublish) {                                                                                            // 461
            self._addPublished(id, newDoc);                                                                           // 462
          } else if (staysInBuffer) {                                                                                 // 463
            // stays in buffer but changes                                                                            //
            self._unpublishedBuffer.set(id, newDoc);                                                                  // 465
          } else {                                                                                                    // 466
            // Throw away from both published set and buffer                                                          //
            self._safeAppendToBuffer = false;                                                                         // 468
            // Normally this check would have been done in _removeBuffered but                                        //
            // we didn't use it, so we need to do it ourself now.                                                     //
            if (!self._unpublishedBuffer.size()) {                                                                    // 471
              self._needToPollQuery();                                                                                // 472
            }                                                                                                         // 473
          }                                                                                                           // 474
        } else {                                                                                                      // 475
          throw new Error("cachedBefore implies either of publishedBefore or bufferedBefore is true.");               // 476
        }                                                                                                             // 477
      }                                                                                                               // 478
    });                                                                                                               // 479
  },                                                                                                                  // 480
  _fetchModifiedDocuments: function _fetchModifiedDocuments() {                                                       // 481
    var self = this;                                                                                                  // 482
    Meteor._noYieldsAllowed(function () {                                                                             // 483
      self._registerPhaseChange(PHASE.FETCHING);                                                                      // 484
      // Defer, because nothing called from the oplog entry handler may yield,                                        //
      // but fetch() yields.                                                                                          //
      Meteor.defer(finishIfNeedToPollQuery(function () {                                                              // 487
        while (!self._stopped && !self._needToFetch.empty()) {                                                        // 488
          if (self._phase === PHASE.QUERYING) {                                                                       // 489
            // While fetching, we decided to go into QUERYING mode, and then we                                       //
            // saw another oplog entry, so _needToFetch is not empty. But we                                          //
            // shouldn't fetch these documents until AFTER the query is done.                                         //
            break;                                                                                                    // 493
          }                                                                                                           // 494
                                                                                                                      //
          // Being in steady phase here would be surprising.                                                          //
          if (self._phase !== PHASE.FETCHING) throw new Error("phase in fetchModifiedDocuments: " + self._phase);     // 497
                                                                                                                      //
          self._currentlyFetching = self._needToFetch;                                                                // 500
          var thisGeneration = ++self._fetchGeneration;                                                               // 501
          self._needToFetch = new LocalCollection._IdMap();                                                           // 502
          var waiting = 0;                                                                                            // 503
          var fut = new Future();                                                                                     // 504
          // This loop is safe, because _currentlyFetching will not be updated                                        //
          // during this loop (in fact, it is never mutated).                                                         //
          self._currentlyFetching.forEach(function (cacheKey, id) {                                                   // 507
            waiting++;                                                                                                // 508
            self._mongoHandle._docFetcher.fetch(self._cursorDescription.collectionName, id, cacheKey, finishIfNeedToPollQuery(function (err, doc) {
              try {                                                                                                   // 512
                if (err) {                                                                                            // 513
                  Meteor._debug("Got exception while fetching documents: " + err);                                    // 514
                  // If we get an error from the fetcher (eg, trouble                                                 //
                  // connecting to Mongo), let's just abandon the fetch phase                                         //
                  // altogether and fall back to polling. It's not like we're                                         //
                  // getting live updates anyway.                                                                     //
                  if (self._phase !== PHASE.QUERYING) {                                                               // 520
                    self._needToPollQuery();                                                                          // 521
                  }                                                                                                   // 522
                } else if (!self._stopped && self._phase === PHASE.FETCHING && self._fetchGeneration === thisGeneration) {
                  // We re-check the generation in case we've had an explicit                                         //
                  // _pollQuery call (eg, in another fiber) which should                                              //
                  // effectively cancel this round of fetches.  (_pollQuery                                           //
                  // increments the generation.)                                                                      //
                  self._handleDoc(id, doc);                                                                           // 529
                }                                                                                                     // 530
              } finally {                                                                                             // 531
                waiting--;                                                                                            // 532
                // Because fetch() never calls its callback synchronously,                                            //
                // this is safe (ie, we won't call fut.return() before the                                            //
                // forEach is done).                                                                                  //
                if (waiting === 0) fut['return']();                                                                   // 536
              }                                                                                                       // 538
            }));                                                                                                      // 539
          });                                                                                                         // 540
          fut.wait();                                                                                                 // 541
          // Exit now if we've had a _pollQuery call (here or in another fiber).                                      //
          if (self._phase === PHASE.QUERYING) return;                                                                 // 543
          self._currentlyFetching = null;                                                                             // 545
        }                                                                                                             // 546
        // We're done fetching, so we can be steady, unless we've had a                                               //
        // _pollQuery call (here or in another fiber).                                                                //
        if (self._phase !== PHASE.QUERYING) self._beSteady();                                                         // 549
      }));                                                                                                            // 551
    });                                                                                                               // 552
  },                                                                                                                  // 553
  _beSteady: function _beSteady() {                                                                                   // 554
    var self = this;                                                                                                  // 555
    Meteor._noYieldsAllowed(function () {                                                                             // 556
      self._registerPhaseChange(PHASE.STEADY);                                                                        // 557
      var writes = self._writesToCommitWhenWeReachSteady;                                                             // 558
      self._writesToCommitWhenWeReachSteady = [];                                                                     // 559
      self._multiplexer.onFlush(function () {                                                                         // 560
        _.each(writes, function (w) {                                                                                 // 561
          w.committed();                                                                                              // 562
        });                                                                                                           // 563
      });                                                                                                             // 564
    });                                                                                                               // 565
  },                                                                                                                  // 566
  _handleOplogEntryQuerying: function _handleOplogEntryQuerying(op) {                                                 // 567
    var self = this;                                                                                                  // 568
    Meteor._noYieldsAllowed(function () {                                                                             // 569
      self._needToFetch.set(idForOp(op), op.ts.toString());                                                           // 570
    });                                                                                                               // 571
  },                                                                                                                  // 572
  _handleOplogEntrySteadyOrFetching: function _handleOplogEntrySteadyOrFetching(op) {                                 // 573
    var self = this;                                                                                                  // 574
    Meteor._noYieldsAllowed(function () {                                                                             // 575
      var id = idForOp(op);                                                                                           // 576
      // If we're already fetching this one, or about to, we can't optimize;                                          //
      // make sure that we fetch it again if necessary.                                                               //
      if (self._phase === PHASE.FETCHING && (self._currentlyFetching && self._currentlyFetching.has(id) || self._needToFetch.has(id))) {
        self._needToFetch.set(id, op.ts.toString());                                                                  // 582
        return;                                                                                                       // 583
      }                                                                                                               // 584
                                                                                                                      //
      if (op.op === 'd') {                                                                                            // 586
        if (self._published.has(id) || self._limit && self._unpublishedBuffer.has(id)) self._removeMatching(id);      // 587
      } else if (op.op === 'i') {                                                                                     // 590
        if (self._published.has(id)) throw new Error("insert found for already-existing ID in published");            // 591
        if (self._unpublishedBuffer && self._unpublishedBuffer.has(id)) throw new Error("insert found for already-existing ID in buffer");
                                                                                                                      //
        // XXX what if selector yields?  for now it can't but later it could                                          //
        // have $where                                                                                                //
        if (self._matcher.documentMatches(op.o).result) self._addMatching(op.o);                                      // 598
      } else if (op.op === 'u') {                                                                                     // 600
        // Is this a modifier ($set/$unset, which may require us to poll the                                          //
        // database to figure out if the whole document matches the selector) or                                      //
        // a replacement (in which case we can just directly re-evaluate the                                          //
        // selector)?                                                                                                 //
        var isReplace = !_.has(op.o, '$set') && !_.has(op.o, '$unset');                                               // 605
        // If this modifier modifies something inside an EJSON custom type (ie,                                       //
        // anything with EJSON$), then we can't try to use                                                            //
        // LocalCollection._modify, since that just mutates the EJSON encoding,                                       //
        // not the actual object.                                                                                     //
        var canDirectlyModifyDoc = !isReplace && modifierCanBeDirectlyApplied(op.o);                                  // 610
                                                                                                                      //
        var publishedBefore = self._published.has(id);                                                                // 613
        var bufferedBefore = self._limit && self._unpublishedBuffer.has(id);                                          // 614
                                                                                                                      //
        if (isReplace) {                                                                                              // 616
          self._handleDoc(id, _.extend({ _id: id }, op.o));                                                           // 617
        } else if ((publishedBefore || bufferedBefore) && canDirectlyModifyDoc) {                                     // 618
          // Oh great, we actually know what the document is, so we can apply                                         //
          // this directly.                                                                                           //
          var newDoc = self._published.has(id) ? self._published.get(id) : self._unpublishedBuffer.get(id);           // 622
          newDoc = EJSON.clone(newDoc);                                                                               // 624
                                                                                                                      //
          newDoc._id = id;                                                                                            // 626
          try {                                                                                                       // 627
            LocalCollection._modify(newDoc, op.o);                                                                    // 628
          } catch (e) {                                                                                               // 629
            if (e.name !== "MinimongoError") throw e;                                                                 // 630
            // We didn't understand the modifier.  Re-fetch.                                                          //
            self._needToFetch.set(id, op.ts.toString());                                                              // 633
            if (self._phase === PHASE.STEADY) {                                                                       // 634
              self._fetchModifiedDocuments();                                                                         // 635
            }                                                                                                         // 636
            return;                                                                                                   // 637
          }                                                                                                           // 638
          self._handleDoc(id, self._sharedProjectionFn(newDoc));                                                      // 639
        } else if (!canDirectlyModifyDoc || self._matcher.canBecomeTrueByModifier(op.o) || self._sorter && self._sorter.affectedByModifier(op.o)) {
          self._needToFetch.set(id, op.ts.toString());                                                                // 643
          if (self._phase === PHASE.STEADY) self._fetchModifiedDocuments();                                           // 644
        }                                                                                                             // 646
      } else {                                                                                                        // 647
        throw Error("XXX SURPRISING OPERATION: " + op);                                                               // 648
      }                                                                                                               // 649
    });                                                                                                               // 650
  },                                                                                                                  // 651
  // Yields!                                                                                                          //
  _runInitialQuery: function _runInitialQuery() {                                                                     // 653
    var self = this;                                                                                                  // 654
    if (self._stopped) throw new Error("oplog stopped surprisingly early");                                           // 655
                                                                                                                      //
    self._runQuery({ initial: true }); // yields                                                                      // 658
                                                                                                                      //
    if (self._stopped) return; // can happen on queryError                                                            // 660
                                                                                                                      //
    // Allow observeChanges calls to return. (After this, it's possible for                                           //
    // stop() to be called.)                                                                                          //
    self._multiplexer.ready();                                                                                        // 665
                                                                                                                      //
    self._doneQuerying(); // yields                                                                                   // 667
  },                                                                                                                  // 668
                                                                                                                      //
  // In various circumstances, we may just want to stop processing the oplog and                                      //
  // re-run the initial query, just as if we were a PollingObserveDriver.                                             //
  //                                                                                                                  //
  // This function may not block, because it is called from an oplog entry                                            //
  // handler.                                                                                                         //
  //                                                                                                                  //
  // XXX We should call this when we detect that we've been in FETCHING for "too                                      //
  // long".                                                                                                           //
  //                                                                                                                  //
  // XXX We should call this when we detect Mongo failover (since that might                                          //
  // mean that some of the oplog entries we have processed have been rolled                                           //
  // back). The Node Mongo driver is in the middle of a bunch of huge                                                 //
  // refactorings, including the way that it notifies you when primary                                                //
  // changes. Will put off implementing this until driver 1.4 is out.                                                 //
  _pollQuery: function _pollQuery() {                                                                                 // 684
    var self = this;                                                                                                  // 685
    Meteor._noYieldsAllowed(function () {                                                                             // 686
      if (self._stopped) return;                                                                                      // 687
                                                                                                                      //
      // Yay, we get to forget about all the things we thought we had to fetch.                                       //
      self._needToFetch = new LocalCollection._IdMap();                                                               // 691
      self._currentlyFetching = null;                                                                                 // 692
      ++self._fetchGeneration; // ignore any in-flight fetches                                                        // 693
      self._registerPhaseChange(PHASE.QUERYING);                                                                      // 694
                                                                                                                      //
      // Defer so that we don't yield.  We don't need finishIfNeedToPollQuery                                         //
      // here because SwitchedToQuery is not thrown in QUERYING mode.                                                 //
      Meteor.defer(function () {                                                                                      // 698
        self._runQuery();                                                                                             // 699
        self._doneQuerying();                                                                                         // 700
      });                                                                                                             // 701
    });                                                                                                               // 702
  },                                                                                                                  // 703
                                                                                                                      //
  // Yields!                                                                                                          //
  _runQuery: function _runQuery(options) {                                                                            // 706
    var self = this;                                                                                                  // 707
    options = options || {};                                                                                          // 708
    var newResults, newBuffer;                                                                                        // 709
                                                                                                                      //
    // This while loop is just to retry failures.                                                                     //
    while (true) {                                                                                                    // 712
      // If we've been stopped, we don't have to run anything any more.                                               //
      if (self._stopped) return;                                                                                      // 714
                                                                                                                      //
      newResults = new LocalCollection._IdMap();                                                                      // 717
      newBuffer = new LocalCollection._IdMap();                                                                       // 718
                                                                                                                      //
      // Query 2x documents as the half excluded from the original query will go                                      //
      // into unpublished buffer to reduce additional Mongo lookups in cases                                          //
      // when documents are removed from the published set and need a                                                 //
      // replacement.                                                                                                 //
      // XXX needs more thought on non-zero skip                                                                      //
      // XXX 2 is a "magic number" meaning there is an extra chunk of docs for                                        //
      // buffer if such is needed.                                                                                    //
      var cursor = self._cursorForQuery({ limit: self._limit * 2 });                                                  // 727
      try {                                                                                                           // 728
        cursor.forEach(function (doc, i) {                                                                            // 729
          // yields                                                                                                   //
          if (!self._limit || i < self._limit) newResults.set(doc._id, doc);else newBuffer.set(doc._id, doc);         // 730
        });                                                                                                           // 734
        break;                                                                                                        // 735
      } catch (e) {                                                                                                   // 736
        if (options.initial && typeof e.code === 'number') {                                                          // 737
          // This is an error document sent to us by mongod, not a connection                                         //
          // error generated by the client. And we've never seen this query work                                      //
          // successfully. Probably it's a bad selector or something, so we                                           //
          // should NOT retry. Instead, we should halt the observe (which ends                                        //
          // up calling `stop` on us).                                                                                //
          self._multiplexer.queryError(e);                                                                            // 743
          return;                                                                                                     // 744
        }                                                                                                             // 745
                                                                                                                      //
        // During failover (eg) if we get an exception we should log and retry                                        //
        // instead of crashing.                                                                                       //
        Meteor._debug("Got exception while polling query: " + e);                                                     // 749
        Meteor._sleepForMs(100);                                                                                      // 750
      }                                                                                                               // 751
    }                                                                                                                 // 752
                                                                                                                      //
    if (self._stopped) return;                                                                                        // 754
                                                                                                                      //
    self._publishNewResults(newResults, newBuffer);                                                                   // 757
  },                                                                                                                  // 758
                                                                                                                      //
  // Transitions to QUERYING and runs another query, or (if already in QUERYING)                                      //
  // ensures that we will query again later.                                                                          //
  //                                                                                                                  //
  // This function may not block, because it is called from an oplog entry                                            //
  // handler. However, if we were not already in the QUERYING phase, it throws                                        //
  // an exception that is caught by the closest surrounding                                                           //
  // finishIfNeedToPollQuery call; this ensures that we don't continue running                                        //
  // close that was designed for another phase inside PHASE.QUERYING.                                                 //
  //                                                                                                                  //
  // (It's also necessary whenever logic in this file yields to check that other                                      //
  // phases haven't put us into QUERYING mode, though; eg,                                                            //
  // _fetchModifiedDocuments does this.)                                                                              //
  _needToPollQuery: function _needToPollQuery() {                                                                     // 772
    var self = this;                                                                                                  // 773
    Meteor._noYieldsAllowed(function () {                                                                             // 774
      if (self._stopped) return;                                                                                      // 775
                                                                                                                      //
      // If we're not already in the middle of a query, we can query now                                              //
      // (possibly pausing FETCHING).                                                                                 //
      if (self._phase !== PHASE.QUERYING) {                                                                           // 780
        self._pollQuery();                                                                                            // 781
        throw new SwitchedToQuery();                                                                                  // 782
      }                                                                                                               // 783
                                                                                                                      //
      // We're currently in QUERYING. Set a flag to ensure that we run another                                        //
      // query when we're done.                                                                                       //
      self._requeryWhenDoneThisQuery = true;                                                                          // 787
    });                                                                                                               // 788
  },                                                                                                                  // 789
                                                                                                                      //
  // Yields!                                                                                                          //
  _doneQuerying: function _doneQuerying() {                                                                           // 792
    var self = this;                                                                                                  // 793
                                                                                                                      //
    if (self._stopped) return;                                                                                        // 795
    self._mongoHandle._oplogHandle.waitUntilCaughtUp(); // yields                                                     // 797
    if (self._stopped) return;                                                                                        // 798
    if (self._phase !== PHASE.QUERYING) throw Error("Phase unexpectedly " + self._phase);                             // 800
                                                                                                                      //
    Meteor._noYieldsAllowed(function () {                                                                             // 803
      if (self._requeryWhenDoneThisQuery) {                                                                           // 804
        self._requeryWhenDoneThisQuery = false;                                                                       // 805
        self._pollQuery();                                                                                            // 806
      } else if (self._needToFetch.empty()) {                                                                         // 807
        self._beSteady();                                                                                             // 808
      } else {                                                                                                        // 809
        self._fetchModifiedDocuments();                                                                               // 810
      }                                                                                                               // 811
    });                                                                                                               // 812
  },                                                                                                                  // 813
                                                                                                                      //
  _cursorForQuery: function _cursorForQuery(optionsOverwrite) {                                                       // 815
    var self = this;                                                                                                  // 816
    return Meteor._noYieldsAllowed(function () {                                                                      // 817
      // The query we run is almost the same as the cursor we are observing,                                          //
      // with a few changes. We need to read all the fields that are relevant to                                      //
      // the selector, not just the fields we are going to publish (that's the                                        //
      // "shared" projection). And we don't want to apply any transform in the                                        //
      // cursor, because observeChanges shouldn't use the transform.                                                  //
      var options = _.clone(self._cursorDescription.options);                                                         // 823
                                                                                                                      //
      // Allow the caller to modify the options. Useful to specify different                                          //
      // skip and limit values.                                                                                       //
      _.extend(options, optionsOverwrite);                                                                            // 827
                                                                                                                      //
      options.fields = self._sharedProjection;                                                                        // 829
      delete options.transform;                                                                                       // 830
      // We are NOT deep cloning fields or selector here, which should be OK.                                         //
      var description = new CursorDescription(self._cursorDescription.collectionName, self._cursorDescription.selector, options);
      return new Cursor(self._mongoHandle, description);                                                              // 836
    });                                                                                                               // 837
  },                                                                                                                  // 838
                                                                                                                      //
  // Replace self._published with newResults (both are IdMaps), invoking observe                                      //
  // callbacks on the multiplexer.                                                                                    //
  // Replace self._unpublishedBuffer with newBuffer.                                                                  //
  //                                                                                                                  //
  // XXX This is very similar to LocalCollection._diffQueryUnorderedChanges. We                                       //
  // should really: (a) Unify IdMap and OrderedDict into Unordered/OrderedDict                                        //
  // (b) Rewrite diff.js to use these classes instead of arrays and objects.                                          //
  _publishNewResults: function _publishNewResults(newResults, newBuffer) {                                            // 848
    var self = this;                                                                                                  // 849
    Meteor._noYieldsAllowed(function () {                                                                             // 850
                                                                                                                      //
      // If the query is limited and there is a buffer, shut down so it doesn't                                       //
      // stay in a way.                                                                                               //
      if (self._limit) {                                                                                              // 854
        self._unpublishedBuffer.clear();                                                                              // 855
      }                                                                                                               // 856
                                                                                                                      //
      // First remove anything that's gone. Be careful not to modify                                                  //
      // self._published while iterating over it.                                                                     //
      var idsToRemove = [];                                                                                           // 860
      self._published.forEach(function (doc, id) {                                                                    // 861
        if (!newResults.has(id)) idsToRemove.push(id);                                                                // 862
      });                                                                                                             // 864
      _.each(idsToRemove, function (id) {                                                                             // 865
        self._removePublished(id);                                                                                    // 866
      });                                                                                                             // 867
                                                                                                                      //
      // Now do adds and changes.                                                                                     //
      // If self has a buffer and limit, the new fetched result will be                                               //
      // limited correctly as the query has sort specifier.                                                           //
      newResults.forEach(function (doc, id) {                                                                         // 872
        self._handleDoc(id, doc);                                                                                     // 873
      });                                                                                                             // 874
                                                                                                                      //
      // Sanity-check that everything we tried to put into _published ended up                                        //
      // there.                                                                                                       //
      // XXX if this is slow, remove it later                                                                         //
      if (self._published.size() !== newResults.size()) {                                                             // 879
        throw Error("The Mongo server and the Meteor query disagree on how " + "many documents match your query. Maybe it is hitting a Mongo " + "edge case? The query is: " + EJSON.stringify(self._cursorDescription.selector));
      }                                                                                                               // 885
      self._published.forEach(function (doc, id) {                                                                    // 886
        if (!newResults.has(id)) throw Error("_published has a doc that newResults doesn't; " + id);                  // 887
      });                                                                                                             // 889
                                                                                                                      //
      // Finally, replace the buffer                                                                                  //
      newBuffer.forEach(function (doc, id) {                                                                          // 892
        self._addBuffered(id, doc);                                                                                   // 893
      });                                                                                                             // 894
                                                                                                                      //
      self._safeAppendToBuffer = newBuffer.size() < self._limit;                                                      // 896
    });                                                                                                               // 897
  },                                                                                                                  // 898
                                                                                                                      //
  // This stop function is invoked from the onStop of the ObserveMultiplexer, so                                      //
  // it shouldn't actually be possible to call it until the multiplexer is                                            //
  // ready.                                                                                                           //
  //                                                                                                                  //
  // It's important to check self._stopped after every call in this file that                                         //
  // can yield!                                                                                                       //
  stop: function stop() {                                                                                             // 906
    var self = this;                                                                                                  // 907
    if (self._stopped) return;                                                                                        // 908
    self._stopped = true;                                                                                             // 910
    _.each(self._stopHandles, function (handle) {                                                                     // 911
      handle.stop();                                                                                                  // 912
    });                                                                                                               // 913
                                                                                                                      //
    // Note: we *don't* use multiplexer.onFlush here because this stop                                                //
    // callback is actually invoked by the multiplexer itself when it has                                             //
    // determined that there are no handles left. So nothing is actually going                                        //
    // to get flushed (and it's probably not valid to call methods on the                                             //
    // dying multiplexer).                                                                                            //
    _.each(self._writesToCommitWhenWeReachSteady, function (w) {                                                      // 920
      w.committed(); // maybe yields?                                                                                 // 921
    });                                                                                                               // 922
    self._writesToCommitWhenWeReachSteady = null;                                                                     // 923
                                                                                                                      //
    // Proactively drop references to potentially big things.                                                         //
    self._published = null;                                                                                           // 926
    self._unpublishedBuffer = null;                                                                                   // 927
    self._needToFetch = null;                                                                                         // 928
    self._currentlyFetching = null;                                                                                   // 929
    self._oplogEntryHandle = null;                                                                                    // 930
    self._listenersHandle = null;                                                                                     // 931
                                                                                                                      //
    Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "observe-drivers-oplog", -1);          // 933
  },                                                                                                                  // 935
                                                                                                                      //
  _registerPhaseChange: function _registerPhaseChange(phase) {                                                        // 937
    var self = this;                                                                                                  // 938
    Meteor._noYieldsAllowed(function () {                                                                             // 939
      var now = new Date();                                                                                           // 940
                                                                                                                      //
      if (self._phase) {                                                                                              // 942
        var timeDiff = now - self._phaseStartTime;                                                                    // 943
        Package.facts && Package.facts.Facts.incrementServerFact("mongo-livedata", "time-spent-in-" + self._phase + "-phase", timeDiff);
      }                                                                                                               // 946
                                                                                                                      //
      self._phase = phase;                                                                                            // 948
      self._phaseStartTime = now;                                                                                     // 949
    });                                                                                                               // 950
  }                                                                                                                   // 951
});                                                                                                                   // 196
                                                                                                                      //
// Does our oplog tailing code support this cursor? For now, we are being very                                        //
// conservative and allowing only simple queries with simple options.                                                 //
// (This is a "static method".)                                                                                       //
OplogObserveDriver.cursorSupported = function (cursorDescription, matcher) {                                          // 957
  // First, check the options.                                                                                        //
  var options = cursorDescription.options;                                                                            // 959
                                                                                                                      //
  // Did the user say no explicitly?                                                                                  //
  // underscored version of the option is COMPAT with 1.2                                                             //
  if (options.disableOplog || options._disableOplog) return false;                                                    // 963
                                                                                                                      //
  // skip is not supported: to support it we would need to keep track of all                                          //
  // "skipped" documents or at least their ids.                                                                       //
  // limit w/o a sort specifier is not supported: current implementation needs a                                      //
  // deterministic way to order documents.                                                                            //
  if (options.skip || options.limit && !options.sort) return false;                                                   // 970
                                                                                                                      //
  // If a fields projection option is given check if it is supported by                                               //
  // minimongo (some operators are not supported).                                                                    //
  if (options.fields) {                                                                                               // 974
    try {                                                                                                             // 975
      LocalCollection._checkSupportedProjection(options.fields);                                                      // 976
    } catch (e) {                                                                                                     // 977
      if (e.name === "MinimongoError") return false;else throw e;                                                     // 978
    }                                                                                                                 // 982
  }                                                                                                                   // 983
                                                                                                                      //
  // We don't allow the following selectors:                                                                          //
  //   - $where (not confident that we provide the same JS environment                                                //
  //             as Mongo, and can yield!)                                                                            //
  //   - $near (has "interesting" properties in MongoDB, like the possibility                                         //
  //            of returning an ID multiple times, though even polling maybe                                          //
  //            have a bug there)                                                                                     //
  //           XXX: once we support it, we would need to think more on how we                                         //
  //           initialize the comparators when we create the driver.                                                  //
  return !matcher.hasWhere() && !matcher.hasGeoQuery();                                                               // 993
};                                                                                                                    // 994
                                                                                                                      //
var modifierCanBeDirectlyApplied = function modifierCanBeDirectlyApplied(modifier) {                                  // 996
  return _.all(modifier, function (fields, operation) {                                                               // 997
    return _.all(fields, function (value, field) {                                                                    // 998
      return !/EJSON\$/.test(field);                                                                                  // 999
    });                                                                                                               // 1000
  });                                                                                                                 // 1001
};                                                                                                                    // 1002
                                                                                                                      //
MongoInternals.OplogObserveDriver = OplogObserveDriver;                                                               // 1004
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"local_collection_driver.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/local_collection_driver.js                                                                          //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
LocalCollectionDriver = function LocalCollectionDriver() {                                                            // 1
  var self = this;                                                                                                    // 2
  self.noConnCollections = {};                                                                                        // 3
};                                                                                                                    // 4
                                                                                                                      //
var ensureCollection = function ensureCollection(name, collections) {                                                 // 6
  if (!(name in collections)) collections[name] = new LocalCollection(name);                                          // 7
  return collections[name];                                                                                           // 9
};                                                                                                                    // 10
                                                                                                                      //
_.extend(LocalCollectionDriver.prototype, {                                                                           // 12
  open: function open(name, conn) {                                                                                   // 13
    var self = this;                                                                                                  // 14
    if (!name) return new LocalCollection();                                                                          // 15
    if (!conn) {                                                                                                      // 17
      return ensureCollection(name, self.noConnCollections);                                                          // 18
    }                                                                                                                 // 19
    if (!conn._mongo_livedata_collections) conn._mongo_livedata_collections = {};                                     // 20
    // XXX is there a way to keep track of a connection's collections without                                         //
    // dangling it off the connection object?                                                                         //
    return ensureCollection(name, conn._mongo_livedata_collections);                                                  // 24
  }                                                                                                                   // 25
});                                                                                                                   // 12
                                                                                                                      //
// singleton                                                                                                          //
LocalCollectionDriver = new LocalCollectionDriver();                                                                  // 29
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"remote_collection_driver.js":function(require){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/remote_collection_driver.js                                                                         //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
MongoInternals.RemoteCollectionDriver = function (mongo_url, options) {                                               // 1
  var self = this;                                                                                                    // 3
  self.mongo = new MongoConnection(mongo_url, options);                                                               // 4
};                                                                                                                    // 5
                                                                                                                      //
_.extend(MongoInternals.RemoteCollectionDriver.prototype, {                                                           // 7
  open: function open(name) {                                                                                         // 8
    var self = this;                                                                                                  // 9
    var ret = {};                                                                                                     // 10
    _.each(['find', 'findOne', 'insert', 'update', 'upsert', 'remove', '_ensureIndex', '_dropIndex', '_createCappedCollection', 'dropCollection', 'rawCollection'], function (m) {
      ret[m] = _.bind(self.mongo[m], self.mongo, name);                                                               // 16
    });                                                                                                               // 17
    return ret;                                                                                                       // 18
  }                                                                                                                   // 19
});                                                                                                                   // 7
                                                                                                                      //
// Create the singleton RemoteCollectionDriver only on demand, so we                                                  //
// only require Mongo configuration if it's actually used (eg, not if                                                 //
// you're only trying to receive data from a remote DDP server.)                                                      //
MongoInternals.defaultRemoteCollectionDriver = _.once(function () {                                                   // 26
  var connectionOptions = {};                                                                                         // 27
                                                                                                                      //
  var mongoUrl = process.env.MONGO_URL;                                                                               // 29
                                                                                                                      //
  if (process.env.MONGO_OPLOG_URL) {                                                                                  // 31
    connectionOptions.oplogUrl = process.env.MONGO_OPLOG_URL;                                                         // 32
  }                                                                                                                   // 33
                                                                                                                      //
  if (!mongoUrl) throw new Error("MONGO_URL must be set in environment");                                             // 35
                                                                                                                      //
  return new MongoInternals.RemoteCollectionDriver(mongoUrl, connectionOptions);                                      // 38
});                                                                                                                   // 39
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"collection.js":function(require,exports,module){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/collection.js                                                                                       //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
// options.connection, if given, is a LivedataClient or LivedataServer                                                //
// XXX presently there is no way to destroy/clean up a Collection                                                     //
                                                                                                                      //
/**                                                                                                                   //
 * @summary Namespace for MongoDB-related items                                                                       //
 * @namespace                                                                                                         //
 */                                                                                                                   //
Mongo = {};                                                                                                           // 8
                                                                                                                      //
/**                                                                                                                   //
 * @summary Constructor for a Collection                                                                              //
 * @locus Anywhere                                                                                                    //
 * @instancename collection                                                                                           //
 * @class                                                                                                             //
 * @param {String} name The name of the collection.  If null, creates an unmanaged (unsynchronized) local collection.
 * @param {Object} [options]                                                                                          //
 * @param {Object} options.connection The server connection that will manage this collection. Uses the default connection if not specified.  Pass the return value of calling [`DDP.connect`](#ddp_connect) to specify a different server. Pass `null` to specify no connection. Unmanaged (`name` is null) collections cannot specify a connection.
 * @param {String} options.idGeneration The method of generating the `_id` fields of new documents in this collection.  Possible values:
                                                                                                                      //
 - **`'STRING'`**: random strings                                                                                     //
 - **`'MONGO'`**:  random [`Mongo.ObjectID`](#mongo_object_id) values                                                 //
                                                                                                                      //
The default id generation technique is `'STRING'`.                                                                    //
 * @param {Function} options.transform An optional transformation function. Documents will be passed through this function before being returned from `fetch` or `findOne`, and before being passed to callbacks of `observe`, `map`, `forEach`, `allow`, and `deny`. Transforms are *not* applied for the callbacks of `observeChanges` or to cursors returned from publish functions.
 * @param {Boolean} options.defineMutationMethods Set to `false` to skip setting up the mutation methods that enable insert/update/remove from client code. Default `true`.
 */                                                                                                                   //
Mongo.Collection = function (name, options) {                                                                         // 27
  var self = this;                                                                                                    // 28
  if (!(self instanceof Mongo.Collection)) throw new Error('use "new" to construct a Mongo.Collection');              // 29
                                                                                                                      //
  if (!name && name !== null) {                                                                                       // 32
    Meteor._debug("Warning: creating anonymous collection. It will not be " + "saved or synchronized over the network. (Pass null for " + "the collection name to turn off this warning.)");
    name = null;                                                                                                      // 36
  }                                                                                                                   // 37
                                                                                                                      //
  if (name !== null && typeof name !== "string") {                                                                    // 39
    throw new Error("First argument to new Mongo.Collection must be a string or null");                               // 40
  }                                                                                                                   // 42
                                                                                                                      //
  if (options && options.methods) {                                                                                   // 44
    // Backwards compatibility hack with original signature (which passed                                             //
    // "connection" directly instead of in options. (Connections must have a "methods"                                //
    // method.)                                                                                                       //
    // XXX remove before 1.0                                                                                          //
    options = { connection: options };                                                                                // 49
  }                                                                                                                   // 50
  // Backwards compatibility: "connection" used to be called "manager".                                               //
  if (options && options.manager && !options.connection) {                                                            // 52
    options.connection = options.manager;                                                                             // 53
  }                                                                                                                   // 54
  options = _.extend({                                                                                                // 55
    connection: undefined,                                                                                            // 56
    idGeneration: 'STRING',                                                                                           // 57
    transform: null,                                                                                                  // 58
    _driver: undefined,                                                                                               // 59
    _preventAutopublish: false                                                                                        // 60
  }, options);                                                                                                        // 55
                                                                                                                      //
  switch (options.idGeneration) {                                                                                     // 63
    case 'MONGO':                                                                                                     // 64
      self._makeNewID = function () {                                                                                 // 65
        var src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;                                   // 66
        return new Mongo.ObjectID(src.hexString(24));                                                                 // 69
      };                                                                                                              // 70
      break;                                                                                                          // 71
    case 'STRING':                                                                                                    // 72
    default:                                                                                                          // 73
      self._makeNewID = function () {                                                                                 // 74
        var src = name ? DDP.randomStream('/collection/' + name) : Random.insecure;                                   // 75
        return src.id();                                                                                              // 78
      };                                                                                                              // 79
      break;                                                                                                          // 80
  }                                                                                                                   // 63
                                                                                                                      //
  self._transform = LocalCollection.wrapTransform(options.transform);                                                 // 83
                                                                                                                      //
  if (!name || options.connection === null)                                                                           // 85
    // note: nameless collections never have a connection                                                             //
    self._connection = null;else if (options.connection) self._connection = options.connection;else if (Meteor.isClient) self._connection = Meteor.connection;else self._connection = Meteor.server;
                                                                                                                      //
  if (!options._driver) {                                                                                             // 95
    // XXX This check assumes that webapp is loaded so that Meteor.server !==                                         //
    // null. We should fully support the case of "want to use a Mongo-backed                                          //
    // collection from Node code without webapp", but we don't yet.                                                   //
    // #MeteorServerNull                                                                                              //
    if (name && self._connection === Meteor.server && typeof MongoInternals !== "undefined" && MongoInternals.defaultRemoteCollectionDriver) {
      options._driver = MongoInternals.defaultRemoteCollectionDriver();                                               // 103
    } else {                                                                                                          // 104
      options._driver = LocalCollectionDriver;                                                                        // 105
    }                                                                                                                 // 106
  }                                                                                                                   // 107
                                                                                                                      //
  self._collection = options._driver.open(name, self._connection);                                                    // 109
  self._name = name;                                                                                                  // 110
  self._driver = options._driver;                                                                                     // 111
                                                                                                                      //
  if (self._connection && self._connection.registerStore) {                                                           // 113
    // OK, we're going to be a slave, replicating some remote                                                         //
    // database, except possibly with some temporary divergence while                                                 //
    // we have unacknowledged RPC's.                                                                                  //
    var ok = self._connection.registerStore(name, {                                                                   // 117
      // Called at the beginning of a batch of updates. batchSize is the number                                       //
      // of update calls to expect.                                                                                   //
      //                                                                                                              //
      // XXX This interface is pretty janky. reset probably ought to go back to                                       //
      // being its own function, and callers shouldn't have to calculate                                              //
      // batchSize. The optimization of not calling pause/remove should be                                            //
      // delayed until later: the first call to update() should buffer its                                            //
      // message, and then we can either directly apply it at endUpdate time if                                       //
      // it was the only update, or do pauseObservers/apply/apply at the next                                         //
      // update() if there's another one.                                                                             //
      beginUpdate: function beginUpdate(batchSize, reset) {                                                           // 128
        // pause observers so users don't see flicker when updating several                                           //
        // objects at once (including the post-reconnect reset-and-reapply                                            //
        // stage), and so that a re-sorting of a query can take advantage of the                                      //
        // full _diffQuery moved calculation instead of applying change one at a                                      //
        // time.                                                                                                      //
        if (batchSize > 1 || reset) self._collection.pauseObservers();                                                // 134
                                                                                                                      //
        if (reset) self._collection.remove({});                                                                       // 137
      },                                                                                                              // 139
                                                                                                                      //
      // Apply an update.                                                                                             //
      // XXX better specify this interface (not in terms of a wire message)?                                          //
      update: function update(msg) {                                                                                  // 143
        var mongoId = MongoID.idParse(msg.id);                                                                        // 144
        var doc = self._collection.findOne(mongoId);                                                                  // 145
                                                                                                                      //
        // Is this a "replace the whole doc" message coming from the quiescence                                       //
        // of method writes to an object? (Note that 'undefined' is a valid                                           //
        // value meaning "remove it".)                                                                                //
        if (msg.msg === 'replace') {                                                                                  // 150
          var replace = msg.replace;                                                                                  // 151
          if (!replace) {                                                                                             // 152
            if (doc) self._collection.remove(mongoId);                                                                // 153
          } else if (!doc) {                                                                                          // 155
            self._collection.insert(replace);                                                                         // 156
          } else {                                                                                                    // 157
            // XXX check that replace has no $ ops                                                                    //
            self._collection.update(mongoId, replace);                                                                // 159
          }                                                                                                           // 160
          return;                                                                                                     // 161
        } else if (msg.msg === 'added') {                                                                             // 162
          if (doc) {                                                                                                  // 163
            throw new Error("Expected not to find a document already present for an add");                            // 164
          }                                                                                                           // 165
          self._collection.insert(_.extend({ _id: mongoId }, msg.fields));                                            // 166
        } else if (msg.msg === 'removed') {                                                                           // 167
          if (!doc) throw new Error("Expected to find a document already present for removed");                       // 168
          self._collection.remove(mongoId);                                                                           // 170
        } else if (msg.msg === 'changed') {                                                                           // 171
          if (!doc) throw new Error("Expected to find a document to change");                                         // 172
          if (!_.isEmpty(msg.fields)) {                                                                               // 174
            var modifier = {};                                                                                        // 175
            _.each(msg.fields, function (value, key) {                                                                // 176
              if (value === undefined) {                                                                              // 177
                if (!modifier.$unset) modifier.$unset = {};                                                           // 178
                modifier.$unset[key] = 1;                                                                             // 180
              } else {                                                                                                // 181
                if (!modifier.$set) modifier.$set = {};                                                               // 182
                modifier.$set[key] = value;                                                                           // 184
              }                                                                                                       // 185
            });                                                                                                       // 186
            self._collection.update(mongoId, modifier);                                                               // 187
          }                                                                                                           // 188
        } else {                                                                                                      // 189
          throw new Error("I don't know how to deal with this message");                                              // 190
        }                                                                                                             // 191
      },                                                                                                              // 193
                                                                                                                      //
      // Called at the end of a batch of updates.                                                                     //
      endUpdate: function endUpdate() {                                                                               // 196
        self._collection.resumeObservers();                                                                           // 197
      },                                                                                                              // 198
                                                                                                                      //
      // Called around method stub invocations to capture the original versions                                       //
      // of modified documents.                                                                                       //
      saveOriginals: function saveOriginals() {                                                                       // 202
        self._collection.saveOriginals();                                                                             // 203
      },                                                                                                              // 204
      retrieveOriginals: function retrieveOriginals() {                                                               // 205
        return self._collection.retrieveOriginals();                                                                  // 206
      },                                                                                                              // 207
                                                                                                                      //
      // Used to preserve current versions of documents across a store reset.                                         //
      getDoc: function getDoc(id) {                                                                                   // 210
        return self.findOne(id);                                                                                      // 211
      },                                                                                                              // 212
                                                                                                                      //
      // To be able to get back to the collection from the store.                                                     //
      _getCollection: function _getCollection() {                                                                     // 215
        return self;                                                                                                  // 216
      }                                                                                                               // 217
    });                                                                                                               // 117
                                                                                                                      //
    if (!ok) {                                                                                                        // 220
      var message = "There is already a collection named \"" + name + "\"";                                           // 221
      if (options._suppressSameNameError === true) {                                                                  // 222
        // XXX In theory we do not have to throw when `ok` is falsy. The store is already defined                     //
        // for this collection name, but this will simply be another reference to it and everything                   //
        // should work. However, we have historically thrown an error here, so for now we will                        //
        // skip the error only when `_suppressSameNameError` is `true`, allowing people to opt in                     //
        // and give this some real world testing.                                                                     //
        console.warn ? console.warn(message) : console.log(message);                                                  // 228
      } else {                                                                                                        // 229
        throw new Error(message);                                                                                     // 230
      }                                                                                                               // 231
    }                                                                                                                 // 232
  }                                                                                                                   // 233
                                                                                                                      //
  // XXX don't define these until allow or deny is actually used for this                                             //
  // collection. Could be hard if the security rules are only defined on the                                          //
  // server.                                                                                                          //
  if (options.defineMutationMethods !== false) {                                                                      // 238
    try {                                                                                                             // 239
      self._defineMutationMethods({ useExisting: options._suppressSameNameError === true });                          // 240
    } catch (error) {                                                                                                 // 241
      // Throw a more understandable error on the server for same collection name                                     //
      if (error.message === "A method named '/" + name + "/insert' is already defined") throw new Error("There is already a collection named \"" + name + "\"");
      throw error;                                                                                                    // 245
    }                                                                                                                 // 246
  }                                                                                                                   // 247
                                                                                                                      //
  // autopublish                                                                                                      //
  if (Package.autopublish && !options._preventAutopublish && self._connection && self._connection.publish) {          // 250
    self._connection.publish(null, function () {                                                                      // 252
      return self.find();                                                                                             // 253
    }, { is_auto: true });                                                                                            // 254
  }                                                                                                                   // 255
};                                                                                                                    // 256
                                                                                                                      //
///                                                                                                                   //
/// Main collection API                                                                                               //
///                                                                                                                   //
                                                                                                                      //
_.extend(Mongo.Collection.prototype, {                                                                                // 263
                                                                                                                      //
  _getFindSelector: function _getFindSelector(args) {                                                                 // 265
    if (args.length == 0) return {};else return args[0];                                                              // 266
  },                                                                                                                  // 270
                                                                                                                      //
  _getFindOptions: function _getFindOptions(args) {                                                                   // 272
    var self = this;                                                                                                  // 273
    if (args.length < 2) {                                                                                            // 274
      return { transform: self._transform };                                                                          // 275
    } else {                                                                                                          // 276
      check(args[1], Match.Optional(Match.ObjectIncluding({                                                           // 277
        fields: Match.Optional(Match.OneOf(Object, undefined)),                                                       // 278
        sort: Match.Optional(Match.OneOf(Object, Array, Function, undefined)),                                        // 279
        limit: Match.Optional(Match.OneOf(Number, undefined)),                                                        // 280
        skip: Match.Optional(Match.OneOf(Number, undefined))                                                          // 281
      })));                                                                                                           // 277
                                                                                                                      //
      return _.extend({                                                                                               // 284
        transform: self._transform                                                                                    // 285
      }, args[1]);                                                                                                    // 284
    }                                                                                                                 // 287
  },                                                                                                                  // 288
                                                                                                                      //
  /**                                                                                                                 //
   * @summary Find the documents in a collection that match the selector.                                             //
   * @locus Anywhere                                                                                                  //
   * @method find                                                                                                     //
   * @memberOf Mongo.Collection                                                                                       //
   * @instance                                                                                                        //
   * @param {MongoSelector} [selector] A query describing the documents to find                                       //
   * @param {Object} [options]                                                                                        //
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)                                     //
   * @param {Number} options.skip Number of results to skip at the beginning                                          //
   * @param {Number} options.limit Maximum number of results to return                                                //
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.                           //
   * @param {Boolean} options.reactive (Client only) Default `true`; pass `false` to disable reactivity               //
   * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @param {Boolean} options.disableOplog (Server only) Pass true to disable oplog-tailing on this query. This affects the way server processes calls to `observe` on this query. Disabling the oplog can be useful when working with data that updates in large batches.
   * @param {Number} options.pollingIntervalMs (Server only) How often to poll this query when observing on the server. In milliseconds. Defaults to 10 seconds.
   * @param {Number} options.pollingThrottleMs (Server only) Minimum time to allow between re-polling. Increasing this will save CPU and mongo load at the expense of slower updates to users. Decreasing this is not recommended. In milliseconds. Defaults to 50 milliseconds.
   * @returns {Mongo.Cursor}                                                                                          //
   */                                                                                                                 //
  find: function find() /* selector, options */{                                                                      // 309
    // Collection.find() (return all docs) behaves differently                                                        //
    // from Collection.find(undefined) (return 0 docs).  so be                                                        //
    // careful about the length of arguments.                                                                         //
    var self = this;                                                                                                  // 313
    var argArray = _.toArray(arguments);                                                                              // 314
    return self._collection.find(self._getFindSelector(argArray), self._getFindOptions(argArray));                    // 315
  },                                                                                                                  // 317
                                                                                                                      //
  /**                                                                                                                 //
   * @summary Finds the first document that matches the selector, as ordered by sort and skip options. Returns `undefined` if no matching document is found.
   * @locus Anywhere                                                                                                  //
   * @method findOne                                                                                                  //
   * @memberOf Mongo.Collection                                                                                       //
   * @instance                                                                                                        //
   * @param {MongoSelector} [selector] A query describing the documents to find                                       //
   * @param {Object} [options]                                                                                        //
   * @param {MongoSortSpecifier} options.sort Sort order (default: natural order)                                     //
   * @param {Number} options.skip Number of results to skip at the beginning                                          //
   * @param {MongoFieldSpecifier} options.fields Dictionary of fields to return or exclude.                           //
   * @param {Boolean} options.reactive (Client only) Default true; pass false to disable reactivity                   //
   * @param {Function} options.transform Overrides `transform` on the [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation.
   * @returns {Object}                                                                                                //
   */                                                                                                                 //
  findOne: function findOne() /* selector, options */{                                                                // 334
    var self = this;                                                                                                  // 335
    var argArray = _.toArray(arguments);                                                                              // 336
    return self._collection.findOne(self._getFindSelector(argArray), self._getFindOptions(argArray));                 // 337
  }                                                                                                                   // 339
                                                                                                                      //
});                                                                                                                   // 263
                                                                                                                      //
Mongo.Collection._publishCursor = function (cursor, sub, collection) {                                                // 343
  var observeHandle = cursor.observeChanges({                                                                         // 344
    added: function added(id, fields) {                                                                               // 345
      sub.added(collection, id, fields);                                                                              // 346
    },                                                                                                                // 347
    changed: function changed(id, fields) {                                                                           // 348
      sub.changed(collection, id, fields);                                                                            // 349
    },                                                                                                                // 350
    removed: function removed(id) {                                                                                   // 351
      sub.removed(collection, id);                                                                                    // 352
    }                                                                                                                 // 353
  });                                                                                                                 // 344
                                                                                                                      //
  // We don't call sub.ready() here: it gets called in livedata_server, after                                         //
  // possibly calling _publishCursor on multiple returned cursors.                                                    //
                                                                                                                      //
  // register stop callback (expects lambda w/ no args).                                                              //
  sub.onStop(function () {                                                                                            // 360
    observeHandle.stop();                                                                                             // 360
  });                                                                                                                 // 360
                                                                                                                      //
  // return the observeHandle in case it needs to be stopped early                                                    //
  return observeHandle;                                                                                               // 363
};                                                                                                                    // 364
                                                                                                                      //
// protect against dangerous selectors.  falsey and {_id: falsey} are both                                            //
// likely programmer error, and not what you want, particularly for destructive                                       //
// operations.  JS regexps don't serialize over DDP but can be trivially                                              //
// replaced by $regex.                                                                                                //
Mongo.Collection._rewriteSelector = function (selector) {                                                             // 370
  // shorthand -- scalars match _id                                                                                   //
  if (LocalCollection._selectorIsId(selector)) selector = { _id: selector };                                          // 372
                                                                                                                      //
  if (_.isArray(selector)) {                                                                                          // 375
    // This is consistent with the Mongo console itself; if we don't do this                                          //
    // check passing an empty array ends up selecting all items                                                       //
    throw new Error("Mongo selector can't be an array.");                                                             // 378
  }                                                                                                                   // 379
                                                                                                                      //
  if (!selector || '_id' in selector && !selector._id)                                                                // 381
    // can't match anything                                                                                           //
    return { _id: Random.id() };                                                                                      // 383
                                                                                                                      //
  var ret = {};                                                                                                       // 385
  _.each(selector, function (value, key) {                                                                            // 386
    // Mongo supports both {field: /foo/} and {field: {$regex: /foo/}}                                                //
    if (value instanceof RegExp) {                                                                                    // 388
      ret[key] = convertRegexpToMongoSelector(value);                                                                 // 389
    } else if (value && value.$regex instanceof RegExp) {                                                             // 390
      ret[key] = convertRegexpToMongoSelector(value.$regex);                                                          // 391
      // if value is {$regex: /foo/, $options: ...} then $options                                                     //
      // override the ones set on $regex.                                                                             //
      if (value.$options !== undefined) ret[key].$options = value.$options;                                           // 394
    } else if (_.contains(['$or', '$and', '$nor'], key)) {                                                            // 396
      // Translate lower levels of $and/$or/$nor                                                                      //
      ret[key] = _.map(value, function (v) {                                                                          // 399
        return Mongo.Collection._rewriteSelector(v);                                                                  // 400
      });                                                                                                             // 401
    } else {                                                                                                          // 402
      ret[key] = value;                                                                                               // 403
    }                                                                                                                 // 404
  });                                                                                                                 // 405
  return ret;                                                                                                         // 406
};                                                                                                                    // 407
                                                                                                                      //
// convert a JS RegExp object to a Mongo {$regex: ..., $options: ...}                                                 //
// selector                                                                                                           //
function convertRegexpToMongoSelector(regexp) {                                                                       // 411
  check(regexp, RegExp); // safety belt                                                                               // 412
                                                                                                                      //
  var selector = { $regex: regexp.source };                                                                           // 414
  var regexOptions = '';                                                                                              // 415
  // JS RegExp objects support 'i', 'm', and 'g'. Mongo regex $options                                                //
  // support 'i', 'm', 'x', and 's'. So we support 'i' and 'm' here.                                                  //
  if (regexp.ignoreCase) regexOptions += 'i';                                                                         // 418
  if (regexp.multiline) regexOptions += 'm';                                                                          // 420
  if (regexOptions) selector.$options = regexOptions;                                                                 // 422
                                                                                                                      //
  return selector;                                                                                                    // 425
};                                                                                                                    // 426
                                                                                                                      //
// 'insert' immediately returns the inserted document's new _id.                                                      //
// The others return values immediately if you are in a stub, an in-memory                                            //
// unmanaged collection, or a mongo-backed collection and you don't pass a                                            //
// callback. 'update' and 'remove' return the number of affected                                                      //
// documents. 'upsert' returns an object with keys 'numberAffected' and, if an                                        //
// insert happened, 'insertedId'.                                                                                     //
//                                                                                                                    //
// Otherwise, the semantics are exactly like other methods: they take                                                 //
// a callback as an optional last argument; if no callback is                                                         //
// provided, they block until the operation is complete, and throw an                                                 //
// exception if it fails; if a callback is provided, then they don't                                                  //
// necessarily block, and they call the callback when they finish with error and                                      //
// result arguments.  (The insert method provides the document ID as its result;                                      //
// update and remove provide the number of affected docs as the result; upsert                                        //
// provides an object with numberAffected and maybe insertedId.)                                                      //
//                                                                                                                    //
// On the client, blocking is impossible, so if a callback                                                            //
// isn't provided, they just return immediately and any error                                                         //
// information is lost.                                                                                               //
//                                                                                                                    //
// There's one more tweak. On the client, if you don't provide a                                                      //
// callback, then if there is an error, a message will be logged with                                                 //
// Meteor._debug.                                                                                                     //
//                                                                                                                    //
// The intent (though this is actually determined by the underlying                                                   //
// drivers) is that the operations should be done synchronously, not                                                  //
// generating their result until the database has acknowledged                                                        //
// them. In the future maybe we should provide a flag to turn this                                                    //
// off.                                                                                                               //
                                                                                                                      //
/**                                                                                                                   //
 * @summary Insert a document in the collection.  Returns its unique _id.                                             //
 * @locus Anywhere                                                                                                    //
 * @method  insert                                                                                                    //
 * @memberOf Mongo.Collection                                                                                         //
 * @instance                                                                                                          //
 * @param {Object} doc The document to insert. May not yet have an _id attribute, in which case Meteor will generate one for you.
 * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the _id as the second.
 */                                                                                                                   //
Mongo.Collection.prototype.insert = function insert(doc, callback) {                                                  // 467
  // Make sure we were passed a document to insert                                                                    //
  if (!doc) {                                                                                                         // 469
    throw new Error("insert requires an argument");                                                                   // 470
  }                                                                                                                   // 471
                                                                                                                      //
  // Shallow-copy the document and possibly generate an ID                                                            //
  doc = _.extend({}, doc);                                                                                            // 474
                                                                                                                      //
  if ('_id' in doc) {                                                                                                 // 476
    if (!doc._id || !(typeof doc._id === 'string' || doc._id instanceof Mongo.ObjectID)) {                            // 477
      throw new Error("Meteor requires document _id fields to be non-empty strings or ObjectIDs");                    // 479
    }                                                                                                                 // 480
  } else {                                                                                                            // 481
    var generateId = true;                                                                                            // 482
                                                                                                                      //
    // Don't generate the id if we're the client and the 'outermost' call                                             //
    // This optimization saves us passing both the randomSeed and the id                                              //
    // Passing both is redundant.                                                                                     //
    if (this._isRemoteCollection()) {                                                                                 // 487
      var enclosing = DDP._CurrentInvocation.get();                                                                   // 488
      if (!enclosing) {                                                                                               // 489
        generateId = false;                                                                                           // 490
      }                                                                                                               // 491
    }                                                                                                                 // 492
                                                                                                                      //
    if (generateId) {                                                                                                 // 494
      doc._id = this._makeNewID();                                                                                    // 495
    }                                                                                                                 // 496
  }                                                                                                                   // 497
                                                                                                                      //
  // On inserts, always return the id that we generated; on all other                                                 //
  // operations, just return the result from the collection.                                                          //
  var chooseReturnValueFromCollectionResult = function chooseReturnValueFromCollectionResult(result) {                // 501
    if (doc._id) {                                                                                                    // 502
      return doc._id;                                                                                                 // 503
    }                                                                                                                 // 504
                                                                                                                      //
    // XXX what is this for??                                                                                         //
    // It's some iteraction between the callback to _callMutatorMethod and                                            //
    // the return value conversion                                                                                    //
    doc._id = result;                                                                                                 // 509
                                                                                                                      //
    return result;                                                                                                    // 511
  };                                                                                                                  // 512
                                                                                                                      //
  var wrappedCallback = wrapCallback(callback, chooseReturnValueFromCollectionResult);                                // 514
                                                                                                                      //
  if (this._isRemoteCollection()) {                                                                                   // 517
    var result = this._callMutatorMethod("insert", [doc], wrappedCallback);                                           // 518
    return chooseReturnValueFromCollectionResult(result);                                                             // 519
  }                                                                                                                   // 520
                                                                                                                      //
  // it's my collection.  descend into the collection object                                                          //
  // and propagate any exception.                                                                                     //
  try {                                                                                                               // 524
    // If the user provided a callback and the collection implements this                                             //
    // operation asynchronously, then queryRet will be undefined, and the                                             //
    // result will be returned through the callback instead.                                                          //
    var _result = this._collection.insert(doc, wrappedCallback);                                                      // 528
    return chooseReturnValueFromCollectionResult(_result);                                                            // 529
  } catch (e) {                                                                                                       // 530
    if (callback) {                                                                                                   // 531
      callback(e);                                                                                                    // 532
      return null;                                                                                                    // 533
    }                                                                                                                 // 534
    throw e;                                                                                                          // 535
  }                                                                                                                   // 536
};                                                                                                                    // 537
                                                                                                                      //
/**                                                                                                                   //
 * @summary Modify one or more documents in the collection. Returns the number of matched documents.                  //
 * @locus Anywhere                                                                                                    //
 * @method update                                                                                                     //
 * @memberOf Mongo.Collection                                                                                         //
 * @instance                                                                                                          //
 * @param {MongoSelector} selector Specifies which documents to modify                                                //
 * @param {MongoModifier} modifier Specifies how to modify the documents                                              //
 * @param {Object} [options]                                                                                          //
 * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
 * @param {Boolean} options.upsert True to insert a document if no matching documents are found.                      //
 * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
 */                                                                                                                   //
Mongo.Collection.prototype.update = function update(selector, modifier) {                                             // 552
  for (var _len = arguments.length, optionsAndCallback = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
    optionsAndCallback[_key - 2] = arguments[_key];                                                                   // 552
  }                                                                                                                   // 552
                                                                                                                      //
  var callback = popCallbackFromArgs(optionsAndCallback);                                                             // 553
                                                                                                                      //
  selector = Mongo.Collection._rewriteSelector(selector);                                                             // 555
                                                                                                                      //
  // We've already popped off the callback, so we are left with an array                                              //
  // of one or zero items                                                                                             //
  var options = _.clone(optionsAndCallback[0]) || {};                                                                 // 559
  if (options && options.upsert) {                                                                                    // 560
    // set `insertedId` if absent.  `insertedId` is a Meteor extension.                                               //
    if (options.insertedId) {                                                                                         // 562
      if (!(typeof options.insertedId === 'string' || options.insertedId instanceof Mongo.ObjectID)) throw new Error("insertedId must be string or ObjectID");
    } else if (!selector._id) {                                                                                       // 566
      options.insertedId = this._makeNewID();                                                                         // 567
    }                                                                                                                 // 568
  }                                                                                                                   // 569
                                                                                                                      //
  var wrappedCallback = wrapCallback(callback);                                                                       // 571
                                                                                                                      //
  if (this._isRemoteCollection()) {                                                                                   // 573
    var args = [selector, modifier, options];                                                                         // 574
                                                                                                                      //
    return this._callMutatorMethod("update", args, wrappedCallback);                                                  // 580
  }                                                                                                                   // 581
                                                                                                                      //
  // it's my collection.  descend into the collection object                                                          //
  // and propagate any exception.                                                                                     //
  try {                                                                                                               // 585
    // If the user provided a callback and the collection implements this                                             //
    // operation asynchronously, then queryRet will be undefined, and the                                             //
    // result will be returned through the callback instead.                                                          //
    return this._collection.update(selector, modifier, options, wrappedCallback);                                     // 589
  } catch (e) {                                                                                                       // 591
    if (callback) {                                                                                                   // 592
      callback(e);                                                                                                    // 593
      return null;                                                                                                    // 594
    }                                                                                                                 // 595
    throw e;                                                                                                          // 596
  }                                                                                                                   // 597
};                                                                                                                    // 598
                                                                                                                      //
/**                                                                                                                   //
 * @summary Remove documents from the collection                                                                      //
 * @locus Anywhere                                                                                                    //
 * @method remove                                                                                                     //
 * @memberOf Mongo.Collection                                                                                         //
 * @instance                                                                                                          //
 * @param {MongoSelector} selector Specifies which documents to remove                                                //
 * @param {Function} [callback] Optional.  If present, called with an error object as its argument.                   //
 */                                                                                                                   //
Mongo.Collection.prototype.remove = function remove(selector, callback) {                                             // 609
  selector = Mongo.Collection._rewriteSelector(selector);                                                             // 610
                                                                                                                      //
  var wrappedCallback = wrapCallback(callback);                                                                       // 612
                                                                                                                      //
  if (this._isRemoteCollection()) {                                                                                   // 614
    return this._callMutatorMethod("remove", [selector], wrappedCallback);                                            // 615
  }                                                                                                                   // 616
                                                                                                                      //
  // it's my collection.  descend into the collection object                                                          //
  // and propagate any exception.                                                                                     //
  try {                                                                                                               // 620
    // If the user provided a callback and the collection implements this                                             //
    // operation asynchronously, then queryRet will be undefined, and the                                             //
    // result will be returned through the callback instead.                                                          //
    return this._collection.remove(selector, wrappedCallback);                                                        // 624
  } catch (e) {                                                                                                       // 625
    if (callback) {                                                                                                   // 626
      callback(e);                                                                                                    // 627
      return null;                                                                                                    // 628
    }                                                                                                                 // 629
    throw e;                                                                                                          // 630
  }                                                                                                                   // 631
};                                                                                                                    // 632
                                                                                                                      //
// Determine if this collection is simply a minimongo representation of a real                                        //
// database on another server                                                                                         //
Mongo.Collection.prototype._isRemoteCollection = function _isRemoteCollection() {                                     // 636
  // XXX see #MeteorServerNull                                                                                        //
  return this._connection && this._connection !== Meteor.server;                                                      // 638
};                                                                                                                    // 639
                                                                                                                      //
// Convert the callback to not return a result if there is an error                                                   //
function wrapCallback(callback, convertResult) {                                                                      // 642
  if (!callback) {                                                                                                    // 643
    return;                                                                                                           // 644
  }                                                                                                                   // 645
                                                                                                                      //
  // If no convert function was passed in, just use a "blank function"                                                //
  convertResult = convertResult || _.identity;                                                                        // 648
                                                                                                                      //
  return function (error, result) {                                                                                   // 650
    callback(error, !error && convertResult(result));                                                                 // 651
  };                                                                                                                  // 652
}                                                                                                                     // 653
                                                                                                                      //
/**                                                                                                                   //
 * @summary Modify one or more documents in the collection, or insert one if no matching documents were found. Returns an object with keys `numberAffected` (the number of documents modified)  and `insertedId` (the unique _id of the document that was inserted, if any).
 * @locus Anywhere                                                                                                    //
 * @param {MongoSelector} selector Specifies which documents to modify                                                //
 * @param {MongoModifier} modifier Specifies how to modify the documents                                              //
 * @param {Object} [options]                                                                                          //
 * @param {Boolean} options.multi True to modify all matching documents; false to only modify one of the matching documents (the default).
 * @param {Function} [callback] Optional.  If present, called with an error object as the first argument and, if no error, the number of affected documents as the second.
 */                                                                                                                   //
Mongo.Collection.prototype.upsert = function upsert(selector, modifier, options, callback) {                          // 664
  if (!callback && typeof options === "function") {                                                                   // 666
    callback = options;                                                                                               // 667
    options = {};                                                                                                     // 668
  }                                                                                                                   // 669
                                                                                                                      //
  var updateOptions = _.extend({}, options, {                                                                         // 671
    _returnObject: true,                                                                                              // 672
    upsert: true                                                                                                      // 673
  });                                                                                                                 // 671
                                                                                                                      //
  return this.update(selector, modifier, updateOptions, callback);                                                    // 676
};                                                                                                                    // 677
                                                                                                                      //
// We'll actually design an index API later. For now, we just pass through to                                         //
// Mongo's, but make it synchronous.                                                                                  //
Mongo.Collection.prototype._ensureIndex = function (index, options) {                                                 // 681
  var self = this;                                                                                                    // 682
  if (!self._collection._ensureIndex) throw new Error("Can only call _ensureIndex on server collections");            // 683
  self._collection._ensureIndex(index, options);                                                                      // 685
};                                                                                                                    // 686
Mongo.Collection.prototype._dropIndex = function (index) {                                                            // 687
  var self = this;                                                                                                    // 688
  if (!self._collection._dropIndex) throw new Error("Can only call _dropIndex on server collections");                // 689
  self._collection._dropIndex(index);                                                                                 // 691
};                                                                                                                    // 692
Mongo.Collection.prototype._dropCollection = function () {                                                            // 693
  var self = this;                                                                                                    // 694
  if (!self._collection.dropCollection) throw new Error("Can only call _dropCollection on server collections");       // 695
  self._collection.dropCollection();                                                                                  // 697
};                                                                                                                    // 698
Mongo.Collection.prototype._createCappedCollection = function (byteSize, maxDocuments) {                              // 699
  var self = this;                                                                                                    // 700
  if (!self._collection._createCappedCollection) throw new Error("Can only call _createCappedCollection on server collections");
  self._collection._createCappedCollection(byteSize, maxDocuments);                                                   // 703
};                                                                                                                    // 704
                                                                                                                      //
/**                                                                                                                   //
 * @summary Returns the [`Collection`](http://mongodb.github.io/node-mongodb-native/1.4/api-generated/collection.html) object corresponding to this collection from the [npm `mongodb` driver module](https://www.npmjs.com/package/mongodb) which is wrapped by `Mongo.Collection`.
 * @locus Server                                                                                                      //
 */                                                                                                                   //
Mongo.Collection.prototype.rawCollection = function () {                                                              // 710
  var self = this;                                                                                                    // 711
  if (!self._collection.rawCollection) {                                                                              // 712
    throw new Error("Can only call rawCollection on server collections");                                             // 713
  }                                                                                                                   // 714
  return self._collection.rawCollection();                                                                            // 715
};                                                                                                                    // 716
                                                                                                                      //
/**                                                                                                                   //
 * @summary Returns the [`Db`](http://mongodb.github.io/node-mongodb-native/1.4/api-generated/db.html) object corresponding to this collection's database connection from the [npm `mongodb` driver module](https://www.npmjs.com/package/mongodb) which is wrapped by `Mongo.Collection`.
 * @locus Server                                                                                                      //
 */                                                                                                                   //
Mongo.Collection.prototype.rawDatabase = function () {                                                                // 722
  var self = this;                                                                                                    // 723
  if (!(self._driver.mongo && self._driver.mongo.db)) {                                                               // 724
    throw new Error("Can only call rawDatabase on server collections");                                               // 725
  }                                                                                                                   // 726
  return self._driver.mongo.db;                                                                                       // 727
};                                                                                                                    // 728
                                                                                                                      //
/**                                                                                                                   //
 * @summary Create a Mongo-style `ObjectID`.  If you don't specify a `hexString`, the `ObjectID` will generated randomly (not using MongoDB's ID construction rules).
 * @locus Anywhere                                                                                                    //
 * @class                                                                                                             //
 * @param {String} [hexString] Optional.  The 24-character hexadecimal contents of the ObjectID to create             //
 */                                                                                                                   //
Mongo.ObjectID = MongoID.ObjectID;                                                                                    // 737
                                                                                                                      //
/**                                                                                                                   //
 * @summary To create a cursor, use find. To access the documents in a cursor, use forEach, map, or fetch.            //
 * @class                                                                                                             //
 * @instanceName cursor                                                                                               //
 */                                                                                                                   //
Mongo.Cursor = LocalCollection.Cursor;                                                                                // 744
                                                                                                                      //
/**                                                                                                                   //
 * @deprecated in 0.9.1                                                                                               //
 */                                                                                                                   //
Mongo.Collection.Cursor = Mongo.Cursor;                                                                               // 749
                                                                                                                      //
/**                                                                                                                   //
 * @deprecated in 0.9.1                                                                                               //
 */                                                                                                                   //
Mongo.Collection.ObjectID = Mongo.ObjectID;                                                                           // 754
                                                                                                                      //
/**                                                                                                                   //
 * @deprecated in 0.9.1                                                                                               //
 */                                                                                                                   //
Meteor.Collection = Mongo.Collection;                                                                                 // 759
                                                                                                                      //
// Allow deny stuff is now in the allow-deny package                                                                  //
_.extend(Meteor.Collection.prototype, AllowDeny.CollectionPrototype);                                                 // 762
                                                                                                                      //
function popCallbackFromArgs(args) {                                                                                  // 764
  // Pull off any callback (or perhaps a 'callback' variable that was passed                                          //
  // in undefined, like how 'upsert' does it).                                                                        //
  if (args.length && (args[args.length - 1] === undefined || args[args.length - 1] instanceof Function)) {            // 767
    return args.pop();                                                                                                // 770
  }                                                                                                                   // 771
}                                                                                                                     // 772
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

},"connection_options.js":function(){

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                                                                                                    //
// packages/mongo/connection_options.js                                                                               //
//                                                                                                                    //
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                                                                                      //
/**                                                                                                                   //
 * @summary Allows for user specified connection options                                                              //
 * @example http://mongodb.github.io/node-mongodb-native/2.1/reference/connecting/connection-settings/                //
 * @locus Server                                                                                                      //
 * @param {Object} options User specified Mongo connection options                                                    //
 */                                                                                                                   //
Mongo.setConnectionOptions = function setConnectionOptions(options) {                                                 // 7
  check(options, Object);                                                                                             // 8
  Mongo._connectionOptions = options;                                                                                 // 9
};                                                                                                                    // 10
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

}}}}},{"extensions":[".js",".json"]});
require("./node_modules/meteor/mongo/mongo_driver.js");
require("./node_modules/meteor/mongo/oplog_tailing.js");
require("./node_modules/meteor/mongo/observe_multiplex.js");
require("./node_modules/meteor/mongo/doc_fetcher.js");
require("./node_modules/meteor/mongo/polling_observe_driver.js");
require("./node_modules/meteor/mongo/oplog_observe_driver.js");
require("./node_modules/meteor/mongo/local_collection_driver.js");
require("./node_modules/meteor/mongo/remote_collection_driver.js");
require("./node_modules/meteor/mongo/collection.js");
require("./node_modules/meteor/mongo/connection_options.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.mongo = {}, {
  MongoInternals: MongoInternals,
  MongoTest: MongoTest,
  Mongo: Mongo
});

})();

//# sourceMappingURL=mongo.js.map
