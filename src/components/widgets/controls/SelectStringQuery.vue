<script setup lang="ts">
import { ref, computed } from "vue";
import useArgoQuery from "~/composables/useArgoQuery";
import { useHashDissect } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: '' },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  required: { type: Boolean, default: false },
})

const { selectedObjId } = useHashDissect(props.hashLevel);

const items = useArgoQuery(
  props.property.argoQuery,
  {_id: selectedObjId.value},
  [props.property, selectedObjId]
)

const valueLabel = computed(() => {
  if (!(props.modelValue && items.value)) return "";
  let valueObj = items.value.find(obj => {
    return obj._id === props.modelValue;
  })

  if (!valueObj) return props.modelValue;
  return valueObj.title ? valueObj.title : valueObj.name;
});
</script>

<template>
  <div v-if="items">
    <div v-if="readonly" class="ar-lightgrey-background">
      {{ valueLabel }}
    </div>
    <el-radio-group
      class="ar-radio-group"
      v-else-if="items.length < 5"
      v-on:input="$emit('input', $event)"
      v-on:change="$emit('change', $event)"
      :model-value="modelValue"
    >
      <el-radio
        v-for="item in items"
        :key="item._id"
        :label="item.title ? item.title : item.name"
        :model-value="item._id"
      ></el-radio>
    </el-radio-group>
    <el-select
      v-else
      class="ar-select"
      v-on:input="$emit('input', $event)"
      v-on:change="$emit('change', $event)"
      :model-value="modelValue"
      :clearable="required ? false : true"
    >
      <el-option
        v-for="item in items"
        :key="item._id"
        :label="item.title ? item.title : item.name"
        :value="item._id"
      >
      </el-option>
    </el-select>
  </div>
</template>

<style scoped>
.el-radio.ar-radio {
  height:24px
}
.ar-radio-group {
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
</style>
