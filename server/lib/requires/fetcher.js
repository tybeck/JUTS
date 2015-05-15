var Fetcher = { 

	server: null,

	xml: require('libxmljs'),

	/**
	 * Grab's all Selenium, Functional, and Intergration tests.
	 * @method getTests
	 * @type Function
	 * @param {Function} fn A callback function to invoke after we are finished.
	 */

	getTests: function(fn) {

		var self = this;
		var server = self.server;

		self.fn = fn,
		self.scripts = {
			'commands': []
		},
		self.suiteCases = [],
		self.inx = 0;

		server.msg('Gathering Tests...');

		server.execFile('bash', [server.dir + server.config.selenium, self.seleniumPath], null, 
			function(err, stdout, stderr) {

				if(!err && !stderr.length) {

					self.suites = stdout.replace(/\n/g, '').split(',');

					self.seleniumStep();

				}

		});
		
	},

	seleniumToFile: function(arr, index, stepindex) {

		stepindex = (!stepindex ? 0 : stepindex);

		var file = arr[stepindex],

			self = this;

		var server = self.server;
		var utils = server.utils;

		if(file) {

			utils.fs.readFile(self.seleniumPath + file, 'utf-8', function(err, data) {
				
				data = self.replaceTags(data);

				var testXml = self.xml.parseXml(data);
				var suiteName = testXml.get('/html/body/table/thead[1]/tr[1]/td[1]').text();

				self.scripts.commands.push([suiteName, []]);
				self.inx++;

				testXml.get('/html/body/table/tbody').find('tr').forEach(function(node, index) {

					var command = node.get('td[1]').text();
					var target = node.get('td[2]').text();
					var value = node.get('td[3]').text();

					self.scripts.commands[self.inx - 1][1].push([command, target, value])

				});

				self.suiteCases[index][1].push(suiteName);
				self.seleniumToFile(arr, index, ++stepindex);

			});

		} else {

			self.seleniumStep(++index);

		}

	},

	/**
	 * Replaces necessary tags / attributes within selenium documents;
	 * we do this because "libxmljs" parser will become invalid otherwise.
	 * @method replaceTags
	 * @type Function
	 * @param {String} data
	 */

	replaceTags: function(data) {

		data = data.replace(/\<\!DOCTYPE.*\>/ig, '');
		data = data.replace(/xmlns=\".*\"/ig, '');

		return data;

	},

	seleniumStep: function(index) {

		index = (!index ? 0 : index);

		var self = this;

		var suite = self.suites[index];
		var server = self.server;
		var utils = server.utils;

		if(suite) {

			utils.fs.readFile(self.seleniumPath + suite, 'utf-8', function(err, data) {
				
				data = self.replaceTags(data);
				
				var suiteXml = self.xml.parseXml(data);
				var table = suiteXml.get('/html/body/table[@id="suiteTable"]/tbody'),
					suitePaths = [];

				table.find('tr/td').forEach(function(node, index) {	

					if(index > 0) suitePaths.push(node.find('a')[0].attr('href').value());

				});

				self.suiteCases.push([suite, []]);
				self.seleniumToFile(suitePaths, index);

			});

		} else {

			switch(true) {

				case(server.doFetch == true):

					self.evaluateTestNodes();

				break;

				default:

					self.seleniumFinished();

				break;

			}

		}

	},

	evaluateTestNodes: function() {

		var self = this;
		var server = self.server;
		var utils = server.utils;

		var functionalPath = utils.uInject(server.config.path, [server.cfg.pwd, server.config.cartridge + 
			server.config.path2js, server.cfg.properties[server.config.functional_node]])

		var intergrationPath = utils.uInject(server.config.path, [server.cfg.pwd, server.config.cartridge + 
			server.config.path2js, server.cfg.properties[server.config.intergration_node]])

		utils.fs.readFile(functionalPath, 'utf-8', function(err, dataFunctional) {
			utils.fs.readFile(intergrationPath, 'utf-8', function(derr, dataIntergration) {
				
				if(!err && !derr) {

					var suitesFunctional = self.findSuites(dataFunctional);
					var suitesIntergration = self.findSuites(dataIntergration);

					console.log('');
					server.msg('Available Selenium Tests:');

					if(self.suiteCases.length) {

						self.suiteCases.forEach(function(suite, index) {
							server.msg('Suite Name: ' + suite[0]);
							suite[1].forEach(function(testcase, testIndex) {
								console.log((testIndex + 1) + '.) ' + testcase)
							});
						})

					}

					console.log('');
					server.msg('Functional Tests:');

					suitesFunctional.forEach(function(test, index) {
						console.log((index + 1) + '.) ' + test);
					});

					console.log('');
					server.msg('Intergration Tests:');
					suitesIntergration.forEach(function(test, index) {
						console.log((index + 1) + '.) ' + test);
					});
					console.log('');
				}

			});
		});

	},

	findSuites: function(data) {

		var index = 0,
			searchString = String('beginSuite('),
			suites = [];

		while(true) {

			index = data.indexOf(searchString, index + 
				(index != 0 ? searchString.length : 0));

			if(index === -1) {
				
				break;

			}

			var lastIndex = data.indexOf(',', (index + 1));
			var suiteName = data.substr(index + searchString.length, 
				lastIndex - index - searchString.length);

			suites.push(suiteName.replace(/'*"*/g, ''));

		}

		return suites;

	},

	seleniumFinished: function() {

		var self = this;
		var server = self.server;
		var utils = server.utils;

		var stream = utils.fs.createWriteStream(server.dir + server.config.commandFile);

		stream.once('open', function(fd) {

			stream.write(JSON.stringify(self.scripts));
		  
			stream.end(function() {

				if(typeof self.fn === 'function') {
					
					self.fn();

				}

			});

		});

	},

	setup: function() {

		var server = this.server;
		var utils = server.utils;

		this.seleniumPath = (utils.uInject(server.config.path, [server.cfg.pwd, 
			server.config.cartridge, server.config.path2selenium]));

	},

	init: function(server) {

		this.server = server;

		this.setup();

	}

}

module.exports = exports = Fetcher;