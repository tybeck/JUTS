juts.begin(function() {
	
	//test commit...
	//test commit2...

	var self = this;

	self.require([

		'gsi_pf_sf/jquery-1.7.2.js',
		'gsi_pf_sf/kor.base.js',
		'gsi_pf_sf/kor.data.js'

	], function() {

		self.beginSuite('Testing KOR', function() {

			this.assertExists(KOR, 'Does KOR exist?');

			this.assertExists(KOR.Instance, 'Does KOR.Instance exist?');

			this.assertExists(KOR.Instance('Data'), 'Does Data Instance exist?');

			this.assertExists(KOR.Instance('TestInstance'), 'Does TestInstance exist?');

		});

		self.beginSuite('Testing jQuery', function() {

			var s = this;

			this.assertExists($, 'Does jQuery exist?');

			this.assertExists($.ready, 'Can we find the ready event?');

			$.get('http://www.google.com', function() {

				s.assert(true, 'Was able to hit google with $.get');

				self.done();

			});

		});
		
	});

});
