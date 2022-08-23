<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { db } from "~/services/dexieServices";
import useArgoQuery from "~/composables/useArgoQuery";
import { getMaterializedView } from "~/lib/argoUtils"
import useLiveQuery from "~/composables/useLiveQuery";
import {
  useHashDissect,
  updateHashWithSelectedTab,
} from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});
const { selectedObjId, pageId, selectedTab } = useHashDissect(props.hashLevel);
const formMode = ref("Readonly Dense");

interface IDataObj {
  _id: string;
  classId: string;
}
const dataArr = reactive([])
const viewObj = reactive([])

interface IViewObj {
  _id: string;
  classId: string;
}
// const viewObj = useLiveQuery<IViewObj>(
//   () => db.state.get(props.widgetObj.viewId),
//   [selectedObjId]
// );
getMaterializedView(props.widgetObj.viewId).then( view => {

    Object.assign(viewObj, view);

    const resArr = useArgoQuery( view.queryId, {
      _id: selectedObjId.value,
    });
    watch( resArr, (arr) => {
      dataArr.length = 0
      arr.forEach( item => dataArr.push(item))
    })
})

const onInput = async (updatedDataObj) => {
  /*
  try {
    
    const stringified = JSON.stringify(updatedDataObj)
    if (stringified === this.oldValue) return
    this.oldValue = stringified

    const valid = await this.$refs["schemaForm"].validate();
    console.log('valid', valid);
    db.state.update(updatedDataObj._id, updatedDataObj);

  } catch (err) {
    this.valid = false;
    this.$message({ showClose: true, message: err, type: "error" })
  }
  */
};

const onEditButton = () => {
  if (formMode.value === "Readonly Dense") formMode.value = "Readonly Full";
  else if (formMode.value === "Readonly Full")
    //this.formMode = "Edit Permitted";
    formMode.value = "Edit Full";
  else if (formMode.value === "Edit Permitted") formMode.value = "Edit Full";
  else formMode.value = "Readonly Dense";
};
</script>

<template>
  <div v-if="dataArr && viewObj" class="fab-parent">
    <div class="ar-json-schema-form">
      <div>
        <SubTable
          ref="schemaForm"
          :model-value="dataArr"
          @input="onInput"
          :properties="viewObj.properties"
          :requiredArr="viewObj.required"
          :form-mode="formMode"
          :hash-level="hashLevel"
        >
        </SubTable>
      </div>
    </div>
    <ElButton class="fab" circle @click="onEditButton">
      <template #icon>
        <svg><use
          xmlns:xlink="http://www.w3.org/1999/xlink"
          :xlink:href="'toolbar-symbols.svg#el-icon-edit'"
        ></use></svg
      ></template>
    </ElButton>
  </div>
</template>

<style scoped>
.fab-parent {
  position: relative;
  height: 100%;
  overflow: hidden;
}
.ar-json-schema-form {
  height: 100%;
  overflow: auto;
  max-width: 750px;
  overflow: auto;
  padding: 10px;
}
.form {
  padding: 10px;
}
.fab {
  position: absolute;
  margin: 10px;
  bottom: 0px;
  right: 0;
  color: #eee;
  background: #e91e63;
  z-index: 20;
}
</style>


<!-- 
<template>
    The table -- >
    <ar-sub-table
      ref="schemaTable"
      class="ar-json-schema-form"
      v-model="dataObj"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-mode="formMode"
      :hash-level="hashLevel"
    >
    </ar-sub-table>
</template>

<script>
import { db } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import SubTable from "./controls/SubTable"
import WidgetMixin from "../../lib/widgetMixin";


export default {
  name: "ar-view-table",
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
      dataObj: [],
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
        liveQuery(() => db.state.where({ _id: selectedObjId }).toArray())
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
-->