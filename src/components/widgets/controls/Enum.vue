<template>
  <div v-if="readonly || property.enum.length < 2" class="ar-rodiv">value</div>

  <el-radio-group
    v-else-if="property.enum.length < 5"
    v-on:update="$emit('input', $event)"
    v-bind:value="value"
  >
    <el-radio
      v-for="item in property.enum"
      :key="item"
      :label="item"
      :value="item"
    ></el-radio>
  </el-radio-group>
  <el-select v-else v-on:update="$emit('input', $event)" v-bind:value="value">
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
  name: "ar-eum",
  props: {
    property: Object,
    value: String,
    readonly: Boolean,
    required: Boolean
  },
};
</script>

<style scoped>
</style>
