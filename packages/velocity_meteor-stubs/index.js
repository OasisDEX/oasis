/*jshint -W020, -W079 */
/*global MeteorStubs: true*/
"use strict";

// TODO: Blaze?
// TODO: ReactiveVar
// TODO: EJSON?

//////////////////////////////////////////////////////////////////////
// Meteor Stubs
//
// Stubs for the core Meteor objects.
//
// Usage:
//
//   MeteorStubs.install()   - installs stubs into the global object
//                             (either `global` or `window`)
//   MeteorStubs.uninstall() - restore global object fields to their
//                             previous values
//
// A note about the structure of this package:
//   Having everything all in a single file is not ideal but it makes
//   it much easier to include client-side.  Please see the ToC below
//   to ease browsing.  Each section has a unique id which you can
//   search on.
//
//
// Table of Contents:
//
//   MS00 - MeteorStubs
//   MS01 - Common prototypes
//          Collection, Cursor, ObjectId
//   MS05 - Meteor
//     MS05-1 - Meteor.Collection
//     MS05-2 - Meteor.Collection.ObjectID
//     MS05-3 - Meteor.users
//   MS06 - Check
//   MS10 - Npm
//   MS15 - Tracker
//   MS20 - Package
//   MS25 - Random
//   MS30 - Session
//   MS35 - Templates
//   MS40 - Handlebars
//   MS45 - Accounts
//   MS48 - ServiceConfiguration
//   MS50 - __meteor_bootstrap__
//   MS55 - share
//   MS60 - Mongo
//   MS62 - HTTP
//   MS63 - Email
//   MS65 - Assets
//   MS70 - Cordova
//
//////////////////////////////////////////////////////////////////////


// Factory methods are used so that each time `MeteorStubs.install` is
// called, a clean object will be returned.
// Each stub has one factory associated with it.

var stubFactories = {},
    emptyFn = function () {},
    stringFn = function () { return '' },
    callbackFn = function (fn) { fn() };




//////////////////////////////////////////////////////////////////////
// MS00 - MeteorStubs
//////////////////////////////////////////////////////////////////////

;(function (global) {
  var _context = global,
      _originals = {};

  var meteorStubs = {

    /**
     * Install Meteor stubs into global context
     *
     * @method install
     * @param {Object} [context] Optional. The context to attach
     *                 stubs to.  Default: the global context.
     */
    install: function (context) {

      if ('object' == typeof context && null !== context) {
        // place stubs on user-defined context
        _context = context;
      }

      for (var key in stubFactories) {
        if (_context[key] && !_originals[key]) {
          _originals[key] = _context[key];
        }
        _context[key] = stubFactories[key]();
      }

    },


    /**
     * Remove stubs by restoring context's original fields
     *
     * @method uninstall
     */
    uninstall: function () {
      for (var key in stubFactories) {
        if ('undefined' == typeof _originals[key]) {
          delete _context[key];
        } else {
          _context[key] = _originals[key];
        }
      }
    }

  };  // end global.MeteorStubs

  if (typeof Meteor === 'undefined') {
    global.MeteorStubs = meteorStubs;
  } else {
    try {
      MeteorStubs = meteorStubs;
    } catch (error) {
      global.MeteorStubs = meteorStubs;
    }
    if (Meteor.isClient) {
      global.MeteorStubs = meteorStubs;
    }
  }

})(typeof global === 'undefined' ? window : global);



//////////////////////////////////////////////////////////////////////
// Common Prototypes - MS01
//////////////////////////////////////////////////////////////////////

var prototypes = {

  Collection: {
    find: function () {
      var Mongo = stubFactories.Mongo();
      return new Mongo.Cursor();
    },
    findOne: emptyFn,
    insert: emptyFn,
    update: emptyFn,
    upsert: emptyFn,
    remove: emptyFn,
    allow: emptyFn,
    deny: emptyFn,
    // TODO: Still needed?
    _ensureIndex: emptyFn
  },  // end Collection

  Cursor: {
    forEach: emptyFn,
    map: emptyFn,
    fetch: emptyFn,
    count: emptyFn,
    observe: emptyFn,
    observeChanges: emptyFn
  },

  ObjectID: {
    getTimestamp: stringFn,
    toHexString: stringFn,
    toJSONValue: stringFn
  }

};  // end prototypes


//////////////////////////////////////////////////////////////////////
// Meteor - MS05
//////////////////////////////////////////////////////////////////////

