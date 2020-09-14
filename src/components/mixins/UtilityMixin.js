export default {
	methods: {
		getMove(moveName) {
			return this[moveName];
		},
		xyConditional(xy, x, y) {
			if (xy === 'x') {
				try {
					return x();
				} catch (e) {
					if (e instanceof TypeError) {
						return x;
					} throw e;
				}
			}
			if (xy === 'y') {
				try {
					return y();
				} catch (e) {
					if (e instanceof TypeError) {
						return y;
					} throw e;
				}
			}
			throw TypeError(`xy is ${xy} but it should be either 'x' or 'y'`);
		},
	},
};
