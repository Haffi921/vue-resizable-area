import { camelCase as camel } from 'lodash';

function xyMixin(x, y, prefix) {
	let pref = '';
	if (typeof prefix === 'string') pref = prefix;

	const data = {
		[camel([pref, x])]: 0,
		[camel([pref, y])]: 0,
	};

	const methods = {
		// Getters
		[camel(['get', pref, x])]() {
			return this.x;
		},
		[camel(['get', pref, y])]() {
			return this.y;
		},
		[camel(['get', pref, x, 'or', y])](xy) {
			if (xy === 'x') return this.x;
			if (xy === 'y') return this.y;
			throw TypeError(`xy should be either 'x' or 'y', but it is: ${xy}`);
		},
		// Setters
		[camel(['set', pref, x])](newX) {
			this.x = newX;
		},
		[camel(['set', pref, y])](newY) {
			this.y = newY;
		},
		[camel(['set', pref, x, 'or', y])](xy, newX, newY) {
			if (xy === 'x') this.x = newX;
			if (xy === 'y') this.y = newY;
			throw TypeError(`xy should be either 'x' or 'y', but it is: ${xy}`);
		},
	};

	return {
		data: () => data,
		methods,
	};
}

export default {
	// Left/Top
	leftTop: xyMixin('left', 'top'),
	leftTopMin: xyMixin('left', 'top', 'min'),
	leftTopMax: xyMixin('left', 'top', 'max'),

	// Right/Bottom
	rightBottom: xyMixin('right', 'bottom'),
	rightBottomMin: xyMixin('right', 'bottom', 'min'),
	rightBottomMax: xyMixin('right', 'bottom', 'max'),

	// Width/Height
	widthHeight: xyMixin('width', 'height'),
	widthHeightMin: xyMixin('width', 'height', 'min'),
	widthHeightMax: xyMixin('width', 'height', 'max'),
};
