<script setup lang="ts">
import { ref, computed } from "vue";
import { lowlight } from "lowlight/lib/core.js";
import { toHtml } from "hast-util-to-html";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: Object, default: {} },
  properties: { type: Object, default: {} },
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
  <div v-if="readonly">
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
.ar-lightgrey-background >>> .hljs {
  background: unset;
  line-height: 20px;
  font-size: 14px;
  padding: 0px;
}
.ar-control > pre.ar-lightgrey-background {
  margin: 0px;
}
</style>
