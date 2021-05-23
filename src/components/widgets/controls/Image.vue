<template>
  <div>
    <img class="ar-rodiv" :src="value" />

    <div v-if="property.contentMediaType === 'image/svg+xml'">
      <tiptap
        v-on:update="$emit('input', $event)"
        v-bind:value="svgMarkup"
      ></tiptap>
    </div>
  </div>
</template>

<script>
export default {
  name: "ar-image",
  props: {
    property: Object,
    value: String,
    readonly: Boolean,
    required: Boolean,
  },
  computed: {
    svgMarkup: function () {
      if (this.property.contentEncoding === "base64") {
        return "<pre><code>" + escapeHtml(svgMarkup) + "</code></pre>";
      }
      return "<pre><code>" + escapeHtml(svgMarkup) + "</code></pre>";
    },
  },
};
</script>

<style scoped>
</style>
