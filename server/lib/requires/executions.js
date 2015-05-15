var Executions = {

	server: null,

	/**
	 * Check's the SVN log vs the revision information retrieved from Fisheye.  We'll then
	 * make sure we have JavaScript changes in the latest Fisheye revision (by looking at the
	 * files of the log from SVN); if changes are there, we'll continue to our testing.
	 * @method svnLogLookup
	 * @type Function
	 * @param {String} out Outputted Execution XML String
	 */

	svnLogLookup: function(out) {

		var server = this.server;

		var utils = server.utils,
			router = server.router,
			self = server.executions,
			proxied = this;

		if(out != null) {

			utils.parse(out, function(err, result) {

				var entry = result.log.logentry[0];

				var paths = entry.paths[0].path;

				if(!err) {

					if(utils.containsJS(paths, '_')) {

						utils.execute(utils.uInject(server.config.phantom, [(server.dir)]) + 
							' ' + server.isDevelopment() + 
							' ' + server.getPort() + 
							' ' + server.dir,
							server.proxy(
								utils.merge(proxied, {
									'complete': self.emailSentComplete,
									'begin': new Date().getTime(),
									'paths': paths,
									'entry': entry
								})
							, self.completedTests)
						);

					}

				}

			});

		} else {

			return this.next('Web Hook Error!');

		}

		return this.next();

	},

	/**
	 * Invoked when we are running our development environment; we directly want to run the tests; without
	 * any other systems.
	 * @method invokeTests
	 * @type Function
	 */

	invokeTests: function() {

		var server = this;
		var utils = server.utils,
			router = server.router,
			self = server.executions;

		utils.execute(utils.uInject(this.config.phantom, [(this.dir)]) + 
			' ' + this.isDevelopment() +
			' ' + this.getPort() + 
			' ' + server.dir,
			this.proxy({
				'begin': new Date().getTime(),
				'server': this
			}, self.completedTests)
		);

	},

	/**
	 * Callback for when PhantomJS finishes it's tests.
	 * @method completedTests
	 * @type Function
	 * @param {String} out Execution Output String 
	 */

	completedTests: function(out) {

		var self = this;
		var server = self.server;
		var mail = server.mail,
			utils = server.utils,
			router = server.router,
			db = server.db || null,
			end = new Date().getTime();

		var duration = ((end - self.begin) / 1000).toFixed(2);

		if(server.isDevelopment()) {

			server.builder.Development(out, duration);

		} else {

			server.builder.Automated(self, out, {
				'duration': duration,
				'end': end
			});

		}

	},

	/**
	 * Callback for when SMTP complete's sending mail.
	 * @method emailSentComplete
	 * @type Function
	 * @param {String} out Execution Output String
	 */

	emailSentComplete: function(out) {

		console.log(out);

		console.log('k');

	},

	init: function(server) {

		this.server = server;

	}

}

module.exports = exports = Executions;