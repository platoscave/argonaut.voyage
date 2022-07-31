<script setup lang="ts">
//import toolbarSymbols from "./toolbar-symbols.svg";

const props = defineProps({
  isActive: { type: Boolean, default: false },
  popupText: { type: String, default: '' },
  iconName: { type: String, default: '' },
})

</script>

<template>
  <el-tooltip :content="popupText" placement="top-start" effect="light">
    <!-- button must have type="button" since we are in a form -->
    <button
      type="button"
      class="menubar__button h-button"
      :class="{ 'is-active': isActive }"
      @click="$emit('buttonClicked')"
    >
      <svg class="icon bold">
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#' + iconName"
        ></use>
      </svg>
    </button>
  </el-tooltip>
</template>

<style scoped>
.icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  fill: lightgray;
}
.menubar__button {
  color: lightgray;
  font-size: 16px;
  background-color: #ffffff1a;
  border-radius: 4px;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  padding-top: 4px;
  margin-right: 3px;
}
.menubar__button.is-active {
  background-color: #00adff42;
}
</style>