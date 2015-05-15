/**
 * 
 * @author Tyler Beck
 * @version 1.0.0
 */

var url = 'http://localhost:{{}}/test/index.html',

	httpPath = 'http://localhost:{{}}080/',

	httpsPath = 'https://localhost:{{}}443/',

	wwwpath = null,

	page = require('webpage').create(),
	sepage = require('webpage').create(),

	self = null,

	runner = null,

	reporter = null,

	utils = null,

	selenium = null,

	properties = null,

	config = null,

	cfg = null,

	sIndex = 0,

	stestIndex = 0;

var MessageType = {

	'ENOTFOUND': 0,
	'WINDOWLOAD': 1,
	'DONE': 2,
	'EINSELECTORATTR': 3,
	'EATTRMATCH': 4

};

var Tests = {

	path: '{{}}/source/{{}}{{}}',

	path2js: '/staticfiles/cartridge/static/default/js/',

	injector: '{{}}/server/runner/lib/js/injector.js',

	screenshots: '/server/www/lib/screenshots/',

	errors: [],

	tests: [],

	store: {},

	/** 
	 * Total amount of tests passed.
	 * @property passed
	 * @type Integer
	 */

	passed: 0,

	/**
	 * Total amount of tests failed.
	 * @property failed
	 * @type Integer
	 */

	failed: 0,

	queue: [],

	index: 0,

	startTime: null,

	currentStep: 0,

	totalSteps: 0,

	'events': {

		messageListener: function(data) {

			if(data && data.name) self.messages[data.name](data);

		},

		loadListener: function(status) {

			var index = (self.index - 1);
			var item = self.queue[index];
			
			page.injectJs(utils.uInject(self.injector, [cfg.pwd]));

			if(item) {
				
				page.injectJs(item[1]);

			} else {

				page.injectJs(utils.uInject(self.path, [cfg.pwd, config.cartridge, 
					self.path2js]) + cfg.properties[config.intergration_node]);

			}

		},

		errorListener: function(msg, trace) {
			
			if(trace.length) {

				runner.kill(runner.ERROR, 
					', "error": { ' + 
					'"trace": ' + JSON.stringify(trace) + 
					', "msg": "' + msg + '"' + 
					' } '
				);

			}

		}

	},

	'messages': {

		require: function(data) {

			data.routes.forEach(function(path, index) {
				
				var cartridge = null,
					subdirectory = null,
					filename = null;

				path = path.replace(/\/?([a-zA-Z_0-9]+){1}\/?([/a-zA-Z_0-9]*\/{1})*(.+)/ig, function(p, dir, subdir, path) {

					cartridge = dir,
					subdirectory = subdir || '', 
					filename = path;

					return(utils.uInject(self.path, [cfg.pwd, cartridge, 
						self.path2js]) + subdirectory + filename);

				});
				
				page.injectJs(path);
				
			});

			return self.isolate(data);

		},

		beginSuite: function(data) {

			self.tests.push({
				'name': data.testname,
				'imagery': [],
				'passed': 0,
				'failed': 0,
				'tests': []
			});

			self.store[data.id] = (self.tests.length - 1);

			return self.isolate(data);

		},

		assert: function(data) {

			var index = self.store[data.id];

			if(data.condition) {
					++self.tests[index].passed;
					++self.passed;
				} else {
					++self.tests[index].failed;
					++self.failed;
			}	

			self.tests[index].tests.push({
				condition: data.condition,
				message: data.message
			});

		},

		screenshot: function(data) {

			var index = self.store[data.id];
			var createPath = new Date().getTime(),
				extension = data.extension || 'jpg',
				quality = data.quality || 50;

			var filePath = self.screenshots + createPath + '.' + extension;
			
			page.render((cfg.pwd + filePath), {
				format: extension,
				quality: quality
			});

			self.tests[index].imagery.push(createPath + '.' + extension);

		},

		/** 
		 * Calls the next item in our play queue. See @tests.play.
		 * @method done
		 * @type Function
		 */

		done: function() {

			self.play();

		}, 

		/**
		 * This only handles functional testing; intergration testing does not need this.
		 * @method begin
		 * @type Function
		 */

		begin: function(data) {

			self.totalSteps = (data.tests.length);
			
			if(self.currentStep <= self.totalSteps) {

				self.currentStep ++;

				return self.isolate(utils.merge(data, {
					'step': (self.currentStep - 1)
				}));

			}

		},

		open: function(data) {

			page.open(wwwpath + data.url);

		}

	},

	start: function() {

		self.startTime = reporter.startReporter();

		self.registerEvents.apply(self, [self.events]);

		var functionalPath = cfg.properties[config.functional_node],
			intergrationPath = cfg.properties[config.intergration_node];

		if(functionalPath && functionalPath.length) {
			self.addQueue(utils.uInject(url, [config.serverPort]), 
				utils.uInject(self.path, [cfg.pwd, config.cartridge, 
				self.path2js]) + functionalPath);
		}

		if(intergrationPath && intergrationPath.length) {
			self.addQueue(wwwpath, utils.uInject(self.path, [cfg.pwd, 
			config.cartridge, self.path2js]) + intergrationPath);
		}

		self.play();

	},

	/**
	 * @method registerEvents
	 * @type Function
	 * @param {Object} Symbolic link to our Events
	 */

	registerEvents: function(events) {

		page.onCallback = events.messageListener;

		page.onError = events.errorListener;

		page.onLoadFinished = self.events.loadListener;
		
		/*page.onResourceRequested = function(requestData, networkRequest) {
    		console.log('Request (#' + requestData.id + '): ' + JSON.stringify(requestData));
		};*/

	},

	/**
	 * Add an queued test item to our test runner.
	 * @method addQueue
	 * @type Function
	 * @param {String} url Starting URL for our testing.
	 * @param {Function} fn Function to call for testing implementation.
	 */

	addQueue: function(url, script) {

		self.queue.push([url, script]);

	},

	/**
	 * We are done with this type of testing; continue to the next
	 * test suites if there are any.
	 * @method play
	 * @type Function 
	 */

	play: function() {

		if(self.index < self.queue.length) {

			var item = self.queue[self.index];

			page.open(item[0]);

			self.index++;

		} else {
				
			if(selenium && selenium.commands.length) {

				self.selenium.init();

			} else {

				self.finished();

			}

		}

	},

	'selenium': {

		tests: [],

		/**
		 * Once a failure occur's; record this change and stop
		 * testing; this is normal selenium behavior.
		 * @property failure
		 * @type Boolean
		 */

		failure: false,

		current: null,

		presentFirst: false,

		waiting: ['open'],

		loading: false,

		isLoading: function(load) {

			if(load == null) { 
				return this.loading;
			}

			this.loading = load;

			return this.loading;			

		},

		isWaitingCommand: function(current) {

			var status = false;

			this.waiting.forEach(function(item, index) {
				if(item == current) status = true;
			});

			return status;

		},

		'events': {

			onLoadFinished: function() {

				sepage.injectJs(utils.uInject(self.injector, [cfg.pwd]));
				
				if(this.isWaitingCommand(this.current) || this.isLoading()) {
					
					this.isLoading(false);
					this.play(true);

				}

			},

			onCallback: function(data) {

				switch(data.type) {
					case MessageType.WINDOWLOAD:

						return this.isLoading(true);

					break;
					case MessageType.ENOTFOUND:
					case MessageType.EINSELECTORATTR:
					case MessageType.EATTRMATCH:

						++self.failed;
						this.failure = true;

						this.tests.push({ 
							'test': data.message,
							'passed': false
						});

					break;
				}

				return this.play(true);

			}

		},

		'commands': {

			open: function(target, value) {

				sepage.open('http://juts.gsiccorp.net:4080' + target);

			},

			click: function(target, value) {

				return this.run('click', target, value);

			},

			clickAndWait: function(target, value) {

				return this.commands.click.apply(this, [target, value]);

			},

			type: function(target, value) {

				return this.run('type', target, value);

			},

			assertNotAttribute: function(target, value) {

				return this.run('assertNotAttribute', target, value);

			},

			assertElementPresent: function(target, value) {

				return this.run('assertElementPresent', target, value);

			}

		},

		run: function(cmd, target, value) {

			sepage.evaluate(function(options) {
				juts.selenium[options.command](options.selector, options.val);
			},{
				command: cmd,
				selector: target,
				val: value
			});

		},

		play: function(finishedTest) {

			var suite = selenium.commands[sIndex][1];

			if(stestIndex > 0 && finishedTest) {
				var lastFinishedTest = (suite[stestIndex - 1]);
				if(!this.failure) {
					self.passed++;
					this.tests.push({
						'test': lastFinishedTest,
						'passed': true
					});
				} else {
					self.finished();
				}
			}

			if(stestIndex >= (suite.length)) {

				if(sIndex >= (selenium.commands.length - 1)) {

					self.finished();
					phantom.exit(0);

				}

				stestIndex = 0;
				suite = selenium.commands[++sIndex][1];

			}

			var testcase = suite[stestIndex];

			stestIndex++;

			var command = testcase[0],
				target = testcase[1],
				value = testcase[2];

			var name = selenium.commands[sIndex][0];

			this.runCommand(command, target, value);

		},

		runCommand: function(cmd, target, value) {

			if(this.commands[cmd]) {

				this.current = cmd;
				this.commands[cmd].apply(this, [target, value]);

			}

		},

		registerEvents: function(page, events) {

			page.onError = null;

			page.onResourceTimeout = self.proxy(this, events.onResourceTimeout);
			page.onLoadFinished = self.proxy(this, events.onLoadFinished);
			page.onCallback = self.proxy(this, events.onCallback);

		},

		registerSettings: function(settings) {

			this.resourceTimeout = 15000;

		},

		init: function() {

			this.registerEvents.apply(this, [sepage, this.events]);
			this.registerSettings.apply(sepage.settings);

			this.play();

		}

	},

	proxy: function(obj, route) {

		return(function() {
			
			return route.apply(obj, arguments);

		});

	},

	finished: function() {

		runner.kill(runner.OK, 
			', "tests": ' + JSON.stringify(self.tests) +
			', "selenium": {' +
				'"tests": ' + JSON.stringify(self.selenium.tests) +
			'}, "statistics": ' + self.createStatistics());

	},

	/**
	 * Creates statistics for testing information gathered.
	 * @method createStatistics
	 * @type Function
	 */

	createStatistics: function() {

		return(JSON.stringify({

			'total': (self.passed + self.failed),
			'passed': self.passed,
			'failed': self.failed
		
		}));

	},

	isolate: function(data) {

		if(data.callback) {

			page.evaluate(function(options) {

				juts.invoke(options.data);

			}, {
				data: data
			});

		}

	},

	/** 
	 * Configure variables
	 * @method setup
	 * @type Function
	 */

	setup: function(options) {

		runner = options.runner;

		selenium = options.selenium,
		reporter = options.reporter,
		utils = options.utilities,
		config = runner.config,
		cfg = options.json;

		wwwpath = utils.uInject(httpPath, [cfg.devnumber]) + 
		cfg.properties[config.webpath];

	},

	/**
	 * Instantiation; invoke our primary call, which will setup 
	 * events, test queue, etc.
	 * @method init
	 * @type Function
	 * @param {Object} options
	 */

	init: function(options) {

		setTimeout(function() {
			console.log(sIndex, stestIndex);
			var suite = selenium.commands[sIndex][1];
			var testcase = suite[stestIndex];
			console.log(testcase[0],testcase[1],testcase[2]);
			sepage.render((cfg.pwd + '/test.png'), {
				format: 'png',
				quality: 50
			});
			setTimeout(function() {
				phantom.exit(0);
			}, 2500);
		},31000);

		self = this;

		self.setup(options);

		return(self.start());

	}

}

module.exports = exports = function(runnerInstance, options) {
 
	return Tests.init(runnerInstance, options);

}