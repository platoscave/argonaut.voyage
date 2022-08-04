<script setup lang="ts">
import { ref, watch } from "vue";
import { db } from "~/services/dexieServices";
import { getClassSchema } from "~/lib/argoUtils"
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
const viewObj = ref({});
const formMode = ref("Readonly Dense");
const classId = ref("");
const subFormEl = ref("")
let formDataObject = ref({});



interface IDataObj {
  _id: string;
  classId: string;
}
// get the dataObj, watch selectedObjId
const dataObj = useLiveQuery<IDataObj>(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
);


// watch dataObj, make a copy for the form
watch(dataObj, (dataObj, oldDataObj) => {
  console.log('dataObj', dataObj, oldDataObj)
  classId.value = dataObj.classId
  formDataObject.value = dataObj;
});


// watch the classId, get a new schema
watch(classId, (classId) => {
  console.log('classId', classId)
  getClassSchema(classId).then(schema => viewObj.value = schema);
});


// watch the form data, perform validate, save data
watch(formDataObject, (formDataObject, oldFormDataObject) => {
  if(!formMode.value.startsWith('Edit')) return
  if(!oldFormDataObject) return
  if(JSON.stringify(formDataObject) === JSON.stringify(oldFormDataObject)) return
  console.log('formDataObject', formDataObject, oldFormDataObject)
  subFormEl.value.validate().then( valid => {
    console.log('valid', valid);
  })
    
},{ deep: true });

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
  <div v-if="formDataObject && viewObj" class="fab-parent">
    <div class="ar-json-schema-form">
      <div>
        <SubForm
          ref="subFormEl"
          v-model="formDataObject"
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
