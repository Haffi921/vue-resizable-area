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
		left: {{ this.$data.left }}<br>
		top: {{ this.$data.top }}<br>
		right: {{ this.$data.right }}<br>
		bottom: {{ this.$data.bottom }}<br>
		width: {{ this.$data.width }}<br>
		height: {{ this.$data.height }}<br>
	</div>
</template>

<script>
import { clamp, gte, gt } from 'lodash';
import HTMLRectMixin from '@/components/mixins/HTMLRectMixin';
import ParentRectMixin from '@/components/mixins/ParentRectMixin';
import ResizeHandle from '@/components/ResizeHandle.vue';

const RectPropsMixin = {
	props: {
		// Left and Top
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
		minL: {
			type: Number,
			validator: (value) => gt(value, 0),
		},
		minT: {
			type: Number,
			validator: (value) => gt(value, 0),
		},

		// Right and Bottom
		maxR: {
			type: Number,
			validator: (value) => gt(value, 0),
		},
		maxB: {
			type: Number,
			validator: (value) => gt(value, 0),
		},

		// Width and Height
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
	},
};

export default {
	components: {
		ResizeHandle,
	},
	mixins: [
		RectPropsMixin,
		HTMLRectMixin,
	],
	props: {
		// Width of drag handles
		handleWidth: {
			type: Number,
			default: 6,
		},

		// Width / Height
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

		// Paddings for cursor on handle
		cursorPadding: 0,

		// Offset XY Cords for free drag
		offsetX: 0,
		offsetY: 0,

		// Grid
		gridX: 1,
		gridY: 1,
		gridB: 0,
	}),
	created() {
		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);

		// Right or bottom
		if (this.restrictToParent) {
			let restrict = [];
			if (typeof this.restrictToParent === 'boolean') {
				restrict = [this.restrictToParent, this.restrictToParent];
			} else {
				restrict = this.restrictToParent;
			}
			this.setMinLeft(restrict[0] ? 0 : -Infinity);
			this.setMinTop(restrict[1] ? 0 : -Infinity);
			// this.setMaxRight(restrict[0] ? this.getParentW() : Infinity);
			// this.setMaxBottom(restrict[1] ? this.getParentH() : Infinity);
		}

		// Width and Height
		this.setWidth(this.W);
		this.setHeight(this.H);
		// Width and Height min
		this.setMinWidth(this.minW);
		this.setMinHeight(this.minH);
		// Width and Height max
		this.setMaxWidth(this.maxW);
		this.setMaxHeight(this.maxH);

		// Left and Top
		this.setLeft(this.L);
		this.setTop(this.T);
		// Left and Top min
		this.setMinLeft(this.minL ? this.minL : this.getMinLeft());
		this.setMinTop(this.minT ? this.minT : this.getMinTop());
		// Right and Bottom max
		this.setMaxRight(this.maxR ? this.maxR : this.getMaxRight());
		this.setMaxBottom(this.maxB ? this.maxB : this.getMaxBottom());
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
			const left = this.getLeft();
			const top = this.getTop();
			const width = this.getWidth();
			const height = this.getHeight();

			this.$el.style.width = `${width}px`;
			this.$el.style.height = `${height}px`;
			this.$el.style.left = `${left}px`;
			this.$el.style.top = `${top}px`;

			// Get new right and bottom
			this.setRight(left + width);
			this.setBottom(top + height);
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

		getRemainingWidth() {
			this.getMaxRight();
			// const a = this. - this.getLeft()
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

		/* --- Util methods ---*/
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

			if (this.left !== left || this.top !== top) {
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

			if (this.left !== left) {
				/* Apply changes */
				this.setLeft(left);
				this.setWidth(width);

				/* Refresh */
				this.updateDOM();
			}
		},
		topMove(e) {
			const [top, height] = this.positionDimensionMove('y', e);

			if (this.top !== top) {
				/* Apply changes */
				this.setTop(top);
				this.setHeight(height);

				/* Refresh */
				this.updateDOM();
			}
		},
		rightMove(e) {
			const width = this.dimensionMove('x', e);

			if (this.width !== width) {
				/* Apply changes */
				this.setWidth(width);

				/* Refresh */
				this.updateDOM();
			}
		},
		bottomMove(e) {
			const height = this.dimensionMove('y', e); // Height

			if (this.height !== height) {
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

			if (this.left !== left || this.top !== top) {
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

			if (this.width !== width || this.top !== top) {
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

			if (this.width !== width || this.height !== height) {
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

			if (this.left !== left || this.height !== height) {
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
