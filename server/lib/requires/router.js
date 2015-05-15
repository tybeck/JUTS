var Router = {

	server: null,

	/** 
	 * Queue of webhooks; if a hook is already being processed; then wait
	 * for the current to finish.  This is where hooks are stored.
	 * @property queue
	 * @type Array
	 */

	queue: [],

	/**
	 * Tell's us if we are currently processing an webhook.
	 * @property processing
	 * @type Boolean
	 */

	processing: false,

	events: {

		onWebHookData: function(data) {

			this.data += data;

		},

		onWebHookFinished: function() {

			var router = this.router;
			
			if(!router.processing) {

				router.process({
					'commit': JSON.parse(router.data),
					'request': this.request,
					'next': this.next
				});

			} else {

				router.queue.push({
					'commit': JSON.parse(router.data),
					'request': this.request,
					'next': this.next
				});

			}

		}

	},

	/**
	 * Processes multiple incoming webhooks; this will take them in order; 
	 * after it finishes the first hook, it will goto the next hook received.
	 * @method process
	 * @type Function
	 * @param {Object} data
	 */

	process: function(data) {

		var router = this;
		var server = router.server;
		var utils = server.utils;

		if(!data && router.queue.length) {

			data = router.queue[0];
			router.queue.splice(0, 1);

		} else if(!data && !router.queue.length) {

			router.processing = false;
			return false;

		}

		var commit = data.commit;
		var repoURL = utils.uInject(server.config.repo, [commit.repository.name]);
		var repoSVN = utils.uInject(server.config.path2svn, [repoURL]);

		router.processing = true;

		utils.execute((repoSVN + commit.changeset.csid), 
			server.proxy({
				'commit': data.commit,
				'request': data.request,
				'next': data.next,
				'server': server
			}, server.executions.svnLogLookup)
		);

	},

	/**
	 * Contain's routes that will determine the logic of what happen for each particular
	 * URL routing we setup.
	 * @property Routes
	 * @type Object
	 */

	routes: {

		searchListener: function(req, res, next) {

			var query = req.params.query,

				self = this,

				utils = this.utils;

			return self.db.search(query, function(err, result) {

				if(!err && result) {					

					return res.render(self.paths.search + 'index.jade', utils.merge({
						'estTime': utils.getTimes(result)
					}, {
						'results': result
					}));

				}

				return res.render(self.paths.search + 'index.jade', []);

			});

		},

		webHookListener: function(req, res, next) {

			this.data = String();

	        req.on('data', this.server.proxy(this, this.events.onWebHookData));

	        req.on('end', this.server.proxy({
	        	'router': this,
	        	'request': req,
	        	'next': next
	        }, this.events.onWebHookFinished));

		},

		/**
		 * Web Report's that were generated by the Runner.
		 * @method webReportListener
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webReportListener: function(req, res, next) {

			var reportId = parseInt(req.params.id),
				
				self = this,

				utils = this.utils;

			return self.db.getReport(reportId, function(err, result) {

				if(!err && result) {

					return res.render(self.paths.reports + 'index.jade', utils.merge(result, {
						'datetime': utils.getEST(reportId),
						'version': self.APP_VERSION
					}));

				} 

				return next();

			}); 

		},

		/**
		 * Web Report Dashboard
		 * @method webReportDashboard
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webReportDashboard: function(req, res, next) {

			var self = this,

				utils = this.utils;

			self.db.getReports(function(err, reports) {
				
				self.db.getError(function(dberr, error) {

					var timesArr = utils.getTimes(reports);

					return res.render(self.paths.dash + 'index.jade', {
						'error': error ? error.error : null,
						'query': reports,
						'datetimes': timesArr,
						'version': self.APP_VERSION
					});

				});

			});

		},
		
		/**
		 * Web API - Page for downloading JUTS
		 * @method webCookbook
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webDownload: function(req, res, next) {

			var self = this;

			return res.render(self.paths.downloads + 'index.jade', {
				'version': self.APP_VERSION
			});

		},

		/**
		 * Web API - Page for learning on usage of JUTS
		 * @method webCookbook
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webUsage: function(req, res, next) {

			var self = this;

			return res.render(self.paths.usage + 'index.jade', {
				'version': self.APP_VERSION
			});

		},

		/**
		 * Web API - Page for learning about JUTS API.
		 * @method webCookbook
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webCookbook: function(req, res, next) {

			var self = this;

			return res.render(self.paths.cookbook + 'index.jade', {
				'version': self.APP_VERSION
			});

		},

		/**
		 * Web API - JUTS API.
		 * @method webApi
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webApi: function(req, res, next) {

			var self = this;

			return res.render(self.paths.api + 'index.jade', {
				'version': self.APP_VERSION
			});

		},

		/**
		 * Web API - JUTS Web Installer.
		 * @method webInstaller
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 * @param {Object} next
		 */

		webInstaller: function(req, res, next) {

			var server = this.server;
			var utils = server.utils;	

			res.writeHead(200, {'Content-Type': 'text/plain'});

			utils.fs.readFile(server.dir + server.paths.installer, 'utf-8', function(err, dat) {

				return res.end(dat);

			});

		},

		/**
		 * This capture's our testing files.
		 * @method testIndexListener
		 * @type Function
		 * @param {Object} req Request Object
		 * @param {Object} res Response Object
		 */

		testIndexListener: function(req, res, next) {

			return res.render('www/tests/index.html');

		}

	},

	/**
	 * Setup callbacks for specified url routes.
	 * @method createRoutes
	 * @type Function
	 */

	createRoutes: function() {

		this.server.app.get('/api/Search/:query', this.server.proxy(this.server, this.routes.searchListener));

		this.server.app.post('/api/WebHookListener', this.server.proxy(this, this.routes.webHookListener));
		
		this.server.app.get('/report/:id', this.server.proxy(this.server, this.routes.webReportListener));

		this.server.app.get('/test/index.html', this.server.proxy(this.server, this.routes.testIndexListener));

		this.server.app.get('/dashboard', this.server.proxy(this.server, this.routes.webReportDashboard));
		
		this.server.app.get('/', this.server.proxy(this.server, this.routes.webReportDashboard));

		this.server.app.get('/cookbook', this.server.proxy(this.server, this.routes.webCookbook));

		this.server.app.get('/downloads', this.server.proxy(this.server, this.routes.webDownload));

		this.server.app.get('/usage', this.server.proxy(this.server, this.routes.webUsage));

		this.server.app.get('/api', this.server.proxy(this.server, this.routes.webApi));

		this.server.app.get('/installer', this.server.proxy(this, this.routes.webInstaller));

	},

	init: function(server) {

		this.server = server;

		this.createRoutes();

	}

}

module.exports = exports = Router;