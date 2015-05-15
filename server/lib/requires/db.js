var Connection = { 

	db: null,

	server: null,

	mongoose: require('mongoose'),

	Schema: null,

	ReportSchema: null,

	Report: null,

	ErrorSchema: null,

	Error: null,

	journaled: true,

	alerted: false,

	jalerted: false,

	events: {

		connectionError: function() {

			var server = this.server,
				self = this;

			setTimeout(function() {

				self.reopenConnection();

			}, 2500)

		},

		connectionOpen: function() {

			this.msg('Database connection established.');

			this.journaled = true;
			this.jalerted = false;
			this.alerted = false;

		}

	},

	reopenConnection: function() {

		var server = this.server;
		var utils = server.utils,
			self = this;

		if(self.journaled) {

			utils.fs.readdir(server.dir + 'bin/data/db', function(err, files) {

				var spawn = server.spawn('bash', [(server.dir + server.config.db_mongo), server.dir]);

				if(!files.length) {

					self.journaled = false;

					server.msg('JUTS cannot find any MongoDB journals.');
					server.msg('MongoDB is in the process of creating an journal, please wait...');

					self.checkInstance();

				} else {
					
					if(!self.jalerted) {
						server.msg('Trying to establish connection to database, please wait...');
						self.jalerted = true;
					}

					self.checkInstance();

				}

			});

		} else {

			if(!self.alerted && !self.journaled) {
				server.msg('Processing...');
				self.alerted = true;
			}

			self.checkInstance();

		}

	},

	checkInstance: function() {

		var server = this.server,
			self = this;

		server.execFile('bash', [(server.dir + server.config.db_instance)], null, function(err, stdout, stderr) {
		
			if(!err && !stderr.length &&
				stdout.length) {

				self.createConnection();

			} else {

				self.checkInstance();

			}

		});

	},

	createConnection: function() {

		this.mongoose.connect('mongodb://localhost/juts');

		this.db = this.mongoose.connection;

	},

	sendReport: function(id, data, fn, keeperr) {
		
		var self = this;

		if(keeperr) {

			self.sendReportAysnc(id, data, fn);

		} else {

			self.removeError(function() {

				self.sendReportAysnc(id, data, fn);

			});

		}

	},

	sendReportAysnc: function(id, data, fn) {

		var self = this;
		var utils = self.server.utils;

		var CompiledReport = new self.Report({ 
			'report': utils.merge({
				'id': id
			}, data)
		});

		CompiledReport.save(function(err, data) {

			if(typeof fn === 'function') fn(err, data);

		});

	},

	sendError: function(data, fn) {

		var self = this;

		self.removeError(function() {

			var CompiledError = new self.Error({
				'error': data
			});

			CompiledError.save(function(err, data) {

				if(typeof fn === 'function') fn(err, data);

			});

		});

	},

	removeError: function(fn) {

		this.Error.find({}).remove().exec(function(err, success) {

			if(typeof fn === 'function') fn(err, success);

		});

	},

	getError: function(fn) {

		this.Error.findOne({}).exec(function(err, errors) {

			if(typeof fn === 'function') fn(err, errors);

		});

	},

	getReport: function(id, fn) { 

		this.Report.findOne({ 'report.id' : parseInt(id) }, function(err, result) {

			if(typeof fn === 'function') fn(err,result);

		});

	},

	getReports: function(fn) {

		this.Report.find({}).sort({ '_id': -1 }).limit(8).exec(function(err, reports) {

			if(typeof fn === 'function') fn(err, reports);

		});

	},

	search: function(query, fn) {

		var re = new RegExp(query, 'ig');

		this.Report.find(
			{ $or: [
				{ $where: re + '.test(this.report.id)' },
				{ 'report.commit.changeset.author': { $regex: re } },
				{ 'report.commit.repository.name': { $regex: re } },
				{ 'report.jira.key': { $regex: re } }
			] }).limit(4).exec(function(err, result) {

				fn(err, result);

		});

	},

	registerEvents: function() {

		this.db.on('error', this.server.proxy(this, this.events.connectionError));

		this.db.once('open', this.server.proxy(this.server, this.events.connectionOpen));

	},

	init: function(server) {

		this.server = server;

		this.Schema = this.mongoose.Schema;

		this.ReportSchema = new this.Schema({ 'report': { } });
		this.Report = this.mongoose.model('reports', this.ReportSchema);

		this.ErrorSchema = new this.Schema({ 'error': { } });
		this.Error = this.mongoose.model('errors', this.ErrorSchema);

		if(!server.isDevelopment()) {

			this.createConnection();

			this.registerEvents();

		}

	}

}

module.exports = exports = Connection;
