<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: "" },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
  // we need to add these to prevent vue warn, for some reason
  class: { type: String, default: '' }, 
  required: { type: Boolean, default: false }, 
  formMode: { type: String, default: '' }
});
const emit = defineEmits(['update:modelValue'])


const onInput = (escapedSvg) => {
  if (props.modelValue.startsWith("data:image/svg+xml;base64,")) {
    const base64Encoded = window.btoa(escapedSvg);
    //console.log("urlEncoded", base64Encoded);
    emit('update:modelValue', "data:image/svg+xml;base64," + base64Encoded)

  }
  if (props.modelValue.startsWith("data:image/svg+xml;utf8,")) {
    // The svg must be uri escaped. However we dont need to escape everything, so we roll our own
    // This leaves the svg somewhat ledgible in our data store
    const escapeUrl = (text) => {
      var map = {
        "&": "%26",
        "#": "%23",
        "<": "%3C",
        ">": "%3E",
        '"': "'",
      };
      return text.replace(/[&#<>"]/g, function (m) {
        return map[m];
      });
    };

    let urlEncoded = escapeUrl(escapedSvg);
    //console.log("urlEncoded", urlEncoded);
    emit('update:modelValue', "data:image/svg+xml;utf8," + urlEncoded)
  }
};

const svgMarkup = computed(() => {
  if (props.modelValue.startsWith("data:image/svg+xml;base64,")) {
    const markup = props.modelValue.slice(26); // remove data:image/svg+xml;base64,
    return window.atob(markup);
  }

  if (props.modelValue.startsWith("data:image/svg+xml;utf8,")) {
    const markup = props.modelValue.slice(24); // remove data:image/svg+xml;utf8,
    return decodeURIComponent(markup);
  }
  return "";
});
</script>

<template>
  <svg
    v-if="modelValue.startsWith('el-icon')"
    class="ar-lightgrey-background"
    height="20px"
    width="20px"
  >
    <use
      xmlns:xlink="http://www.w3.org/1999/xlink"
      :xlink:href="'toolbar-symbols.svg#' + modelValue"
    ></use>
  </svg>
  <img
    v-else
    :src="modelValue"
    class="ar-lightgrey-background"
    height="20px"
    width="20px"
  />

  <div v-if="!readonly" class="ar-full-width">
    <el-input
      class="ar-control"
      v-if="modelValue.startsWith('data:image/svg+xml')"
      type="textarea"
      autosize
      :value="svgMarkup"
      :input="onInput"
    ></el-input>

    <el-input
      class="ar-control"
      v-else
      :value="modelValue"
      @input="$emit('update:modelValue', $event)"
    ></el-input>
  </div>

  <!-- In future color coded editor
    <div v-if="property.contentMediaType === 'image/svg+xml' && !readonly">
      <ar-tiptap
        v-on:input="$emit('input', $event)"
        :model-value="'<pre><code>' + svgMarkup + '</code></pre>'"
      ></ar-tiptap>
    </div> -->
</template>

<style scoped>
.ar-full-width {
  width: 100%;
}
</style>
