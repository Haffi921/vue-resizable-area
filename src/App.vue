<template>
    <div id="app">
        <ResizableArea />
        <!-- grid="[200, 200]" :minWidth="200" :minHeight="200" /> -->
    </div>
</template>

<script>
import ResizableArea from './components/ResizableArea.vue';

export default {
	name: 'App',
	components: {
		ResizableArea,
	},
};
</script>

<style lang="less">
body {
    margin: 0;
    background: darkgray;
    box-sizing: border-box;
    z-index: 1000;
}

#app {
    font-family: Avenir, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background: white;
    height: calc(100vh - 20px);
    padding: 10px;
}
</style>
