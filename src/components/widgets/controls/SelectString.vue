<template>
  <div
    v-if="readonly || property.enum.length < 2"
    class="ar-readonly-div"
  >
    {{value}}
  </div>

  <el-radio-group
    v-else-if="property.enum.length < 5"
    v-on:input="$emit('input', $event)"
    :value="value"
  >
    <el-radio
      v-for="item in property.enum"
      :key="item"
      :label="item"
      :value="item"
    ></el-radio>
  </el-radio-group>
  <el-select v-else v-on:input="$emit('input', $event)" :value="value">
    <el-option
      v-for="item in property.enum"
      :key="item"
      :label="item"
      :value="item"
    >
    </el-option>
  </el-select>
</template>

<script>
export default {
  name: "ar-select-string",
  props: {
    value: {
      type: String,
      default: '',
    },
    property: {
      type: Object,
      default: () => {},
    },
    readonly: Boolean,
  },
};
</script>

<style scoped>

/* Readonly div */
.ar-readonly-div {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-style: none;
  font-size: 16px;
  line-height: 30px;
  min-height: 30px;
}

/* Radiobuttons */
.el-radio-group {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  font-size: 16px;
  line-height: 30px;
}

/* Select */
input.el-input__inner {
  background-color: #ffffff08;
  border-color: #00adff42;
  border-style: solid;
  font-size: 16px;
  height: 30px;
}
</style>
