$(function() {

	var doc = $(document),

		self = null;

	var juts = {

		delay: 750,

		events: {

			crowdLink: function(ev) {

				var target = $(ev.currentTarget);

				target.closest('form').submit();

			},

			svnToggle: function(ev) {

				var target = $(ev.currentTarget);
				var svn = target.closest('.juts-svn');

		        switch(target.text()) {

		        	case '-':

				        svn.animate({ 
				            height: 25
				        }, 500);

		        		target.text('+');

		        	break;
		        	case '+':

		        		var contentHeight = svn.css('height', '')
		        			.addClass('juts-svn-auto').height();

				        svn.removeClass('juts-svn-auto').animate({ 
				            height: contentHeight
				        }, 500);

		        		target.text('-');

		        	break;

		        }

			},

			searchKeyup: function(ev) {

				var target = $(ev.currentTarget);
				self.lastTimestamp = new Date().getTime() || 0;

				setTimeout(function() {

					var currentTimestamp = new Date().getTime();

					if(currentTimestamp >= (self.lastTimestamp + self.delay)) {
						
						$.get('/api/Search/' + target.val(), function(data) {

							$('.juts-report-results').html(data);

						});

					}

				}, self.delay);

			},

			searchClick: function(ev) {

				var target = $(ev.currentTarget);

				if(target.val().length) {

					console.log('popup previous results.');

				}

			}

		},

		registerEvents: function() {

			doc.on('click', '.juts-crowd-link', this.crowdLink);
			doc.on('click', '.juts-svn-toggle', this.svnToggle);
			doc.on('keyup', '.juts-search-text', this.searchKeyup);
			doc.on('click', '.juts-search-text', this.searchClick);

		},

		init: function() {

			self = this;

			self.registerEvents.apply(this.events);

		}

	}

	juts.init();

});