juts.begin([
	function Homepage() {
		
		this.beginSuite('Testing Homepage', function() {

			this.assert(1==1,'yep');

			this.assertExistsSelector('#prBaseStylesheet', 'Does this selector exist?');

			this.assertNotExistsSelector('#1111prBaseStylesheet', 'Does this selector NOT exist?');

			this.assertVisible('.ws-container-login-utilities a', 'Are these all visible?');

			this.assertHasAttribute('.ws-header-login', 'data-test', 'Does this attribute exist?');

			this.screenshot();

		});

		this.open('login');

	},
	function Login() {

		this.beginSuite('TEST LOGIN', function() {
			
			this.assert(1 == 1, 'alrighty');

			this.screenshot();
		
		});

		this.done();

	},
	
]);
