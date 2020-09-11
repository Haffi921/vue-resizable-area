<template>
	<div class="area">
		<!-- Side handles -->
		<ResizeHandle class="side"
			v-for="side in sides" :key="side"
			:type="side" :moveFunction="getMove(side + 'Move')"
			:width="handleWidth" />
		<!-- Corner handles -->
		<ResizeHandle class="corner" :corner="true"
			v-for="(type, corner) in corners" :key="corner"
			:type="type" :moveFunction="getMove(corner + 'Move')"
			:width="handleWidth" />
	</div>
</template>

<script>
import clamp from 'lodash/clamp';
import ResizeHandle from './ResizeHandle.vue';

export default {
	components: {
		ResizeHandle,
	},
	props: {
		handleWidth: {
			type: Number,
			default: 6,
		},
		initWidth: {
			type: Number,
			default: 200,
		},
		initHeight: {
			type: Number,
			default: 200,
		},
		minWidth: {
			type: Number,
			default: 35,
		},
		minHeight: {
			type: Number,
			default: 35,
		},
		maxWidth: {
			type: Number,
			default: Infinity,
		},
		maxHeight: {
			type: Number,
			default: Infinity,
		},
		grid: {
			type: String,
			default: '[200, 200]',
			validator(value) {
				return value.match(/\[\d+, \d+]/);
			},
		},
	},
	data: () => ({
		// Div creators
		sides: ['left', 'top', 'right', 'bottom'],
		corners: {
			topLeft: 'top-left',
			topRight: 'top-right',
			bottomRight: 'bottom-right',
			bottomLeft: 'bottom-left',
		},

		// Self
		rect: {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: this.initWidth,
			height: this.initHeight,
		},

		// Rects
		domRect: {},
		parent: {},

		// Paddings for cursor on handle
		cursorPadding: 0,

		// Grid
		gridx: 1,
		gridy: 1,
		gbuf: 0.6,

		// Transition
		// tSpeed: 1250, // px/s
		// tStringX: '',
		// tStringY: '',
	}),
	mounted() {
		// Initial set up of area
		this.renameRect();

		// Update rects
		this.refreshRect();
		this.refreshParent();

		// Update rects on window change
		this.setWindowChangeListeners();

		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);

		// Grid
		if (this.grid) this.setUpGrid();
	},
	methods: {
		// Set style methods
		renameRect() {
			this.$el.style.width = `${this.width}px`;
			this.$el.style.height = `${this.height}px`;
		},

		// Refresh methods
		refreshRect() {
			this.domRect = this.$el.getBoundingClientRect();
		},
		refreshParent() {
			const parentPadding = window.getComputedStyle(
				this.$el.parentNode,
			).padding.match(/\d+/g).map((p) => parseInt(p, 10));

			this.parent = this.$el.parentNode.getBoundingClientRect();
			this.parent.padding = {
				top: parentPadding[0 % parentPadding.length],
				right: parentPadding[1 % parentPadding.length],
				bottom: parentPadding[2 % parentPadding.length],
				left: parentPadding[3 % parentPadding.length],
			};
		},

		// Event listener methods
		setWindowChangeListeners() {
			window.addEventListener('resize', this.refreshRect);
			window.addEventListener('scroll', this.refreshRect);
			window.addEventListener('scroll', this.refreshParent);
			window.addEventListener('resize', this.refreshParent);
		},

		// Binding method
		getMove(moveName) {
			return this[moveName];
		},

		// Util methods
		xyConditional(xy, x, y) {
			if (xy === 'x') {
				return x;
			}
			if (xy === 'y') {
				return y;
			}
			throw TypeError(`xy is ${xy} but it should be either 'x' or 'y'`);
		},

		// Get self methods
		getMinWidthOrHeight(xy) {
			return this.xyConditional(xy, this.minWidth, this.minHeight);
		},

		// Get cursor methods
		getRelativeCursor(xy, e) {
			return this.xyConditional(xy, this.getRelativeCursorX(e), this.getRelativeCursorY(e));
		},
		getRelativeCursorX(e) {
			// Get cursor x-position
			return e.clientX
				// ...relative to the parent
				- this.getParentX();
		},
		getRelativeCursorY(e) {
			// Get cursor y-position
			return e.clientY
			// ...relative to the parent
			- this.getParentY();
		},

		// Get parent methods
		getParentXY(xy) {
			return this.xyConditional(xy, this.getParentX(), this.getParentY());
		},
		getParentWH(xy) {
			return this.xyConditional(xy, this.getParentW(), this.getParentH());
		},
		getParentX() {
			return this.parent.x + this.parent.padding.left;
		},
		getParentY() {
			return this.parent.y + this.parent.padding.top;
		},
		getParentW() {
			const { left, right } = this.parent.padding;
			const totalXPadding = left + right;
			return this.parent.width - totalXPadding;
		},
		getParentH() {
			const { top, bottom } = this.parent.padding;
			const totalYPadding = top + bottom;
			return this.parent.height - totalYPadding;
		},

		// Get rect methods
		getLeftOrTop(xy) {
			return this.xyConditional(xy, this.getLeftX(), this.getTopY());
		},
		getRightOrBottom(xy) {
			return this.xyConditional(xy, this.getRightX(), this.getBottomY());
		},
		getLeftX() {
			return this.domRect.left - this.getParentX();
		},
		getTopY() {
			return this.domRect.top - this.getParentY();
		},
		getRightX() {
			return this.domRect.right - this.getParentX();
		},
		getBottomY() {
			return this.domRect.bottom - this.getParentY();
		},

		// Grid methods
		setUpGrid() {
			// Calculate grid
			[this.gridx, this.gridy] = this.grid.match(/\d+/g);
			this.gbuf /= 2;

			// If grid is bigger then minLengths, then minLength is mute
			if (this.minWidth < this.gridx) this.minWidth = this.gridx;
			if (this.minHeight < this.gridy) this.minHeight = this.gridy;

			// Transition string
			// this.tSpeed = this.gridx / this.tSpeed;
			// this.tStringX = `${this.tSpeed}s ease-in`;
		},
		applyGrid(value, grid) {
			return Math.round(value / grid) * grid;
		},
		applyGridBuf(value, parentValue, grid, buf) {
			const gridBuf = grid * buf;
			const valueBuf = value < parentValue
				? value + gridBuf
				: value - gridBuf;

			return this.applyGrid(valueBuf, grid);
		},

		// Transition
		// removeTransition() {
		// 	this.$el.style.removeProperty('transition');
		// },

		// Move methods
		dimensionMove(xy, e) {
			// Get dimension name
			const dimension = this.xyConditional(xy, 'width', 'height');

			// Get cursor x or y-position
			let wh = this.getRelativeCursor(xy, e)
				// ...relative to left or top-side
				- this.getLeftOrTop(xy)
				// Small padding
				+ this.cursorPadding;

			// max is parent minus rect distance from left/top side
			const max = this.getParentWH(xy) - this.getLeftOrTop(xy);
			const min = this.getMinWidthOrHeight(xy);

			// Clamp wh between min and max values
			wh = clamp(wh, min, max);

			// Apply grid
			if (this.grid) {
				wh = this.applyGridBuf(
					wh, this.domRect[dimension], this[`grid${xy}`], this.gbuf,
				);
				if (this.domRect[dimension] !== wh) {
					// Apply styles
					this.$el.style[dimension] = `${wh}px`;
				}
			} else {
				// Apply styles
				this.$el.style[dimension] = `${wh}px`;
			}
		},
		positionDimensionMove(xy, e) {
			// Get position and dimension name
			const position = this.xyConditional(xy, 'left', 'top');
			const dimension = this.xyConditional(xy, 'width', 'height');

			// Get cursor x or y-position relative to parent
			let lt = this.getRelativeCursor(xy, e)
				// Small cursor padding
				- this.cursorPadding;

			// Get right or bottom side XY position
			const rb = this.getRightOrBottom(xy);

			const min = 0;
			const max = rb - this.getMinWidthOrHeight(xy);

			// Clamp leftX between min and max
			lt = clamp(lt, min, max);

			if (this.grid) {
				lt = this.applyGridBuf(
					lt, this.domRect[position], this[`grid${xy}`], this.gbuf,
				);
				if (this.getLeftOrTop(xy) !== lt) {
					// Apply styles
					this.$el.style[position] = `${lt}px`;
					this.$el.style[dimension] = `${rb - lt}px`;
				}
			} else {
				// Apply styles
				this.$el.style[position] = `${lt}px`;
				this.$el.style[dimension] = `${rb - lt}px`;
			}
		},

		// Side moves
		leftMove(e) {
			/* Apply changes */
			this.positionDimensionMove('x', e); // Left

			/* Refresh */
			this.refreshRect();
		},
		topMove(e) {
			/* Apply changes */
			this.positionDimensionMove('y', e); // Top

			/* Refresh */
			this.refreshRect();
		},
		rightMove(e) {
			/* Apply changes */
			this.dimensionMove('x', e); // Right

			/* Refresh */
			this.refreshRect();
		},
		bottomMove(e) {
			/* Apply changes */
			this.dimensionMove('y', e); // Bottom

			/* Refresh */
			this.refreshRect();
		},

		// Corner moves
		topLeftMove(e) {
			/* Apply changes */
			this.positionDimensionMove('y', e); // Top
			this.positionDimensionMove('x', e); // Left

			/* Refresh */
			this.refreshRect();
		},
		topRightMove(e) {
			/* Apply changes */
			this.positionDimensionMove('y', e);	// Top
			this.dimensionMove('x', e); 		// Right

			/* Refresh */
			this.refreshRect();
		},
		bottomRightMove(e) {
			/* Apply changes */
			this.dimensionMove('y', e);	// Bottom
			this.dimensionMove('x', e);	// Right

			/* Refresh */
			this.refreshRect();
		},
		bottomLeftMove(e) {
			/* Apply changes */
			this.dimensionMove('y', e);			// Bottom
			this.positionDimensionMove('x', e);	// Left

			/* Refresh */
			this.refreshRect();
		},
	},
};
</script>

