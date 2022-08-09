<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  leftSize: { type: Number, default: 300 },
  rightSize: { type: Number, default: 0 },
});
const emit = defineEmits(["leftsizestop", "rightsizestop"]);
let studioEl = ref('')

const minWidthLeft = 300;
const minWidthRight = 450;
let sizeLeft = ref(props.leftSize)
let sizeRight = ref(props.rightSize)
let moving = "";

const onMouseDownLeft = () => {
  console.log('down')
  moving = "left";
};
const onMouseDownRight = () => {
  moving = "right";
};
const onMouseMove = (evt) => {
  if (moving === "left") {
    let rect = studioEl.value.getBoundingClientRect();
    sizeLeft.value = evt.clientX - rect.left;
    console.log('moving', sizeLeft.value)
  }
  if (moving === "right") {
    let rect = studioEl.value.getBoundingClientRect();
    sizeRight.value = rect.right - evt.clientX;
  }
};
const onMouseUp = () => {
  if (moving === "left") {
    emit("leftsizestop", sizeLeft.value);
    moving = "";
  }
  if (moving === "right") {
    emit("rightsizestop", sizeRight.value);
    moving = "";
  }
};
</script>

<template>
  <!-- Studio -->
  <div ref="studioEl" @mousemove="onMouseMove" @mouseup="onMouseUp" class="studio">
    <!-- Full page background -->
    <div class="diagram">
      <slot></slot>
    </div>

    <!-- Left drawer -->
    <div
      class="drawer-left"
      :style="{
        left: sizeLeft > minWidthLeft ? 0 + 'px' : sizeLeft - minWidthLeft + 'px',
        width: sizeLeft < minWidthLeft ? minWidthLeft + 'px' : sizeLeft + 'px',
      }"
    >
      <div class="drawer-content">
        <slot name="drawer-left"></slot>
      </div>
      <div
        class="left-handle"
        @dblclick="
          sizeLeft === minWidthLeft ? (sizeLeft = 0) : (sizeLeft = minWidthLeft)
        "
        @mousedown="onMouseDownLeft"
      >
        <svg class="handle-icon">
          <use
            xmlns:xlink="http://www.w3.org/1999/xlink"
            :xlink:href="'toolbar-symbols.svg#handle-left'"
          ></use>
        </svg>
      </div>
    </div>

    <!-- Right drawer -->
    <div
      class="drawer-right"
      v-bind:style="{
        right:
          sizeRight > minWidthRight
            ? 0 + 'px'
            : sizeRight - minWidthRight + 'px',
        width:
          sizeRight < minWidthRight ? minWidthRight + 'px' : sizeRight + 'px',
      }"
    >
      <div class="drawer-content">
        <slot name="drawer-right" class="drawer-content"></slot>
      </div>
      <div
        class="right-handle"
        @dblclick="
          sizeRight === minWidthRight
            ? (sizeRight = 0)
            : (sizeRight = minWidthRight)
        "
        @mousedown="onMouseDownRight"
      >
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


<style scoped>
/* Studio */
.studio {
  /* height: calc(100vh - 40px); */
  /* width: 100%; */
  position: relative;
}
.diagram {
  height: calc(100vh - 40px);
  width: 100%;
  position: absolute;
}
.drawer-left {
  z-index: 10;
  position: absolute;
}
.drawer-right {
  z-index: 10;
  position: absolute;
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
  cursor: col-resize;
}
.right-handle {
  position: absolute;
  top: calc(50% - 20px);
  right: 100%;
  z-index: 10;
  cursor: col-resize;
}
.handle-icon {
  width: 20px;
  height: 40px;
  fill: #e91e63;
}
</style>
