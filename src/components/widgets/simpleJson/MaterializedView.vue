<template>
  <highlight-code lang="json" class="highlight-code">
    {{ viewObj }}
  </highlight-code>
</template>

<script>
import WidgetMixin from "../../../lib/widgetMixin"
import QueryMixin from "../../../lib/queryMixin"

export default {
  name: 'ar-materialized-view',
  mixins: [WidgetMixin, QueryMixin], 
  props: {
    hashLevel: Number,
  }, 
  data() {
    return {
      viewObj: {}
    };
  },
  watch: {
    selectedObjId: function (value) {
      // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
      // Thats why we need both mounted and watch
      if(value) this.getMaterializedView( value ).then( viewObj => {
        this.viewObj = viewObj
      })
    },
  },
  mounted() {
    if(this.selectedObjId) this.getMaterializedView( this.selectedObjId ).then( viewObj => {
      this.viewObj = viewObj
    })
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