<style lang="less">
.area {
	--border: #BBBBBB;
	--border-size: 1.5px;

	position: relative;
	background-color: #DDDDDD;
	border-radius: 3px;
	user-select: none;
	box-sizing: border-box;
}

.handle,
.vertical,
.horizontal {
	border: 0 solid transparent;
	border-radius: 3px;
	transition: border 0.2s ease-out;
}

.handle-top:hover {
	border-top: var(--border-size) solid var(--border);
}
.handle-right:hover {
	border-right: var(--border-size) solid var(--border);
}
.handle-bottom:hover {
	border-bottom: var(--border-size) solid var(--border);
}
.handle-left:hover {
	border-left: var(--border-size) solid var(--border);
}

.handle-top-left:hover {
	.horizontal {
		border-radius: 3px;
		border-top: var(--border-size) solid var(--border);
	}
	.vertical {
		border-radius: 3px;
		border-left: var(--border-size) solid var(--border);
	}
}
.handle-top-right:hover {
	.horizontal {
		border-radius: 3px;
		border-top: var(--border-size) solid var(--border);
	}
	.vertical {
		border-radius: 3px;
		border-right: var(--border-size) solid var(--border);
	}
}
.handle-bottom-right:hover {
	.horizontal {
		border-radius: 3px;
		border-bottom: var(--border-size) solid var(--border);
	}
	.vertical {
		border-radius: 3px;
		border-right: var(--border-size) solid var(--border);
	}
}
.handle-bottom-left:hover {
	.horizontal {
		border-radius: 3px;
		border-bottom: var(--border-size) solid var(--border);
	}
	.vertical {
		border-radius: 3px;
		border-left: var(--border-size) solid var(--border);
	}
}

</style>
