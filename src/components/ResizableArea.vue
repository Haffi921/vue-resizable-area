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
import { getMethod } from './utils';
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
		width: {
			type: Number,
			default: 200,
		},
		height: {
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
		grid: {
			type: String,
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

		// Rects
		rect: {},
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
		this.$el.style.width = `${this.width}px`;
		this.$el.style.height = `${this.height}px`;

		// Update rects
		this.refreshRect();
		this.refreshParent();

		// Update rects on window change
		window.addEventListener('resize', this.refreshRect);
		window.addEventListener('scroll', this.refreshRect);
		window.addEventListener('scroll', this.refreshParent);
		window.addEventListener('resize', this.refreshParent);

		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);

		// Grid
		if (this.grid) {
			// Calculate grid
			[this.gridx, this.gridy] = this.grid.match(/\d+/g);
			this.gbuf /= 2;

			// If grid is bigger then minLengths, then minLength is mute
			if (this.minWidth < this.gridx) this.minWidth = this.gridx;
			if (this.minHeight < this.gridy) this.minHeight = this.gridy;

			// Transition string
			// this.tSpeed = this.gridx / this.tSpeed;
			// this.tStringX = `${this.tSpeed}s ease-in`;
		}
	},
	methods: {
		// Refresh methods
		refreshRect() {
			this.rect = this.$el.getBoundingClientRect();
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

		// Binding method
		getMove: getMethod,

		// Get cursor methods
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
		getLeftX() {
			return this.rect.left - this.getParentX();
		},
		getTopY() {
			return this.rect.top - this.getParentY();
		},
		getRightX() {
			return this.rect.right - this.getParentX();
		},
		getBottomY() {
			return this.rect.bottom - this.getParentY();
		},

		// Grid methods
		applyGrid(value, grid) {
			return Math.round(value / grid) * grid;
		},
		applyGridBuf(value, parentValue, grid, buf) {
			const gridbuf = grid * buf;
			const widthBuf = value < parentValue
				? value + gridbuf
				: value - gridbuf;

			return this.applyGrid(widthBuf, grid);
		},

		// Transition
		removeTransition() {
			this.$el.style.removeProperty('transition');
		},

		// Side moves
		leftMove(e) {
			// Get cursor x-position relative to parent
			let leftX = this.getRelativeCursorX(e)
				// Small cursor padding
				- this.cursorPadding;

			// Get right side x-position
			const rightX = this.getRightX();
			console.log(rightX);

			// Clamp leftX between min and max
			leftX = clamp(leftX, 0, rightX - this.minWidth);

			if (this.grid) {
				leftX = this.applyGridBuf(
					leftX, this.rect.left, this.gridx, this.gbuf,
				);
				if (this.getLeftX() !== leftX) {
					// Apply styles
					this.$el.style.left = `${leftX}px`;
					this.$el.style.width = `${rightX - leftX}px`;
				}
			} else {
				// Apply styles
				this.$el.style.left = `${leftX}px`;
				this.$el.style.width = `${rightX - leftX}px`;
			}

			// Refresh rect
			this.refreshRect();
		},
		topMove(e) {
			// Get relative cursor y-position
			let topY = this.getRelativeCursorY(e)
				// Small cursor padding
				- this.cursorPadding;

			// Get bottom side y-position
			const bottomY = this.getBottomY();

			// Clamp topY between min and max
			topY = clamp(topY, 0, bottomY - this.minHeight);

			if (this.grid) {
				topY = this.applyGridBuf(
					topY, this.rect.top, this.gridy, this.gbuf,
				);
				if (this.getTopY() !== topY) {
					// Apply styles
					this.$el.style.top = `${topY}px`;
					this.$el.style.height = `${bottomY - topY}px`;
				}
			} else {
				// Apply styles
				this.$el.style.top = `${topY}px`;
				this.$el.style.height = `${bottomY - topY}px`;
			}

			// Refresh rect
			this.refreshRect();
		},
		rightMove(e) {
			// Get cursor x-position
			let w = this.getRelativeCursorX(e)
				// ...relative to left-side
				- this.getLeftX()
				// Small padding
				+ this.cursorPadding;

			// maxWidth is parent.width minus rect distance from left side
			const maxWidth = this.getParentW() - this.getLeftX();

			// Clamp w between min and max width
			w = clamp(w, this.minWidth, maxWidth);

			// Apply grid
			if (this.grid) {
				w = this.applyGridBuf(
					w, this.rect.width, this.gridx, this.gbuf,
				);
				if (this.rect.width !== w) {
					// Apply styles
					this.$el.style.width = `${w}px`;
				}
			} else {
				// Apply styles
				this.$el.style.width = `${w}px`;
			}

			// refresh rect
			this.refreshRect();
		},
		bottomMove(e) {
			// Get cursor y-position
			let h = this.getRelativeCursorY(e)
				// ...relative to left-side
				- this.getTopY()
				// Small padding
				+ this.cursorPadding;

			// maxHeight is parent.height minus rect distance from left side
			const maxHeight = this.getParentH() - this.getTopY();

			// Clamp h between min and max height
			h = clamp(h, this.minHeight, maxHeight);

			// Apply grid
			if (this.grid) {
				h = this.applyGridBuf(
					h, this.rect.height, this.gridy, this.gbuf,
				);
				if (this.rect.height !== h) {
					// Apply styles
					this.$el.style.height = `${h}px`;
				}
			} else {
				// Apply styles
				this.$el.style.height = `${h}px`;
			}

			// Refresh rect
			this.refreshRect();
		},

		// Corner moves
		topLeftMove(e) {
			this.topMove(e);
			this.leftMove(e);
		},
		topRightMove(e) {
			this.topMove(e);
			this.rightMove(e);
		},
		bottomRightMove(e) {
			this.bottomMove(e);
			this.rightMove(e);
		},
		bottomLeftMove(e) {
			this.bottomMove(e);
			this.leftMove(e);
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
