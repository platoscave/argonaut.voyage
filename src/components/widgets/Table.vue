<template>
    <!-- The table -->
    <ar-sub-table
      ref="schemaTable"
      class="ar-json-schema-form"
      v-model="tableData"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-mode="formMode"
      :hash-level="hashLevel"
    >
    </ar-sub-table>
</template>

<script>
import { db, argoQuery } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import SubTable from "./controls/SubTable"
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
      argoQuery: {},
      tableData: [],
      formMode: "Readonly Dense",
    };
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

    // Watch the viewId as observable
    const viewId$ = this.$watchAsObservable("viewId", {
      immediate: true,
    })
      .pipe(pluck("newValue")) // Obtain value from reactive var (whenever it changes)
      .pipe(filter((viewId) => viewId)) //filter out falsy values
      .pipe(distinctUntilChanged()); // emit only when changed

    // Whenever viewId changes, reset the live query with the new viewId
    const viewObj$ = viewId$.pipe(
      switchMap((viewId) =>
        liveQuery(() => db.state.where({ _id: viewId }).first())
      )
    );
    return {
      dataObj: dataObj$,
      viewObj: viewObj$,
    };
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