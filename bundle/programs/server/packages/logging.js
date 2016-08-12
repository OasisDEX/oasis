(function () {

/* Imports */
var Meteor = Package.meteor.Meteor;
var global = Package.meteor.global;
var meteorEnv = Package.meteor.meteorEnv;
var _ = Package.underscore._;
var EJSON = Package.ejson.EJSON;
var meteorInstall = Package.modules.meteorInstall;
var Buffer = Package.modules.Buffer;
var process = Package.modules.process;

/* Package-scope variables */
var Log, exports;

var require = meteorInstall({"node_modules":{"meteor":{"logging":{"logging.js":["cli-color",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// packages/logging/logging.js                                                         //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
Log = function () {
  return Log.info.apply(this, arguments);
};

/// FOR TESTING
var intercept = 0;
var interceptedLines = [];
var suppress = 0;

// Intercept the next 'count' calls to a Log function. The actual
// lines printed to the console can be cleared and read by calling
// Log._intercepted().
Log._intercept = function (count) {
  intercept += count;
};

// Suppress the next 'count' calls to a Log function. Use this to stop
// tests from spamming the console, especially with red errors that
// might look like a failing test.
Log._suppress = function (count) {
  suppress += count;
};

// Returns intercepted lines and resets the intercept counter.
Log._intercepted = function () {
  var lines = interceptedLines;
  interceptedLines = [];
  intercept = 0;
  return lines;
};

// Either 'json' or 'colored-text'.
//
// When this is set to 'json', print JSON documents that are parsed by another
// process ('satellite' or 'meteor run'). This other process should call
// 'Log.format' for nice output.
//
// When this is set to 'colored-text', call 'Log.format' before printing.
// This should be used for logging from within satellite, since there is no
// other process that will be reading its standard output.
Log.outputFormat = 'json';

var LEVEL_COLORS = {
  debug: 'green',
  // leave info as the default color
  warn: 'magenta',
  error: 'red'
};

var META_COLOR = 'blue';

// XXX package
var RESTRICTED_KEYS = ['time', 'timeInexact', 'level', 'file', 'line',
                        'program', 'originApp', 'satellite', 'stderr'];

var FORMATTED_KEYS = RESTRICTED_KEYS.concat(['app', 'message']);

var logInBrowser = function (obj) {
  var str = Log.format(obj);

  // XXX Some levels should be probably be sent to the server
  var level = obj.level;

  if ((typeof console !== 'undefined') && console[level]) {
    console[level](str);
  } else {
    // XXX Uses of Meteor._debug should probably be replaced by Log.debug or
    //     Log.info, and we should have another name for "do your best to
    //     call call console.log".
    Meteor._debug(str);
  }
};

// @returns {Object: { line: Number, file: String }}
Log._getCallerDetails = function () {
  var getStack = function () {
    // We do NOT use Error.prepareStackTrace here (a V8 extension that gets us a
    // pre-parsed stack) since it's impossible to compose it with the use of
    // Error.prepareStackTrace used on the server for source maps.
    var err = new Error;
    var stack = err.stack;
    return stack;
  };

  var stack = getStack();

  if (!stack) return {};

  var lines = stack.split('\n');

  // looking for the first line outside the logging package (or an
  // eval if we find that first)
  var line;
  for (var i = 1; i < lines.length; ++i) {
    line = lines[i];
    if (line.match(/^\s*at eval \(eval/)) {
      return {file: "eval"};
    }

    if (!line.match(/packages\/(?:local-test[:_])?logging(?:\/|\.js)/))
      break;
  }

  var details = {};

  // The format for FF is 'functionName@filePath:lineNumber'
  // The format for V8 is 'functionName (packages/logging/logging.js:81)' or
  //                      'packages/logging/logging.js:81'
  var match = /(?:[@(]| at )([^(]+?):([0-9:]+)(?:\)|$)/.exec(line);
  if (!match)
    return details;
  // in case the matched block here is line:column
  details.line = match[2].split(':')[0];

  // Possible format: https://foo.bar.com/scripts/file.js?random=foobar
  // XXX: if you can write the following in better way, please do it
  // XXX: what about evals?
  details.file = match[1].split('/').slice(-1)[0].split('?')[0];

  return details;
};

_.each(['debug', 'info', 'warn', 'error'], function (level) {
  // @param arg {String|Object}
  Log[level] = function (arg) {
    if (suppress) {
      suppress--;
      return;
    }

    var intercepted = false;
    if (intercept) {
      intercept--;
      intercepted = true;
    }

    var obj = (_.isObject(arg) && !_.isRegExp(arg) && !_.isDate(arg) ) ?
              arg : {message: new String(arg).toString() };

    _.each(RESTRICTED_KEYS, function (key) {
      if (obj[key])
        throw new Error("Can't set '" + key + "' in log message");
    });

    if (_.has(obj, 'message') && !_.isString(obj.message))
      throw new Error("The 'message' field in log objects must be a string");
    if (!obj.omitCallerDetails)
      obj = _.extend(Log._getCallerDetails(), obj);
    obj.time = new Date();
    obj.level = level;

    // XXX allow you to enable 'debug', probably per-package
    if (level === 'debug')
      return;

    if (intercepted) {
      interceptedLines.push(EJSON.stringify(obj));
    } else if (Meteor.isServer) {
      if (Log.outputFormat === 'colored-text') {
        console.log(Log.format(obj, {color: true}));
      } else if (Log.outputFormat === 'json') {
        console.log(EJSON.stringify(obj));
      } else {
        throw new Error("Unknown logging output format: " + Log.outputFormat);
      }
    } else {
      logInBrowser(obj);
    }
  };
});

// tries to parse line as EJSON. returns object if parse is successful, or null if not
Log.parse = function (line) {
  var obj = null;
  if (line && line.charAt(0) === '{') { // might be json generated from calling 'Log'
    try { obj = EJSON.parse(line); } catch (e) {}
  }

  // XXX should probably check fields other than 'time'
  if (obj && obj.time && (obj.time instanceof Date))
    return obj;
  else
    return null;
};

// formats a log object into colored human and machine-readable text
Log.format = function (obj, options) {
  obj = EJSON.clone(obj); // don't mutate the argument
  options = options || {};

  var time = obj.time;
  if (!(time instanceof Date))
    throw new Error("'time' must be a Date object");
  var timeInexact = obj.timeInexact;

  // store fields that are in FORMATTED_KEYS since we strip them
  var level = obj.level || 'info';
  var file = obj.file;
  var lineNumber = obj.line;
  var appName = obj.app || '';
  var originApp = obj.originApp;
  var message = obj.message || '';
  var program = obj.program || '';
  var satellite = obj.satellite;
  var stderr = obj.stderr || '';

  _.each(FORMATTED_KEYS, function(key) {
    delete obj[key];
  });

  if (!_.isEmpty(obj)) {
    if (message) message += " ";
    message += EJSON.stringify(obj);
  }

  var pad2 = function(n) { return n < 10 ? '0' + n : n.toString(); };
  var pad3 = function(n) { return n < 100 ? '0' + pad2(n) : n.toString(); };

  var dateStamp = time.getFullYear().toString() +
    pad2(time.getMonth() + 1 /*0-based*/) +
    pad2(time.getDate());
  var timeStamp = pad2(time.getHours()) +
        ':' +
        pad2(time.getMinutes()) +
        ':' +
        pad2(time.getSeconds()) +
        '.' +
        pad3(time.getMilliseconds());

  // eg in San Francisco in June this will be '(-7)'
  var utcOffsetStr = '(' + (-(new Date().getTimezoneOffset() / 60)) + ')';

  var appInfo = '';
  if (appName) appInfo += appName;
  if (originApp && originApp !== appName) appInfo += ' via ' + originApp;
  if (appInfo) appInfo = '[' + appInfo + '] ';

  var sourceInfoParts = [];
  if (program) sourceInfoParts.push(program);
  if (file) sourceInfoParts.push(file);
  if (lineNumber) sourceInfoParts.push(lineNumber);
  var sourceInfo = _.isEmpty(sourceInfoParts) ?
    '' : '(' + sourceInfoParts.join(':') + ') ';

  if (satellite)
    sourceInfo += ['[', satellite, ']'].join('');

  var stderrIndicator = stderr ? '(STDERR) ' : '';

  var metaPrefix = [
    level.charAt(0).toUpperCase(),
    dateStamp,
    '-',
    timeStamp,
    utcOffsetStr,
    timeInexact ? '? ' : ' ',
    appInfo,
    sourceInfo,
    stderrIndicator].join('');

  var prettify = function (line, color) {
    return (options.color && Meteor.isServer && color) ?
      require('cli-color')[color](line) : line;
  };

  return prettify(metaPrefix, options.metaColor || META_COLOR) +
    prettify(message, LEVEL_COLORS[level]);
};

// Turn a line of text into a loggable object.
// @param line {String}
// @param override {Object}
Log.objFromText = function (line, override) {
  var obj = {message: line, level: "info", time: new Date(), timeInexact: true};
  return _.extend(obj, override);
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"node_modules":{"cli-color":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// ../npm/node_modules/cli-color/package.json                                          //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
exports.name = "cli-color";
exports.version = "0.2.3";
exports.main = "lib";

/////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":["es5-ext/lib/Object/descriptor","es5-ext/lib/Object/extend","es5-ext/lib/Object/map","es5-ext/lib/Object/reduce","es5-ext/lib/String/prototype/repeat","memoizee","tty","./_xterm-match",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/lib/index.js                     //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var d       = require('es5-ext/lib/Object/descriptor')
  , extend  = require('es5-ext/lib/Object/extend')
  , map     = require('es5-ext/lib/Object/map')
  , reduce  = require('es5-ext/lib/Object/reduce')
  , repeat  = require('es5-ext/lib/String/prototype/repeat')
  , memoize = require('memoizee')
  , tty     = require('tty')

  , join = Array.prototype.join, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties, abs = Math.abs
  , floor = Math.floor, max = Math.max, min = Math.min

  , mods, proto, getFn, getMove, xtermMatch
  , up, down, right, left, getHeight, memoized;

mods = extend({
	// Style
	bold:      { _bold: [1, 22] },
	italic:    { _italic: [3, 23] },
	underline: { _underline: [4, 24] },
	blink:     { _blink: [5, 25] },
	inverse:   { _inverse: [7, 27] },
	strike:    { _strike: [9, 29] }
},

	// Color
	['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
		.reduce(function (obj, color, index) {
		// foreground
		obj[color] = { _fg: [30 + index, 39] };
		obj[color + 'Bright'] = { _fg: [90 + index, 39] };

		// background
		obj['bg' + color[0].toUpperCase() + color.slice(1)] =
			{ _bg: [40 + index, 49] };
		obj['bg' + color[0].toUpperCase() + color.slice(1) + 'Bright'] =
			{ _bg: [100 + index, 49] };

		return obj;
	}, {}));

// Some use cli-color as: console.log(clc.red('Error!'));
// Which is inefficient as on each call it configures new clc object
// with memoization we reuse once created object
memoized = memoize(function (scope, mod) {
	return defineProperty(getFn(), '_cliColorData',
		d(extend({}, scope._cliColorData, mod)));
});

proto = Object.create(Function.prototype, extend(map(mods, function (mod) {
	return d.gs(function () { return memoized(this, mod); });
}), {
	// xterm (255) color
	xterm: d(memoize(function (code) {
		code = isNaN(code) ? 255 : min(max(code, 0), 255);
		return defineProperty(getFn(), '_cliColorData',
			d(extend({}, this._cliColorData, {
				_fg: [xtermMatch ? xtermMatch[code] : ('38;5;' + code), 39]
			})));
	}, { method: 'xterm' })),
	bgXterm: d(memoize(function (code) {
		code = isNaN(code) ? 255 : min(max(code, 0), 255);
		return defineProperty(getFn(), '_cliColorData',
			d(extend({}, this._cliColorData, {
				_bg: [xtermMatch ? (xtermMatch[code] + 10) : ('48;5;' + code), 49]
			})));
	}, { method: 'bgXterm' }))
}));

if (process.platform === 'win32') {
	xtermMatch = require('./_xterm-match');
}

getFn = function () {
	var fn = function (/*…msg*/) {
		var data = fn._cliColorData, close = '';
		return reduce(data, function (str, mod) {
			close = '\x1b[' + mod[1] + 'm' + close;
			return str + '\x1b[' + mod[0] + 'm';
		}, '', true) + join.call(arguments, ' ') + close;
	};
	fn.__proto__ = proto;
	return fn;
};

getMove = function (control) {
	return function (num) {
		num = isNaN(num) ? 0 : max(floor(num), 0);
		return num ? ('\x1b[' + num + control) : '';
	};
};

module.exports = defineProperties(getFn(), {
	width: d.gs(process.stdout.getWindowSize ? function () {
		return process.stdout.getWindowSize()[0];
	} : function () {
		return tty.getWindowSize ? tty.getWindowSize()[1] : 0;
	}),
	height: d.gs(getHeight = process.stdout.getWindowSize ? function () {
		return process.stdout.getWindowSize()[1];
	} : function () {
		return tty.getWindowSize ? tty.getWindowSize()[0] : 0;
	}),
	reset: d.gs(function () {
		return repeat.call('\n', getHeight() - 1) + '\x1bc';
	}),
	up: d(up = getMove('A')),
	down: d(down = getMove('B')),
	right: d(right = getMove('C')),
	left: d(left = getMove('D')),
	move: d(function (x, y) {
		x = isNaN(x) ? 0 : floor(x);
		y = isNaN(y) ? 0 : floor(y);
		return ((x > 0) ? right(x) : left(-x)) + ((y > 0) ? down(y) : up(-y));
	}),
	moveTo: d(function (x, y) {
		x = isNaN(x) ? 1 : (max(floor(x), 0) + 1);
		y = isNaN(y) ? 1 : (max(floor(y), 0) + 1);
		return '\x1b[' + y + ';' + x + 'H';
	}),
	bol: d(function (n/*, erase*/) {
		var dir;
		n = isNaN(n) ? 0 : Number(n);
		dir = (n >= 0) ? 'E' : 'F';
		n = floor(abs(n));
		return arguments[1] ?
				(((!n || (dir === 'F')) ? '\x1b[0E\x1bK' : '') +
					repeat.call('\x1b[1' + dir + '\x1b[K', n)) : '\x1b[' + n + dir;
	}),
	beep: d('\x07'),
	xtermSupported: d(!xtermMatch),
	_cliColorData: d({})
});

/////////////////////////////////////////////////////////////////////////////////////////

}],"_xterm-match.js":["./_xterm-colors",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/lib/_xterm-match.js              //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var push = Array.prototype.push, reduce = Array.prototype.reduce, abs = Math.abs
  , colors, match, result, i;

colors = require('./_xterm-colors').map(function (color) {
	return {
		r: parseInt(color.slice(0, 2), 16),
		g: parseInt(color.slice(2, 4), 16),
		b: parseInt(color.slice(4), 16)
	};
});

match = colors.slice(0, 16);

module.exports = result = [];

i = 0;
while (i < 8) {
	result.push(30 + i++);
}
i = 0;
while (i < 8) {
	result.push(90 + i++);
}
push.apply(result, colors.slice(16).map(function (data) {
	var index, diff = Infinity;
	match.every(function (match, i) {
		var ndiff = reduce.call('rgb', function (diff, channel) {
			return (diff += abs(match[channel] - data[channel]));
		}, 0);
		if (ndiff < diff) {
			index = i;
			diff = ndiff;
		}
		return ndiff;
	});
	return result[index];
}));

/////////////////////////////////////////////////////////////////////////////////////////

}],"_xterm-colors.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/lib/_xterm-colors.js             //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = [
	"000000", "800000", "008000", "808000", "000080", "800080", "008080", "c0c0c0",
	"808080", "ff0000", "00ff00", "ffff00", "0000ff", "ff00ff", "00ffff", "ffffff",

	"000000", "00005f", "000087", "0000af", "0000d7", "0000ff",
	"005f00", "005f5f", "005f87", "005faf", "005fd7", "005fff",
	"008700", "00875f", "008787", "0087af", "0087d7", "0087ff",
	"00af00", "00af5f", "00af87", "00afaf", "00afd7", "00afff",
	"00d700", "00d75f", "00d787", "00d7af", "00d7d7", "00d7ff",
	"00ff00", "00ff5f", "00ff87", "00ffaf", "00ffd7", "00ffff",

	"5f0000", "5f005f", "5f0087", "5f00af", "5f00d7", "5f00ff",
	"5f5f00", "5f5f5f", "5f5f87", "5f5faf", "5f5fd7", "5f5fff",
	"5f8700", "5f875f", "5f8787", "5f87af", "5f87d7", "5f87ff",
	"5faf00", "5faf5f", "5faf87", "5fafaf", "5fafd7", "5fafff",
	"5fd700", "5fd75f", "5fd787", "5fd7af", "5fd7d7", "5fd7ff",
	"5fff00", "5fff5f", "5fff87", "5fffaf", "5fffd7", "5fffff",

	"870000", "87005f", "870087", "8700af", "8700d7", "8700ff",
	"875f00", "875f5f", "875f87", "875faf", "875fd7", "875fff",
	"878700", "87875f", "878787", "8787af", "8787d7", "8787ff",
	"87af00", "87af5f", "87af87", "87afaf", "87afd7", "87afff",
	"87d700", "87d75f", "87d787", "87d7af", "87d7d7", "87d7ff",
	"87ff00", "87ff5f", "87ff87", "87ffaf", "87ffd7", "87ffff",

	"af0000", "af005f", "af0087", "af00af", "af00d7", "af00ff",
	"af5f00", "af5f5f", "af5f87", "af5faf", "af5fd7", "af5fff",
	"af8700", "af875f", "af8787", "af87af", "af87d7", "af87ff",
	"afaf00", "afaf5f", "afaf87", "afafaf", "afafd7", "afafff",
	"afd700", "afd75f", "afd787", "afd7af", "afd7d7", "afd7ff",
	"afff00", "afff5f", "afff87", "afffaf", "afffd7", "afffff",

	"d70000", "d7005f", "d70087", "d700af", "d700d7", "d700ff",
	"d75f00", "d75f5f", "d75f87", "d75faf", "d75fd7", "d75fff",
	"d78700", "d7875f", "d78787", "d787af", "d787d7", "d787ff",
	"d7af00", "d7af5f", "d7af87", "d7afaf", "d7afd7", "d7afff",
	"d7d700", "d7d75f", "d7d787", "d7d7af", "d7d7d7", "d7d7ff",
	"d7ff00", "d7ff5f", "d7ff87", "d7ffaf", "d7ffd7", "d7ffff",

	"ff0000", "ff005f", "ff0087", "ff00af", "ff00d7", "ff00ff",
	"ff5f00", "ff5f5f", "ff5f87", "ff5faf", "ff5fd7", "ff5fff",
	"ff8700", "ff875f", "ff8787", "ff87af", "ff87d7", "ff87ff",
	"ffaf00", "ffaf5f", "ffaf87", "ffafaf", "ffafd7", "ffafff",
	"ffd700", "ffd75f", "ffd787", "ffd7af", "ffd7d7", "ffd7ff",
	"ffff00", "ffff5f", "ffff87", "ffffaf", "ffffd7", "ffffff",

	"080808", "121212", "1c1c1c", "262626", "303030", "3a3a3a",
	"444444", "4e4e4e", "585858", "626262", "6c6c6c", "767676",
	"808080", "8a8a8a", "949494", "9e9e9e", "a8a8a8", "b2b2b2",
	"bcbcbc", "c6c6c6", "d0d0d0", "dadada", "e4e4e4", "eeeeee"
];

/////////////////////////////////////////////////////////////////////////////////////////

}},"node_modules":{"es5-ext":{"lib":{"Object":{"descriptor.js":["./is-callable","./valid-callable","./valid-value","./copy","./map","../String/is-string","../String/prototype/contains",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var isCallable = require('./is-callable')
  , callable   = require('./valid-callable')
  , validValue = require('./valid-value')
  , copy       = require('./copy')
  , map        = require('./map')
  , isString   = require('../String/is-string')
  , contains   = require('../String/prototype/contains')

  , bind = Function.prototype.bind
  , defineProperty = Object.defineProperty
  , d;

d = module.exports = function (dscr, value) {
	var c, e, w;
	if (arguments.length < 2) {
		value = dscr;
		dscr = null;
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	return { value: value, configurable: c, enumerable: e, writable: w };
};

d.gs = function (dscr, get, set) {
	var c, e;
	if (isCallable(dscr)) {
		set = (get == null) ? undefined : callable(get);
		get = dscr;
		dscr = null;
	} else {
		get = (get == null) ? undefined : callable(get);
		set = (set == null) ? undefined : callable(set);
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	return { get: get, set: set, configurable: c, enumerable: e };
};

d.binder = function self(name, dv) {
	var value, dgs;
	if (!isString(name)) {
		return map(name, function (dv, name) { return self(name, dv); });
	}
	value = validValue(dv) && callable(dv.value);
	dgs = copy(dv);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		dv.value = bind.call(value, this);
		defineProperty(this, name, dv);
		return this[name];
	};
	return dgs;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"is-callable.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Inspired by: http://www.davidflanagan.com/2009/08/typeof-isfuncti.html

'use strict';

var forEach = Array.prototype.forEach.bind([]);

module.exports = function (obj) {
	var type;
	if (!obj) {
		return false;
	}
	type = typeof obj;
	if (type === 'function') {
		return true;
	}
	if (type !== 'object') {
		return false;
	}

	try {
		forEach(obj);
		return true;
	} catch (e) {
		if (e instanceof TypeError) {
			return false;
		}
		throw e;
	}
};

/////////////////////////////////////////////////////////////////////////////////////////

},"valid-callable.js":["./is-callable",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var isCallable = require('./is-callable');

module.exports = function (fn) {
	if (!isCallable(fn)) {
		throw new TypeError(fn + " is not a function");
	}
	return fn;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"valid-value.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = function (value) {
	if (value == null) {
		throw new TypeError("Cannot use null or undefined");
	}
	return value;
};

/////////////////////////////////////////////////////////////////////////////////////////

},"copy.js":["./is-plain-object","./for-each","./extend","./valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var isPlainObject = require('./is-plain-object')
  , forEach       = require('./for-each')
  , extend        = require('./extend')
  , value         = require('./valid-value')

  , recursive;

recursive = function (to, from, cloned) {
	forEach(from, function (value, key) {
		var index;
		if (isPlainObject(value)) {
			if ((index = cloned[0].indexOf(value)) === -1) {
				cloned[0].push(value);
				cloned[1].push(to[key] = extend({}, value));
				recursive(to[key], value, cloned);
			} else {
				to[key] = cloned[1][index];
			}
		}
	}, from);
};

module.exports = function (obj/*, deep*/) {
	var copy;
	if ((copy = Object(value(obj))) === obj) {
		copy = extend({}, obj);
		if (arguments[1]) {
			recursive(copy, obj, [[obj], [copy]]);
		}
	}
	return copy;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"is-plain-object.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var getPrototypeOf = Object.getPrototypeOf, prototype = Object.prototype
  , toString = prototype.toString

  , id = {}.toString();

module.exports = function (value) {
	var proto;
	if (!value || (typeof value !== 'object') || (toString.call(value) !== id)) {
		return false;
	}
	proto = getPrototypeOf(value);
	return (proto === prototype) || (getPrototypeOf(proto) === null);
};

/////////////////////////////////////////////////////////////////////////////////////////

},"for-each.js":["./_iterate",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = require('./_iterate')('forEach');

/////////////////////////////////////////////////////////////////////////////////////////

}],"_iterate.js":["./is-callable","./valid-callable","./valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var isCallable = require('./is-callable')
  , callable   = require('./valid-callable')
  , value      = require('./valid-value')

  , call = Function.prototype.call, keys = Object.keys;

module.exports = function (method) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort(isCallable(compareFn) ? compareFn.bind(obj) : undefined);
		}
		return list[method](function (key, index) {
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"extend.js":["./valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var value = require('./valid-value')

  , forEach = Array.prototype.forEach, slice = Array.prototype.slice
  , keys = Object.keys

  , extend;

extend = function (src) {
	keys(Object(src)).forEach(function (key) {
		this[key] = src[key];
	}, this);
};

module.exports = function (dest/*, …src*/) {
	forEach.call(arguments, value);
	slice.call(arguments, 1).forEach(extend, dest);
	return dest;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"map.js":["./valid-callable","./for-each",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var callable = require('./valid-callable')
  , forEach  = require('./for-each')

  , call = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var o = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, obj, index) {
		o[key] = call.call(cb, thisArg, value, key, obj, index);
	});
	return o;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"reduce.js":["./is-callable","./valid-callable","./valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var isCallable = require('./is-callable')
  , callable   = require('./valid-callable')
  , value      = require('./valid-value')

  , call = Function.prototype.call, keys = Object.keys;

module.exports = exports = function self(obj, cb/*, initial, compareFn*/) {
	var list, fn, initial, compareFn, initialized;
	value(obj) && callable(cb);

	obj = Object(obj);
	initial = arguments[2];
	compareFn = arguments[3];

	list = keys(obj);
	if (compareFn) {
		list.sort(isCallable(compareFn) ? compareFn.bind(obj) : undefined);
	}

	fn = function (value, key, index) {
		if (initialized) {
			return call.call(cb, undefined, value, obj[key], key, obj, index);
		} else {
			initialized = true;
			return call.call(cb, undefined, obj[value], obj[key], key, obj, index,
				value);
		}
	};

	if ((arguments.length < 3) || (initial === self.NO_INITIAL)) {
		return list.reduce(fn);
	} else {
		initialized = true;
		return list.reduce(fn, initial);
	}
};
exports.NO_INITIAL = {};

/////////////////////////////////////////////////////////////////////////////////////////

}],"is.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Implementation credits go to:
// http://wiki.ecmascript.org/doku.php?id=harmony:egal

'use strict';

module.exports = function (x, y) {
	return (x === y) ?
			((x !== 0) || ((1 / x) === (1 / y))) :
			((x !== x) && (y !== y)); //jslint: skip
};

/////////////////////////////////////////////////////////////////////////////////////////

},"is-empty.js":["./valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Object/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var value = require('./valid-value');

module.exports = function (obj) {
	var i;
	value(obj);
	for (i in obj) { //jslint: skip
		if (obj.propertyIsEnumerable(i)) return false;
	}
	return true;
};

/////////////////////////////////////////////////////////////////////////////////////////

}]},"String":{"is-string.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/String/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

/////////////////////////////////////////////////////////////////////////////////////////

},"prototype":{"contains.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/String/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

/////////////////////////////////////////////////////////////////////////////////////////

},"repeat.js":["../../Object/valid-value","../../Number/to-uint",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/String/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Not rocket science but taken from:
// http://closure-library.googlecode.com/svn/trunk/closure/goog/string/string.js

'use strict';

var value  = require('../../Object/valid-value')
  , toUint = require('../../Number/to-uint');

module.exports = function (n) {
	return new Array((isNaN(n) ? 1 : toUint(n)) + 1).join(String(value(this)));
};

/////////////////////////////////////////////////////////////////////////////////////////

}]}},"Number":{"to-uint.js":["./to-int",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Number/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var toInt = require('./to-int')

  , max = Math.max;

module.exports = function (value) { return max(0, toInt(value)); };

/////////////////////////////////////////////////////////////////////////////////////////

}],"to-int.js":["../Math/sign",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Number/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var sign = require('../Math/sign')

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) {
		return 0;
	}
	value = Number(value);
	if ((value === 0) || !isFinite(value)) {
		return value;
	}

	return sign(value) * floor(abs(value));
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"is-nan.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Number/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = function (value) {
	return (value !== value); //jslint: skip
};

/////////////////////////////////////////////////////////////////////////////////////////

},"is-number.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Number/ //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(1);

module.exports = function (x) {
	return ((typeof x === 'number') ||
		((x instanceof Number) ||
			((typeof x === 'object') && (toString.call(x) === id))));
};

/////////////////////////////////////////////////////////////////////////////////////////

}},"Math":{"sign.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Math/si //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) {
		return value;
	}
	return (value > 0) ? 1 : -1;
};

/////////////////////////////////////////////////////////////////////////////////////////

}},"Error":{"custom.js":["../Object/descriptor","../Object/extend",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Error/c //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var d      = require('../Object/descriptor')
  , extend = require('../Object/extend')

  , captureStackTrace = Error.captureStackTrace
  , CustomError;

CustomError = module.exports = function CustomError(message, code/*, ext*/) {
	var ext = arguments[2];
	if (ext != null) extend(this, ext);
	this.message = String(message);
	if (code != null) this.code = String(code);
	if (captureStackTrace) captureStackTrace(this, CustomError);
};

CustomError.prototype = Object.create(Error.prototype, {
	constructor: d(CustomError),
	name: d('CustomError')
});

/////////////////////////////////////////////////////////////////////////////////////////

}]},"Array":{"prototype":{"e-index-of.js":["../../Number/is-nan","../../Object/is","../../Object/valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Array/p //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var numIsNaN = require('../../Number/is-nan')
  , ois      = require('../../Object/is')
  , value    = require('../../Object/valid-value')

  , indexOf = Array.prototype.indexOf;

module.exports = function (searchElement/*, fromIndex*/) {
	var i;
	if (!numIsNaN(searchElement) && (searchElement !== 0)) {
		return indexOf.apply(this, arguments);
	}

	for (i = (arguments[1] >>> 0); i < (value(this).length >>> 0); ++i) {
		if (this.hasOwnProperty(i) && ois(searchElement, this[i])) {
			return i;
		}
	}
	return -1;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"last.js":["./last-index",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Array/p //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var lastIndex = require('./last-index');

module.exports = function () {
	var i;
	if ((i = lastIndex.call(this)) !== null) {
		return this[i];
	}
	return undefined;
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"last-index.js":["../../Object/valid-value",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Array/p //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var value = require('../../Object/valid-value');

module.exports = function () {
	var i, l;
	if (!(l = (value(this).length >>> 0))) {
		return null;
	}
	i = l - 1;
	while (!this.hasOwnProperty(i)) {
		if (--i === -1) {
			return null;
		}
	}
	return i;
};

/////////////////////////////////////////////////////////////////////////////////////////

}]},"from.js":["../Function/is-arguments",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Array/f //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var isArguments   = require('../Function/is-arguments')

  , isArray = Array.isArray, slice = Array.prototype.slice;

module.exports = function (obj) {
	if (isArray(obj)) {
		return obj;
	} else if (isArguments(obj)) {
		return (obj.length === 1) ? [obj[0]] : Array.apply(null, obj);
	} else {
		return slice.call(obj);
	}
};

/////////////////////////////////////////////////////////////////////////////////////////

}]},"Function":{"is-arguments.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/Functio //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var toString = Object.prototype.toString

  , id = toString.call((function () { return arguments; }()));

module.exports = function (x) {
	return toString.call(x) === id;
};

/////////////////////////////////////////////////////////////////////////////////////////

}},"global.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/es5-ext/lib/global. //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = new Function("return this")();

/////////////////////////////////////////////////////////////////////////////////////////

}}},"memoizee":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// ../npm/node_modules/cli-color/node_modules/memoizee/package.json                    //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
exports.name = "memoizee";
exports.version = "0.2.5";
exports.main = "lib";

