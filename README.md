![logo](assets/logo.png)

# Hermes JS

[![build status](https://img.shields.io/travis/pensierinmusica/hermes-js.svg)](https://travis-ci.org/pensierinmusica/hermes-js)
[![test coverage](https://img.shields.io/coveralls/pensierinmusica/hermes-js.svg)](https://coveralls.io/r/pensierinmusica/hermes-js)
[![dependencies](https://img.shields.io/david/pensierinmusica/hermes-js.svg)](https://www.npmjs.com/package/hermes-js)
[![npm version](https://img.shields.io/npm/v/hermes-js.svg)](https://www.npmjs.com/package/hermes-js)
[![license](https://img.shields.io/github/license/pensierinmusica/hermes-js.svg)](https://www.npmjs.com/package/hermes-js)

Hermes JS is a universal action dispatcher for JavaScript apps. It facilitates the design and management of action flows, both for interacting with the UI and back-end / third-party services.

In case you wonder, the library name name is inspired by the [Greek messenger of the gods](https://en.wikipedia.org/wiki/Hermes).

## Description

Let’s consider an “action” as any type of data that can be dispatched, might include metadata, and could expect a response to be returned (e.g. an HTTP request, a WebSocket event, or a Redux action).

Such action can be represented as an object that has three properties:

- `type` - The action name - *String*
- `data` - Additional data associated with the action (optional) - *Primitive or Object*
- `meta` - Metadata that is useful to process the action (optional) - *Object*

For example:

```js
const simpleAction = {type: 'INCREMENT_COUNTER'};

const completeAction = {
  type: 'NEW_USER',
  data: {
    email: 'hello@world.com'
    password: 'pass'
  },
  meta: {
    method: 'POST'
  }
};
```

Hermes abstracts the concept of actions being dispatched in an app, decoupling them from the actual dispatcher. It facilitates the generation of action creators, easily allows to include middleware, and simplifies testing.

It supports asynchronous flows, and integrates well with the latest front-end or back-end frameworks, making it a breeze to define your actions logic and cleanly combine different technologies (e.g. Flux / Redux, HTTP, WebSocket, etc).

For example, actions like the ones above can be dispatched with:

```js
import cd from '/actions/client/dispatcher';
import sd from '/actions/server/dispatcher';

const data = {
  email: 'hello@world.com',
  password: 'pass'
};

(async () => {
  if (await sd('NEW_USER', data)) cd('INCREMENT_COUNTER');
})();
```
## Install

`npm install hermes-js`

## Usage

```js
// Initialize
const dispatcher = hermes(actionsList, dispatch, [middleware]);

// Dispatch an action
dispatcher('MY_ACTION', [data], [meta]);

// Validate an action
dispatcher.at('MY_ACTION');
```

Hermes takes 3 arguments:

1. The actions list - *Array of strings*
2. The dispatch function - *Function*
3. The middleware list (optional) - *Array of functions*

It returns a function to dispatch actions (i.e. a “dispacther”), which:

- When invoked automatically checks that the action type is part of the original actions list.
- If a list of middleware has been provided, before dispatching the action, runs it through each middleware following the original list order.
- Offers a basic action validator under the `at` property. The validator takes one argument, which is the action name (String), and simply returns it or throws an error if it’s not part of the original actions list.

Each dispatcher takes 3 arguments:

1. The action type  - *String*
2. The action data (optional) - *Primitive or Object*
3. The action metadata (optional) - *Object*

Now let’s go back and take a look at the arguments to initialize Hermes in details.

### 1. actionsList

*Array of strings*

A list naming all the actions we want to be able to dispatch (having the action names in uppercase leaves less doubts about capitalization, but you can choose whatever format you prefer). For example:

```js
const actionsList = [
  'NEW_USER',
  'USER_LOGIN',
  'NEW_MESSAGE'
];
```

### 2. dispatch

*Function*

The callback that will be invoked to dispatch the action. Here’s a mock example (for more realistic use cases check the “Examples” section at the bottom):

```js
const dispatch = action => console.log('dispatching action', action);
```

### 3. middleware

*Array of functions*

A list of all the middleware that we want in the flow (if any). Each middleware function is passed three arguments.

1. The action itself.
2. The  `next` callback, that when invoked inside the middleware executes the next middleware in the list (if there’s no middleware left, `next` invokes `dispatch`).
3. The basic action validator.

For example:

```js
const middleware = [
  (action, next) => {
    console.log('logging action', action);
    return next();
  },
  (action, next, at) => {
    if (action.type === at('SOME_ACTION')) console.log('tracking action', action);
    return next();
  }
];
```

## Patterns

Let’s call “sync action” any action that is meant for UI rendering on the front-end, hence synchronous (e.g. a Redux action), and “async action” any action that is meant for interaction with the back-end or a third part API, hence asynchronous (e.g. an HTTP request).

After testing different approaches, it has emerged that separating sync and async actions leads to the cleanest logic and the best code scalability / maintainability / development speed.

In both cases middleware can include sync or async code. Any middleware code that affects an action (i.e. modifies it in any way) should be sync. Async code in middleware instead should not have side effects (e.g. error reporting, analytics, etc.) and the `next` callback should be invoked independently of the outcome of the async code.

One of the reasons why this library was created is exactly to avoid async code in middleware that can affect an action, like other libraries instead enforce. Such code can be moved to async actions. We believe it’s better to dispatch sync actions before, after, or depending on the outcome of async actions (and not mix the two through middleware).

Also, when you implement your own dispatch function (e.g. for server actions), evaluate whether it should handle all errors locally and return `false` (i.e. centralized error handler), or return the error and let the callee handle the different cases (i.e. distributed error handler).

Most importantly, Hermes is agnostic about the action flow patterns you decide to implement, so choose whatever works best for you.

## File structure

In case you wonder what is a good file structure for projects using Hermes, this is a nice starting point.

```sh
/actions
  /client
    /dispatcher.js
    /list.js
    /middleware
  /server
    /dispatcher.js
    /list.js
    /middleware
```

It makes sense to group your actions in different sections (e.g. “client” and “server”). This can be more or less granular depending on your project needs. Then each section should have a dispatcher and a list. Finally, if you use any middleware store it in a separate sub-folder within its section.

## Examples

Here are just a few examples of how Hermes can be used, although the power of this library lies in its flexibility and adaptability to different technologies.

Progressing through the different examples you might find references to code that is defined in previous examples (otherwise this section would become too long).

### React + Redux

When used with Redux, you initialize the dispatcher by passing `store.dispatch` to it. Once the dispatcher has been initialized, any dispatched action should go through the dispatcher and not directly through `store.dispatch`.

```jsx
// /actions/client/list.js

export default [
  'INCREMENT_COUNTER',
  'NEW_MESSAGE',
  'USER_LOGIN'
];

// /actions/client/dispatcher.js

import hermes from 'hermes-js';

import { dispatch } from '/redux/store';
import actionsList from './list';

export default hermes(actionsList, dispatch);

// /components/increment-button.js

import React from 'react';

import cd from '/actions/client/dispatcher';

export default props => (
  <button
    onClick={ () => cd('INCREMENT_COUNTER', props.amount) }
  >
    Increment { props.amount }
  </button>
);

// /redux/reducer.js

import { at } from '/actions/client/dispatcher';

const initialState = {
  counter: 0,
  user: null
};

export default (state = initialState, action) => {
  switch (action.type) {
    case at('INCREMENT_COUNTER'):
      const amount = action.data;
      return {...state, counter: state.counter + amount};
    case at('USER_LOGIN'):
      const user = action.data;
      return {...state, user};
    default:
      return state;
  }
};
```

### HTTP

Here’s an example of how a dispatcher for server actions could be initialized and used with an HTTP back-end.

```js
// /actions/server/list.js

export default [
  'GET_MESSAGES',
  'SEND_MESSAGE',
  'USER_LOGIN'
];

// /actions/server/dispatcher.js

import hermes from 'hermes-js';

import actionsList from './list';

const dispatch = async { data } => {
  try {
    const res = await fetch('/api', {
      method: 'POST',
      body: data
    });
    return await res.json();
  } catch (e) {
    console.log('API error', e);
    return false;
  }
};

export default hermes(actionsList, dispatch);

// /components/login.js

import cd from '/actions/client/dispatcher';
import sd from '/actions/server/dispatcher';

const formData = {
  email: 'hello@world.com',
  password: 'pass'
};

async function login () {
  const userData = await sd('USER_LOGIN', formData);
  if (userData) cd('USER_LOGIN', userData);
  else alert('Please check your login credentials');
};
```

### WebSocket

And here’s how a dispatcher could work with a WebSocket back-end.

```js
// /actions/server/dispatcher.js

import io from 'socket.io-client';
import hermes from 'hermes-js';

import actionsList from './list';

const socket = io('/api');

const dispatch = action => {
  return new Promise(resolve => {
    socket.emit('action', action, res => {
      if (res.status === 200) resolve(res.data === undefined ? true : res.data);
      else {
        console.log('API error', res);
        resolve(false);
      }
    });
  });
};

export default hermes(actionsList, dispatch);
```

### Middleware

Now, let’s check a few middleware examples.

The first one is an error handler that catches any un-handled errors down the chain (i.e. other middleware and the dispatch function) if placed as the first element in the middleware array.

In this case it just logs the error, but it could be integrated with any **error tracker**.

```js
// /actions/client/middleware/error-handler.js

export default (action, next) => {
  try {
    return next();
  } catch (e) {
    console.error('Error dispatching action', action, e);
    throw e;
  }
};

// /actions/client/dispatcher.js

import hermes from 'hermes-js';
import { dispatch } from '/redux/store';

import actionsList from './list';
import errorHandler from './middleware/error-handler';

export default hermes(actionsList, dispatch, [errorHandler]);
```

Here’s an example of an analytics middleware. It simply logs every action, but it could be integrated with any third-party **analytics service**.

```js
// /actions/client/middleware/analytics.js

function track (action) {
  console.log('tracking action', action.type);
}

export default (action, next) => {
  track(action);
  return next();
};
```

When interacting with an HTTP **REST API**, the url paths and HTTP methods for each action can be added directly in the dispatch function, or through a middleware that adds the correct metadata.

```js
// /actions/server/middleware/http-meta.js

export default (action, next, at) => {
  const { meta, type } = action;
  switch (type) {
    case at('GET_MESSAGES'):
      meta.method = 'GET';
      meta.path = ('/messages');
      return next();
    case at('SEND_MESSAGE'):
      meta.method = 'POST';
      meta.path = ('/message');
      return next();
    case at('USER_LOGIN'):
      meta.method = 'POST';
      meta.path = ('/login');
      return next();
    default:
      return next();
  }
};

// /actions/server/dispatcher.js

import hermes from 'hermes-js';

import actionsList from './list';
import httpMeta from './middleware/http-meta';

const dispatch = async action => {
  const { data, meta } = action;
  const { method, path } = meta;
  const init = { method };
  if (method === 'POST') init.body = data;
  try {
    const res = await fetch(`/api${path}`, init);
  } catch (e) {
    console.log('API error', e);
    return false;
  }
  return await res.json();
};

export default hermes(actionsList, dispatch, [httpMeta]);
```

In a similar fashion, middleware can also be used to extend the basic action **validation** and interrupt the dispatch cycle in case of invalid actions.

```js
// /actions/server/middleware/validate.js

function validateString (str, propName, type) {
  if (!str || typeof str !== 'string') {
    throw new Error(`The action ${type} must provide a ${propName} (String)`);
  }
}

export default (action, next, at) => {
  const { data, type } = action;
  switch (type) {
    case at('USER_LOGIN'):
      validateString(data.email, 'email', type);
      validateString(data.pass, 'password', type);
      return next();
    default:
      return next();
  }
};
```

Or to **debounce** actions.

```js
// /actions/server/middleware/debounce.js

const timers = {};

function debounce (type, next, time) {
  if (!timers[type]) {
    return new Promise(resolve => {
      const id = setTimeout(() => {
        timers[type] = null;
        resolve(next());
      }, time);
      timers[type] = () => {
        cancelTimeout(id);
        resolve(false);
      };
    });
  } else {
    timers[type]();
    timers[type] = null;
    return debounce(type, next, time);
  }
}

export default (action, next, at) => {
  const { type } = action;
  switch (type) {
    case at('GET_MESSAGES'):
      return debounce(type, next, 2000);
    case at('SEND_MESSAGE'):
      return debounce(type, next, 1000);
    default:
      return next();
  }
};
```

More complex logic can be implemented in middleware, for example to **interrupt an async action** through the use of a generator function.

### Testing

Here are a few test examples that simply throw in case of failure, but the same concepts can be easily applied to the testing framework of your choice.

To test a middleware chain, initialize Hermes with a dispatch function that returns the action instead of dispatching it.

```js
// /tests/hermes-middleware.spec.js

import assert from 'assert';
import deepEqual from 'deep-equal';
import hermes from 'hermes-js';

import actionsList from '/actions/server/list';
import httpMeta from '/actions/server/middleware/http-meta';

const dispatch = action => action;
const sd = hermes(actionsList, dispatch, [httpMeta]);

const formData = {
  email: 'hello@world.com',
  password: 'pass'
};

const dispatchedAction = sd('USER_LOGIN', formData);

const expectedAction = {
  type: 'USER_LOGIN',
  data: {
    email: 'hello@world.com',
    password: 'pass'
  },
  meta: {
    method: 'POST',
    path: '/login'
  }
};

assert(deepEqual(dispatchedAction, expectedAction));
```

You can also write tests that simulate the full action cycle, using a mock back-end.

```js
// /tests/hermes-middleware.spec.js

import assert from 'assert';
import deepEqual from 'deep-equal';
import hermes from 'hermes-js';
import fetchMock from 'fetch-mock';

import actionsList from '/actions/server/list';
import httpMeta from '/actions/server/middleware/http-meta';

const dispatch = fetch => async action => {
  const { data, meta } = action;
  const { method, path } = meta;
  const init = { method };
  if (method === 'POST') init.body = data;
  try {
    const res = await fetch(`/api${path}`, init);
  } catch (e) {
    console.log('API error', e);
    return false;
  }
  return await res.json();
};

const sd = hermes(actionsLis, dispatch(fetchMock), [httpMeta]);

const email = 'hello@world.com';
const correctFormData = { email, password: 'pass' };
const wrongFormData = { email, password: 'wrong' };

const expectedResponse = {
  username: 'username',
  token: 'token'
};

(async () => {

  const path = '/api/login';

  fetchMock.post(path, expectedResponse);
  const correctResponse = await sd('USER_LOGIN', correctFormData);
  assert(deepEqual(correctResponse, expectedResponse));

  fetchMock.post(path, { status: 403 });
  const wrongResponse = await sd('USER_LOGIN', wrongFormData);
  assert(wrongResponse === false);

})();
```

---

*Hermes logo credit: Vincent Montagnana*