<template>
	<div class="area">
		<ResizeHandle class="drag-bar"
			type="bar"
			:down-function="setOffset"
			:move-function="freeMove"
			:up-function="unsetOffset"
			:width="30" />
		<!-- Side handles -->
		<ResizeHandle class="side"
			v-for="side in sides" :key="side"
			:type="side" :move-function="getMove(side + 'Move')"
			:width="handleWidth" />
		<!-- Corner handles -->
		<ResizeHandle class="corner" :corner="true"
			v-for="(type, corner) in corners" :key="corner"
			:type="type" :move-function="getMove(corner + 'Move')"
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
import ResizeHandle from './ResizeHandle.vue';

export default {
	components: {
		ResizeHandle,
	},
	props: {
		// Width of drag handles
		handleWidth: {
			type: Number,
			default: 6,
		},

		// Width and Height
		initWidth: {
			type: Number,
			default: 250,
		},
		initHeight: {
			type: Number,
			default: 250,
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
		restrictToParent: {
			type: Boolean || Array[Boolean],
			default: true,
			validator(value) {
				const booleanCheck = (bool) => (typeof bool === 'boolean');
				const arrayCheck = (arr) => Array.isArray(arr)
						&& arr.length === 2
						&& arr.every(booleanCheck);

				return booleanCheck(value) || arrayCheck(value);
			},
		},

		// Grid
		grid: {
			type: Array,
			// default: () => ([200, 200]),
			validator(value) {
				return value.length === 2 && value.every((xy) => xy > 0);
			},
		},
		gridBuf: {
			type: Number,
			default: 0.5,
			validator(value) {
				return value >= 0 && value <= 1;
			},
		},

		// Transition
		transition: {
			type: Boolean,
			default: false,
		},
		tSpeed: {
			type: Number,
			default: 2000,
			validator(value) {
				return value > 0;
			},
		},
		tFunction: {
			type: String,
			default: 'ease-in',
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

		// Offset XY Cords for free drag
		offsetX: 0,
		offsetY: 0,

		// Width and Height
		minW: 0,
		minH: 0,
		maxW: 0,
		maxH: 0,

		// Grid
		gridX: 1,
		gridY: 1,
		gridB: 0,
	}),
	created() {
		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);

		// Width and Height
		this.rect.width = this.initWidth;
		this.rect.height = this.initHeight;
		this.minW = this.minWidth;
		this.minH = this.minHeight;
		this.maxW = this.maxWidth;
		this.maxH = this.maxHeight;
	},
	mounted() {
		// Get parent
		this.refreshParent();

		// Grid
		if (this.grid) this.setUpGrid();

		// Transition
		if (this.transition) this.setUpTransition();

		// Initial set up of area
		this.updateDOM();

		// Update rects on window change
		this.setWindowChangeListeners();
	},
	methods: {
		/* --- Refresh methods ---*/
		// Rects
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

			// If padding is 'padding: {top} {left/right} {bottom};'
			// if (parentPadding.length === 3) this.parentRect.padding.left = parentPadding[1];

			if (this.restrictToParent) {
				this.setMaxWidth(this.getParentW());
				this.setMaxHeight(this.getParentH());
			}
		},

		// Reload rects
		reloadRect(xy) {
			this.reloadWH(xy);
			this.reloadLT(xy);
		},
		reloadWH(xy) {
			const min = this.getMinWidthOrHeight(xy);
			const max = this.getMaxWidthOrHeight(xy);
			const wh = this.getWidthOrHeight(xy);
			this.setWidthOrHeight(xy, clamp(wh, min, max));
		},
		reloadLT(xy) {
			const min = this.getMinWidthOrHeight(xy);
			const max = this.getParentWH(xy) - min;
			const lt = clamp(this.getLeftOrTop(xy), 0, max);
			this.setLeftOrTop(xy, lt);
		},
		reloadWH_grid(xy) {
			const grid = this.getGrid(xy);
			let wh = this.applyGridFloor(this.getWidthOrHeight(xy), grid);
			let lt = this.applyGridFloor(this.getLeftOrTop(xy), grid);
			wh = wh > grid ? wh : grid;
			lt = lt > 0 ? lt : 0;

			this.setWidthOrHeight(xy, wh);
			this.setLeftOrTop(xy, lt);
		},

		// Event listener methods
		onWindowResize() {
			this.refreshParent();

			let changed = false;

			['x', 'y'].forEach((xy) => {
				if (this.getWidthOrHeight(xy) > this.getMaxWidthOrHeight(xy)) {
					changed = true;
					this.reloadRect(xy);
					if (this.grid) {
						this.reloadWH_grid(xy);
					}
				}
			});

			if (changed) {
				this.updateDOM();
			}
		},
		setWindowChangeListeners() {
			window.addEventListener('scroll', this.refreshParent);
			window.addEventListener('resize', this.onWindowResize);
		},

		/* --- Props ---*/
		// Grid methods
		setUpGrid() {
			// Calculate grid
			[this.gridX, this.gridY] = this.grid;
			this.gridB = this.gridBuf / 2;

			['x', 'y'].forEach((xy) => {
				const grid = this.getGrid(xy);
				let wh = this.getWidthOrHeight(xy);

				// If grid is bigger then minLengths, then minLength is mute
				if (this.getMinWidthOrHeight(xy) < grid) this.setMinWidthOrHeight(xy, grid);

				// Floor rect to next grid level
				wh = this.applyGridFloor(wh, grid);

				// If rect has been floored to 0, rectify
				const max = this.applyGridFloor(this.getMaxWidthOrHeight(xy), grid);
				wh = clamp(wh, this.getMinWidthOrHeight(xy), max);

				this.setWidthOrHeight(xy, wh);
			});
		},
		applyGrid(value, grid) {
			return Math.round(value / grid) * grid;
		},
		applyGridFloor(value, grid) {
			return Math.floor(value / grid) * grid;
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

		// Transition methods
		setUpTransition() {
			const durationX = this.gridX / this.tSpeed;
			const durationY = this.gridY / this.tSpeed;
			const stringX = `${durationX}s ${this.tFunction}`;
			const stringY = `${durationY}s ${this.tFunction}`;
			const ruleX = `width ${stringX}, left ${stringX}`;
			const ruleY = `height ${stringY}, top ${stringY}`;

			this.$el.style.transition = `${ruleX}, ${ruleY}`;
		},

		/* --- Binding method ---*/
		getMove(moveName) {
			return this[moveName];
		},

		/* --- Util methods ---*/
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

		/* --- Getters and setters ---*/
		// Width and Height
		getWidthOrHeight(xy) {
			return this.xyConditional(xy, this.rect.width, this.rect.height);
		},
		getWidth() {
			return this.rect.width;
		},
		getHeight() {
			return this.rect.height;
		},
		setWidthOrHeight(xy, wh) {
			this.xyConditional(xy, this.setWidth.bind(this, wh), this.setHeight.bind(this, wh));
		},
		setWidth(width) {
			this.rect.width = width;
		},
		setHeight(height) {
			this.rect.height = height;
		},

		// MinWidth or MinHeight
		getMinWidthOrHeight(xy) {
			return this.xyConditional(xy, this.minW, this.minH);
		},
		getMinWidth() {
			return this.minW;
		},
		getMinHeight() {
			return this.minH;
		},
		setMinWidthOrHeight(xy, wh) {
			this.xyConditional(xy,
				this.setMinWidth.bind(this, wh),
				this.setMinHeight.bind(this, wh));
		},
		setMinWidth(width) {
			this.minW = width;
		},
		setMinHeight(height) {
			this.minH = height;
		},

		// MaxWidth or MaxHeight
		getMaxWidthOrHeight(xy) {
			return this.xyConditional(xy, this.getMaxWidth, this.getMaxHeight);
		},
		getMaxWidth() {
			return this.maxW - this.getLeft();
		},
		getMaxHeight() {
			return this.maxH - this.getTop();
		},
		setMaxWidthOrHeight(xy, wh) {
			this.xyConditional(xy,
				this.setMaxWidth.bind(this, wh),
				this.setMaxHeight.bind(this, wh));
		},
		setMaxWidth(width) {
			this.maxW = width;
		},
		setMaxHeight(height) {
			this.maxH = height;
		},

		// Left/Top
		getLeftOrTop(xy) {
			return this.xyConditional(xy, this.getLeft, this.getTop);
		},
		getLeft() {
			return this.rect.left;
		},
		getTop() {
			return this.rect.top;
		},
		setLeftOrTop(xy, lt) {
			this.xyConditional(xy, this.setLeft.bind(this, lt), this.setTop.bind(this, lt));
		},
		setLeft(left) {
			this.rect.left = left;
		},
		setTop(top) {
			this.rect.top = top;
		},

		// Right/Bottom
		getRightOrBottom(xy) {
			return this.xyConditional(xy, this.getRight, this.getBottom);
		},
		getRight() {
			return this.rect.right;
		},
		getBottom() {
			return this.rect.bottom;
		},
		setRightOrBottom(xy, rb) {
			this.xyConditional(xy, this.setRight.bind(this, rb), this.setBottom.bind(this, rb));
		},
		setRight(right) {
			this.rect.right = right;
		},
		setBottom(bottom) {
			this.rect.bottom = bottom;
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
		getCursor(xy, e) {
			return this.xyConditional(
				xy,
				this.getCursorX.bind(this, e),
				this.getCursorY.bind(this, e),
			);
		},
		getCursorX(e) {
			// Get cursor x-position
			return e.clientX
				// ...relative to the parent
				- this.getParentX();
		},
		getCursorY(e) {
			// Get cursor y-position
			return e.clientY
			// ...relative to the parent
			- this.getParentY();
		},

		// Cursor offset
		getOffset(xy) {
			return this.xyConditional(xy, this.offsetX, this.offsetY);
		},
		setOffset(e) {
			this.offsetX = this.getCursorX(e) - this.getLeft();
			this.offsetY = this.getCursorY(e) - this.getTop();
		},
		setOffsetX(e) {
			this.offsetX = this.getCursorX(e) - this.getLeft();
		},
		setOffsetY(e) {
			this.offsetY = this.getCursorY(e) - this.getTop();
		},
		unsetOffset() {
			this.offsetX = 0;
			this.offsetY = 0;
		},

		// Grid
		getGrid(xy) {
			return this.xyConditional(xy, this.gridX, this.gridY);
		},

		/* --- Move methods ---*/
		// General moves
		dimensionMove(xy, e) {
			// Get current left or top side XY position
			const lt = this.getLeftOrTop(xy);
			// Get proposed new right/bottom
			let rb = this.getCursor(xy, e)
				// Small padding
				+ this.cursorPadding;

			// Clamp wh between min and max values
			const min = lt + this.getMinWidthOrHeight(xy);
			const max = this.getParentWH(xy);
			rb = clamp(rb, min, max);

			// Apply grid
			if (this.grid) {
				const grid = this.getGrid(xy);
				rb = this.applyGridBuf(rb, this.getRightOrBottom(xy), max, grid, this.gridB);
			}

			// Return new width/height
			return rb - lt;
		},
		positionMove(xy, e) {
			// Get proposed new left/right
			let lt = this.getCursor(xy, e) - this.getOffset(xy);

			// Clamp cursor between min and max
			const min = 0;
			const max = this.getParentWH(xy) - this.getWidthOrHeight(xy);
			lt = clamp(lt, min, max);

			if (this.grid) {
				const grid = this.getGrid(xy);
				lt = this.applyGridBuf(lt, this.getLeftOrTop(xy), max, grid, this.gridB);
			}

			// Return new left/top
			return lt;
		},
		positionDimensionMove(xy, e) {
			// Get right or bottom side XY position
			const rb = this.getRightOrBottom(xy);
			// Get proposed x or y-position
			let lt = this.getCursor(xy, e)
				// Small cursor padding
				- this.cursorPadding;

			// Clamp leftX between min and max
			const min = 0;
			const max = rb - this.getMinWidthOrHeight(xy);
			lt = clamp(lt, min, max);

			if (this.grid) {
				const grid = this.getGrid(xy);
				lt = this.applyGridBuf(lt, this.getLeftOrTop(xy), max, grid, this.gridB);
			}

			// Return new left/top and width/height
			return [lt, rb - lt];
		},

		// Drag bar
		freeMove(e) {
			const left = this.positionMove('x', e);
			const top = this.positionMove('y', e);

			if (this.rect.left !== left || this.rect.top !== top) {
				/* Apply changes */
				this.setLeft(left);
				this.setTop(top);

				/* Refresh */
				this.updateDOM();
			}
		},

		// Sides
		leftMove(e) {
			const [left, width] = this.positionDimensionMove('x', e);

			if (this.rect.left !== left) {
				/* Apply changes */
				this.setLeft(left);
				this.setWidth(width);

				/* Refresh */
				this.updateDOM();
			}
		},
		topMove(e) {
			const [top, height] = this.positionDimensionMove('y', e);

			if (this.rect.top !== top) {
				/* Apply changes */
				this.setTop(top);
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
		},
		rightMove(e) {
			const width = this.dimensionMove('x', e);

			if (this.rect.width !== width) {
				/* Apply changes */
				this.setWidth(width);

				/* Refresh */
				this.updateDOM();
			}
		},
		bottomMove(e) {
			const height = this.dimensionMove('y', e); // Height

			if (this.rect.height !== height) {
				/* Apply changes */
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
		},

		// Corners
		topLeftMove(e) {
			const [left, width] = this.positionDimensionMove('x', e);
			const [top, height] = this.positionDimensionMove('y', e);

			if (this.rect.left !== left || this.rect.top !== top) {
				/* Apply changes */
				this.setLeft(left);
				this.setWidth(width);
				this.setTop(top);
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
		},
		topRightMove(e) {
			const width = this.dimensionMove('x', e);
			const [top, height] = this.positionDimensionMove('y', e);

			if (this.rect.width !== width || this.rect.top !== top) {
				/* Apply changes */
				this.setWidth(width);
				this.setTop(top);
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
		},
		bottomRightMove(e) {
			const width = this.dimensionMove('x', e);
			const height = this.dimensionMove('y', e);

			if (this.rect.width !== width || this.rect.height !== height) {
				/* Apply changes */
				this.setWidth(width);
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
		},
		bottomLeftMove(e) {
			const [left, width] = this.positionDimensionMove('x', e);
			const height = this.dimensionMove('y', e);

			if (this.rect.left !== left || this.rect.height !== height) {
				/* Apply changes */
				this.setLeft(left);
				this.setWidth(width);
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
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
