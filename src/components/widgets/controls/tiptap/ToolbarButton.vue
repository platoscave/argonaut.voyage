<template>
  <el-tooltip :content="popupText" placement="top-start" effect="dark">
    <!-- button must have type="button" since we are in a form See https://github.com/ueberdosis/tiptap/issues/729 -->
    <button
      type="button"
      class="menubar__button h-button"
      :class="{ 'is-active': this.isActive }"
      @click="$emit('buttonClicked')"
    >
      <svg class="icon bold">
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#' + this.iconName"
        ></use>
      </svg>
    </button>
  </el-tooltip>
</template>

<script>
//import toolbarSymbols from "./toolbar-symbols.svg";

export default {
  name: "toolbar-button",
  components: {
    //toolbarSymbols,
  },
  props: {
    isActive: {
      type: Boolean,
      default: false
    },
    popupText: String,
    iconName: String,
  },
};
</script>
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