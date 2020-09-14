import UtilityMixin from '@/components/mixins/util/UtilityMixin';
import HTMLRectMixin from '@/components/mixins/HTMLRectMixin';

export default {
	mixins: [UtilityMixin, HTMLRectMixin],
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
		restrictX: false,
		restrictY: false,
	}),
	created() {
		if (this.restrictToParent) {
			if (typeof this.restrictToParent === 'boolean') {
				this.restrictX = this.restrictToParent;
				this.restrictY = this.restrictToParent;
			} else {
				[this.restrictX, this.restrictY] = this.restrictToParent;
			}
		}
	},
	mounted() {
		this.refreshParent();
	},
	methods: {
		refreshParent() {
			const parent = this.$el.parentElement;
			const padding = window.getComputedStyle(parent).padding
				.match(/\d+/g)
				.map((p) => parseInt(p, 10));

			this.parent = parent.getBoundingClientRect();
			this.parent.padding = {
				top: padding[0 % padding.length],
				right: padding[1 % padding.length],
				bottom: padding[2 % padding.length],
				left: padding[3 % padding.length],
			};

			// If padding is 'padding: {top} {left/right} {bottom};'
			if (padding.length === 3) this.parent.padding.left = this.parent.padding.right;

			if (this.restrictToParent) {
				if (this.restrictX) this.restrictArea('x');
				if (this.restrictY) this.restrictArea('y');
			}
		},

		restrictArea(xy) {
			this.setMinLeftOrTop(xy, 0);
			this.setMaxRightOrBottom(xy, this.getParentWH(xy));
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
