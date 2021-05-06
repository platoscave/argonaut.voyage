<template>
  <!-- Studio -->
  <div>
    <!-- Full page background -->
    <div class="diagram">
      <slot name="diagram"></slot>
    </div>

    <!-- Left drawer -->
    <div class="drawer-left" v-bind:class="{ 'left-open': leftOpen }">
      <div class="drawer-content">
        <slot name="drawer-left"></slot>
      </div>
      <div class="left-handle" @click="leftOpen = !leftOpen">
        <svg class="handle-icon">
          <use
            xmlns:xlink="http://www.w3.org/1999/xlink"
            :xlink:href="'toolbar-symbols.svg#handle-left'"
          ></use>
        </svg>
      </div>
    </div>

    <!-- Right drawer -->
    <div class="drawer-right" v-bind:class="{ 'right-open': rightOpen }">
      <div class="drawer-content">
        <slot name="drawer-right" class="drawer-content"></slot>
      </div>
      <div class="right-handle" @click="rightOpen = !rightOpen">
        <svg class="handle-icon">
          <use
            xmlns:xlink="http://www.w3.org/1999/xlink"
            :xlink:href="'toolbar-symbols.svg#handle-right'"
          ></use>
        </svg>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: "ar-studio",
  props: {},
  data() {
    return {
      leftOpen: true,
      rightOpen: false,
    };
  },
};
</script>

<style scoped>
/* Studio */
.diagram {
  height: calc(100vh - 40px);
  width: 100%;
  position: absolute;
}
.drawer-left {
  z-index: 10;
  position: absolute;
  left: -300px;
  min-width: 300px;
  transition-property: left;
  transition-duration: 1s;
}
.left-open {
  left: 0px;
}
.drawer-right {
  z-index: 10;
  position: absolute;
  right: -450px;
  width: 450px;
  transition-property: right;
  transition-duration: 1s;
}
.right-open {
  right: 0px;
}
.drawer-content {
  background: #232323db;
  /* background: #232323ab; */
  border-radius: 6px;
  border-style: solid;
  border-width: 1px;
  border-color: #524f4f;
  overflow: auto;
  max-height: calc(100vh - 40px);
}
.drawer-content >>> .el-tree {
  background: unset;
  padding-top: 5px;
}
.left-handle {
  position: absolute;
  top: calc(50% - 20px);
  left: 100%;
  z-index: 10;
}
.right-handle {
  position: absolute;
  top: calc(50% - 20px);
  right: 100%;
  z-index: 10;
}
.handle-icon {
  width: 20px;
  height: 40px;
  fill: #e91e63;
}
</style>