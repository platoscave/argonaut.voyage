<template>
  <ar-sub-table
    class="ar-subform-background"
    v-model="value"
    :properties="property.items.properties"
    :requiredArr="property.required"
    :form-mode="formMode"
    :hash-level="hashLevel"
  ></ar-sub-table>
</template>

<script>
//import Form from "./SubForm"; // must be declared globally

export default {
  name: "ar-table-array",
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

<style scoped>
/* subForm background */
.ar-subform-background {
  background-color: #ffffff08;
  padding: 10px;
  border-radius: 4px;
  border-style: none;
  margin-bottom: 10px;
  position: relative;
}
</style>
