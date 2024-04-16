<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: Object, default: {} },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  formMode: { type: String, default: "Readonly Dense" },
})
let objValue = props.modelValue
const highlightedCode = computed(() => {

});
</script>


<template>
  <ar-sub-table
    class="ar-subform-background"
    v-model="objValue"
    :properties="property.items.properties"
    :requiredArr="property.required"
    :form-mode="formMode"
    :hash-level="hashLevel"
  ></ar-sub-table>
</template>
<!--
<script>
//import SubForm from "./SubForm"; // must be declared globally

export default {
  name: "ar-view-table-array",
  props: {
    modelValue: {
      type: Array,
      default: () => [],
    },
    property: {
      type: Object,
      default: () => {},
    },
    readonly: Boolean,
    formMode: String,
    hashLevel: Number,
  },
  watch: {
    modelValue: {
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
  margin-bottom: 10px;
  position: relative;
}
</style>
