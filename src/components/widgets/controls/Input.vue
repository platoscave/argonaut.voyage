<script setup lang="ts">
import { ref, computed } from "vue";
import { lowlight } from "lowlight/lib/core.js";
import { toHtml } from "hast-util-to-html";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: '' },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
})

const highlightedCode = computed(() => {
  if (props.modelValue) {
    const res = lowlight.highlightAuto(JSON.stringify(props.modelValue, null, 4));
    return toHtml(res);
  }
  return "";
});
</script>

<template>
  <div v-if="readonly" class="ar-lightgrey-background">
    {{modelValue}}
  </div>
    <el-input v-else
      Xtype="textarea"
      autosize
      v-on:input="$emit('input', $event)"
      :model-value="modelValue"
    ></el-input>
</template>


<style scoped>
</style>
