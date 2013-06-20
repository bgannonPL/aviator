(function () {

  // Convienience aliases
  var location  = window.location,
      history   = window.history;

  // -- Utility ---------------------------------------------------------------

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
  **/
  var merge = function () {
    var result = {},
        arr = Array.prototype.slice.call(arguments, 0);

    each(arr, function (obj) {
      for (var key in obj) {
        result[key] = obj[key];
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
  **/
  var addEvent = function (host, eventName, handler, context) {
    host.addEventListener(eventName, handler.bind(context), false);
  };

  /**
  @method isPlainObject
  @param {any} val
  @return {Boolean}
  **/
  var isPlainObject = function (val) {
    return (!!val) && (val.constructor === Object);
  };

  /**
  @method isString
  @param {Any} val
  @return {Boolean}
  **/
  var isString = function (val) {
    return typeof val === 'string';
  };

  // -- Internal API ----------------------------------------------------------

  /**
  @class Request
  @constructor
  **/
  var Request = function (options) {
    this.namedParams  = {};
    this.queryParams  = {};
    this.params       = {};

    this.uri          = options.uri;
    this.queryString  = options.queryString;
    this.matchedRoute = options.matchedRoute;

    this._extractNamedParamsFromURI();
    this._extractQueryParamsFromQueryString();
    this._mergeParams();
  };

  Request.prototype = {
    /**
    @method _extractNamedParamsFromURI
    @private
    **/
    _extractNamedParamsFromURI: function () {
      var uriParts = this.uri.split('/'),
          routeParts = this.matchedRoute.split('/'),
          params = {};

      each(routeParts, function (part, i) {
        var key;

        if (part.indexOf(':') === 0) {
          key = part.replace(':', '');

          params[key] = uriParts[i];
        }
      });

      this.namedParams = params;
    },

    /**
    Splits the query string by '&'. Splits each part by '='.
    Passes the key and value for each part to _applyQueryParam

    @method _extractQueryParamsFromQueryString
    @private
    **/
    _extractQueryParamsFromQueryString: function () {
      var parts;

      if (!this.queryString) return;

      parts = this.queryString.replace('?','').split('&');

      each(parts, function (part) {
        var key = part.split('=')[0],
            val = part.split('=')[1];

        if ( part.indexOf( '=' ) === -1 ) return;
        this._applyQueryParam( key, val );

      }, this);

    },

    /**
    Update the queryParams property with a new key and value.
    Values for keys with the [] notation are put into arrays
    or pushed into an existing array for that key.

    @method _applyQueryParam
    @param {String} key
    @param {String} val
    **/
    _applyQueryParam: function (key, val) {
      if ( key.indexOf( '[]' ) !== -1 ) {
        key = key.replace( '[]', '' );

        if ( this.queryParams[key] instanceof Array ) {
          this.queryParams[key].push(val);
        } else {
          this.queryParams[key] = [ val ];
        }
      }
      else {
        this.queryParams[key] = val;
      }
    },

    /**
    @method _mergeParams
    @private
    **/
    _mergeParams: function () {
      this.params = merge(this.namedParams, this.queryParams);
    }
  };

  /**
  Contains the properties for a route
  After attempting to match a uri to the Routes map

  @class Route
  @constructor
  @private
  **/
  var Route = function (routes, uri) {
    this.uri          = uri;
    this.matchedRoute = '';
    this.actions      = [];
    this.options      = {};

    this.match(routes);

    this.uri = uri;
  };

  Route.prototype = {

    /**
    Matches the uri from the routes map.

    @method match
    @param {String} routeLevel
    @return {Object}
    **/
    match: function (routeLevel) {
      var value,
          action = {
            target: routeLevel.target,
            method:    null
          };

      for (var key in routeLevel) {
        value = routeLevel[key];

        if (this.isFragment(key) && this.isFragmentInURI(key)) {
          this.updateMatchedRoute(key);
          this.updateURI(key);

          if (this.isActionDescriptor(value)) {
            if (isString(value)) {
              action.method = value;
            }
            else {
              action.method = value.method;
              this.mergeOptions(value.options);
            }

            this.actions.push(action);
          }

          if (isPlainObject(value)) {
            // recurse
            this.match(value);
          }
        }
      }
    },

    /**
    @method mergeOptions
    @param {Object} options
    **/
    mergeOptions: function (options) {
      this.options = merge(this.options, options);
    },

    /**
    appends the matched fragment to the matched route

    @method updateMatchedRoute
    @param {String} fragment
    **/
    updateMatchedRoute: function (fragment) {
      if (fragment !== '/' && fragment !== '/*') {
        this.matchedRoute += fragment;
      }
    },

    /**
    removes matched fragments from the beginning of the uri

    @method updateURI
    @param {String} fragment
    **/
    updateURI: function (fragment) {
      var uri = this.uri,
          match;

      if (fragment !== '/' && fragment !== '/*') {
        match = uri.match(/(\/\w+)\/?/);
        if (match) {
          this.uri = uri.replace(match[1], '');
        }
      }
    },

    /**
    @method isFragmentInURI
    @param {Any} fragment
    @return {Boolean}
    **/
    isFragmentInURI: function (fragment) {
      var uri    = this.uri,
          prefix = fragment.substr(0,2),
          match;

      if ( fragment === '/' ) {
        return (uri === '/' || uri === '');
      }
      else if ( fragment === '/*' || prefix === '/:') {
        return true;
      }
      else {
        match = uri.match(/(\/\w+)\/?/);
        return match && fragment === match[1];
      }
    },

    /**
    @method isFragment
    @param {Any} key
    @return {Boolean}
    **/
    isFragment: function (key) {
      return key.indexOf('/') === 0;
    },

    /**
    @method isActionDescriptor
    @param {Any} val
    @return {Boolean}
    **/
    isActionDescriptor: function (val) {
      return isString(val) || isPlainObject(val) && val.method && val.options;
    }
  };

  /**
  @class Navigator
  @constructor
  @private
  **/
  var Navigator = function () {
    this._routes = null;
  };

  Navigator.prototype = {

    /**
    @method setup
    @param {Object} options
    **/
    setup: function (options) {
      options = options || {};

      for (var k in options) {
        this[k] = options[k];
      }

      this._attachEvents();
    },

    /**
    @method setRoutes
    @param {Object} routes a configuration of routes and targets
    **/
    setRoutes: function (routes) {
      this._routes = routes;
    },

    /**
    @method getRouteForURI
    @param {String} uri
    @return {Request}
    **/
    getRouteForURI: function (uri) {
      return new Route(this._routes, uri);
    },

    /**
    @method getRequest
    @param {String} uri
    @param {String|Null} queryString
    @param {String} matchedRoute
    @return {Request}
    **/
    getRequest: function (uri, queryString, matchedRoute) {
      return new Request({
        uri: uri,
        queryString: queryString,
        matchedRoute: matchedRoute
      });
    },

    /**
    @method getURI
    @return {String}
    **/
    getURI: function () {
      if (this.pushStateEnabled) {
        return location.pathname.replace(this.root, '');
      }
      else {
        return location.hash.replace('#', '');
      }
    },

    /**
    @method getQueryString
    @return {String|Null}
    **/
    getQueryString: function () {
      return window.location.search || null;
    },

    /**
    @method dispatch
    **/
    dispatch: function () {
      var uri         = this.getURI(),
          route       = this.getRouteForURI(uri),
          queryString = this.getQueryString(),
          options     = route.options,
          request     = this.getRequest(
            uri,
            queryString,
            route.matchedRoute
          );

      each(route.actions, function (action) {
        var target = action.target,
            method = action.method;

        target[method].call(
          target,
          request,
          options
        );
      });
    },

    /**
    @method onURIChange
    **/
    onURIChange: function () {
      this.dispatch();
    },

    /**
    @method onPopState
    **/
    onPopState: function () {
      // some browsers fire 'popstate' on the initial page load
      // with a null state object. In those cases we don't want
      // to trigger the uri change
      if (!history.state) this.onURIChange();
    },

    /**
    @method onClick
    @param {Event} ev
    **/
    onClick: function (ev) {
      var target = ev.target,
          matchesSelector = this._matchesSelector(target),
          uri;

      if (!matchesSelector) return;

      ev.preventDefault();

      uri = target.pathname.replace(this.root, '');

      this.navigate(uri);
    },

    /**
    @method navigate
    @param {String} uri
    **/
    navigate: function (uri) {
      if (this.pushStateEnabled) {
        history.pushState(null, '', this.root + uri);
        this.onURIChange();
      }
      else {
        location.hash = uri;
      }
    },

    /**
    @method refresh
    **/
    refresh: function () {
      this.dispatch();
    },

    /**
    @method _attachEvents
    @protected
    **/
    _attachEvents: function () {
      var pushStateEnabled = this.pushStateEnabled,
          evt = (pushStateEnabled ? 'popstate' : 'hashchange');

      if (pushStateEnabled) {
        addEvent(window, 'popstate', this.onPopState, this);
      }
      else {
        addEvent(window, 'hashchange', this.onURIChange, this);
      }

      addEvent(document, 'click', this.onClick, this);
    },

    /**
    @method _matchesSelector
    @param {DOMNode} node
    @protected
    **/
    _matchesSelector: function (node) {
      var nodeList = document.querySelectorAll(this.linkSelector),
          contains = false,
          i;

      for ( i = 0; i < nodeList.length; i++ ) {
        if (!contains) contains = ( node === nodeList[i] );
        else break;
      }

      return contains;
    }

  };

  // -- Public API ------------------------------------------------------------
  // Only expose a tiny API to keep internal routing safe

  /**
  @singleton Aviator
  **/
  window.Aviator = {

    /**
    @property pushStateEnabled
    @type {Boolean}
    @default true if the browser supports pushState
    **/
    pushStateEnabled: ('pushState' in history),

    /**
    @property linkSelector
    @type {String}
    @default 'a.navigate'
    **/
    linkSelector: 'a.navigate',

    /**
    the root of the uri from which routing will append to

    @property root
    @type {String}
    @default ''
    **/
    root: '',

    /**
    @property _navigator
    @type {Navigator}

    @private
    **/
    _navigator: new Navigator(),

    /**
    @method setRoutes
    @param {Object} routes
    **/
    setRoutes: function (routes) {
      this._navigator.setRoutes(routes);
    },

    /**
    dispatches routes to targets and sets up event handlers

    @method dispatch
    **/
    dispatch: function () {
      var navigator = this._navigator;

      navigator.setup({
        pushStateEnabled: this.pushStateEnabled,
        linkSelector:     this.linkSelector,
        root:             this.root
      });

      navigator.dispatch();
    },

    /**
    @method navigate
    @param {String} uri to navigate to
    **/
    navigate: function (uri) {
      this._navigator.navigate(uri);
    },

    /**
    @method refresh
    **/
    refresh: function () {
      this._navigator.refresh();
    }

  };

}());