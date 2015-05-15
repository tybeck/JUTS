
/**
 * 
 * @author Tyler Beck
 * @version 1.0.0
 */

exports.Reporter = function() {

	var fs = require('fs'),

		util = require('./utils'),

		streaming = false,

		suiteCount = 0,
		testCount = 0,

		report = '',
		suites = '',
		tests ='';

	this.startReporter = function() {

		var reportTime = new Date().getTime();
		
		streaming = true;

		report = '{ "report": { "suites": [';

		return reportTime;

	}

	this.closeReporter = function() {

		if(streaming) {

			report += suites + '] }}';

			return report;

		}

		return false;

	}

	this.createSection = function(options) {
		
		if(streaming) {

			suites += (suiteCount != 0 ? ',' : '') + '{ "name": "' + 
			options.suite + '", "tests": [';
			suiteCount++;

		}

	}

	this.closeSection = function(suite) {

		if(streaming) { 

			suites += tests + '], \
				"duration": "' + suite.calculateDuration() + '",\
				"assertions": "' + suite.assertions + '",\
				"passed": "' + suite.passed + '",\
				"failed": "' + suite.failed + '",\
				"rate": "' + ((suite.passed / suite.assertions) * 100) + '",\
				"state": "' + (suite.passed == suite.assertions ? 
					'1' : 
						(suite.passed != 0 && suite.passed != suite.assertions ?
							'2' :
							'3'
						)
					) + '"\
			 }';
			tests = '';
			testCount = 0;

		}

	}

	this.passTest = function(message) {

		if(streaming) {

			tests += (testCount != 0 ? ',' : '') + '{ "condition": "true",\
			"message": "' + message +'" }';
			testCount++;

		}

	}

	this.failTest = function(options) {

		if(streaming) {

			tests += (testCount != 0 ? ',' : '') + '{ "condition": "false",\
			"message": "' + options.error.message +'" }';
			testCount++;

		}

	}

	return this;

}