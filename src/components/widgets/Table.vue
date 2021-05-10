<template>
  <!-- <div> -->
  <el-table :data="tableData" style="width: 100%">
    <el-table-column
      v-for="(property, propertyName) in viewObj.properties"
      :key="propertyName"
      :prop="propertyName"
      :label="property.title"
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
      selector: {},
      tableData: [],
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonaut",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    } /* 
    tableData: function () {
      return {
        database: "argonaut",
        selector: this.selector,
      };
    }, */,
  },
  methods: {
    async viewIdHandeler() {
      if (this.viewId) {
        this.viewObj = await PoucdbServices.getMaterializedView(this.viewId);
        console.log(this.viewObj);
        const mongoQuery = await this.$pouch.get(this.viewObj.queryId);
        this.selector = mongoQuery.mongoQuery;
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