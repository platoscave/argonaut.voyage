<template>
  <!-- <div> -->
  <el-table :data="tableData" style="width: 100%">
    <el-table-column
      v-for="(property, propertyName) in viewObj.properties"
      :key="propertyName"
      :prop="propertyName"
      :label="property.title"
      :fit="true"
    >
    </el-table-column>
  </el-table>
</template>

<script>
import PoucdbServices from "../../dataServices/pouchdbServices"
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-table",
  mixins: [WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      pageId: null,
      viewObj: {},
      mongoQuery: {},
      tableData: [],
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "blockprocess",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    }/*  ,
    tableData: function () {
      return {
        database: "blockprocess",
        selector: this.mongoQuery,
      };
    }, */
  },
  methods: {
    async viewIdHandeler() {
      if (this.viewId) {
        this.viewObj = await PoucdbServices.getMaterializedView(this.viewId);
        console.log(this.viewObj);
        this.tableData = await PoucdbServices.getTheData(this.viewObj.queryId, {_id: this.selectedObjId});
        //const mongoQuery = await this.$pouch.get(this.viewObj.queryId);
        //this.mongoQuery = mongoQuery.mongoQuery;
      }
    },
  },
  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    viewId: "viewIdHandeler",
  },
  mounted: function () {
    this.viewIdHandeler();
  },
};
</script>

<style scoped>
</style>