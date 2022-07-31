<script setup lang="ts">
import { ref } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: Array, default: [] },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  formMode: { type: String, default: "Readonly Dense" },
});
</script>

<template>
  <div>
    <!-- Create a subForm for each of the items in the modelValue array -->
    <div
      v-for="(item, idx) in modelValue"
      :key="idx"
      :class="{
        'ar-subform-background': true,
        'not-readonly': formMode.startsWith('Edit') && property.additionalItems,
      }"
    >
      <SubForm
        v-model="modelValue[idx]"
        :draggable="formMode.startsWith('Edit') && property.additionalItems"
        :properties="property.items.properties"
        :requiredArr="property.required"
        :form-mode="formMode"
        :hash-level="hashLevel"
      ></SubForm>
      <!-- Delete icon -->
      <svg
        class="el-icon-close"
        v-if="formMode.startsWith('Edit') && property.additionalItems"
        @click="modelValue.splice(idx, 1)"
      >
        <use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#el-icon-close'"
        ></use>
      </svg>
    </div>
    <!-- Add icon -->
    <svg
      class="el-icon-plus"
      v-if="formMode.startsWith('Edit') && property.additionalItems"
      @click="modelValue.push({})"
    >
      <use
        xmlns:xlink="http://www.w3.org/1999/xlink"
        :xlink:href="'toolbar-symbols.svg#el-icon-plus'"
      ></use>
    </svg>
  </div>
</template>

<style scoped>
/* subForm background */
.ar-subform-background {
  background-color: #ffffff08;
  padding: 10px 10px 10px 15px;
  border-radius: 4px;
  border-style: none;
  position: relative;
}
.ar-subform-background:not(:last-child) {
  margin-bottom: 10px;
}
/* Icons */
.el-icon-close {
  height: 1em;
  width: 1em;
  position: absolute;
  margin: 3px;
  top: 0px;
  right: 0;
  /* background-color: #ff4000a3; */
  color: #ff4000a3;
  z-index: 20;
  border-radius: 50%;
}
.el-icon-plus {
  height: 1em;
  width: 1em;
  margin: 3px;
  /* background-color: green; */
  color: green;
  z-index: 20;
  border-radius: 50%;
}
.not-readonly:hover {
  cursor: pointer;
}
</style>
