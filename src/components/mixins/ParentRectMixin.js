export default {
	props: {
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
	},
	data: () => ({
		parent: {},
		parentElement: {},
	}),
	mounted() {
		this.parentElement = this.$el.parentElement;
		this.refreshParent();

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
			this.setMaxRight(restrict[0] ? this.getParentW() : Infinity);
			this.setMaxBottom(restrict[1] ? this.getParentH() : Infinity);
		}
	},
	methods: {
		refreshParent() {
			const padding = window.getComputedStyle(
				this.parentElement,
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
				this.setMaxRight(this.getParentW());
				this.setMaxBottom(this.getParentH());
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
