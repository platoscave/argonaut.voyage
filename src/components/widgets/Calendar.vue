<template>
  <el-calendar class="el-calendar">
    {{ dataObj }}
  </el-calendar>
</template>

<script>
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: 'ar-calendar',
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
.el-calendar {
  background-color: unset;
}
.el-calendar >>> div.el-calendar__title {
  color: unset;
}
.el-calendar >>> .el-calendar-table td.is-selected {
  background-color: #ffffff08;
}
</style>