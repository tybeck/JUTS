var Builder = {

	server: null,

	FAILED_PROPERTIES: 0,
	 
	OK: 1,

	ERROR: 2,

	/**
	 * Build out the development environment information.
	 * @method Development
	 * @param {String} out
	 * @param {String} time
	 */

	Development: function(out, time) {

		var data = JSON.parse(out),
			server = this.server;

		var program = server.program;

		if(data.runner) {

			switch(data.runner.status) {

				case this.ERROR: 

				    var error = data.runner.error;

				    if(error) {

				    	server.msg('JUTS encountered an error with one of the test\'s and was unable to continue; please see below.\r\n');
					    
					    console.log(decodeURIComponent(error.msg));

					    if(error.trace && error.trace.length) {

					    	error.trace.forEach(function(item, index) {

					    		console.log('-> ' + item.file + ': ' + item.line + (item.function 
					    			? ' (in function "' + item.function + '")' : ''));

					    	});

					    }

					    console.log('');
					    
					    process.exit(0);

				    }

				break;

				case this.FAILED_PROPERTIES:

					server.kill('Failed to import properties; could not find temporary file!\r\n');

				break;

				case this.OK:

					if(data.runner.tests) {

						var openArg = program.open;

						if(openArg) {

							this.openResults(data, time);

						} else {

							this.terminalResults(data, time);

						}

					}

				break;

			}

		}

	},

	/**
	 * @method openResults
	 * @type Function
	 * @param {Object} data
	 * @param {String} time
	 */

	openResults: function(data, time) {

		var server = this.server;
		var utils = server.utils,
			self = this;
		
		var program = server.program;
		var showArg = program.showall;

		utils.fs.readFile(server.config.openTemplate, {
			'encoding': 'utf8'
		}, function(err, out) {

			if(!err) {

				var builtTemplate = utils.template(out, utils.merge(data, {
					'showall': showArg,
					'time': time
				}));
				
				var stream = utils.fs.createWriteStream(server.config.openIndex, {
					'flag': 'w'
				});
				
				stream.once('open', function() {

					stream.write(builtTemplate);
  					stream.end();

					var launcher = server.spawn('firefox', [server.config.openIndex]);
					server.msg('Opening Firefox to display results; please wait!');

					launcher.on('close', function() {

						server.kill('Finished.');

					});

				});

			}

		});

	},

	/**
	 * Show the suite information.
	 * @method showSuite
	 * @type Function
	 * @param {Object} suite
	 * @param {Boolean} arg
	 */

	showSuite: function(suite, arg) {

		suite.tests.forEach(function(test, currentIndex) {

			if(!test.condition) {
				console.log('          \u001b[41;1m' + (currentIndex + 1) + 
					'.)\u001b[0m ' + test.message);
			} else {
				if(arg) {
					console.log('          \u001b[42;1m' + (currentIndex + 1) + 
						'.)\u001b[0m ' + test.message);
				}
			}

		});

	},

	/**
	 * @method terminalResults
	 * @type Function
	 * @param {Object} data
	 * @param {String} time
	 */

	terminalResults: function(data, time) {

		var server = this.server,
			suites = data.runner.tests,
			selenium = data.runner.selenium,
			stats = data.runner.statistics,
			self = this;

		var program = server.program;
		var showArg = program.showall;

		suites.forEach(function(suite, index) {

			if(!suite.failed) {

				console.log('	' + suite.name + ' \u001b[32;1mCOMPLETE PASS\u001b[0m');
				self.showSuite(suite, showArg);

			} else {

				console.log('	' + suite.name + ' \u001b[41;1mFAIL\u001b[0m');
				self.showSuite(suite, showArg);

			}

		});

		if(selenium && selenium.tests &&
			selenium.tests.length) {

				console.log('');
				server.msg('Selenium Tests:\r\n');

				selenium.tests.forEach(function(item, index) {

					if(!item.passed) {

						console.log('          \u001b[41;1m' + (index + 1) + 
							'.)\u001b[0m ' + decodeURIComponent(item.test));

					} else {

						var command = item.test[0],
							target = item.test[1],
							value = item.test[2];

						console.log('          \u001b[42;1m' + (index + 1) + 
							'.)\u001b[0m ' + command + ' ' + target + ' ' + value);

					}

				});

		}

		console.log('\r');
		server.msg('Total Tests: ' + stats.total);
		server.msg('Total Time: ' + time + ' seconds');
		server.kill('Test Finished.\r\n');

	},

	Automated: function(built, data, info) {

		var webpath = built.request.protocol + '://' + built.request.get('host'),
			server = this.server;

		var router = server.router,
			utils = server.utils,
			db = server.db,
			mail = server.mail;

		data = JSON.parse(data);

		if(data && data.runner) {

			var sender = {
				'commit': built.commit,
				'paths': utils.getPathsArray(built.paths, '_'),
				'time': info.duration
			}
			
			switch(data.runner.status) {

				case this.ERROR: 

				    var error = data.runner.error;

				    if(error) {

				    	db.sendError(error, function() {
						
							db.sendReport(info.end, utils.merge(
								utils.merge(data.runner, sender)),
								null, true
							);

				    	});

				    }

				break;

				case this.OK:

					var errors = this.buildAutomatedErrors(data.runner);

					if(errors.length) {

						//utils.createTicket(server, built.commit, function(ticket) {

							var ticket = {
								'id': '123132312',
								'key': 'CQI-test'
							}

							db.sendReport(info.end, utils.merge(
								utils.merge(data.runner, sender), { 
									'jira': ticket 
								}), function() {

									/*mail.send(utils.merge(built, {
										'webpath': webpath,
										'time': info.end,
										'jira': ticket,
										'errors': errors
									}));*/

							});

						//});

					} else {

						db.sendReport(info.end, utils.merge(data.runner, sender));

					}

				break;

			}

			router.process();

		}

	},

	buildAutomatedErrors: function(data) {

		var errors = [];

		if(data.tests) {

			data.tests.forEach(function(suite, index) {

				var name = suite.name;
				var errs = {
					'name': name,
					'tests': []
				};

				if(suite.tests) {
					
					suite.tests.forEach(function(test, testIndex) {

						if(!test.condition) errs.tests.push(test.message);

					});

				}

				if(errs.tests.length) errors.push(errs);

			});

		}

		return errors;

	},

	init: function(server) {

		this.server = server;

	}

}

module.exports = exports = Builder;