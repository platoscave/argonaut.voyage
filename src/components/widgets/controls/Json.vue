<template>
  <ar-tiptap
    v-on:input="$emit('input', $event)"
    :value="'<pre><code>' + value + '</code></pre>'"
    :readonly="readonly"
  ></ar-tiptap>
  
</template>

<script>
import Tiptap from './TiptapEditor';

export default {
  name: "ar-json",  
  components: {
    'ar-tiptap': Tiptap,
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
  mounted() {
    console.log(this.value)
  }
};
</script>

<style scoped>

.ar-readonly-div >>> .hljs{
  background: unset;
  line-height: 20px;
  font-size: 14px;
}
</style>
