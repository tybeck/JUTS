/**
 * This application provide's an automated unit testing environment, which
 * can also be used as an development environment with simple configuration
 * changes.  This tool is meant to be used by JavaScript developers to provide
 * sanity checks.  If you have any questions; please contact the storefront team.
 * @author: Tyler Beck
 * @version: 1.0.0
 */

 'use strict';

var express = require('express'),

	fs = require('fs'),

	stream = null,

	/**
	 * Configuration properties for our server.
	 * @property config
	 * @type Object
	 */

	config = {

		/**
		 * The port our application server will be listening on.
		 * @property APP_PORT
		 * @type Integer
		 */

		APP_PORT: 80,

		DEV_PORT: 4445,

		/**
		 * @property ENVIRONMENT
		 * @type String
		 */

		ENVIRONMENT: 'development',

		WWW_LIB: __dirname + '/www/lib',

		SCREENSHOT_LIB: __dirname + '/www/lib/screenshots/',

		LIB: __dirname + '/lib'

	},

	Server = null,

	/**
	 * Statics 
	 * @property statics
	 * @type Object
	 */

	statics = {

		ENV_TYPES: { 
	
			DEVELOPMENT: 'development', // our development environment
			PRODUCTION: 'production' // our production environment
		
		}
	
	} // end of statics type

