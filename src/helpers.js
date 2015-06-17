/**
binds a function to a context

@method bind
@param {Function} func
@param {Object} context
@return {Function}
@private
**/
var bind = function (func, context) {
  return function () {
    func.apply(context, Array.prototype.slice.call(arguments));
  };
};

/**
@method each
@param {Array} arr
@param {Function} iterator
@private
**/
var each = function (arr, iterator, context) {
  context = context || this;

  for (var i = 0, len = arr.length; i < len; i++) {
    iterator.call(context, arr[i], i);
  }
};

/**
@method merge
@return {Object}
@private
**/
var merge = function () {
  var result = {},
      arr = Array.prototype.slice.call(arguments, 0);

  each(arr, function (obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = obj[key];
      }
    }
  });

  return result;
};

/**
@method addEvent
@param {Any} host
@param {String} eventName
@param {Function} handler
@param {Any} [context]
@private
**/
var addEvent = function (host, eventName, handler, context) {
  host.addEventListener(eventName, bind(handler, context), false);
};

/**
@method isArray
@param {Object} o
@return {Boolean}
@private
**/
var isArray = function (o) {
  return Array.isArray(o);
};

/**
@method isPlainObject
@param {any} val
@return {Boolean}
@private
**/
var isPlainObject = function (val) {
  return (!!val) && (val.constructor === Object);
};

/**
@method isString
@param {Any} val
@return {Boolean}
@private
**/
var isString = function (val) {
  return typeof val === 'string';
};

/**
@method parseURI
@param {string} str
@return {object}
@private
By Steven Levithan, MIT License, http://blog.stevenlevithan.com/archives/parseuri
**/
var parseURI = function (str) {
  var	o   = parseURI.options,
  m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
  uri = {},
  i   = 14;

  while (i--) uri[o.key[i]] = m[i] || "";

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
    if ($1) uri[o.q.name][$1] = $2;
  });

  return uri;
};
parseURI.options = {
  strictMode: false,
  key: ["source","protocol","authority","userInfo","username","password","host","port","relative","pathname","directory","file","search","anchor"],
  q:   {
    name:   "queryKey",
    parser: /(?:^|&)([^&=]*)=?([^&]*)/g
  },
  parser: {
    strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
    loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
  }
};

module.exports = {
  bind: bind,
  each: each,
  merge: merge,
  addEvent: addEvent,
  isArray: isArray,
  isPlainObject: isPlainObject,
  isString: isString,
  parseURI: parseURI
};
