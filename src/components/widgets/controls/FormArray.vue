<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  value: Object,
  property: Object,
  readonly: Boolean,
});

const highlightedCode = computed(() => {

});
</script>

<template>
  <div>
    <!-- Create a subForm for each of the items in the value array -->
    <div
      v-for="(item, idx) in value"
      :key="idx"
      :class="{
        'ar-subform-background': true,
        'not-readonly': formMode.startsWith('Edit') && property.additionalItems,
      }"
    >
      <ar-sub-form
        v-model="value[idx]"
        :draggable="formMode.startsWith('Edit') && property.additionalItems"
        :properties="property.items.properties"
        :requiredArr="property.required"
        :form-mode="formMode"
        :hash-level="hashLevel"
      ></ar-sub-form>
      <!-- Delete icon -->
      <i
        v-if="formMode.startsWith('Edit') && property.additionalItems"
        class="el-icon-close"
        @click="value.splice(idx, 1)"
      ></i>
    </div>
    <!-- Add icon -->
    <i
      v-if="formMode.startsWith('Edit') && property.additionalItems"
      class="el-icon-plus"
      @click="value.push({})"
    ></i>
  </div>
</template>
<!--
<script>
//import SubForm from "./SubForm"; // must be declared globally

export default {
  name: "ar-view-form-array",
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    property: {
      type: Object,
      default: () => {},
    },
    readonly: Boolean,
    formMode: String,
    additionalItems: Boolean,
    hashLevel: Number,
  },
  watch: {
    value: {
      handler(newVal) {
        this.$emit("input", newVal);
      },
      deep: true,
    },
  },
};
</script>
-->
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
  position: absolute;
  margin: 3px;
  top: 0px;
  right: 0;
  background-color: #ff4000a3;
  color: #eee;
  z-index: 20;
  border-radius: 50%;
}
.el-icon-plus {
  margin: 3px;
  background-color: green;
  color: #eee;
  z-index: 20;
  border-radius: 50%;
}
.not-readonly:hover {
  cursor: pointer;
}
</style>
