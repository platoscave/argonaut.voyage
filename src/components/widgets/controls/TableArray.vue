<template>
  <ar-sub-table
    class="ar-subform-background"
    :properties="property.items.properties"
    :value="value"
    :requiredArr="property.required"
    :form-read-only="formReadOnly"
    :omit-empty-fields="omitEmptyFields"
    :hash-level="hashLevel"
    v-on:input="$emit('input', $event)"
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
    formReadOnly: Boolean,
    omitEmptyFields: Boolean,
    hashLevel: Number,
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
