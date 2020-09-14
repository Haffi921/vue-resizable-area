import { clamp } from 'lodash';
import HTMLRectMixin from '@/components/mixins/HTMLRectMixin';
import ParentRectMixin from '@/components/mixins/ParentRectMixin';
import GridMixin from '@/components/mixins/propMixins/GridMixin';

export default {
	mixins: [HTMLRectMixin, ParentRectMixin, GridMixin],
	mounted() {
		// Update rects on window change
		this.setWindowChangeListeners();
	},
	methods: {
		// Event listener methods
		setWindowChangeListeners() {
			window.addEventListener('scroll', this.refreshParent);
			window.addEventListener('resize', this.onWindowResize);
		},
		onWindowResize() {
			this.refreshParent();

			if (this.restrictToParent) {
				['x', 'y'].forEach((xy) => {
					if (this.getRightOrBottom(xy) > this.getParentWH(xy)) {
						this.reloadRect(xy);
					}
				});
			}
		},

		// Reload rects
		reloadRect(xy) {
			// Width/Height
			const minWH = this.getMinWidthOrHeight(xy);
			const maxWH = this.getMaxWidthOrHeight(xy);
			// Left/Top
			const maxLT = this.getParentWH(xy) - minWH;
			const minLT = this.getMinLeftOrTop(xy);

			// New values
			let wh = clamp(this.getWidthOrHeight(xy), minWH, maxWH);
			let lt = clamp(this.getLeftOrTop(xy), minLT, maxLT);

			// Apply grid if needed
			if (this.grid) {
				const grid = this.getGrid(xy);
				wh = this.applyGridFloor(wh, grid);
				lt = this.applyGridFloor(lt, grid);
			}

			// Apply
			this.setWidthOrHeight(xy, wh);
			this.setLeftOrTop(xy, lt);
		},
	},
};
