export default {
	data: () => ({
		offsetX: 0,
		offsetY: 0,
	}),
	methods: {
		getCursor(xy, e) {
			const getX = this.getCursorX.bind(this, e);
			const getY = this.getCursorY.bind(this, e);
			return this.xyConditional(xy, getX, getY);
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
			this.setOffsetX(e);
			this.setOffsetY(e);
		},
		setOffsetX(e) {
			this.offsetX = this.getCursorX(e) - this.left;
		},
		setOffsetY(e) {
			this.offsetY = this.getCursorY(e) - this.top;
		},
		unsetOffset() {
			this.offsetX = 0;
			this.offsetY = 0;
		},
	},
};
