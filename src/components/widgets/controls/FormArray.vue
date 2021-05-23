<template>
  <div>
    <!-- Create a subForm for each of the items in the value array -->
    <div
      v-for="(item, idx) in value"
      :key="idx"
      :class="{
        'ar-subform-background': true,
        'not-readonly': !readonly && property.additionalItems,
      }"
    >
      <ar-sub-form
        :draggable="!readonly && property.additionalItems"
        :properties="property.items.properties"
        :value="item"
        :requiredArr="property.required"
        :form-read-only="formReadOnly"
        :omit-empty-fields="omitEmptyFields"
        :hash-level="hashLevel"
        v-on:input="$emit('input', $event)"
      ></ar-sub-form>
      <!-- Delete icon -->
      <i
        v-if="!readonly && property.additionalItems"
        class="el-icon-close"
        @click="value.splice(idx, 1)"
      ></i>
    </div>
    <!-- Add icon -->
    <i
      v-if="!readonly && property.additionalItems"
      class="el-icon-plus"
      @click="value.push({})"
    ></i>
  </div>
</template>

<script>
//import Form from "./SubForm"; // must be declared globally

export default {
  name: "ar-form-array",
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
