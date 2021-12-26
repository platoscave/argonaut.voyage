<template>
  <div v-if="dataObj && viewObj">
    <h3 v-if="widgetName">{{ widgetName }}</h3>
    <!-- The form -->
    <ar-sub-form
      ref="schemaForm"
      class="ar-json-schema-form"
      v-model="dataObj"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-mode="formMode"
      :hash-level="hashLevel"
      v-on:change="onChange"
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
  name: "ar-view-form",
  mixins: [WidgetMixin],
  components: {
    "ar-sub-form": SubForm,
  },
  props: {
    hashLevel: Number,
    viewId: String,
    widgetName: String,
  },
  data() {
    return {
      selectedObjId: null,
      formMode: "Readonly Dense",
      valid: false,
      viewObj: {},
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
      switchMap((viewId) => argoQuery.getMaterializedView(viewId))
    );
    return {
      dataObj: dataObj$,
      viewObj: viewObj$,
    };
  },

  methods: {
    async onChange(value, oldValue) {
      try {
        console.log(this.dataObj);

        if (JSON.stringify(value) === JSON.stringify(oldValue)) {
          return;
        }

        const valid = await this.$refs["schemaForm"].validate();
        console.log(valid);
        this.$argonautdb
          .upsert(this.selectedObjId, (doc) => {
            return Object.assign(doc, this.dataObj);
          })
          .catch((err) =>
            this.$message({ showClose: true, message: err, type: "error" })
          );
      } catch (err) {
        this.valid = false;
      }
    },

    onEditButton() {
      if (this.formMode === "Readonly Dense") this.formMode = "Readonly Full";
      else if (this.formMode === "Readonly Full")
        this.formMode = "Edit Permitted";
      else if (this.formMode === "Edit Permitted") this.formMode = "Edit Full";
      else this.formMode = "Readonly Dense";
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
