/**
 * PhantomJS-based JS globals survey script
 *
 * Usage:
 *  phantomjs phantomas.js
 *    --url=<page to check>
 *    --global=<JS variable name>
 *    --globals=<JS variables name (comma separated)>
 *
 * @version 0.1
 */

// parse script arguments
var args = require('system').args,
	params = require('./../lib/args').parse(args),
	page = require('webpage').create();

var url = params.url || '',
	globals = (params.globals || params.global || '').split(',');

console.log('> Performing JS globals survey for <' + url + '> (' + globals.join(', ') + ')...');

// inject setter function for window object
page.onInitialized = function() {
	console.log('> Page is initialized, injecting survey code...');

	// let's take helper JS code from phantomas
	page.injectJs('./../core/helper.js');

	page.evaluate(function(globals) {
		(function() {
			var store = {};
			phantomas.globals = [];

			globals.forEach(function(varName) {
				varName = varName.trim();

				window.__defineSetter__(varName, function(val) {
					var stack;

					try {
						throw new Error('Backtrace');
					}
					catch(e) {
						stack = e.stackArray;
					}

					// keep track of all globals
					phantomas.globals.push({
						name: varName,
						file: '',
						line: 0,
						stack: stack,
						type: typeof val
					});

					// store original value
					store[varName] = val;
				});
				window.__defineGetter__(varName, function() {
					return store[varName];
				});
			});
		}());
	}, globals);
};

page.onConsoleMessage = function(msg) {
	console.log('> log: ' + msg);
};

// load the page
page.open(url, function (status) {
	console.log('> Loaded <' + url + '>');

	var globals = page.evaluate(function() {
		return window.phantomas.globals;
	});

	console.log(JSON.stringify(globals));

	phantom.exit();
});
