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

// Components
import ResizeHandle from '@/components/ResizeHandle.vue';

// Mixins
import HTMLRectMixin from '@/components/mixins/HTMLRectMixin';
import ParentRectMixin from '@/components/mixins/ParentRectMixin';
import GridMixin from '@/components/mixins/GridMixin';
import TransitionMixin from '@/components/mixins/TransitionMixin';
import CursorPositionMixin from '@/components/mixins/CursorPositionMixin';
import WindowChangeMixin from '@/components/mixins/WindowChangeMixin';

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
		ParentRectMixin,
		GridMixin,
		TransitionMixin,
		CursorPositionMixin,
		WindowChangeMixin,
	],
	props: {
		// Width of drag handles
		handleWidth: {
			type: Number,
			default: 6,
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
	}),
	created() {
		// TODO: Fix this mess
		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);

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
		// Initial set up of area
		this.updateDOM();
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
		getRemainingWidth() {
			this.getParentW();
			// const a = this. - this.getLeft()
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
