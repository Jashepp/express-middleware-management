# express-middleware-management - Nodejs Module

[![NPM Version][npm-image]][npm-url]
[![Downloads Stats][npm-downloads]][npm-url]

Manage middleware for [express](https://www.npmjs.com/package/express) applications on the run.

## What is this?

This module lets you manage middleware on an express application, while the application is live. For example, you can have a dynamic feature that is loaded or unloaded which adds a middleware onto the express router stack, then enable, disable, remove or move it around using the features this module provide.


## Why use this?

I have been looking for a way to manage my middleware while keeping my application online, so I can have a part of my server reload on changes, and automatically remove and add middleware without needing a restart.

There are existing modules such as [connectr](https://www.npmjs.com/package/connectr) which lets you manage middleware, but it requires rewriting the way you use middleware with your express application. See https://github.com/expressjs/express/issues/1765

So I decided to make my own middleware management module which has the basic features and allows one to simply add onto existing code to add functionality, instead of rewriting it.

## Installation

Install the module via [NPM](https://www.npmjs.com/package/express-middleware-management)
```
npm install express-middleware-management --save
```
Or [download the latest release](https://github.com/Unchosen/express-middleware-management/releases), or git clone the [repository on GitHub](https://github.com/Unchosen/express-middleware-management).

### Important Changes
0.0.3 to 0.0.4 - Removed `manageMiddleware.getByID(ID)` and `layer._emmObjID`. Objects are now stored via Map. This allows multiple instances to use the same router stack.

## How to use / Example

Require the module, create a management instance, fetch the middleware to manage, then action!

```javascript
// Require Modules
var express = require('express');
var http = require('http');
var expressMiddlewareManagement = require('express-middleware-management');

// Create Express Application
var app = express();

// Create Middleware Management Instance
var manageMiddleware = expressMiddlewareManagement.createInstance(app);

// Setup HTTP/1.x Server
var httpServer = http.Server(app);
httpServer.listen(80,function(){
  console.log("Express HTTP/1 server started");
});

// Serve some content

// Add middleware to the express app via express's inbuilt .get method
app.get('/', function(req,res){
    res.send('Test 1').end();
});
// Get management for the middleware added above, via getting the most recently added
var myHomeGet = manageMiddleware.getRecent();

// Add middleware to the express app via express's inbuilt .use method
app.use(function myCustomMiddleware(req, res, next){
	res.send('Test 2').end();
});
// Get management for the middleware added above, via it's function name
var myCustom = manageMiddleware.getByName('myCustomMiddleware');

// Every second, disable and enable the 2 middlewares above
setInterval(function(){
	var isHomeEnabled = myHomeGet.enabled;
	if(isHomeEnabled) myHomeGet.disable();
    else myHomeGet.enable();
    if(isHomeEnabled) myCustom.enable();
    else myCustom.disable();
},1000);

// Now if you visit http://localhost/ and refresh every second, you'll see them switching.
```

It is recommended to use sub express applications with a middleware management instance attached to that instead of the main express application, to keep code clean and to segment what the management instance has access to.

When creating an instance for a sub express application, the application must be attached to the parent application before hand.
```javascript
// let 'app' be the main express() application
// Create sub application
var subApp = express();
// Attach it to the parent application
app.use(subApp);
// Create Middleware Management Instance (must be after the app is attached to it's parent app!)
var manageMiddleware = expressMiddlewareManagement.createInstance(subApp);
```

## API

Methods to get a management object (manageObject) for a middleware

```javascript
// let 'manageMiddleware' be the main middleware management interface as shown above

// Get via position in manageMiddleware.middlewareStack (app._router.stack)
manageMiddleware.getByStackIndex(index);
// Returns management object on success, false on failure.

// Get by function/handle name. index argument is optional
manageMiddleware.getByName('myCustomMiddleware'[,index]);
// If more than one exist with that name, return false, otherwise if index is specified, return the nth result. -1 for the last result.
// Returns management object on success, false on failure.

// Get an array of all by function/handle name
manageMiddleware.getAllByName('myCustomMiddleware');
// Returns an array of management objects on success, or an empty array on failure.

// Get by function/handle itself
manageMiddleware.getByHandle(theMiddlewareFunction);
// Returns management object on success, false on failure.

// Get by router stack Layer itself
manageMiddleware.getByLayer(layer);
// Returns management object on success, false on failure.

// Get the most recently added middleware. This would most likely be the method you use the most.
manageMiddleware.getRecent();
// Returns management object on success, false on failure.
```

Other methods on the middleware management interface
```javascript
// let 'manageMiddleware' be the main middleware management interface as shown above

// Add a 'Layer' into the express stack (same as app._router.stack.push(Layer))
// manageObject.remove() returns a Layer, so you can use it to add back in later, or to move a middleware Layer between different express applications
manageMiddleware.addLayer(Layer);
```

Methods to manage the middleware returned via the get methods above
```javascript
// let 'manageObject' be the management object for a middleware

// Enable a middleware (defautly enabled). Can be checked via manageObject.enabled
manageObject.enable([enable]);
// Optional enable argument. If passed as false, it will disable instead
// Returns true on success, false on failure

// Disable a middleware
manageObject.disable([disable]);
// Optional disable argument. If passed as false, it will enable instead
// Returns true on success, false on failure
// In the back-end, it simply replaces the middleware's function/handle with a No-Op middleware that simply calls next()

// Remove a middleware from the stack
manageObject.remove();
// Returns a router Layer object, which used to be in the stack. It is able to be added back into an express router stack directly, or via manageMiddleware.addLayer(Layer)
// Or it returns false on failure

// Swap a middleware with another middleware (swap positions in the router stack)
manageObject.swapWith(manageObject2);
// Both manageObject and manageObject2 will remain enabled/disabled. Only the Layer object is swapped.

// Move a middleware before another middleware (move position in the router stack)
manageObject.insertBefore(manageObject2);
// Returns true on success, false on failure

// Move a middleware after another middleware (move position in the router stack)
manageObject.insertAfter(manageObject2);
// Returns true on success, false on failure

// Get the previous middleware's management object (previous in the router stack)
manageObject.getPrevious()
// Returns manageObject2 on success or false if there is no middleware before it

// Get the next middleware's management object (next in the router stack)
manageObject.getNext()
// Returns manageObject2 on success or false if there is no middleware after it
```

If there are any more features you would like me to implement, please [create a GitHub issue](https://github.com/Unchosen/express-middleware-management/issues/new) with an example of how you would use it.

## Known Issues

This is very experimental.

## Tests

None. Try existing express applications with this module.

## Contributors

Create issues on the GitHub project or create pull requests.

All the help is appreciated.

## License

MIT License

Copyright (c) 2017 Jason Sheppard @ https://github.com/Unchosen

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Links

GitHub Repository: [https://github.com/Unchosen/express-middleware-management](https://github.com/Unchosen/express-middleware-management)

NPM Package: [https://www.npmjs.com/package/express-middleware-management](https://www.npmjs.com/package/express-middleware-management)

[npm-image]: https://img.shields.io/npm/v/express-middleware-management.svg?style=flat-square
[npm-url]: https://npmjs.org/package/express-middleware-management
[npm-downloads]: https://img.shields.io/npm/dm/express-middleware-management.svg?style=flat-square
