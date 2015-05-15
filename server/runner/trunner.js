
/**
 * Primary Test Runner, used to initially setup.
 * @author Tyler Beck
 * @version 1.0.0
 */

var args = require('system').args,

	execFile = require('child_process').execFile,

	fs = require('fs'),

	utils = require('./modules/utils'),

	reporter = null,

	tests = null,

	self = null;

var Runner = {

	FAILED_PROPERTIES: 0,

	OK: 1,

	ERROR: 2,
	
	/**
	 * Width of our browser viewport
	 * @property width
	 * @type Integer
	 */

	width: 1024,

	/**
	 * Height of our browser viewport
	 * @property width
	 * @type Integer
	 */

	height: 768,

	config: {

		/**
		 * This is the property we are looking for within our 
		 * configuration file for our starting functional testing node.
		 * @property node
		 * @type String
		 */

		functional_node: 'juts_functional',

		intergration_node: 'juts_intergration',

		webpath: 'juts_webpath',

		/**
		 * Primary JUTS cartridge
		 * @property cartridge
		 * @type String
		 */

		cartridge: 'gsi_pf_juts',

		/**
		 * Received from command line arguments when CasperJS is started;
		 * this will tell us whether to output to terminal or that we are
		 * going to injecting into a database. 
		 * @property debugToTerminal
		 * @type Boolean
		 */

		developmentMode: null,

		serverPort: 80,

		dir: null,

		pwd: null,

		commandFile: 'commands.json',

		tmpFile: 'tmp.json'

	},

	kill: function(status, json) {

		json = json || '';

		console.log('{ "runner": {\
			"status": ' + status + '\
			' + json + '\
		}}');

		phantom.exit(0);

	},

	init: function() {

		self = this;
			
		this.developmentMode = (args[1] == 'true'),
		this.serverPort = String(args[2]);
		this.dir = String(args[3]);

		if(fs.isFile(this.dir + this.config.tmpFile)) {

			var data = JSON.parse(fs.read(this.dir + this.config.tmpFile)),
				selenium = JSON.parse(fs.read(this.dir + this.config.commandFile)),
				props = null;

			if(data && data.config) {

				self.setup.apply(self.config, [data.config, selenium]);

			}

		} else {

			this.kill(this.FAILED_PROPERTIES);

		}

	},

	setup: function(props, selenium) {

		reporter = new require('./modules/reporter').Reporter(this.developmentMode);

		tests = new require('./modules/tests')({
			'runner': self,
			'reporter': reporter,
			'selenium': selenium,
			'utilities': utils, 
			'json': props
		});

	}

}

Runner.init();