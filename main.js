Game.registerMod("osak-cookie-clicker-mod", {
	init: function () {
		for (var i in Game.Objects) {
			var building = Game.Objects[i];
			var originalTooltip = building.tooltip;
			building.tooltip = function () {
				let str = originalTooltip.bind(this).call();
				if (this.locked || this.totalCookies == 0) {
					return str;
				}
				let singleCps = this.storedTotalCps / this.amount * Game.globalCpsMult;
				let amortize = this.price / singleCps;

				if (str.endsWith('</div>')) {
					str = str.slice(0, -6);
					str += '<div class="descriptionBlock"><b>' + Beautify(amortize) + '</b> seconds to amortize the cost</div>';
					str += '</div>';
				}
				return str;
			};
		};

	},
	save: function () {
		return "";
	},
	load: function (str) {
	}
});