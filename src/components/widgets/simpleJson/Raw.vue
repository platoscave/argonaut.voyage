<template>
  <highlight-code lang="json" class="highlight-code">
    {{ dataObj }}
  </highlight-code>
</template>

<script>
import { db } from "../../../services/dexieServices";
import { liveQuery } from "dexie";
import WidgetMixin from "../../../lib/widgetMixin";

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
        database: "argonautdb",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
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
