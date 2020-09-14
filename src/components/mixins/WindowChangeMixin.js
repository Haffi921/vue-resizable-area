import { clamp } from 'lodash';

export default {
	mounted() {
		// Update rects on window change
		this.setWindowChangeListeners();
	},
	methods: {
		// Event listener methods
		onWindowResize() {
			this.refreshParent();

			let changed = false;

			['x', 'y'].forEach((xy) => {
				// TODO: Fix this; not working functionally after HTMLRectMixin change
				if (this.getRightOrBottom(xy) > this.getMaxRightOrBottom(xy)) {
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

		// Reload rects
		reloadRect(xy) {
			if (!this.reloadWH(xy)) {
				this.reloadLT(xy);
			}
		},
		reloadWH(xy) {
			const min = this.getMinWidthOrHeight(xy);
			const max = this.getMaxWidthOrHeight(xy);
			const wh = this.getWidthOrHeight(xy);
			const newValue = clamp(wh, min, max);
			if (wh === newValue) {
				this.setWidthOrHeight(xy, clamp(wh, min, max));
				return true;
			}
			return false;
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
	},
};
