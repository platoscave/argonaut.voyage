<template>
  <el-table :data="tableData" height="250" style="width: 100%">
    <el-table-column prop="date" label="Date" width="180"> </el-table-column>
    <el-table-column prop="name" label="Name" width="180"> </el-table-column>
    <el-table-column prop="address" label="Address"> </el-table-column>
  </el-table>
</template>

<script>
import QueryMixin from "../../lib/queryMixin";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-table",
  mixins: [WidgetMixin, QueryMixin], 
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      pageId: null,
      viewObj: {},
      selector: {}
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
    tableData: function () {
      return {
        database: "argonaut",
        selector: this.selector,
      };
    },
  },  
  methods: {
    async viewIdHandeler() {
      if (this.viewId) {
        this.viewObj = await this.getMaterializedView(this.viewId)
        const mongoQuery = await this.$pouch.get( this.viewObj.queryId )
        this.selector = mongoQuery.mongoQuery
      }
    }
  },
  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    viewId: 'viewIdHandeler'
  },
  mounted: function (){
    this.viewIdHandeler()
  },

};
</script>

<style scoped>
</style>