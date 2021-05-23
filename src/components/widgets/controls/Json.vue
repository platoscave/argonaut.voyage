<template>

  <highlight-code
    v-if="readonly"
    class="highlight-code"
    readonly
    lang="json"
  > {{value}}
  </highlight-code>

  <ar-tiptap
    v-else
    v-on:update="$emit('input', $event)"
    v-bind:value="'<pre><code>' + value + '</code></pre>'"
  ></ar-tiptap>
  
</template>

<script>
import Tiptap from '../Tiptap';

export default {
  name: "ar-json",  
  components: {
    'ar-tiptap': Tiptap,
  },
  props: {
    property: Object,
    value: String,
    readonly: Boolean,
    required: Boolean,
  },
};
</script>

<style scoped>
</style>
