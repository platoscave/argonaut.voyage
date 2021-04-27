<template>
  <highlight-code lang="json" class="highlight-code">
    {{ classObj }}
  </highlight-code>
</template>

<script>
import WidgetMixin from "../../../lib/widgetMixin"
import QueryMixin from "../../../lib/queryMixin"


export default {
  name: 'ar-merged-ancestors',
  mixins: [WidgetMixin, QueryMixin], 
  props: {
    hashLevel: Number,
  }, 
  data() {
    return {
      classObj: {}
    };
  },
  watch: {
    selectedObjId: function (value) {
      // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
      // Thats why we need both mounted and watch
      if(value) this.getMergedAncestorProperties( value ).then( classObj => {
        this.classObj = classObj
      })
    },
  },
  mounted() {
    if(this.selectedObjId) this.getMergedAncestorProperties( this.selectedObjId ).then( classObj => {
      this.classObj = classObj
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
