<template>
  <highlight-code lang="json" class="highlight-code">
    {{ classObj }}
  </highlight-code>
</template>

<script>
import WidgetMixin from "../../../lib/widgetMixin"
import PoucdbServices from "../../../dataServices/pouchdbServices"



export default {
  name: 'ar-merged-ancestors',
  mixins: [WidgetMixin], 
  props: {
    hashLevel: Number,
  }, 
  data() {
    return {
      classObj: {}
    };
  },
  methods: {
    async selectedObjIdHandeler() {
      if (this.selectedObjId) this.classObj = await PoucdbServices.getMergedAncestorProperties(this.selectedObjId)
    }
  },
  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    selectedObjId: 'selectedObjIdHandeler'
  },
  mounted: function (){
    this.selectedObjIdHandeler()
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
