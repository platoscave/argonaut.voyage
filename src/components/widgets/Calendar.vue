<template>
  <el-calendar class="el-calendar">
    {{ dataObj }}
  </el-calendar>
</template>

<script>
import { db } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap } from "rxjs/operators";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-calendar",
  mixins: [WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },
  subscriptions() {
    // Watch the pageId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    }).pipe(pluck("newValue"));
    // Whenever it changes, reset the live query with the new selectedObjId
    const currentObj$ = selectedObjId$.pipe(
      switchMap((selectedObjId) =>
        liveQuery(() => db.state.where({ _id: selectedObjId }).first())
      )
    );
    return {
      dataObj: currentObj$,
    };
  },
};
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
