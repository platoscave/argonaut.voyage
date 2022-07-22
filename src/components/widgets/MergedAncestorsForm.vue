<script setup lang="ts">
import { ref, watch } from "vue";
import { db, argoQuery } from "~/services/dexieServices";
import useLiveQuery from "~/composables/useLiveQuery";
import { useHashDissect, updateHashWithSelectedTab } from "~/composables/useHashDissect";

const props = defineProps({
  hashLevel: Number,
  viewId: String,
})
const {selectedObjId, pageId, selectedTab} = useHashDissect(props.hashLevel)
const viewObj = ref({})
const formMode = ref("Readonly Dense")

interface IDataObj {
  _id: string;
  name: string;
}
const dataObj = useLiveQuery<IDataObj>(
  () => db.state.get(selectedObjId.value),
  [selectedObjId]
)
watch(dataObj, async (dataObj) => {
  viewObj.value = await argoQuery.getMergedAncestorProperties(dataObj.classId)
});







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
}

const onEditButton = () => {
  if (formMode.value === "Readonly Dense") formMode.value = "Readonly Full";
  else if (formMode.value === "Readonly Full")
    //this.formMode = "Edit Permitted";
    formMode.value = "Edit Full";
  else if (formMode.value === "Edit Permitted") formMode.value = "Edit Full";
  else formMode.value = "Readonly Dense";
}
</script>

<template>
  <div v-if="dataObj && viewObj" class="fab-parent" >
    <!-- <ar-sub-form
      ref="schemaForm"
      class="ar-json-schema-form"
      :value="dataObj"
      @input="onInput"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-mode="formMode"
      :hash-level="hashLevel"
    >
    </ar-sub-form> -->
    <ElButton
      class="fab"
      icon="el-icon-refresh"
      circle
      @click="autoRotate = !autoRotate"
    ></ElButton>
  </div>
</template>
<!--
<script>
import { db, argoQuery } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap, filter, distinctUntilChanged } from "rxjs/operators";
import SubForm from "./controls/SubForm";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-merged-ancestors-form",
  mixins: [WidgetMixin],
  components: {
    "ar-sub-form": SubForm,
  },
  
  props: {
    hashLevel: Number,
    viewId: String,
  },

  data() {
    return {
      selectedObjId: null,
      formMode: "Readonly Dense",
      valid: false,
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
    )

    // Whenever dataObj changes, fetch the getMergedAncestorProperties promise with the new classId
    const viewObj$ = dataObj$.pipe(
      switchMap((dataObj) =>
        argoQuery.getMergedAncestorProperties(dataObj.classId)
      )
    )

    dataObj$.pipe(distinctUntilChanged())

    return {
      dataObj: dataObj$,
      viewObj: viewObj$,
    }
  },

  methods: {
    async onInput(updatedDataObj) {
      //return
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
    },

    onEditButton() {
      if (this.formMode === "Readonly Dense") this.formMode = "Readonly Full";
      else if (this.formMode === "Readonly Full")
        //this.formMode = "Edit Permitted";
        this.formMode = "Edit Full";
      else if (this.formMode === "Edit Permitted") this.formMode = "Edit Full";
      else this.formMode = "Readonly Dense";
    },
  },
};
</script>
 -->
<style scoped>
.fab-parent {
  position: relative;
  height: 100%;
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
.ar-json-schema-form {
  max-width: 750px;
  padding: 6px;
}
</style>
