<template>
  <div v-if="dataObj && viewObj">
    <!-- The form -->
    <ar-sub-form
      ref="schemaForm"
      class="ar-json-schema-form"
      v-model="dataObj"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-mode="formMode"
      :hash-level="hashLevel"
    >
    </ar-sub-form>
    <el-button
      class="fab"
      icon="el-icon-edit"
      circle
      @click="onEditButton"
    ></el-button>
  </div>
</template>

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
      viewObj: {},
      dataObj: {}
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
    async onInput(updateDataObj, oldValue) {
      try {
        console.log(updateDataObj);
        if (JSON.stringify(updateDataObj) === JSON.stringify(oldValue)) {
          return;
        }

        const valid = await this.$refs["schemaForm"].validate();
        console.log('valid', valid);
        db.state.update(updateDataObj._id, updateDataObj);

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
  watch: {
    value: {
      handler(newVal, oldVal) {
        this.onInput(newVal, oldVal)
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
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
  padding: 10px;
}
</style>
