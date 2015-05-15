
/**
 * 
 * @author Tyler Beck
 * @version 1.0.0
 */

module.exports = exports = {

	uInject: function(str, opts) {

		var i = -1;
		return str.replace(/\{\{(.*?)\}\}/g, function(match) {
			i++;
			return opts[i] ?
				opts[i] : 
				match;
		});
		
	},

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

	getName: function(obj) {

		for(var name in obj) return name;

	}

}