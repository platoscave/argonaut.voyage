<template>
    <!-- The table -->
    <ar-sub-table
      ref="schemaTable"
      class="ar-json-schema-form"
      v-model="tableData"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-read-only="formReadOnly"
      :omit-empty-fields="omitEmptyFields"
      :hash-level="hashLevel"
      v-on:change="onChange"
    >
    </ar-sub-table>
</template>

<script>
import SubTable from "./controls/SubTable"
import PoucdbServices from "../../services/pouchdbServices";
import WidgetMixin from "../../lib/widgetMixin";


export default {
  name: "ar-table",
  mixins: [WidgetMixin],
  components: {
    "ar-sub-table": SubTable
  },
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
      formReadOnly: true,
      omitEmptyFields: false,
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonautdb",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    } /*  ,
    tableData: function () {
      return {
        database: "argonautdb",
        selector: this.mongoQuery,
      };
    }, */,
  },
  methods: {    
    async onChange(newDataObj) {
      try {
        const valid = await this.$refs["schemaForm"].validate()
        console.log(valid)
        this.$argonautdb.upsert(this.selectedObjId, () => {
          return newDataObj
        }).catch((err) =>
          this.$message({ showClose: true, message: err, type: "error" })
        );
      } catch (err) {
        this.valid = false;
      }
    },
    async viewIdHandeler() {
      if (this.viewId) {
        this.viewObj = await PoucdbServices.getMaterializedView(this.viewId);
        //console.log(this.viewObj);
        this.tableData = await PoucdbServices.executeQuery(this.viewObj.queryId, {
          _id: this.selectedObjId,
        });
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

.eltable >>> .cell {
  padding: 3px;
}
.eltable >>> th {
  padding: 0px 10px;
}
.eltable >>> td {
  padding: 0px;
  vertical-align: top;
}
</style>