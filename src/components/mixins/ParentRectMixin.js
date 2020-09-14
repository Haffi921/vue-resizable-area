export default {
	data: () => ({
		parent: {},
	}),
	mounted() {
		this.refreshParent();
	},
	methods: {
		refreshParent() {
			const padding = window.getComputedStyle(
				this.$el.parentNode,
			).padding.match(/\d+/g).map((p) => parseInt(p, 10));

			this.parent = this.$el.parentNode.getBoundingClientRect();
			this.parent.padding = {
				top: padding[0 % padding.length],
				right: padding[1 % padding.length],
				bottom: padding[2 % padding.length],
				left: padding[3 % padding.length],
			};

			// If padding is 'padding: {top} {left/right} {bottom};'
			if (padding.length === 3) this.parent.padding.left = this.parent.padding.right;

			if (this.restrictToParent) {
				this.setMaxWidth(this.getParentW());
				this.setMaxHeight(this.getParentH());
			}
		},
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
		getParentWH(xy) {
			return this.xyConditional(xy, this.getParentW, this.getParentH);
		},
	},
};
