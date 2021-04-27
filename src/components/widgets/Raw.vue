<template>
  <highlight-code lang="json" class="highlight-code">
    {{ dataObj }}
  </highlight-code>
</template>

<script>
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: 'ar-raw',
  mixins: [WidgetMixin], 

  props: {
    hashLevel: Number,
    viewId: String
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
  },
}
</script>

<style scoped>
.hljs {
  background:  #ffffff08;
}
pre {
  line-height: 20px;
  font-size: 14px;
}
</style>