stubFactories.Meteor = function () {
  var _instantiationCounts = {},
      Meteor;

  function collectionFn (collectionName) {
    var current = _instantiationCounts[collectionName];

    if (!current) {
      _instantiationCounts[collectionName] = 1
    } else {
      _instantiationCounts[collectionName] = current + 1
    }
  }

  Meteor = {
    // Core
    isClient: true,
    isServer: true,
    isCordova: false,
    startup: function (newStartupFunction) {
      this.startupFunctions.push(newStartupFunction);
    },
    wrapAsync: emptyFn,
    absoluteUrl: emptyFn,
    settings: { public: {} },
    release: undefined,

    // Publish and subscribe
    publish: function (modelName, publishFunction) {
      this.publishFunctions[modelName] = publishFunction;
    },
    subscribe: function (modelName, subscribeFunction) {
      this.subscribeFunctions[modelName] = subscribeFunction;
      return {
        ready: function () {
          return true;
        }
      };
    },

    // Methods
    methods: function (map) {
      for (var name in map) {
        //noinspection JSUnfilteredForInLoop
        this.methodMap[name] = map[name];
      }
    },
    Error: function(error, reason, details) {
      if (error) this.error = error;
      if (reason) this.reason = reason;
      if (details) this.details = details;
    },
    call: function(name /* .. [arguments] .. callback */) {
      // if it's a function, the last argument is the result callback,
      // not a parameter to the remote method.
      var args = Array.prototype.slice.call(arguments, 1);
      if (args.length && typeof args[args.length - 1] === "function") {
        var callback = args.pop();
      }

      return Meteor.apply(name, args, callback)
    },
    callInContext: function(name, context /* .. [arguments] .. callback */) {
      // if it's a function, the last argument is the result callback,
      // not a parameter to the remote method.
      var args = Array.prototype.slice.call(arguments, 2);
      if (args.length && typeof args[args.length - 1] === "function") {
        var callback = args.pop();
      }

      return Meteor.applyInContext(name, context, args, callback)
    },
    // TODO: Support options.onResultReceived
    apply: function(name, args, options, callback) {
      var context = {
        userId: null,
        setUserId: emptyFn,
        isSimulation: false,
        unblock: emptyFn,
        connection: null
      };

      return Meteor.applyInContext(name, context, args, options, callback);
    },
    // TODO: Support options.onResultReceived
    applyInContext: function(name, context, args, options, callback) {
      // We were passed 4 arguments.
      // They may be either (name, context, args, options)
      // or (name, context, args, callback)
      if (!callback && typeof options === 'function') {
        callback = options;
        //options = {};
      }
      //options = options || {};

      return Meteor.executeFunction(function() {
        return Meteor.methodMap[name].apply(context, args);
      }, callback);
    },

    // Server connections
    status: function () {
      return {
        connected: true,
        status: 'connected',
        retryCount: 0,
        retryTime: undefined,
        reason: undefined
      }
    },
    reconnect: emptyFn,
    disconnect: emptyFn,
    onConnection: emptyFn,
    // TODO: DDP.connect

    // Collections
    /*
     * @Deprecated Use Mongo.Collection
     */
    Collection: collectionFn,
    /*
     * @Deprecated Use Mongo.Collection
     */
    SmartCollection: collectionFn,

    // Accounts
    user: function () {
      return {
        emails: []
      };
    },
    userId: function () {
      return null;
    },
    loggingIn: emptyFn,
    logout: emptyFn,
    logoutOtherClients: emptyFn,
    loginWithMeteorDeveloperAccount: emptyFn,
    loginWithFacebook: emptyFn,
    loginWithGithub: emptyFn,
    loginWithGoogle: emptyFn,
    loginWithMeetup: emptyFn,
    loginWithTwitter: emptyFn,
    loginWithWeibo: emptyFn,

    // Timers
    setTimeout: emptyFn,
    setInterval: emptyFn,
    clearTimeout: emptyFn,
    clearInterval: emptyFn,

    // Internal stub state
    instantiationCounts: _instantiationCounts,
    startupFunctions: [],
    publishFunctions: {},
    subscribeFunctions: {},
    methodMap: {},

    // Methods of the stub
    executeFunction: function(func, callback) {
      var exception = null;
      var result = null;

      try {
        result = func();
      } catch (ex) {
        exception = ex;
      }

      // if we specify the callback function execute it
      if (callback) {
        callback(exception, result);
      } else {
        if (exception != null) {
          // rethrow exception
          throw exception;
        } else if (Meteor.isServer) {
          return result;
        }
      }
    },

    runStartupMethods: function () {
      for (var i = 0; i < this.startupFunctions.length; i += 1) {
        this.startupFunctions[i]();
      }
    }
  };


  //////////////////////////////////////////////////////////////////////
  // Meteor.Collection - MS05.1
  //////////////////////////////////////////////////////////////////////

  Meteor.Collection.prototype = prototypes.Collection;




  //////////////////////////////////////////////////////////////////////
  // Meteor.Collection.ObjectID - MS05.2
  //////////////////////////////////////////////////////////////////////

  Meteor.Collection.ObjectID = function () {
    return { _str: '' };
  };
  Meteor.Collection.ObjectID.prototype = prototypes.ObjectID



  //////////////////////////////////////////////////////////////////////
  // Meteor.users - MS05.3
  //
  // Instantiate the users default collection
  //////////////////////////////////////////////////////////////////////

  Meteor.users = new Meteor.Collection('users');




  return Meteor;

};  // Meteor


