<!--suppress ALL -->
<template>
	<div class="handle"
		:class="'handle-' + type"
		:style="cssVars"
		draggable="false">
		<div v-if="corner" class="vertical"></div>
		<div v-if="corner" class="horizontal"></div>
	</div>
</template>

<script>
const props = {
	downFunction: {
		type: Function,
	},
	moveFunction: {
		type: Function,
		required: true,
	},
	upFunction: {
		type: Function,
	},
	width: {
		type: Number,
		default: 6,
	},
	corner: {
		type: Boolean,
		default: false,
	},
	type: {
		type: String,
		required: true,
		validator(value) {
			return [
				'left', 'top', 'right', 'bottom',
				'top-left', 'top-right',
				'bottom-right', 'bottom-left',
				'bar',
			].includes(value);
		},
	},
};

const computed = {
	cssVars() {
		return {
			'--width': `${this.width}px`,
		};
	},
};

export default {
	props,
	computed,
	mounted() {
		this.$el.addEventListener('mousedown', this.onDown);
	},
	methods: {
		onDown(e) {
			window.addEventListener('mousemove', this.moveFunction);
			window.addEventListener('mouseup', this.onUp);
			if (this.downFunction) this.downFunction(e);
		},
		onUp(e) {
			window.removeEventListener('mousemove', this.moveFunction);
			window.removeEventListener('mouseup', this.onUp);
			if (this.upFunction) this.upFunction(e);
		},
	},
};
</script>

<style>
.handle {
	position: absolute;
	box-sizing: border-box;
}

/* Bar */
.handle-bar {
	top: 0;
	left: 0;
	width: 100%;
	height: var(--width);
}

/* Top-left */
.handle-top,
.handle-left,
.handle-top-left {
	top: 0;
	left: 0;
}

/* Top-right */
.handle-top-right {
	top: 0;
	right: 0;
}

/* Bottom-right */
.handle-bottom,
.handle-right,
.handle-bottom-right {
	bottom: 0;
	right: 0;
}

/* Bottom-left */
.handle-bottom-left {
	bottom: 0;
	left: 0;
}

/* Horizontal side handles */
.handle-top,
.handle-bottom {
	width: 100%;
	height: var(--width);
	cursor: row-resize;
}

/* Vertical side handles */
.handle-left,
.handle-right {
	width: var(--width);
	height: 100%;
	cursor: col-resize;
}

/* NW-SE Corners */
.handle-top-left,
.handle-bottom-right {
	cursor: nwse-resize;
}

/* NE-SW Corners */
.handle-top-right,
.handle-bottom-left {
	cursor: nesw-resize;
}

/* Corner handles */
.vertical {
	width: var(--width);
	height: 15px;
}

.horizontal {
	width: 15px;
	height: var(--width);
}

.vertical,
.horizontal {
	position: absolute;
	top: inherit;
	left: inherit;
	bottom: inherit;
	right: inherit;
}
</style>
