Game.registerMod("osak-cookie-clicker-mod", {
	init: function () {
		this.installAmortizationTimeDisplay();
		this.installStockNetWorthDisplay();
	},
	save: function () {
		return "";
	},
	load: function (str) {
	},
	installAmortizationTimeDisplay() {
		for (var i in Game.Objects) {
			var building = Game.Objects[i];
			var originalTooltip = building.tooltip;
			building.tooltip = function () {
				let str = originalTooltip.call(this);
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
	installStockNetWorthDisplay() {
		const bank = Game.Objects['Bank'];
		const MOD = this;

		// The game dynamically loads minigame script after it launched and the building is determined to have reached the level.
		// Game.scriptLoaded is the earliest possible place to hook into after the script is loaded.
		Game.scriptLoaded = this.addHook(Game.scriptLoaded, function(_, who, script) {
			// `script` is internal script ID, which consists of the fixed string and numerical ID of the building.
			if (script != 'minigameScript-' + bank.id) {
				return;
			}

			// At this point, minigame is loaded and instantiated via launch() method.
			const market = bank.minigame;

			// Additional init logic - overriding init() doesn't take effect because launch() calls init() at the end.
			const bankHeader = l('bankHeader');
			const firstLine = bankHeader.children[0].children[0]; // Profits: ...
			firstLine.insertAdjacentHTML('beforeend', '<br>Net worth: <span id="bankNetWorth">$0</span>');

			// Net worth calculation and add hooks to property update the value.
			market.netWorth = 0;
			market.buyGood = MOD.addHook(market.buyGood, function () {
				this.updateNetWorth();
			});
			market.sellGood = MOD.addHook(market.sellGood, function () {
				this.updateNetWorth();
			});
			market.tick = MOD.addHook(market.tick, function () {
				this.updateNetWorth();
			});
			market.updateNetWorth = function () {
				let netWorth = this.profit;
				for (good of this.goodsById) {
					netWorth += good.stock * good.val;
				}
				this.netWorth = netWorth;
		
				const elem = l('bankNetWorth');
				MOD.printStockValueInto(elem, this.netWorth);
			};

			// Kick off
			market.updateNetWorth();
		});
	},
	addHook(func, hook) {
		return function(...args) {
			const originalRet = func.call(this, ...args);
			const hookRet = hook.call(this, originalRet, ...args);
			if (hookRet === undefined) {
				return originalRet;
			} else {
				return hookRet;
			}
		};
	},
	printStockValueInto(elem, value) {
		// Taken from minigameMarket.js#draw()
		elem.innerHTML = (value < 0 ? '-' : '') + '$' + Beautify(Math.abs(value), 2);
		if (value > 0) { elem.classList.add('bankSymbolUp'); elem.classList.remove('bankSymbolDown'); }
		else if (value < 0) { elem.classList.add('bankSymbolDown'); elem.classList.remove('bankSymbolUp'); }
	}
});