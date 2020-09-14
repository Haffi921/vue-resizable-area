export default {
	data: () => ({
		offsetX: 0,
		offsetY: 0,
	}),
	methods: {
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
	},
};
