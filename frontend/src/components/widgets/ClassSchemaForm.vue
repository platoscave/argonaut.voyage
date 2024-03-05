<script setup lang="ts">
import { ref, watch, reactive, toRaw } from "vue";
import { db } from "~/services/dexieServices";
import { getClassSchema } from "~/lib/argoUtils";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect, updateHashWithSelectedTab } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  widgetObj: Object,
});

const { selectedObjId, pageId, selectedTab } = useHashDissect(props.hashLevel);

let viewObj = reactive({});
const formMode = ref("Readonly Dense");
const subFormEl = ref("");
let prevClassId: string = '';
let previousDataObj: any = {}

// get the dataObj, watch selectedObjId
interface IDataObj {
  key: string;
  classId: string;
}
const dataObj = useLiveQuery<IDataObj>(() => db.state.get(selectedObjId.value), [
  selectedObjId,
]);

// deep watch dataObj, get the classSchema if the classId changed
watch(dataObj, (newDataObj, oldDataObj) => {

  // Get rid of false updates (otherwise we will loop)
  if (previousDataObj === JSON.stringify(newDataObj)) return;
  previousDataObj = JSON.stringify(newDataObj)

  if (newDataObj.classId !== prevClassId) {
    getClassSchema(newDataObj.classId).then((schema) => {
      viewObj = Object.assign(viewObj, schema);
    });
    prevClassId = newDataObj.classId;
  }

  if (!formMode.value.startsWith("Edit")) return;
  if (!oldDataObj) return; // will be empty first time
  subFormEl.value.validate().then((valid) => {
    console.log("valid", valid);
    if (valid) {
      db.state.put(toRaw(newDataObj)).catch(function (e) {
        alert("Failed update: " + e);
      })
    }
  });
}, { deep: true });


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
        <SubForm ref="subFormEl" v-model="dataObj" :properties="viewObj.properties" :requiredArr="viewObj.required"
          :form-mode="formMode" :hash-level="hashLevel">
        </SubForm>
      </div>
    </div>
    <ElButton class="fab" circle @click="onEditButton">
      <template #icon>
        <svg>
          <use xmlns:xlink="http://www.w3.org/1999/xlink" :xlink:href="'toolbar-symbols.svg#el-icon-edit'"></use>
        </svg></template>
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
