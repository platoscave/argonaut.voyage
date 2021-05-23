<template>
  <ar-sub-form
    class="ar-subform-background"
    :properties="property.properties"
    :value="value"
    :requiredArr="property.required"
    :form-read-only="formReadOnly"
    :omit-empty-fields="omitEmptyFields"
    :hash-level="hashLevel"
    v-on:input="$emit('input', $event)"
  ></ar-sub-form>
</template>

<script>
//import Form from "./SubForm"; // must be declared globally

export default {
  name: "ar-nested-object",
  props: {
    value: {
      type: Object,
      default: () => {},
    },
    property: {
      type: Object,
      default: () => {},
    },
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
}
</style>
