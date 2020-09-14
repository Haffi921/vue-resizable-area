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
	</div>
</template>

<script>
import { clamp } from 'lodash';

// Components
import ResizeHandle from '@/components/ResizeHandle.vue';

/* Mixins */
import UtilityMixin from '@/components/mixins/UtilityMixin';
// Rects
import HTMLRectMixin from '@/components/mixins/HTMLRectMixin';
import ParentRectMixin from '@/components/mixins/ParentRectMixin';
// Browser
import CursorPositionMixin from '@/components/mixins/CursorPositionMixin';
import WindowChangeMixin from '@/components/mixins/WindowChangeMixin';
// PropMixins
import GridMixin from '@/components/mixins/propMixins/GridMixin';
import TransitionMixin from '@/components/mixins/propMixins/TransitionMixin';
/* ------ */

export default {
	components: {
		ResizeHandle,
	},
	mixins: [
		UtilityMixin,
		HTMLRectMixin,
		ParentRectMixin,
		CursorPositionMixin,
		WindowChangeMixin,
		// PropMixins
		GridMixin,
		TransitionMixin,
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
		// Cursor padding is half the handle width
		this.cursorPadding = Math.floor(this.handleWidth / 2);
	},
	methods: {
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
			const max = this.getMaxRightOrBottom(xy);
			rb = clamp(rb, min, max);

			// Apply grid
			if (this.grid) {
				const grid = this.getGrid(xy);
				rb = this.applyGridBuf(rb, this.getRightOrBottom(xy), max, grid, this.gridB);
			}

			this.setWidthOrHeight(xy, rb - lt);
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

			this.setLeftOrTop(xy, lt);
		},
		positionDimensionMove(xy, e) {
			// Get right or bottom side XY position
			const rb = this.getRightOrBottom(xy);
			// Get proposed x or y-position
			let lt = this.getCursor(xy, e)
				// Small cursor padding
				- this.cursorPadding;

			// Clamp leftX between min and max
			const min = this.getMinLeftOrTop(xy);
			const max = rb - this.getMinWidthOrHeight(xy);
			lt = clamp(lt, min, max);

			if (this.grid) {
				const grid = this.getGrid(xy);
				lt = this.applyGridBuf(lt, this.getLeftOrTop(xy), max, grid, this.gridB);
			}

			this.setLeftOrTop(xy, lt);
			this.setWidthOrHeight(xy, rb - lt);
		},

		// Drag bar
		freeMove(e) {
			this.positionMove('x', e);
			this.positionMove('y', e);
		},

		// Sides
		leftMove(e) {
			this.positionDimensionMove('x', e);
		},
		topMove(e) {
			this.positionDimensionMove('y', e);
		},
		rightMove(e) {
			this.dimensionMove('x', e);
		},
		bottomMove(e) {
			this.dimensionMove('y', e);
		},

		// Corners
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
