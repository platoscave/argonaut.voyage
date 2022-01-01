<template>
  <div>
    <img :src="value" class="ar-lightgrey-background"/>
    <div v-if="readonly && property.contentMediaType === 'image/svg+xml'">
      <highlight-code lang="xml" class="ar-lightgrey-background">
        {{ svgMarkup }}
      </highlight-code>
    </div>
    <div v-else>
      <el-input
        type="textarea"
        autosize
        v-on:input="$emit('input', $event)"
        :value="svgMarkup"
      ></el-input>
    </div>
<!--     <div v-if="property.contentMediaType === 'image/svg+xml' && !readonly">
      <ar-tiptap
        v-on:input="$emit('input', $event)"
        v-on:change="$emit('change', $event)"
        :value="'<pre><code>' + svgMarkup + '</code></pre>'"
      ></ar-tiptap>
    </div> -->
  </div>
</template>

<script>
import Tiptap from "./TiptapEditor";
export default {
  name: "ar-image",
  components: {
    "ar-tiptap": Tiptap,
  },
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
  computed: {
    svgMarkup: function () {
      const escapeHtml = (text) => {
        var map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;",
        };
        return text.replace(/[&<>"']/g, function (m) {
          return map[m];
        });
      };
      if (this.property.contentEncoding === "base64") {
        const sub = this.value.slice(26) // remove data:image/svg+xml;base64,
        const markup = window.atob(sub)
        console.log(markup)
        return markup
      }
      return "<pre><code>" + escapeHtml(this.value) + "</code></pre>";
    },
  },
};
</script>

<style scoped>
.ar-lightgrey-background >>> .hljs {
  background: unset;
  line-height: 20px;
  font-size: 14px;
  padding: 0px;
}
.ar-control > pre.ar-lightgrey-background {
  margin: 0px
}
</style>
