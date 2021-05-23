<template>
  <el-table
    class="eltable"
    :data="tableData"
    style="width: 100%"
    highlight-current-row
    @current-change="(currentRow) => updateNextLevelHash( { _id: currentRow._id, pageId: currentRow.pageId })"
  >
    <el-table-column
      v-for="(property, propertyName) in viewObj.properties"
      :key="propertyName"
      :prop="propertyName"
      :label="property.title"
      :fit="true"
    >
      <template slot-scope="scope">
        <ar-control-selector
          :property="property"
          :propertyName="propertyName"
          :value="scope.row[propertyName]"
          :readonly="formReadOnly"
          :hash-level="hashLevel"
          @:input="$emit('input', $event)"
        ></ar-control-selector>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
/* eslint-disable vue/no-unused-components */
import PoucdbServices from "../../dataServices/pouchdbServices";
import WidgetMixin from "../../lib/widgetMixin";
import ControlSelector from "./controls/ControlSelector";
import Enum from './controls/Enum';
import Form from './Form';
import Image from './controls/Image';
import Json from './controls/Json';
import ObjectArray from './controls/ObjectArray';
import Select from './controls/Select';
import StringArray from './controls/StringArray';
import Tiptap from './Tiptap';

export default {
  name: "ar-table",
  mixins: [WidgetMixin],
  components: {
    "ar-control-selector": ControlSelector,
    'ar-enum': Enum,
    'ar-form': Form,
    'ar-image': Image,
    'ar-json': Json,
    'ar-object-array': ObjectArray,
    'ar-select': Select,
    'ar-string-array': StringArray,
    'ar-tiptap': Tiptap,
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
      formReadOnly: true
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "blockprocess",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    } /*  ,
    tableData: function () {
      return {
        database: "blockprocess",
        selector: this.mongoQuery,
      };
    }, */,
  },
  methods: {
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