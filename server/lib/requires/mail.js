var Mail = {

	server: null,

	nodemailer: require('nodemailer'),

	smtpTransport: null,

	from: 'Tyler Beck <tybeck@ebay.com>',

	subject: 'JavaScript Unit Test Suite - CQI',

	to_service: '@gsicommerce.com',

	envelope: require('../templates/envelope.js'),

	/**
	 * Send's mail.
	 * @method send
	 * @type Function
	 * @param {Object} options
	 */

	send: function(options, fn) {

		var changeset = options.commit.changeset;
		var server = options.server;

		var utils = server.utils,
			mail = server.mail;

		var revision = changeset.csid,
			author = changeset.author,
			comment = changeset.comment,
			pathArray = options.entry.paths[0].path,
			paths = [];

		for(var name in pathArray) {

			var pathName = pathArray[name]['_'];

			paths.push(pathName);

		}

		this.smtpTransport.sendMail({
			'from': mail.from,
			'to': author + mail.to_service,
			'subject': mail.subject,
			'html': utils.template(mail.envelope, {
				'jira': options.jira,
				'webpath': options.webpath,
				'time': options.time,
				'revision': revision,
				'author': author,
				'comment': comment,
				'errors': options.errors,
				'paths': paths
			})
		}, function (error, response) {

			if(typeof fn === 'function') fn();

		});

	},

	init: function(server) {

		this.server = server;

		this.smtpTransport = this.nodemailer.createTransport('SMTP', {
			host: server.config.smtp
		});

	}

}

module.exports = exports = Mail;