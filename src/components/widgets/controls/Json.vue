<script setup lang="ts">
import { ref, computed } from "vue";
import { lowlight } from "lowlight/lib/core.js";
import { toHtml } from "hast-util-to-html";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: Object, default: {} },
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
    <code>
      <pre v-html="highlightedCode" />
    </code>
  </div>
  <div v-else>
    <el-input
      type="textarea"
      autosize
      v-on:input="$emit('input', $event)"
      :model-value="JSON.stringify(modelValue, null, 2)"
    ></el-input>
  </div>
</template>


<style scoped>
code {
  padding: 0px;
}
pre {
  margin: 0px;
}
</style>
