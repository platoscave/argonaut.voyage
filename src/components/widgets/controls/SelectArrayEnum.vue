<template>
  <!-- TODO This is nonsense. Enums are single select by definition 
     To be removed  
  -->
  <div v-if="readonly" class="ar-lightgrey-background">
    {{ value.join(", ") }}
  </div>

  <el-checkbox-group
    v-else-if="property.items.enum.length < 5"
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :value="value"
  >
    <el-checkbox
      v-for="item in property.items.enum"
      :key="item"
      :label="item"
      :value="item"
    ></el-checkbox>
  </el-checkbox-group>
  <el-select
    class="ar-multiple"
    v-else
    v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)"
    :value="value"
    multiple
  >
    <el-option
      v-for="item in property.items.enum"
      :key="item"
      :label="item"
      :value="item"
    >
    </el-option>
  </el-select>
</template>

<script>
export default {
  name: "ar-select-array-enum",
  props: {
    value: {
      type: Array,
      default: () => [],
    },
    property: {
      type: Object,
      default: () => {},
    },
    required: Boolean,
    readonly: Boolean,
  },
};
</script>

<style scoped>

/* checkbox background*/
.el-checkbox-group {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  font-size: 16px;
  line-height: 24px;
}

/* Select */
/* .ar-control >>> .el-input > input {
  background-color: #ffffff08;
  border-color: #00adff42;
  font-size: 16px;
  height: 30px;
} */

/* Fix multiselect */
.ar-multiple >>> .el-tag {
  background-color: #ffffff08;
}
.ar-multiple >>> .el-select__tags-text {
  color: #00adff;
}
.ar-multiple >>> .el-icon-close {
  background-color: #ff4000a3;
  color: #eee;
}
</style>
