<template>
  <el-calendar class="el-calendar">
    {{ dataObj }}
  </el-calendar>
</template>

<script>
import { db } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-calendar",
  mixins: [WidgetMixin],
  props: {
    hashLevel: Number,
    viewId: String,
  },

  subscriptions() {
    //
    // Watch the selectedObjId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((selectedObjId) => selectedObjId)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const dataObj$ = selectedObjId$.pipe(
      switchMap((selectedObjId) =>
        liveQuery(() => db.state.where({ _id: selectedObjId }).first())
      )
    );

    return {
      dataObj: dataObj$
    }
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
