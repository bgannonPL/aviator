

| w![Aviator](https://s3.amazonaws.com/swipely-pub/public-images/aviator-logo.png)

Aviator is a front-end router built for modular single page applications. 

You tell Aviator what parts of your application should handle what routes. It sends requests to the right place.

Aviator:

* has a central, declarative place to define your routes
* doesn't care what framework you use
* supports push state and hash url routing
* builds a simple yet rich request object with named and query params
* supports nesting routes and passing special options to certain urls
* lets you edit the url to trigger changes or update it silently to keep state

[![Build Status](https://travis-ci.org/swipely/aviator.png)](https://travis-ci.org/swipely/aviator)

## API

Aviator exposes a small API:

* `setRoutes`: parses the routes config object
* `dispatch`: makes the routes go pew pew
* `navigate`: routes a given path
* `refresh`: re-dispatches the current URI
* `getCurrentURI`: get the currently matched URI
* `getCurrentRequest`: get the currently matched Request

### Configuration properties

overwrite to customize

* `pushStateEnabled`: Route via pushState or hashchange. Defaults to feature detection.
* `linkSelector`: clicks on elements that matches this selector is hijacked
                  and routed using the href attribute. Default it is `"a.navigate"`
* `root`: All routing will done on top of the `root`. Default it is `""`

### `Aviator.setRoutes`

Pass an object that represents all routes within the app.
The object should be nested to describe different parts of the url:

```javascript
Aviator.setRoutes({
  '/marketing': {
    '/campaigns': {
    }
  }
});
```

Keys in the object are either strings that represent routes,
or a special key called `target`. The value of this key is an object
that accepts and responds to urls.

Targets are objects that handle the route changes.
They have methods that correspond to the values of the other elements in
that level of the routes object.

```javascript
Aviator.setRoutes({
  '/campaigns': {
    target: CampaignsTarget,
    '/': 'index',
    '/add': 'add'
  }
});
```

In the above case, hitting `"/campaigns/add"` would call the add method on
the on the MarketingTarget.

The special key `/*` indicates a method on that target to be called
before any other route handler methods on that level and any
subsequent levels in the object.

With the config below:

```javascript
Aviator.setRoutes({
  '/partners': {
    target: PartnersTarget
    '/*': 'show'
    '/marketing': {
      target: MarketingTarget,
      '/*': 'show',
      '/': 'index',
      '/campaigns': {
        target: CampaignsTarget
        '/': 'index',
        '/add': 'add'
      }
    }
  }
});
```

Hitting the url `"/partners/marketing"` calls

1. `partnersTarget#show`
2. `marketingTarget#show`
3. `marketingTarget#index`

Hitting the url `"/partners/marketing/campaigns/add"` calls

1. `partnersTarget#show`
2. `marketingTarget#show`
3. `campaignsTarget#add`

Instead of a method name string, the value of a route key can be
an object with a method name and options:

```javascript
Aviator.setRoutes({
  '/marketing': {
    target: MarketingTarget,
    '/*': 'show',
    '/reputation': {
      target: ReputationTarget,
      '/': { method: 'show', options: { renderMarketingLayout: false } }
    }
  }
});
```

Upon hitting `"/marketing/reputation"`,
`marketingTarget#show` and `reputationTarget#show`
will be called in that order, and both will be passed the options object.

### `Aviator.dispatch`

After having setup routes via `Aviator.setRoutes`,
call `Aviator.dispatch` to get things going,
and start listening for routing events.

No matter how many times this is called it will only setup listeners for
route events once.

Dispatch also sets up a click event handler that will pick up links matching
the selector that was set in `linkSelector` and route to its `href`
attribute instead of forcing a full page load.

### `Aviator.navigate`

After having dispatched (`Aviator.dispatch`) calling change the url and
force a routing by calling `Aviator.navigate`.

For instance calling
```javascript
Aviator.navigate('/users/all');
```
Will change the URL to `"/users/all"`. If the `root` property was set to
`"/admin"`, the same navigate call would change the url to `"/admin/users/all"`.

If the browser does not support pushState or you have set
`pushStateEnabled` to `false`, Aviator will instead take the same navigate
call and add it to `window.location.hash` so the url would
look like this `"/admin#/users/all"`.

If you wish to replace the history item instead pushing to the history list
call `navigate` with the replace option: `Aviator.navigate('/users/all', { replace: true });`

Pass in the `queryParams` option that will be parsed into a queryString and added
to the navigated uri: `Aviator.navigate('/users', { queryParams: { filter: [1,2] }});` will navigate to `"/users?filter[]=1&filter[]=2"`

Pass in the `namedParams` option to interpolate params into the url before navigate to it:
`Aviator.navigate('/users/:id/edit', { namedParams: { id: 3 });` will navigate to `"/users/3/edit"`

If you wish to change the url, but not have it call the route target, pass in `{ silent: true }` like so
`Aviator.navigate('/users', { silent: true });`

### `Aviator.refresh`

re-dispatch the current uri

## Browser support

Aviator supports modern browsers: IE9+, Chrome, Safari, Firefox, Opera

## Authors
Simon Højberg (hojberg) and Bart Flaherty (flahertyb)

Logo by Adam Hunter Peck
