import { gt, gte } from 'lodash';

function xyGetter(x, y) {
	return (function get(xy) {
		if (xy === 'x') return this[x];
		if (xy === 'y') return this[y];
		throw TypeError(`xy should be either 'x' or 'y', but it is: ${xy}`);
	});
}

function xySetter(x, y) {
	return (function set(xy, value) {
		if (xy === 'x') this[x] = value;
		else if (xy === 'y') this[y] = value;
		else throw TypeError(`xy should be either 'x' or 'y', but it is: ${xy}`);
	});
}

export default {
	props: {
		// Base
		L: {
			type: Number,
			default: 0,
			validator: (value) => gte(value, 0),
		},
		T: {
			type: Number,
			default: 0,
			validator: (value) => gte(value, 0),
		},
		W: {
			type: Number,
			default: 250,
			validator: (value) => gt(value, 0),
		},
		H: {
			type: Number,
			default: 250,
			validator: (value) => gt(value, 0),
		},

		// Min
		minL: {
			type: Number,
			default: -Infinity,
		},
		minT: {
			type: Number,
			default: -Infinity,
		},
		minW: {
			type: Number,
			default: 35,
			validator: (value) => gt(value, 0),
		},
		minH: {
			type: Number,
			default: 35,
			validator: (value) => gt(value, 0),
		},

		// Max
		maxW: {
			type: Number,
			default: Infinity,
			validator: (value) => gt(value, 0),
		},
		maxH: {
			type: Number,
			default: Infinity,
			validator: (value) => gt(value, 0),
		},
		maxR: {
			type: Number,
			default: Infinity,
		},
		maxB: {
			type: Number,
			default: Infinity,
		},
	},
	data: () => ({
		// Base
		left: 0,
		top: 0,
		width: 0,
		height: 0,

		// Min
		minLeft: 0,
		minTop: 0,
		minWidth: 0,
		minHeight: 0,

		// Max
		maxRight: 0,
		maxBottom: 0,
	}),
	computed: {
		right() {
			return this.left + this.width;
		},
		bottom() {
			return this.top + this.height;
		},
		maxWidth() {
			return this.maxRight - this.left;
		},
		maxHeight() {
			return this.maxBottom - this.top;
		},
	},
	watch: {
		left(left) {
			this.$el.style.left = `${left}px`;
		},
		top(top) {
			this.$el.style.top = `${top}px`;
		},
		width(width) {
			this.$el.style.width = `${width}px`;
		},
		height(height) {
			this.$el.style.height = `${height}px`;
		},
	},
	created() {
		// Base
		this.left = this.L;
		this.top = this.T;
		this.width = this.W;
		this.height = this.H;

		// Min
		this.minLeft = this.minL;
		this.minTop = this.minT;
		this.minWidth = this.minW;
		this.minHeight = this.minH;

		// Max
		// this.maxWidth = this.maxW;
		// this.maxHeight = this.maxH;
		this.maxRight = this.maxR;
		this.maxBottom = this.maxB;
	},
	methods: {
		// LeftOrTop
		getLeftOrTop: xyGetter('left', 'top'),
		setLeftOrTop: xySetter('left', 'top'),
		// Min
		getMinLeftOrTop: xyGetter('minLeft', 'minTop'),
		setMinLeftOrTop: xySetter('minLeft', 'minTop'),

		// WidthOrHeight
		getWidthOrHeight: xyGetter('width', 'height'),
		setWidthOrHeight: xySetter('width', 'height'),
		// Min
		getMinWidthOrHeight: xyGetter('minWidth', 'minHeight'),
		setMinWidthOrHeight: xySetter('minWidth', 'minHeight'),
		// Max
		getMaxWidthOrHeight: xyGetter('maxWidth', 'maxHeight'),
		setMaxWidthOrHeight: xySetter('maxWidth', 'maxHeight'),

		// RightOrBottom
		getRightOrBottom: xyGetter('right', 'bottom'),
		// Max
		getMaxRightOrBottom: xyGetter('maxRight', 'maxBottom'),
		setMaxRightOrBottom: xySetter('maxRight', 'maxBottom'),
	},
};
