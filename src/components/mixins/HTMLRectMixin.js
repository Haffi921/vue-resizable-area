import { camelCase as camel } from 'lodash';

function xyMixin(x, y, prefix) {
	let pref = '';
	if (typeof prefix === 'string') pref = prefix;

	const data = () => ({
		[camel([pref, x])]: 0,
		[camel([pref, y])]: 0,
	});

	const methods = {
		// Getters
		[camel(['get', pref, x])]() {
			return this[camel([pref, x])];
		},
		[camel(['get', pref, y])]() {
			return this[camel([pref, y])];
		},
		[camel(['get', pref, x, 'or', y])](xy) {
			if (xy === 'x') return this[camel([pref, x])];
			if (xy === 'y') return this[camel([pref, y])];
			throw TypeError(`xy should be either 'x' or 'y', but it is: ${xy}`);
		},
		// Setters
		[camel(['set', pref, x])](newX) {
			this[camel([pref, x])] = newX;
		},
		[camel(['set', pref, y])](newY) {
			this[camel([pref, y])] = newY;
		},
		[camel(['set', pref, x, 'or', y])](xy, newX, newY) {
			if (xy === 'x') this[camel([pref, x])] = newX;
			if (xy === 'y') this[camel([pref, y])] = newY;
			throw TypeError(`xy should be either 'x' or 'y', but it is: ${xy}`);
		},
	};

	return {
		data,
		methods,
	};
}

// Left/Top
export const leftTop = xyMixin('left', 'top');
export const leftTopMin = xyMixin('left', 'top', 'min');
// export const leftTopMax = xyMixin('left', 'top', 'max');

// Right/Bottom
export const rightBottom = xyMixin('right', 'bottom');
// export const rightBottomMin = xyMixin('right', 'bottom', 'min');
export const rightBottomMax = xyMixin('right', 'bottom', 'max');

// Width/Height
export const widthHeight = xyMixin('width', 'height');
export const widthHeightMin = xyMixin('width', 'height', 'min');
export const widthHeightMax = xyMixin('width', 'height', 'max');

export default {
	mixins: [
		leftTop, leftTopMin,
		rightBottom, rightBottomMax,
		widthHeight, widthHeightMin, widthHeightMax,
	],
};
