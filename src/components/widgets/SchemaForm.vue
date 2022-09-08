<script setup lang="ts">
import { ref, watch, reactive } from "vue";
import { db } from "~/services/dexieServices";
import { getMaterializedView } from "~/lib/argoUtils"
import useLiveQuery from "~/composables/useLiveQuery";
import useArgoQuery from "~/composables/useArgoQuery";
import {
  useHashDissect,
  updateHashWithSelectedTab,
} from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});
const { selectedObjId, pageId, selectedTab } = useHashDissect(props.hashLevel);
let viewObj = reactive({});
let dataObj = reactive({});
const formMode = ref("Readonly Dense");

interface IDataObj {
  _id: string;
  classId: string;
}

interface IViewObj {
  _id: string;
  classId: string;
}

watch(
  () => props.widgetObj.viewId,
  (viewId: string) => {
    getMaterializedView(viewId).then((view) => {
    //debugger;
    viewObj = Object.assign(viewObj, view);

    const dataObj = useArgoQuery(view.queryId, {
      _id: selectedObjId.value,
    });
    watch(resArr, (arr: any[]) => {
      dataArr.length = 0;
      arr.forEach((item) => dataArr.push(item));
    });
  });

  }
);

// getMaterializedView(props.widgetObj.viewId).then((view) => {
//   //debugger;
//   Object.assign(viewObj, view);

//   const resArr = useArgoQuery(view.queryId, {
//     _id: selectedObjId.value,
//   });
//   watch(resArr, (arr: any[]) => {
//     dataArr.length = 0;
//     arr.forEach((item) => dataArr.push(item));
//   });
// });

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
  <div v-if="dataObj && viewObj" class="fab-parent">
    <div class="ar-json-schema-form">
      <div>
        <SubForm
          ref="schemaForm"
          :model-value="dataObj"
          @input="onInput"
          :properties="viewObj.properties"
          :requiredArr="viewObj.required"
          :form-mode="formMode"
          :hash-level="hashLevel"
        >
        </SubForm>
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
