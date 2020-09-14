import { clamp } from 'lodash';
import HTMLRectMixin from '@/components/mixins/HTMLRectMixin';

export default {
	mixins: [HTMLRectMixin],
	props: {
		// Grid
		grid: {
			type: Array,
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
	},
	data: () => ({
		gridX: 1,
		gridY: 1,
		gridB: 0,
	}),
	mounted() {
		if (this.grid) this.setUpGrid();
	},
	methods: {
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
		getGrid(xy) {
			return this.xyConditional(xy, this.gridX, this.gridY);
		},
	},
};
