var helpers = require('./helpers'),
    Request = require('./request'),
    Route   = require('./route');

// helpers
var each      = helpers.each,
    addEvent  = helpers.addEvent,
    isArray   = helpers.isArray;

// Convienience aliases
var location  = window.location,
    history   = window.history;

/**
@class Navigator
@constructor
@private
**/
var Navigator = function () {
  this._routes = null;
  this._silent = false;
};

Navigator.prototype = {

  /**
  @method setup
  @param {Object} options
  **/
  setup: function (options) {
    options = options || {};

    for (var k in options) {
      if (options.hasOwnProperty(k)) {
        this[k] = options[k];
      }
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
  @method createRouteForURI
  @param {String} uri
  @return {Request}
  **/
  createRouteForURI: function (uri) {
    return new Route(this._routes, uri);
  },

  /**
  @method createRequest
  @param {String} uri
  @param {String|Null} queryString
  @param {String} matchedRoute
  @return {Request}
  **/
  createRequest: function (uri, queryString, matchedRoute) {
    this._request = new Request({
      uri: uri,
      queryString: queryString,
      matchedRoute: matchedRoute
    });

    return this._request;
  },

  /**
  @method getCurrentRequest
  @return {Request}
  **/
  getCurrentRequest: function () {
    return this._request;
  },

  /**
  @method getCurrentURI
  @return {String}
  **/
  getCurrentURI: function () {
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
    return location.search || null;
  },

  /**
  @method dispatch
  **/
  dispatch: function () {
    var uri         = this.getCurrentURI(),
        route       = this.createRouteForURI(uri),
        queryString = this.getQueryString(),
        options     = route.options,
        request     = this.createRequest(
          uri,
          queryString,
          route.matchedRoute
        );

    each(route.actions, function (action) {
      var target = action.target,
          method = action.method;

      if (!(method in target)) {
        throw new Error("Can't call " + method + ' on target for uri ' + request.uri);
      }

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
    if (!this._silent) {
      this.dispatch();
    }

    this._silent = false;
  },

  /**
  Some browsers fire 'popstate' on the initial page load
  with a null state object. In those cases we don't want
  to trigger the uri change.

  @method onPopState
  @param {Event}
  **/
  onPopState: function (ev) {
    if (ev.state) this.onURIChange();
  },

  /**
  @method onClick
  @param {Event} ev
  **/
  onClick: function (ev) {
    var target = ev.target,
        matchesSelector = this._matchesSelector(target),
        pathname = target.pathname,
        uri;

    if (!matchesSelector) return;

    ev.preventDefault();

    // Some browsers drop the leading slash
    // from an `a` tag's href location.
    if ( pathname.charAt(0) !== '/' ) pathname = '/' + pathname;

    uri = pathname.replace(this.root, '');

    this.navigate(uri);
  },

  /**
  @method navigate
  @param {String} uri
  @param {Object} [options]
  **/
  navigate: function (uri, options) {
    var options = options || {},
        namedParams = options.namedParams,
        queryParams = options.queryParams;

    if (queryParams) {
      uri += this.serializeQueryParams(queryParams);
    }

    if (namedParams) {
      for (var p in namedParams) {
        if (namedParams.hasOwnProperty(p)) {
          uri = uri.replace(':' + p, encodeURIComponent(namedParams[p]));
        }
      }
    }

    if (options.silent) {
      this._silent = true;
    }

    if (this.pushStateEnabled) {
      uri = this.root + uri;

      if (options.replace) {
        history.replaceState('navigate', '', uri);
      }
      else {
        history.pushState('navigate', '', uri);
      }

      this.onURIChange();
    }
    else {
      if (options.replace) location.replace('#' + uri);
      else location.hash = uri;
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
    var pushStateEnabled = this.pushStateEnabled;

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
  },

  /**
  @method serializeQueryParams
  @param {Object} queryParams
  @return {String} queryString "?foo=bar&baz[]=boo&baz=[]oob"
  **/
  serializeQueryParams: function (queryParams) {
    var queryString = [],
        val;

    for (var key in queryParams) {
      if (queryParams.hasOwnProperty(key)) {
        val = queryParams[key];

        if (isArray(val)) {
          each(val, function (item, i) {
            queryString.push(encodeURIComponent(key) + '[]=' + encodeURIComponent(item));
          });
        }
        else {
          queryString.push(encodeURIComponent(key) + '=' + encodeURIComponent(val));
        }
      }
    }

    queryString = '?' + queryString.join('&');

    return queryString;
  }

};

module.exports = Navigator;
