<script setup lang="ts">
import { ref, computed } from "vue";

const props = defineProps({
  hashLevel: { type: Number, default: 0 },
  modelValue: { type: String, default: "" },
  property: { type: Object, default: {} },
  readonly: { type: Boolean, default: true },
});

const onInput = (escapedSvg) => {
  if (props.modelValue.startsWith("data:image/svg+xml;base64,")) {
    const base64Encoded = window.btoa(escapedSvg);
    //console.log("urlEncoded", base64Encoded);
    this.$emit("input", "data:image/svg+xml;base64," + base64Encoded);
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
    this.$emit("input", "data:image/svg+xml;utf8," + urlEncoded);
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
  <div>
    <i
      v-if="modelValue.startsWith('el-icon')"
      class="ar-lightgrey-background"
      v-bind:class="modelValue"
    />
    <img v-else :src="modelValue" class="ar-lightgrey-background" />

    <div v-if="modelValue.startsWith('data:image/svg+xml')">
      <div v-if="!readonly">
        <el-input
          type="textarea"
          autosize
          v-on:input="onInput"
          :model-value="svgMarkup"
        ></el-input>
      </div>
    </div>

    <div v-else-if="!readonly">
      <el-input
        :model-value="modelValue"
        v-on:input="$emit('input', $event)"
      ></el-input>
    </div>

    <!-- In future color coded editor
    <div v-if="property.contentMediaType === 'image/svg+xml' && !readonly">
      <ar-tiptap
        v-on:input="$emit('input', $event)"
        :model-value="'<pre><code>' + svgMarkup + '</code></pre>'"
      ></ar-tiptap>
    </div> -->
  </div>
</template>
<!--
<script>
import Tiptap from "./TiptapEditor";
export default {
  name: "ar-image",
  components: {
    "ar-tiptap": Tiptap,
  },
  props: {
    modelValue: {
      type: String,
      default: "",
    },
    property: {
      type: Object,
      default: () => {},
    },
    readonly: Boolean,
  },
  data() {
    return {
      encoding: "",
    };
  },
  computed: {
    svgMarkup: function() {
      if (this.modelValue.startsWith("data:image/svg+xml;base64,")) {
        const markup = this.modelValue.slice(26); // remove data:image/svg+xml;base64,
        return window.atob(markup);
      }

      if (this.modelValue.startsWith("data:image/svg+xml;utf8,")) {
        const markup = this.modelValue.slice(24); // remove data:image/svg+xml;utf8,
        return decodeURIComponent(markup);
      }
      return "";
    },
  },
  methods: {
    onInput(escapedSvg) {
      if (this.modelValue.startsWith("data:image/svg+xml;base64,")) {
        const base64Encoded = window.btoa(escapedSvg);
        //console.log("urlEncoded", base64Encoded);
        this.$emit("input", "data:image/svg+xml;base64," + base64Encoded);
      }
      if (this.modelValue.startsWith("data:image/svg+xml;utf8,")) {
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
          return text.replace(/[&#<>"]/g, function(m) {
            return map[m];
          });
        };

        let urlEncoded = escapeUrl(escapedSvg);
        //console.log("urlEncoded", urlEncoded);
        this.$emit("input", "data:image/svg+xml;utf8," + urlEncoded);
      }
    },
  },
};
</script>
-->
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
