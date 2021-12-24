<template>
  <highlight-code lang="json" class="highlight-code">
    {{ viewObj }}
  </highlight-code>
</template>

<script>
import { argoQuery } from "../../../services/dexieServices"
import WidgetMixin from "../../../lib/widgetMixin"

export default {
  name: 'ar-materialized-view',
  mixins: [WidgetMixin], 
  props: {
    hashLevel: Number,
  }, 
  data() {
    return {
      viewObj: {}
    };
  },
}
</script>

<style scoped>
.highlight-code >>> .hljs{
  background: unset;
  line-height: 20px;
  font-size: 14px;
}
</style>
