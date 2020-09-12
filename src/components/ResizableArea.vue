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
		left: {{ this.rect.left }}<br>
		top: {{ this.rect.top }}<br>
		right: {{ this.rect.right }}<br>
		bottom: {{ this.rect.bottom }}<br>
		width: {{ this.rect.width }}<br>
		height: {{ this.rect.height }}<br>
	</div>
</template>

<script>
import clamp from 'lodash/clamp';
import upper from 'lodash/upperCase';
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

		/* Rects */
		// Self
		rect: {
			left: 0,
			top: 0,
			right: 0,
			bottom: 0,
			width: 0,
			height: 0,
		},
		// Parent
		parentRect: {},

		// Paddings for cursor on handle
		cursorPadding: 0,

		// Grid
		gridX: 1,
		gridY: 1,
		gridBuf: 0.6,

		// Transition
		// tSpeed: 1250, // px/s
		// tStringX: '',
		// tStringY: '',
	}),
	created() {
		this.rect.width = this.initWidth;
		this.rect.height = this.initHeight;
		this.rect.right = this.rect.left + this.rect.width;
		this.rect.bottom = this.rect.top + this.rect.height;
	},
	mounted() {
		// Initial set up of area
		this.updateDOM();
		this.refreshParent();

		// Update rects on window change
		this.setWindowChangeListeners();

		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);

		// Grid
		if (this.grid) this.setUpGrid();
	},
	methods: {
		/* Refresh methods */
		updateDOM() {
			this.$el.style.width = `${this.rect.width}px`;
			this.$el.style.height = `${this.rect.height}px`;
			this.$el.style.left = `${this.rect.left}px`;
			this.$el.style.top = `${this.rect.top}px`;
			this.rect.right = this.rect.left + this.rect.width;
			this.rect.bottom = this.rect.top + this.rect.height;
		},
		refreshParent() {
			const parentPadding = window.getComputedStyle(
				this.$el.parentNode,
			).padding.match(/\d+/g).map((p) => parseInt(p, 10));

			this.parentRect = this.$el.parentNode.getBoundingClientRect();
			this.parentRect.padding = {
				top: parentPadding[0 % parentPadding.length],
				right: parentPadding[1 % parentPadding.length],
				bottom: parentPadding[2 % parentPadding.length],
				left: parentPadding[3 % parentPadding.length],
			};
		},
		reloadRect(xy) {
			this.reloadWH(xy);
			this.reloadLT(xy);
		},
		reloadWH(xy) {
			const dimension = this.xyConditional(xy, 'width', 'height');
			const min = this.getMinWidthOrHeight(xy);
			const max = this.getMaxWidthOrHeight(xy);
			const wh = this.rect[dimension];
			this.rect[dimension] = clamp(wh, min, max);
		},
		reloadLT(xy) {
			const dimension = this.xyConditional(xy, 'left', 'top');
			const min = this.getMinWidthOrHeight(xy);
			const parentWH = this.getParentWH(xy);
			if (this.rect[dimension] > parentWH - min) {
				this.rect[dimension] = parentWH - min;
			}
		},
		reloadWH_grid(xy) {
			const position = this.xyConditional(xy, 'left', 'right');
			const dimension = this.xyConditional(xy, 'width', 'height');
			const grid = this[`grid${upper(xy)}`];
			this.rect[position] = Math.floor(this.rect[position] / grid) * grid;
			this.rect[dimension] = Math.floor(this.rect[dimension] / grid) * grid;
		},
		// Event listener methods
		onWindowResize() {
			this.refreshParent();

			this.reloadRect('x');
			this.reloadRect('y');

			if (this.grid) {
				this.reloadWH_grid('x');
				this.reloadWH_grid('y');
			}

			this.updateDOM();
		},
		setWindowChangeListeners() {
			window.addEventListener('scroll', this.refreshParent);
			window.addEventListener('resize', this.onWindowResize);
		},

		/* Binding method */
		getMove(moveName) {
			return this[moveName];
		},

		/* Util methods */
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

		/* Getters */
		// Get self methods
		getMinWidthOrHeight(xy) {
			return this.xyConditional(xy, this.getMinWidth, this.getMinHeight);
		},
		getMinWidth() {
			return this.minWidth;
		},
		getMinHeight() {
			return this.minHeight;
		},
		getMaxWidthOrHeight(xy) {
			return this.xyConditional(xy, this.getMaxWidth, this.getMaxHeight);
		},
		getMaxWidth() {
			return this.getParentW() - this.getLeftX();
		},
		getMaxHeight() {
			return this.getParentH() - this.getTopY();
		},
		// Get rect methods
		getLeftOrTop(xy) {
			return this.xyConditional(xy, this.getLeftX, this.getTopY);
		},
		getRightOrBottom(xy) {
			return this.xyConditional(xy, this.getRightX, this.getBottomY);
		},
		getLeftX() {
			return this.rect.left;// - this.getParentX();
		},
		getTopY() {
			return this.rect.top;// - this.getParentY();
		},
		getRightX() {
			return this.rect.right;// - this.getParentX();
		},
		getBottomY() {
			return this.rect.bottom;// - this.getParentY();
		},
		// Get parent methods
		getParentWH(xy) {
			return this.xyConditional(xy, this.getParentW, this.getParentH);
		},
		getParentX() {
			return this.parentRect.x + this.parentRect.padding.left;
		},
		getParentY() {
			return this.parentRect.y + this.parentRect.padding.top;
		},
		getParentW() {
			const { left, right } = this.parentRect.padding;
			const totalXPadding = left + right;
			return this.parentRect.width - totalXPadding;
		},
		getParentH() {
			const { top, bottom } = this.parentRect.padding;
			const totalYPadding = top + bottom;
			return this.parentRect.height - totalYPadding;
		},
		// Get cursor methods
		getRelativeCursor(xy, e) {
			return this.xyConditional(
				xy,
				this.getRelativeCursorX.bind(this, e),
				this.getRelativeCursorY.bind(this, e),
			);
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

		/* Grid methods */
		setUpGrid() {
			// Calculate grid
			[this.gridX, this.gridY] = this.grid.match(/\d+/g).map(Number);
			this.gridBuf /= 2;

			// If grid is bigger then minLengths, then minLength is mute
			if (this.minWidth < this.gridX) this.minWidth = this.gridX;
			if (this.minHeight < this.gridY) this.minHeight = this.gridY;

			// Transition string
			// this.tSpeed = this.gridx / this.tSpeed;
			// this.tStringX = `${this.tSpeed}s ease-in`;
		},
		applyGrid(value, grid) {
			return Math.round(value / grid) * grid;
		},
		applyGridBuf(newValue, currentValue, maxValue, grid, buf) {
			if (newValue > currentValue
				&& currentValue + grid > maxValue) {
				return currentValue;
			}

			const gridBuf = grid * buf;
			const valueBuf = newValue < currentValue
				? newValue + gridBuf
				: newValue - gridBuf;

			return this.applyGrid(valueBuf, grid);
		},
		// Transition
		// removeTransition() {
		// 	this.$el.style.removeProperty('transition');
		// },

		/* Move methods */
		// General moves
		dimensionMove(xy, e) {
			// Get position and dimension name
			const dimension = this.xyConditional(xy, 'width', 'height');
			// Get left or top side XY position
			const lt = this.getLeftOrTop(xy);
			// Get min/max
			const min = this.getMinWidthOrHeight(xy);
			const max = this.getMaxWidthOrHeight(xy);

			// Get cursor x or y-position
			let wh = this.getRelativeCursor(xy, e)
				// ...relative to left or top-side
				- lt
				// Small padding
				+ this.cursorPadding;

			// Clamp wh between min and max values
			wh = clamp(wh, min, max);

			// Apply grid
			if (this.grid) {
				const grid = `grid${upper(xy)}`;
				wh = this.applyGridBuf(
					wh, this.rect[dimension], this.getMaxWidthOrHeight(xy),
					this[grid], this.gridBuf,
				);
			}

			this.rect[dimension] = wh;
		},
		positionDimensionMove(xy, e) {
			// Get position and dimension name
			const position = this.xyConditional(xy, 'left', 'top');
			const dimension = this.xyConditional(xy, 'width', 'height');
			// Get right or bottom side XY position
			const rb = this.getRightOrBottom(xy);
			// Get min/max
			const min = 0;
			const max = rb - this.getMinWidthOrHeight(xy);

			// Get cursor x or y-position relative to parent
			let lt = this.getRelativeCursor(xy, e)
				// Small cursor padding
				- this.cursorPadding;

			// Clamp leftX between min and max
			lt = clamp(lt, min, max);

			if (this.grid) {
				const grid = `grid${upper(xy)}`;
				lt = this.applyGridBuf(
					lt, this.rect[position], this.getParentWH(xy),
					this[grid], this.gridBuf,
				);
			}

			this.rect[position] = lt;
			this.rect[dimension] = rb - lt;
		},
		// Sides
		leftMove(e) {
			/* Apply changes */
			this.positionDimensionMove('x', e); // Left

			/* Refresh */
			this.updateDOM();
		},
		topMove(e) {
			/* Apply changes */
			this.positionDimensionMove('y', e); // Top

			/* Refresh */
			this.updateDOM();
		},
		rightMove(e) {
			/* Apply changes */
			this.dimensionMove('x', e); // Right

			/* Refresh */
			this.updateDOM();
		},
		bottomMove(e) {
			/* Apply changes */
			this.dimensionMove('y', e); // Bottom

			/* Refresh */
			this.updateDOM();
		},
		// Corners
		topLeftMove(e) {
			/* Apply changes */
			this.positionDimensionMove('y', e); // Top
			this.positionDimensionMove('x', e); // Left

			/* Refresh */
			this.updateDOM();
		},
		topRightMove(e) {
			/* Apply changes */
			this.positionDimensionMove('y', e); // Top
			this.dimensionMove('x', e); // Right

			/* Refresh */
			this.updateDOM();
		},
		bottomRightMove(e) {
			/* Apply changes */
			this.dimensionMove('y', e); // Bottom
			this.dimensionMove('x', e); // Right

			/* Refresh */
			this.updateDOM();
		},
		bottomLeftMove(e) {
			/* Apply changes */
			this.dimensionMove('y', e); // Bottom
			this.positionDimensionMove('x', e); // Left

			/* Refresh */
			this.updateDOM();
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