//////////////////////////////////////////////////////////////////////
// MS06 - Check
//////////////////////////////////////////////////////////////////////

stubFactories.check = function () {
  return emptyFn;
};

stubFactories.Match = function () {
  return {
    test: emptyFn
  };
};


//////////////////////////////////////////////////////////////////////
// MS10 - Npm
//////////////////////////////////////////////////////////////////////

stubFactories.Npm = function () {
  return {
    depends: emptyFn,
    require: emptyFn
  };
};


//////////////////////////////////////////////////////////////////////
// MS15 - Deps / Tracker
//////////////////////////////////////////////////////////////////////

// TODO: Tracker.Computation (if needed)
// TODO: Tracker.Dependency (if needed)

stubFactories.Tracker = function () {
  return {
    autorun: callbackFn,
    flush: emptyFn,
    nonreactive: callbackFn,
    active: false,
    currentComputation: emptyFn,
    onInvalidate: emptyFn,
    afterFlush: emptyFn
  };
};
stubFactories.Deps = stubFactories.Tracker


//////////////////////////////////////////////////////////////////////
// MS20 - Package
//////////////////////////////////////////////////////////////////////

stubFactories.Package = function () {
  return {
    describe: emptyFn,
    onUse: emptyFn,
    onTest: emptyFn,
    registerBuildPlugin: emptyFn
  };
};



//////////////////////////////////////////////////////////////////////
// MS25 - Random
//////////////////////////////////////////////////////////////////////

stubFactories.Random = function () {
  return {
    id: emptyFn,
    secret: emptyFn,
    fraction: emptyFn,
    choice: emptyFn,
    hexString: emptyFn
  };
};



//////////////////////////////////////////////////////////////////////
// MS30 - Session
//////////////////////////////////////////////////////////////////////

stubFactories.Session = function () {
  return {
    store: {},
    set: function (key, value) {
      this.store[key] = value;
    },
    setDefault: function (key, value) {
      if (typeof this.get(key) === 'undefined') {
        this.set(key, value);
      }
    },
    get: function (key) {
      return this.store[key];
    },
    equals: function (key, value) {
      return this.store[key] === value;
    }
  };
};


//////////////////////////////////////////////////////////////////////
// MS35 - Templates
//////////////////////////////////////////////////////////////////////

function TemplateClass () {}
TemplateClass.prototype = {
  stub: function (templateName) {
    TemplateClass.prototype[templateName] = {
      eventMap: {},
      events: function (eventMap) {
        for (var event in eventMap) {
          //noinspection JSUnfilteredForInLoop
          TemplateClass.prototype[templateName].eventMap[event] = eventMap[event];
        }
      },
      helpers: function (helperMap) {
        for (var helper in helperMap) {
          //noinspection JSUnfilteredForInLoop
          TemplateClass.prototype[templateName][helper] = helperMap[helper];
        }
      },
      fireEvent: function (key) {
        if (arguments.length > 1) {
          var args = Array.prototype.slice.call(arguments, 1);
          TemplateClass.prototype[templateName].eventMap[key].apply(null, args);
        } else {
          TemplateClass.prototype[templateName].eventMap[key]();
        }
      },
      // Allows you to set an attribute in the event 'this' context
      addContextAttribute: function (key, value) {
        TemplateClass.prototype[templateName].eventMap[key] = value;
      }
    };
  }
};

