<script setup lang="ts">
import { ref, computed } from "vue";
import useArgoQuery from "~/composables/useArgoQuery";
import { useHashDissect } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: Array, default: [] },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  required: { type: Boolean, default: false },
});

const { selectedObjId } = useHashDissect(props.hashLevel);

const items = useArgoQuery(
  props.property.items.argoQuery,
  { key: selectedObjId.value },
  [props.property, selectedObjId]
);

const filteredObjs = computed(() => {
  if (!(props.modelValue && items.value)) return "";
  return items.value.filter((obj) => {
    return props.modelValue.includes(obj.key);
  });
});
</script>

<template>
  <div v-if="readonly" class="ar-lightgrey-background">
    <div v-for="item in filteredObjs" :key="item.key" :model-value="item.key">
      <img :src="'icons/' + item.treeVars.icon" />
      <span>{{ item.treeVars.label }}</span>
    </div>
  </div>
  <el-checkbox-group class="ar-checkbox-group" v-else-if="items.length < 5" v-on:input="$emit('input', $event)"
    v-on:change="$emit('change', $event)" :model-value="modelValue">
    <el-checkbox class="ar-checkbox" v-for="item in items" :key="item.key" :label="item.title ? item.title : item.name"
      :model-value="item.key"></el-checkbox>
  </el-checkbox-group>
  <el-select v-else v-on:input="$emit('input', $event)" v-on:change="$emit('change', $event)" :model-value="modelValue"
    multiple>
    <el-option v-for="item in items" :key="item.key" :label="item.treeVars.label" :value="item.key">
      <img :src="'icons/' + item.treeVars.icon" />
      <span>{{ item.treeVars.label }}</span>
    </el-option>
  </el-select>
</template>

<style scoped>
.el-checkbox.ar-checkbox {
  height: 24px
}

/* checkbox background*/
.ar-checkbox-group {
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

img {
  height: 20px;
  width: 20px;
  margin-right: 10px;
  vertical-align: middle;
}
</style>
