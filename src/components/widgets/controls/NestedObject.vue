<template>
  <ar-sub-form
    class="ar-subform-background"
    v-model="value"
    :properties="property.properties"
    :requiredArr="property.required"
    :form-mode="formMode"
    :hash-level="hashLevel"
  ></ar-sub-form>
</template>

<script>
//import SubForm from "./SubForm"; // must be declared globally

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
}
</style>
