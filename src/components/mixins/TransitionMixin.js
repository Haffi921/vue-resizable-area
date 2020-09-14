export default {
	props: {
		transition: {
			type: Boolean,
			default: false,
		},
		tSpeed: {
			type: Number,
			default: 2000,
			validator(value) {
				return value > 0;
			},
		},
		tFunction: {
			type: String,
			default: 'ease-in',
		},
	},
	methods: {
		setUpTransition() {
			const durationX = this.gridX / this.tSpeed;
			const durationY = this.gridY / this.tSpeed;
			const stringX = `${durationX}s ${this.tFunction}`;
			const stringY = `${durationY}s ${this.tFunction}`;
			const ruleX = `width ${stringX}, left ${stringX}`;
			const ruleY = `height ${stringY}, top ${stringY}`;

			this.$el.style.transition = `${ruleX}, ${ruleY}`;
		},
	},
};
