var Envelope = '<html>\
	<body>\
	\
		<style type="text/css">\
			\
			.juts-info {\
				background: none repeat scroll 0 0 #C2E08B;\
				padding: 4px;\
			}\
			\
			.juts-wrap {\
				padding-bottom: 5px;\
				display: block;\
			}\
			\
			.juts-failed {\
				background: none repeat scroll 0 0 #FFD4C5;\
				margin-bottom: 5px;\
				padding: 4px;\
			}\
			\
			ul {\
				list-style-type: none;\
				margin-left: 5px;\
				padding-left: 0;\
			}\
			\
			h1 {\
				border-bottom: 1px;\
			}\
			\
			.juts-test-suite {\
				display: block;\
				font-weight: bold;\
				padding: 0;\
				margin: 0;\
			}\
			\
			.juts-test-desc {\
				display: block;\
				padding-left: 5px;\
				margin-bottom: 2px;\
				margin-top: 2px;\
				padding-bottom: 0;\
				padding-right: 0;\
				padding-top: 0;\
			}\
			\
		</style>\
		\
		<div>\
		\
			<h1>JUTS - Automation Report</h1>\
			\
			<p>\
				Hello <strong>{{this.author}}</strong>,\
			</p>\
			\
			<p>\
				After running through our automated javascript unit tests; issues were reported by JUTS that your commit\
				may have caused some tests to fail.\
			</p>\
			\
			<p class="juts-wrap juts-revision-wrap">\
				<strong class="juts-info">Revision:</strong> r{{this.revision}}\
			</p>\
			\
			<p class="juts-wrap juts-comment-wrap">\
				<strong class="juts-info">Commit Message:</strong> {{this.comment}}\
			</p>\
			\
			<p class="juts-wrap juts-file-wrap">\
				<strong class="juts-info">Files:</strong>\
			</p>\
			\
			<ul>\
				{% this.paths.forEach(function(path, index) { %}\
					{% var inx = (index + 1); %}\
					<li>{{inx}}.) {{path}}</li>\
				{% }); %}\
			</ul>\
			\
		</div>\
		\
		<div>\
		\
			<p>\
				<strong class="juts-failed">Failed Tests:</strong>\
			</p>\
			\
			{% this.errors.forEach(function(suite, index) { %}\
			<p class="juts-test-suite">{{suite.name}}</p>\
			<ul>\
				{% suite.tests.forEach(function(test, testIndex) { %}\
				<li>\
					<p class="juts-test-desc">{{ test }}</p>\
				</li>\
				{% }); %}\
			</ul>\
			{% }); %}\
			\
		</div>\
		\
		<div>\
		\
			<p class="juts-wrap">\
				<strong class="juts-info">For Your Review</strong>\
			</p>\
			\
			<p>\
				To get a more detailed look into the report that was generated; please see below.  We have also assigned\
				a CQI ticket and tasked it to you - please review this and resolve if possible.\
			</p>\
			\
			<ul>\
				<li>\
					<span>JUTS</span>\
					<a href="{{this.webpath}}/report/{{this.time}}">Report</a>\
				</li>\
				<li>\
					<span>JIRA Ticket:</span>\
					<a href="http://jira.tools.us.gspt.net/browse/{{this.jira.key}}">{{this.jira.key}}</a>\
				</li>\
			</ul>\
			\
		</div>\
		\
		<div>\
		\
			Thanks,\
			<br />\
			Product Team\
			\
		</div>\
		\
	</body>\
</html>';

module.exports = exports = Envelope;