/////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"index.js":["./regular","./primitive","./ext/dispose","./ext/resolvers","./ext/async","./ext/ref-counter","./ext/method","./ext/max-age","./ext/max",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/index. //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Provides memoize with all options

'use strict';

var regular   = require('./regular')
  , primitive = require('./primitive')

  , call = Function.prototype.call;

// Order is significant!
require('./ext/dispose');
require('./ext/resolvers');
require('./ext/async');
require('./ext/ref-counter');
require('./ext/method');
require('./ext/max-age');
require('./ext/max');

module.exports = function (fn/* options */) {
	var options = Object(arguments[1]);
	return call.call(options.primitive ? primitive : regular, this, fn, options);
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"regular.js":["es5-ext/lib/Error/custom","es5-ext/lib/Array/prototype/e-index-of","event-emitter/lib/has-listeners","./_base",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/regula //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Memoize working in object mode (supports any type of arguments)

'use strict';

var CustomError  = require('es5-ext/lib/Error/custom')
  , indexOf      = require('es5-ext/lib/Array/prototype/e-index-of')
  , hasListeners = require('event-emitter/lib/has-listeners')

  , apply = Function.prototype.apply;

// Results are saved internally within array matrix:
// [0] -> Result of calling function with no arguments
// [1] -> Matrix that keeps results when function is called with one argument
//        [1][0] -> Array of arguments with which
//                 function have been called
//        [1][1] -> Array of results that matches [1][0] array
// [2] -> Matrix that keeps results when function is called with two arguments
//        [2][0] -> Array of first (of two) arguments with which
//                function have been called
//        [2][1] -> Matrixes that keeps results for two arguments function calls
//                  Each matrix matches first argument found in [2][0]
//                  [2][1][x][0] -> Array of second arguments with which
//                                  function have been called.
//                  [2][1][x][1] -> Array of results that matches [2][1][x][0]
//                                   arguments array
// ...and so on
module.exports = require('./_base')(function (conf, length) {
	var map, map1, map2, get, set, clear, count, fn
	  , hitListeners, initListeners, purgeListeners
	  , cache = conf.cache = {}, argsCache;

	if (length === 0) {
		map = null;
		get = conf.get = function () { return map; };
		set = function () { return ((map = 1)); };
		clear = function () { map = null; };
		conf.clearAll = function () {
			map = null;
			cache = conf.cache = {};
		};
	} else {
		count = 0;
		if (length === 1) {
			map1 = [];
			map2 = [];
			get = conf.get = function (args) {
				var index = indexOf.call(map1, args[0]);
				return (index === -1) ? null : map2[index];
			};
			set = function (args) {
				map1.push(args[0]);
				map2.push(++count);
				return count;
			};
			clear = function (id) {
				var index = indexOf.call(map2, id);
				if (index !== -1) {
					map1.splice(index, 1);
					map2.splice(index, 1);
				}
			};
			conf.clearAll = function () {
				map1 = [];
				map2 = [];
				cache = conf.cache = {};
			};
		} else if (length === false) {
			map = [];
			argsCache = {};
			get = conf.get = function (args) {
				var index = 0, set = map, i, length = args.length;
				if (length === 0) {
					return set[length] || null;
				} else if ((set = set[length])) {
					while (index < (length - 1)) {
						i = indexOf.call(set[0], args[index]);
						if (i === -1) return null;
						set = set[1][i];
						++index;
					}
					i = indexOf.call(set[0], args[index]);
					if (i === -1) return null;
					return set[1][i] || null;
				}
				return null;
			};
			set = function (args) {
				var index = 0, set = map, i, length = args.length;
				if (length === 0) {
					set[length] = ++count;
				} else {
					if (!set[length]) {
						set[length] = [[], []];
					}
					set = set[length];
					while (index < (length - 1)) {
						i = indexOf.call(set[0], args[index]);
						if (i === -1) {
							i = set[0].push(args[index]) - 1;
							set[1].push([[], []]);
						}
						set = set[1][i];
						++index;
					}
					i = indexOf.call(set[0], args[index]);
					if (i === -1) {
						i = set[0].push(args[index]) - 1;
					}
					set[1][i] = ++count;
				}
				argsCache[count] = args;
				return count;
			};
			clear = function (id) {
				var index = 0, set = map, i, args = argsCache[id], length = args.length
				  , path = [];
				if (length === 0) {
					delete set[length];
				} else if ((set = set[length])) {
					while (index < (length - 1)) {
						i = indexOf.call(set[0], args[index]);
						if (i === -1) {
							return;
						}
						path.push(set, i);
						set = set[1][i];
						++index;
					}
					i = indexOf.call(set[0], args[index]);
					if (i === -1) {
						return;
					}
					id = set[1][i];
					set[0].splice(i, 1);
					set[1].splice(i, 1);
					while (!set[0].length && path.length) {
						i = path.pop();
						set = path.pop();
						set[0].splice(i, 1);
						set[1].splice(i, 1);
					}
				}
				delete argsCache[id];
			};
			conf.clearAll = function () {
				map = [];
				cache = conf.cache = {};
				argsCache = {};
			};
		} else {
			map = [[], []];
			argsCache = {};
			get = conf.get = function (args) {
				var index = 0, set = map, i;
				while (index < (length - 1)) {
					i = indexOf.call(set[0], args[index]);
					if (i === -1) return null;
					set = set[1][i];
					++index;
				}
				i = indexOf.call(set[0], args[index]);
				if (i === -1) return null;
				return set[1][i] || null;
			};
			set = function (args) {
				var index = 0, set = map, i;
				while (index < (length - 1)) {
					i = indexOf.call(set[0], args[index]);
					if (i === -1) {
						i = set[0].push(args[index]) - 1;
						set[1].push([[], []]);
					}
					set = set[1][i];
					++index;
				}
				i = indexOf.call(set[0], args[index]);
				if (i === -1) {
					i = set[0].push(args[index]) - 1;
				}
				set[1][i] = ++count;
				argsCache[count] = args;
				return count;
			};
			clear = function (id) {
				var index = 0, set = map, i, path = [], args = argsCache[id];
				while (index < (length - 1)) {
					i = indexOf.call(set[0], args[index]);
					if (i === -1) {
						return;
					}
					path.push(set, i);
					set = set[1][i];
					++index;
				}
				i = indexOf.call(set[0], args[index]);
				if (i === -1) {
					return;
				}
				id = set[1][i];
				set[0].splice(i, 1);
				set[1].splice(i, 1);
				while (!set[0].length && path.length) {
					i = path.pop();
					set = path.pop();
					set[0].splice(i, 1);
					set[1].splice(i, 1);
				}
				delete argsCache[id];
			};
			conf.clearAll = function () {
				map = [[], []];
				cache = conf.cache = {};
				argsCache = {};
			};
		}
	}
	conf.memoized = function () {
		var id = get(arguments), value;
		if (id != null) {
			hitListeners && conf.emit('hit', id, arguments, this);
			return cache[id];
		} else {
			value = apply.call(fn, this, arguments);
			id = get(arguments);
			if (id != null) {
				throw new CustomError("Circular invocation", 'CIRCULAR_INVOCATION');
			}
			id = set(arguments);
			cache[id] = value;
			initListeners && conf.emit('init', id);
			return value;
		}
	};
	conf.clear = function (id) {
		if (cache.hasOwnProperty(id)) {
			purgeListeners && conf.emit('purge', id);
			clear(id);
			delete cache[id];
		}
	};

	conf.once('ready', function () {
		fn = conf.fn;
		hitListeners = hasListeners(conf, 'hit');
		initListeners = hasListeners(conf, 'init');
		purgeListeners = hasListeners(conf, 'purge');
	});
});

/////////////////////////////////////////////////////////////////////////////////////////

}],"_base.js":["es5-ext/lib/Object/valid-callable","es5-ext/lib/Object/for-each","event-emitter/lib/core",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/_base. //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// To be used internally, memoize factory

'use strict';

var callable = require('es5-ext/lib/Object/valid-callable')
  , forEach  = require('es5-ext/lib/Object/for-each')
  , ee       = require('event-emitter/lib/core')

  , ext;

module.exports = exports = function (core) {
	return function self(fn/*, options */) {
		var options, length, get, clear, conf;

		callable(fn);
		if (fn.memoized) {
			// Do not memoize already memoized function
			return fn;
		}

		options = Object(arguments[1]);
		conf = ee({ memoize: self, fn: fn });

		// Normalize length
		if (isNaN(options.length)) {
			length = fn.length;
			// Special case
			if (options.async && ext.async) {
				--length;
			}
		} else {
			length = (options.length === false) ? false : (options.length >>> 0);
		}

		core(conf, length);

		forEach(ext, function (fn, name) {
			if (fn.force) {
				fn(conf, options);
			} else if (options[name]) {
				fn(options[name], conf, options);
			}
		});

		fn = conf.fn;
		get = conf.get;
		clear = conf.clear;

		conf.memoized.clear = function () { clear(get(arguments)); };
		conf.memoized.clearAll = function () {
			conf.emit('purgeall');
			conf.clearAll();
		};
		conf.memoized.memoized = true;
		conf.emit('ready');
		return conf.memoized;
	};
};
ext = exports.ext = {};

/////////////////////////////////////////////////////////////////////////////////////////

}],"primitive.js":["es5-ext/lib/Error/custom","event-emitter/lib/has-listeners","./_base",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/primit //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Memoize working in primitive mode

'use strict';

var CustomError  = require('es5-ext/lib/Error/custom')
  , hasListeners = require('event-emitter/lib/has-listeners')

  , getId0 = function () { return ''; }
  , getId1 = function (args) { return args[0]; }

  , apply = Function.prototype.apply, call = Function.prototype.call;

module.exports = require('./_base')(function (conf, length) {
	var get, cache = conf.cache = {}, fn
	  , hitListeners, initListeners, purgeListeners;

	if (length === 1) {
		get = conf.get = getId1;
	} else if (length === false) {
		get = conf.get = function (args) {
			var id = '', i, length = args.length;
			if (length) {
				id += args[i = 0];
				while (--length) {
					id += '\u0001' + args[++i];
				}
			} else {
				id = '\u0002';
			}
			return id;
		};
	} else if (length) {
		get = conf.get = function (args) {
			var id = String(args[0]), i = 0, l = length;
			while (--l) { id += '\u0001' + args[++i]; }
			return id;
		};
	} else {
		get = conf.get = getId0;
	}

	conf.memoized = (length === 1) ? function (id) {
		var value;
		if (cache.hasOwnProperty(id)) {
			hitListeners && conf.emit('hit', id, arguments, this);
			return cache[id];
		} else {
			if (arguments.length === 1) {
				value = call.call(fn, this, id);
			} else {
				value = apply.call(fn, this, arguments);
			}
			if (cache.hasOwnProperty(id)) {
				throw new CustomError("Circular invocation", 'CIRCULAR_INVOCATION');
			}
			cache[id] = value;
			initListeners && conf.emit('init', id);
			return value;
		}
	} : function () {
		var id = get(arguments), value;
		if (cache.hasOwnProperty(id)) {
			hitListeners && conf.emit('hit', id, arguments, this);
			return cache[id];
		} else {
			value = apply.call(conf.fn, this, arguments);
			if (cache.hasOwnProperty(id)) {
				throw new CustomError("Circular invocation", 'CIRCULAR_INVOCATION');
			}
			cache[id] = value;
			initListeners && conf.emit('init', id);
			return value;
		}
	};

	conf.clear = function (id) {
		if (cache.hasOwnProperty(id)) {
			purgeListeners && conf.emit('purge', id);
			delete cache[id];
		}
	};
	conf.clearAll = function () { cache = conf.cache = {}; };

	conf.once('ready', function () {
		fn = conf.fn;
		hitListeners = hasListeners(conf, 'hit');
		initListeners = hasListeners(conf, 'init');
		purgeListeners = hasListeners(conf, 'purge');
	});
});

/////////////////////////////////////////////////////////////////////////////////////////

}],"ext":{"dispose.js":["es5-ext/lib/Object/valid-callable","es5-ext/lib/Object/for-each","../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/di //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Call dispose callback on each cache purge

'use strict';

var callable = require('es5-ext/lib/Object/valid-callable')
  , forEach  = require('es5-ext/lib/Object/for-each')
  , ext      = require('../_base').ext

  , slice = Array.prototype.slice;

ext.dispose = function (dispose, conf, options) {
	var clear, async;

	callable(dispose);

	async = (options.async && ext.async);
	conf.on('purge' + (async ? 'async' : ''), clear =  async ? function (id) {
		var value = conf.async[id];
		delete conf.cache[id];
		dispose.apply(conf.memoized['_memoize:context_'], slice.call(value, 1));
	} : function (id) {
		var value = conf.cache[id];
		delete conf.cache[id];
		dispose.call(conf.memoized['_memoize:context_'], value);
	});

	if (!async) {
		conf.on('purgeall', function () {
			forEach(conf.cache, function (value, id) { clear(id); });
		});
	}
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"resolvers.js":["es5-ext/lib/Array/from","es5-ext/lib/Object/for-each","es5-ext/lib/Object/valid-callable","../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/re //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Normalize arguments before passing them to underlying function

'use strict';

var toArray    = require('es5-ext/lib/Array/from')
  , forEach    = require('es5-ext/lib/Object/for-each')
  , callable   = require('es5-ext/lib/Object/valid-callable')

  , slice = Array.prototype.slice

  , resolve;

resolve = function (args) {
	return this.map(function (r, i) {
		return r ? r(args[i]) : args[i];
	}).concat(slice.call(args, this.length));
};

require('../_base').ext.resolvers = function (resolvers, conf) {
	var resolver;

	resolver = toArray(resolvers);
	resolver.forEach(function (r) { (r == null) || callable(r); });
	resolver = resolve.bind(resolver);

	(function (fn) {
		conf.memoized = function () {
			var value;
			conf.memoized.args = arguments;
			value = fn.apply(this, resolver(arguments));
			delete conf.memoized.args;
			return value;
		};
		forEach(fn, function (value, name) {
			conf.memoized[name] = function () {
				return fn[name].apply(this, resolver(arguments));
			};
		});
	}(conf.memoized));
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"async.js":["es5-ext/lib/Array/from","es5-ext/lib/Array/prototype/last","es5-ext/lib/Object/for-each","es5-ext/lib/Object/is-callable","next-tick","../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/as //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Support for asynchronous functions

'use strict';

var toArray    = require('es5-ext/lib/Array/from')
  , last       = require('es5-ext/lib/Array/prototype/last')
  , forEach    = require('es5-ext/lib/Object/for-each')
  , isCallable = require('es5-ext/lib/Object/is-callable')
  , nextTick   = require('next-tick')

  , isArray = Array.isArray, slice = Array.prototype.slice
  , apply = Function.prototype.apply;

require('../_base').ext.async = function (ignore, conf) {
	var cache, purge;

	cache = conf.async = {};

	(function (org) {
		var value, cb, initContext, initArgs, fn, resolver;

		conf.on('init', function (id) {
			value.id = id;
			cache[id] = cb ? [cb] : [];
		});

		conf.on('hit', function (id, syncArgs, syncCtx) {
			if (!cb) {
				return;
			}

			if (isArray(cache[id])) {
				cache[id].push(cb);
			} else {
				nextTick(function (cb, id, ctx, args) {
					if (cache[id]) {
						conf.emit('hitasync', id, syncArgs, syncCtx);
						apply.call(cb, this.context, this);
					} else {
						// Purged in a meantime, we shouldn't rely on cached value, recall
						fn.apply(ctx, args);
					}
				}.bind(cache[id], cb, id, initContext, initArgs));
				initContext = initArgs = null;
			}
		});
		conf.fn = function () {
			var args, asyncArgs;
			args = arguments;
			asyncArgs = toArray(args);
			asyncArgs.push(value = function self(err) {
				var i, cb, waiting, res;
				if (self.id == null) {
					// Shouldn't happen, means async callback was called sync way
					nextTick(apply.bind(self, this, arguments));
					return;
				}
				waiting = cache[self.id];
				if (conf.cache.hasOwnProperty(self.id)) {
					if (err) {
						delete cache[self.id];
						conf.clear(self.id);
					} else {
						arguments.context = this;
						cache[self.id] = arguments;
						conf.emit('initasync', self.id, waiting.length);
					}
				} else {
					delete cache[self.id];
				}
				for (i = 0; (cb = waiting[i]); ++i) {
					res = apply.call(cb, this, arguments);
				}
				return res;
			});
			return apply.call(org, this, asyncArgs);
		};

		fn = conf.memoized;
		resolver = function (args) {
			cb = last.call(args);
			if (isCallable(cb)) {
				return slice.call(args, 0, -1);
			} else {
				cb = null;
				return args;
			}
		};
		conf.memoized = function () {
			return fn.apply(initContext = this, initArgs = resolver(arguments));
		};
		forEach(fn, function (value, name) {
			conf.memoized[name] = function () {
				return fn[name].apply(this, resolver(arguments));
			};
		});

	}(conf.fn));

	conf.on('purge', purge = function (id) {
		// If false, we don't have value yet, so we assume that intention is not
		// to memoize this call. After value is obtained we don't cache it but
		// gracefully pass to callback
		if (!isArray(cache[id])) {
			conf.emit('purgeasync', id);
			delete cache[id];
		}
	});

	conf.on('purgeall', function () {
		forEach(conf.async, function (value, id) { purge(id); });
	});
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"ref-counter.js":["../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/re //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Reference counter, useful for garbage collector like functionality

'use strict';

var ext = require('../_base').ext;

ext.refCounter = function (ignore, conf, options) {
	var cache, async;

	cache = {};
	async = options.async && ext.async;

	conf.on('init' + (async ? 'async' : ''), async ? function (id, length) {
		cache[id] = length;
	} : function (id) { cache[id] = 1; });
	conf.on('hit' + (async ? 'async' : ''), function (id) { ++cache[id]; });
	conf.on('purge' + (async ? 'async' : ''), function (id) {
		delete cache[id];
	});
	if (!async) {
		conf.on('purgeall', function () { cache = {}; });
	}

	conf.memoized.clearRef = function () {
		var id = conf.get(arguments);
		if (cache.hasOwnProperty(id)) {
			if (!--cache[id]) {
				conf.clear(id);
				return true;
			}
			return false;
		}
		return null;
	};
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"method.js":["es5-ext/lib/Object/descriptor","es5-ext/lib/global","es5-ext/lib/Object/extend","es5-ext/lib/String/is-string","../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/me //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Memoized methods factory

'use strict';

var d        = require('es5-ext/lib/Object/descriptor')
  , global   = require('es5-ext/lib/global')
  , extend   = require('es5-ext/lib/Object/extend')
  , isString = require('es5-ext/lib/String/is-string')

  , create = Object.create, defineProperty = Object.defineProperty;

require('../_base').ext.method = function (method, conf, options) {
	if (isString(options.method)) {
		method = { name: String(options.method),
			descriptor: { configurable: true, writable: true } };
	} else {
		method = options.method;
		method.name = String(method.name);
		method.descriptor = (method.descriptor == null) ?
				{ configurable: true, writable: true } : Object(method.descriptor);
	}
	options = create(options);
	options.method = undefined;

	(function (fn) {
		conf.memoized = function () {
			var memoized;
			if (this && (this !== global)) {
				memoized = method.descriptor.value =
					conf.memoize(conf.fn.bind(this), options);
				defineProperty(this, method.name, method.descriptor);
				defineProperty(memoized, '_memoize:context_', d(this));
				return memoized.apply(this, arguments);
			}
			return fn.apply(this, arguments);
		};
		extend(conf.memoized, fn);
	}(conf.memoized));
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"max-age.js":["es5-ext/lib/Number/is-number","es5-ext/lib/Object/for-each","next-tick","../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/ma //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Timeout cached values

'use strict';

var isNumber = require('es5-ext/lib/Number/is-number')
  , forEach  = require('es5-ext/lib/Object/for-each')
  , nextTick = require('next-tick')
  , ext      = require('../_base').ext

  , max = Math.max, min = Math.min;

ext.maxAge = function (maxAge, conf, options) {
	var cache, async, preFetchAge, preFetchCache;

	maxAge = maxAge >>> 0;
	if (!maxAge) {
		return;
	}

	cache = {};
	async = options.async && ext.async;
	conf.on('init' + (async ? 'async' : ''), function (id) {
		cache[id] = setTimeout(function () { conf.clear(id); }, maxAge);
		if (preFetchCache) {
			preFetchCache[id] = setTimeout(function () { delete preFetchCache[id]; },
				preFetchAge);
		}
	});
	conf.on('purge' + (async ? 'async' : ''), function (id) {
		clearTimeout(cache[id]);
		if (preFetchCache && preFetchCache[id]) {
			clearTimeout(preFetchCache[id]);
			delete preFetchCache[id];
		}
		delete cache[id];
	});

	if (options.preFetch) {
		if (isNumber(options.preFetch)) {
			preFetchAge = max(min(Number(options.preFetch), 1), 0);
		} else {
			preFetchAge = 0.333;
		}
		if (preFetchAge) {
			preFetchCache = {};
			preFetchAge = (1 - preFetchAge) * maxAge;
			conf.on('hit' + (async ? 'async' : ''), function (id, args, ctx) {
				if (!preFetchCache[id]) {
					preFetchCache[id] = true;
					nextTick(function () {
						if (preFetchCache[id] === true) {
							delete preFetchCache[id];
							conf.clear(id);
							conf.memoized.apply(ctx, args);
						}
					});
				}
			});
		}
	}

	if (!async) {
		conf.on('purgeall', function () {
			forEach(cache, function (id) {
				clearTimeout(id);
			});
			cache = {};
			if (preFetchCache) {
				forEach(preFetchCache, function (id) {
					clearTimeout(id);
				});
				preFetchCache = {};
			}
		});
	}
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"max.js":["../_base",function(require){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/lib/ext/ma //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
// Limit cache size, LRU (least recently used) algorithm.

'use strict';

var ext = require('../_base').ext;

ext.max = function (max, conf, options) {
	var index, base, size, queue, map, async;

	max = max >>> 0;
	if (!max) {
		return;
	}

	index = -1;
	base = size = 0;
	queue = {};
	map = {};
	async = options.async && ext.async;

	conf.on('init' + (async ? 'async' : ''), function (id) {
		queue[++index] = id;
		map[id] = index;
		++size;
		if (size > max) {
			conf.clear(queue[base]);
		}
	});

	conf.on('hit' + (async ? 'async' : ''), function (id) {
		var oldIndex = map[id];
		queue[++index] = id;
		map[id] = index;
		delete queue[oldIndex];
		if (base === oldIndex) {
			while (!queue.hasOwnProperty(++base)) continue; //jslint: skip
		}
	});

	conf.on('purge' + (async ? 'async' : ''), function (id) {
		var oldIndex = map[id];
		delete queue[oldIndex];
		--size;
		if (base === oldIndex) {
			if (!size) {
				index = -1;
				base = 0;
			} else {
				while (!queue.hasOwnProperty(++base)) continue; //jslint: skip
			}
		}
	});

	if (!async) {
		conf.on('purgeall', function () {
			index = -1;
			base = size = 0;
			queue = {};
			map = {};
		});
	}
};

/////////////////////////////////////////////////////////////////////////////////////////

}]}},"node_modules":{"event-emitter":{"lib":{"has-listeners.js":["es5-ext/lib/Object/is-empty","es5-ext/lib/Object/valid-value","./_id",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/node_modul //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var isEmpty = require('es5-ext/lib/Object/is-empty')
  , value   = require('es5-ext/lib/Object/valid-value')
  , id      = require('./_id');

module.exports = function (obj/*, type*/) {
	var type;
	value(obj);
	type = arguments[1];
	if (arguments.length > 1) {
		return obj.hasOwnProperty(id) && obj[id].hasOwnProperty(type);
	} else {
		return obj.hasOwnProperty(id) && !isEmpty(obj[id]);
	}
};

/////////////////////////////////////////////////////////////////////////////////////////

}],"_id.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/node_modul //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

module.exports = '_ee2_';

/////////////////////////////////////////////////////////////////////////////////////////

},"core.js":["es5-ext/lib/Object/descriptor","es5-ext/lib/Object/valid-callable","./_id",function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/node_modul //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

var d        = require('es5-ext/lib/Object/descriptor')
  , callable = require('es5-ext/lib/Object/valid-callable')
  , id       = require('./_id')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit
  , colId, methods, descriptors, base;

colId = id + 'l_';

on = function (type, listener) {
	var data;

	callable(listener);

	if (!this.hasOwnProperty(id)) {
		data = descriptor.value = {};
		defineProperty(this, id, descriptor);
		descriptor.value = null;
	} else {
		data = this[id];
	}
	if (!data.hasOwnProperty(type)) data[type] = listener;
	else if (data[type].hasOwnProperty(colId)) data[type].push(listener);
	else (data[type] = [data[type], listener])[colId] = true;

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once._listener = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!this.hasOwnProperty(id)) return this;
	data = this[id];
	if (!data.hasOwnProperty(type)) return this;
	listeners = data[type];

	if (listeners.hasOwnProperty(colId)) {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) || (candidate._listener === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) || (listeners._listener === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var data, i, l, listener, listeners, args;

	if (!this.hasOwnProperty(id)) return;
	data = this[id];
	if (!data.hasOwnProperty(type)) return;
	listeners = data[type];

	if (listeners.hasOwnProperty(colId)) {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) {
			args[i - 1] = arguments[i];
		}

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

/////////////////////////////////////////////////////////////////////////////////////////

}]}},"next-tick":{"package.json":function(require,exports){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// ../npm/node_modules/cli-color/node_modules/memoizee/node_modules/next-tick/package. //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
exports.name = "next-tick";
exports.version = "0.1.0";
exports.main = "lib/next-tick";

/////////////////////////////////////////////////////////////////////////////////////////

},"lib":{"next-tick.js":function(require,exports,module){

/////////////////////////////////////////////////////////////////////////////////////////
//                                                                                     //
// node_modules/meteor/logging/node_modules/cli-color/node_modules/memoizee/node_modul //
//                                                                                     //
/////////////////////////////////////////////////////////////////////////////////////////
                                                                                       //
'use strict';

if ((typeof process !== 'undefined') && process &&
		(typeof process.nextTick === 'function')) {

	// Node.js
	module.exports = process.nextTick;

} else if (typeof setImmediate === 'function') {

	// W3C Draft
	// https://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	module.exports = function (cb) { setImmediate(cb); };

} else {

	// Wide available standard
	module.exports = function (cb) { setTimeout(cb, 0); };
}

/////////////////////////////////////////////////////////////////////////////////////////

}}}}}}}}}}}},{"extensions":[".js",".json"]});
require("./node_modules/meteor/logging/logging.js");

/* Exports */
if (typeof Package === 'undefined') Package = {};
(function (pkg, symbols) {
  for (var s in symbols)
    (s in pkg) || (pkg[s] = symbols[s]);
})(Package.logging = {}, {
  Log: Log
});

})();

//# sourceMappingURL=logging.js.map