Server = {
	
	modules: ['router', 'executions', 'mail', 'db', 'builder'],
	extensions: ['utils', 'fetcher'],

	APP_VERSION: '0.0.46',

	fetcher: null,

	/**
	 * Creates an express application.
	 * @property app
	 * @type Object
	 */

	app: null, 

	/**
	 * Creates our database object
	 * @property db
	 * @type Class
	 */

	db: null,

	/**
	 *
	 * @property utils
	 * @type Class
	 */

	utils: null,

	/**
	 * 
	 * @property router
	 * @type Class
	 */

	router: null,

	/**
	 * 
	 * @property executions
	 * @type Class
	 */

	executions: null,
	
	/**
	 * 
	 * @property builder
	 * @type Class
	 */
	
	builder: null,

	/**
	 * 
	 * @property mail
	 * @type Class
	 */

	mail: null,

	/**
	 * Empty object for storage of retrieved properties from configuration file.
	 * @property cfg
	 * @type Object
	 */

	'cfg': new Object(),

	execFile: require('child_process').execFile,

	spawn: require('child_process').spawn,

	/**
	 * Helper for creating meta data for available argument options.
	 * @property program
	 * @type Class
	 */

	program: require('commander'),

	/**
	 * Configuration properties for the server that are more likely to change.
	 * @property config
	 * @type Object
	 */

	'config': {

		functional_node: 'juts_functional',

		intergration_node: 'juts_intergration',

		path2selenium: '/staticfiles/cartridge/static/default/selenium/',
		
		path2js: '/staticfiles/cartridge/static/default/js/',

		path: '{{}}/source/{{}}{{}}',

		/**
		 * If MongoDB cannot be found; we'll create one.
		 * @property db_mongo
		 * @type String
		 */

		db_mongo: 'lib/scripts/mongo.sh',

		/**
		 * Database Instance; Check's to see if our mongo
		 * application is running or not...
		 * @property db_instance
		 * @type String
		 */

		db_instance: 'lib/scripts/instance.sh',

		/**
		 * Get properties from main cartridge.
		 * @property props
		 * @type String
		 */

		props: 'lib/scripts/getprops.sh',

		/**
		 * Get updates for our application.
		 * @property updater
		 * @type String
		 */

		updater: 'lib/scripts/getupdates.sh',

		/**
		 * Get our selenium-written scripts.
		 * @property updater
		 * @type String
		 */

		selenium: 'lib/scripts/getselenium.sh',

		/**
		 * Primary JUTS cartridge
		 * @property cartridge
		 * @type String
		 */

		cartridge: 'gsi_pf_juts',

		/**
		 * Path to our SMTP server
		 * @property smtp
		 * @type String
		 */

		smtp: 'secdevnet.gspt.net',

		/**
		 * Repository location for product.
		 * @property repo
		 * @type String
		 */

		repo: 'http://svn.gspt.net/phx/v11ext/Source/v11/components/{{}}/',

		/**
		 * Shell command to execute to run our reports.
		 * @property phantom
		 * @type String
		 */

		phantom: 'phantomjs --ignore-ssl-errors=true --web-security=false {{}}runner/trunner.js',

		path2svn: 'svn --xml -v log {{}} --username=v11refstoreteam --password=v11refstoreteam --no-auth-cache --non-interactive -c ',

		/**
		 * Open link we use to open up firefox.  This path is generated
		 * via an template we build out.
		 * @property openlink
		 * @type String
		 */

		openLink: 'firefox "file://$(pwd)/runner/reports/index.html"',

		openTemplate: 'runner/reports/template.html',

		openIndex: 'runner/reports/index.html',

		/**
		 * Debug to terminal; or report normally using runner reports?
		 * NOTE: With this option turned ON (true), emails / tickets will not be
		 * created for output in terminal.
		 * TRUE: Development Environment Mode
		 * FALSE: Automated Debugging / Testing / Notification mode
		 * @property developmentMode
		 * @type Boolean
		 */

		developmentMode: true,

		commandFile: 'commands.json',
		
		tmpFile: 'tmp.json'

	},

	'jira': {

		summary: 'JUTS - Automation Report',

		api: '/rest/api/2/issue/',

		host: 'jira.tools.us.gspt.net',

		username: 'devintserver',

		password: 'd3v1nts3rv3r',

		projectName: 'CQI',

		issueId: '1'

	},

	'paths': {

		/**
		 * Path to Reports Directory
		 * @property reports
		 * @type String
		 */

		reports: 'www/reports/',
		
		/**
		 * Path to Search Directory
		 * @property reports
		 * @type String
		 */

		search: 'www/search/',

		/**
		 * Path to Dashboard Directory
		 * @property reports
		 * @type String
		 */

		dash: 'www/dashboard/',

		/**
		 * Path to Cookbook Directory
		 * @property reports
		 * @type String
		 */

		cookbook: 'www/cookbook/',

		/**
		 * Path to Downloads Directory
		 * @property reports
		 * @type String
		 */

		downloads: 'www/downloads/',

		/**
		 * Path to Usage Directory
		 * @property reports
		 * @type String
		 */

		usage: 'www/usage/',

		/**
		 * Path to API Directory
		 * @property api
		 * @type String
		 */

		api: 'www/api/',

		/**
		 * Path to Installer File
		 * @property installer
		 * @type String
		 */

		installer: 'www/lib/downloads/installer.sh'

	},

	'command': {

		fetch: function() {

			this.doFetch = true;

		},

		tests: function() {

			console.log('okay');

		},

		setup: function() {

			console.log('setup');

		}

	},

	/**
	 * Tell's us to only fetch; then exit.
	 * @property doFetch
	 * @type Boolean
	 */

	doFetch: false,
	
	/**
	 * Tell's us to run only specific tests.
	 * @property doTests
	 * @type Boolean
	 */

	doTests: false,

	/**
	 * Current directory of our server application.
	 * @property dir
	 * @type String
	 */

	dir: __dirname + '/',

	/**
	 * Are we running an development environment?
	 * @method isDevelopment
	 * @type Function
	 */

	isDevelopment: function() {

		return this.config.developmentMode;

	},

	/**
	 * Check's if our eserver application is running; this is only needed
	 * if we have an intergration testing node.  If this isn't found; we don't
	 * need an eserver application.
	 * @method isAppServerRunning
	 * @type Function
	 */

	isAppServerRunning: function() {

		var intergrationPath = this.cfg.properties[this.config.intergration_node];

		if(!intergrationPath || !intergrationPath.length) {

			return true;

		} else {

			if(this.cfg.running) {

				return true;

			}

		}

		this.msg('eServer Application is not running!  Please make sure your eserver' + this.cfg.devnumber + ' is running.');
		this.msg('Since you have an intergration node ("' + intergrationPath + '") configured, this');
		this.kill('requires the webstore.\r\n');

	},

	isAppModified: function() {

		this.msg('Reviewing JUTS...');

		if(this.cfg.modifications) {

			this.msg('JUTS is out of date and will need to be updated before running.');

			this.execFile('bash', [this.config.updater], null, this.proxy(this, this.getUpdates));

			return true;

		}

		return false;

	},

	/**
	 * Did we want to start as an web application?
	 * @method isWebApplication
	 * @type Function
	 */

	isWebApplication: function() {
		
		if(this.program.webapp) {
		
			this.config.developmentMode = false;
		
		}

	},

	/**
	 * Get current port we should use (this is different for development / automation).
	 * @method getPort
	 * @type Function
	 */

	getPort: function() {

		return(this.isDevelopment() ? config.DEV_PORT : config.APP_PORT);

	},

	/**
	 * Get arguments from current process thread
	 * @method getArguments
	 * @type Function
	 */

	getArguments: function() {

		return process.argv.splice(2);

	},

	/**
	 * Callback function for executing a child process for our 
	 * properties gatherer script.
	 * @method getProperties
	 * @type Function
	 */

	getProperties: function(err, stdout, stderr) {

		var self = this;

		if(err == null && !stderr.length) {

			var data = JSON.parse(stdout);

			if(!data || !data.config) {

				self.kill('Properties returned malformed data! Exiting...\r\n');

			} else {

				self.createReadableProperties(stdout, data);

			}

		} else {

			self.kill('Could not gather properties! Exiting...\r\n');

		}

	},

	/**
	 * Create readable properties from our Java-Based Properties.
	 * @method createReadableProperties
	 * @type Function
	 */

	createReadableProperties: function(out, data) {

		var self = this;
		var stream = fs.createWriteStream(self.dir + self.config.tmpFile);

		stream.once('open', function(fd) {

			stream.write(out);
		  
			stream.end();

			self.cfg = data.config;

			self.construct(self.extensions);

			if(self.doFetch) {
				
				self.fetcher.getTests();

			} else if(self.doTests) {

			} else {

				self.fetcher.getTests(function() {
					
					self.requirements();	
				
				});

			}

		});

	},

	/**
	 * After SVN is done updating; we'll be returned here, they'll need to restart
	 * for updates to take full affect (depending on what was updated.)
	 * @method getUpdates
	 * @type Function
	 */

	getUpdates: function() {

		this.kill('JUTS has been updated; please rerun to continue...\r\n');

	},

	/**
	 * 
	 * @method configure
	 * @type Function
	 */

	configure: function Configure(server) {

		var app = this;

		app.configure(function() {

			app.set('views', server.dir);

			app.engine('.html', require('ejs').renderFile);
			app.engine('.jade', require('jade').__express);

			app.use('/screenshots', express.static(config.SCREENSHOT_LIB));
			app.use('/reports', express.static(config.WWW_LIB));
			app.use(express.static(config.LIB));

		});

		switch(config.ENVIRONMENT) {

			case statics.ENV_TYPES.DEVELOPMENT:
							
				app.configure(statics.ENV_TYPES.DEVELOPMENT, function() {
				
					// configure our expressjs middleware for 
					// our development environment

					app.set('view options', { 
						pretty: true 
					});
					
					app.use(express.errorHandler({
						dumpExceptions: true,
						showStack: true
					}));
				
				});
			
			break; // end of development environment configurations
			
			case statics.ENV_TYPES.PRODUCTION:
			
				app.configure(statics.ENV_TYPES.PRODUCTION, function() {
				
					// configure our expressjs middleware for
					// our production environment

					app.set('view options', { 
						pretty: false 
					});
					
					app.use(express.errorHandler()); // don't report
					//  errors; just generic 'internal' errors
				
				});
			
			break; // end of production environment configurations

		} // end of switch-statement

	},

	construct: function(extensions) {

		var j = 0;

		for (; j < extensions.length; j++) {

			var name = extensions[j];

			this[name] = require('./lib/requires/' + name);

			if(this[name].init) this[name].init(this);

		}

	},

	msg: function(message) {

		console.log('\x1B[1m\x1B[33m## JUTS ##\x1B[39m\x1B[22m ' + message);

	},

	kill: function(message) {

		this.msg(message);

		process.exit(0);

	},

	/**
	 * Proxies an object into the 'this' object of an listener.
	 * @method proxy
	 * @type Function
	 */

	proxy: function(obj, route) {

		return(function() {
			return route.apply(obj, arguments);
		});

	},

	createHelper: function() {

		console.log('  Examples:\r\n');
		console.log('    $ jutstest<eserver> fetch');
		console.log('    $ jutstest<eserver> tests\r\n');

	},

	setup: function() {

		this.msg('v' + this.APP_VERSION);
		this.msg('Welcome to JavaScript Unit Testing Suite\r\n');

		this.program.version(this.APP_VERSION);
		
		this.program.option('-w, --webapp', 'Set JUTS as a server.');

		if(this.isDevelopment()) {

			this.program.option('-o, --open', 'Open report in default browser.');
			this.program.option('-s, --showall', 'Show all tests results.');
			this.program.option('-t, --tests', 'Run an specific list of tests.');

			this.program
				.command('fetch')
				.description('Fetch all runnable tests (Functional, Intergration, Selenium).')
				.action(this.proxy(this, this.command.fetch));

			this.program
				.command('setup')
				.description('Allows you to change the current setup of juts ' + 
					'including webstore testing order, add / remove webstores, and more.')
				.action(this.proxy(this, this.command.setup));

			this.program
				.command('tests')
				.description('Run an specific list of tests.')
				.action(this.proxy(this, this.command.tests));

			this.program.on('--help', this.createHelper);

		}

		this.program.parse(process.argv);

		this.run();

	},                       

	/**
	 * Run our first startup initialization.
	 * @method run
	 * @type Function
	 */

	run: function Run() {

		this.isWebApplication();

		this.msg('Gathering Properties...');

		this.execFile('bash', [(this.dir + this.config.props), this.config.cartridge, 
			this.dir], null, this.proxy(this, this.getProperties));

	},

	/**
	 * Start our application server.
	 * @method Start
	 * @type Function
	 */

	start: function Start() {

		var PORT = this.getPort();

		this.app = express();

		this.configure.apply(this.app, [this]);
		
		this.construct(this.modules);

		if(this.isDevelopment()) {

				this.msg('Running Unit Tests... please wait!\r\n');

				this.executions.invokeTests.apply(this);

			} else {

				this.msg('Running localhost:' + PORT + 
					' @ ' + config.ENVIRONMENT + ' environment...\r\n');

		}

		this.app.listen(PORT);

	},

	/**
	 * Requirements necessary in order to properly run an development environment 
	 * or automated testing server.
	 * @method requirements
	 * @type Function
	 */

	requirements: function Requirements() {

		if(!this.isAppModified()) {

			var requirements = [this.isAppServerRunning()],
				passed = true;

			requirements.forEach(function(requirement, index) {
				if(!requirement) passed = false;
			});

			if(passed) this.start();

		}
	
	}

}

module.exports.Server = Server;

Server.setup();