stubFactories.Template = function () {
  var Template = new TemplateClass();

  Template.registerHelper = emptyFn;
  Template.instance = emptyFn;
  Template.currentData = emptyFn;
  Template.parentData = emptyFn;
  Template.body = {};

  return Template;
};


//////////////////////////////////////////////////////////////////////
// MS40 - Handlebars
//////////////////////////////////////////////////////////////////////

function HandlebarsClass () {}
HandlebarsClass.prototype = {
  helpers: {},
  registerHelper: function (name, method) {
    this.helpers[name] = method;
  }
};

stubFactories.Handlebars = function () {
  return new HandlebarsClass();
};



//////////////////////////////////////////////////////////////////////
// MS45 - Accounts
//////////////////////////////////////////////////////////////////////

stubFactories.Accounts = function () {
  return {
    // Accounts
    config: emptyFn,
    ui: {
      config: emptyFn
    },
    validateNewUser: emptyFn,
    onCreateUser: emptyFn,
    validateLoginAttempt: emptyFn,
    onLogin: emptyFn,
    onLoginFailure: emptyFn,

    // Passwords
    createUser: emptyFn,
    changePassword: emptyFn,
    forgotPassword: emptyFn,
    resetPassword: emptyFn,
    setPassword: emptyFn,
    verifyEmail: emptyFn,

    sendResetPasswordEmail: emptyFn,
    sendEnrollmentEmail: emptyFn,
    sendVerificationEmail: emptyFn,

    onResetPasswordLink: emptyFn,
    onEnrollmentLink: emptyFn,
    onEmailVerificationLink: emptyFn,

    emailTemplates: {
      resetPassword: {},
      enrollAccount: {},
      verifyEmail: {}
    }
  };
};


//////////////////////////////////////////////////////////////////////
// MS48 - ServiceConfiguration
//////////////////////////////////////////////////////////////////////

stubFactories.ServiceConfiguration = function () {
  var Mongo = stubFactories.Mongo();
  var ServiceConfiguration = {
    configurations: new Mongo.Collection('meteor_accounts_loginServiceConfiguration')
  }

  return ServiceConfiguration;
};


//////////////////////////////////////////////////////////////////////
// MS50 - __meteor_bootstrap__
//////////////////////////////////////////////////////////////////////

stubFactories.__meteor_bootstrap__ = function () {
  return {
    deployConfig: {
      packages: { 'mongo-livedata': { url: '' } }
    }
  };
};

//////////////////////////////////////////////////////////////////////
// MS55 - share
//////////////////////////////////////////////////////////////////////

stubFactories.share = function () {
  return {};
};


//////////////////////////////////////////////////////////////////////
// MS60 - Mongo
//////////////////////////////////////////////////////////////////////

stubFactories.Mongo = function () {
  var _instantiationCounts = {},
      Mongo;

  function collectionFn (collectionName) {
    var current = _instantiationCounts[collectionName];

    if (!current) {
      _instantiationCounts[collectionName] = 1
    } else {
      _instantiationCounts[collectionName] = current + 1
    }
  }

  Mongo = {
    instantiationCounts: _instantiationCounts,
    Collection: collectionFn,
    Cursor: emptyFn,
    ObjectID: function () {
      return { _str: '' };
    }
  };

  Mongo.Collection.prototype = prototypes.Collection;
  Mongo.Cursor.prototype = prototypes.Cursor;
  Mongo.ObjectID.prototype = prototypes.ObjectID;

  return Mongo;
};


//////////////////////////////////////////////////////////////////////
// MS62 - HTTP
//////////////////////////////////////////////////////////////////////
stubFactories.HTTP = function () {
  return {
    call: emptyFn,
    get: emptyFn,
    post: emptyFn,
    put: emptyFn,
    del: emptyFn
  };
};


//////////////////////////////////////////////////////////////////////
// MS63 - Email
//////////////////////////////////////////////////////////////////////
stubFactories.Email = function () {
  return {
    send: emptyFn
  };
};


//////////////////////////////////////////////////////////////////////
// MS65 - Assets
//////////////////////////////////////////////////////////////////////

stubFactories.Assets = function () {
  return {
    getText: stringFn,
    getBinary: emptyFn
  };
};


//////////////////////////////////////////////////////////////////////
// MS70 - Cordova
//////////////////////////////////////////////////////////////////////
stubFactories.Cordova = function () {
  return {
    depends: emptyFn
  };
}

