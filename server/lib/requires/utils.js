var Utils = {

	server: null,

	fs: require('fs'),

	/**
	 * Convert's XML to JavaScript Object Notation.
	 * @property parser
	 * @type Function
	 */

	parser: require('xml2js').parseString,

	/**
	 * Runs a command in a shell and buffers the output.
	 * @type Function
	 * @param {String} command The command we want to run in our shell.
	 * @param {Function} callback Called with the output returned from shell.
	 */

	exec: require('child_process').exec,

	template: function(template, data, opts) {
			
		var parser = new Function('utils', "var tok=[];tok.push('" + (template.replace(/\n|\r|'|\{\{(.*?)\}\}|\{%(.*?)%\}/g, function() {
			if (arguments[0] == "'") return "\\'";
			else if (arguments[0].charAt(1) == '{') return "'," + arguments[1] + ",'";
			else return "');" + arguments[2] + ";tok.push('";
		})) + "');return tok.join('');");

		var result = parser.call(data || window);
		
		if (opts && opts.cleanWhitespace) {
			result = result
				.replace(/\s+/g, ' ')
				.replace(/(^\s+|\s+$)/g, '');
		}

		return result;

	},

	createTicket: function(server, commit, fn) {

		var changeset = commit.changeset;
		var http = require('http'),

			data = String(),

			issue = JSON.stringify({
		    	'fields': {
		       		'project': { 
	          			'key': server.jira.projectName
		       		},
		       		'assignee': {
		       			'name': changeset.author
		       		},
		       		'summary': server.jira.summary + ' - r' + changeset.csid,
		       		'description': '\
		       			*SVN Revision #*: ' + changeset.csid + '\r\n\
		       			*SVN Comment*: ' + changeset.comment + '\r\n\
		       			\r\nPlease review this CQI that has been tasked to you; if you think this has been \
		       			incorrectly assigned, please contact the Storefront Team.\
		       		',
		       		'issuetype': {
		          		'id': server.jira.issueId
		       		}
	   			}
			}),

			options = {
				host: server.jira.host,
				port: 80,
				method: 'POST',
				path: server.jira.api,
				headers: {
					'Content-Type' : 'application/json',
					'Authorization': 'Basic ' + new Buffer(server.jira.username + 
						':' + server.jira.password).toString('base64'),
					'Content-Length' : issue.length
				}
			};

		var httpPost = http.request(options, function(res) {
		  res.on('data', function(chunk) {
		  	data += chunk;
		  });
		  res.on('end', function() {
		  	fn(JSON.parse(data));
		  });
		});

		httpPost.write(issue);
		httpPost.end();

	},

	/**
	 * Convert UTC to EST and return our results.
	 * @method getEST
	 * @type Function
	 * @param {Object} date
	 */

	getEST: function(date) {

		var dayArray = ['Sunday', 'Monday', 'Tuesday', 
		'Wednesday', 'Thursday', 'Friday', 'Saturday'];
		var monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 
		'July', 'August', 'September', 'October', 'November', 'December'];

		var offset = -5.0,
			dt = new Date(),
			rdt = new Date();

		rdt.setTime(date);
		var UTC = rdt.getTime() + (rdt.getTimezoneOffset() * 60000);
		dt.setTime(UTC + (3600000 * offset));

		var hours = dt.getHours(),
			minutes = dt.getMinutes();

		var ampm = (hours >= 12) ? "PM" : "AM",
			hrs = (hours > 12) ? hours - 12 : hours,
			mins = (minutes < 10) ? "0" + minutes : minutes,
			weekdayName = dayArray[dt.getDay()],
			month = monthArray[dt.getUTCMonth()],
			year = dt.getUTCFullYear(),
			day = dt.getUTCDate();

		return {
			hours: hrs,
			minutes: mins,
			weekday: weekdayName,
			month: month,
			year: year,
			day: day,
			ampm: ampm
		}

	},

	getTimes: function(data) {

		var times = [],

			self = this;

		data.forEach(function(item, index) {

			times.push(self.getEST(item.report.id));

		});
		
		return times;

	},

	/**
	 * Convert's XML to JSON.
	 * @method parse
	 * @type Function
	 * @param {String} out The XML you would like to convert.
	 * @param {Function} fn The callback function that will be invoked with the
	 * returned converted XML (to JSON).
	 */

	parse: function(out, fn) {
		
		this.parser(out, fn);

	},

	/**
	 * Execute's a shell command; then invokes an function provided with the returned
	 * contents of the shell execution.
	 * @method execute
	 * @type Function
	 * @param {String} command An command to execute in shell.
	 * @param {Function} funct An function that will be excuted upon shell execution and completion.
	 */

	execute: function(command, funct) {

		this.exec(command, function(error, stdout, stderr) {
			
			return (!error && !stderr.length) ?
				funct(stdout) :
				funct(null);

		});

	},

	/**
	 * Check's an SVN path object to see if any files from the current
	 * revision has any javascript files.
	 * @method containsJS
	 * @type Function
	 * @param {Object} obj The object containing SVN path info.
	 * @param {String} key The key which contains the file path.
	 */

	containsJS: function(obj, key) {

		var hasJS = false;

		for(var name in obj) {

			var path = obj[name][key];
			var extension = path.substr((~-path.lastIndexOf('.') >>> 0) + 2);

			if(extension === 'js') {

				hasJS = true;

			}

		}

		return hasJS;

	},

	getPathsArray: function(obj, key) {

		var paths = [];

		for(var name in obj) {

			var path = obj[name][key];
			
			paths.push(path);

		}

		return paths;

	},

	uInject: function(str, opts) {

		var i = -1;
		return str.replace(/\{\{(.*?)\}\}/g, function(match) {
			i++;
			return opts[i] ?
				opts[i] : 
				match;
		});
		
	},

	/**
	 * Merges two object's into one.
	 * @method merge
	 * @type Function
	 */

	merge: function(obj1, obj2) {

		for (var p in obj2) {
			
			try {

				if (obj2[p].constructor == Object) {

					obj1[p] = this.merge(obj1[p], obj2[p]);

				} else {

					obj1[p] = obj2[p];

				}

			} catch(e) {

				obj1[p] = obj2[p];

			}
		
		}

		return obj1;

	},

	init: function(server) {

		this.server = server;

	}

}

module.exports = exports = Utils;