<template>
  <div v-if="dataObj && viewObj">
    <h3 v-if="widgetName">{{widgetName}}</h3>
    <!-- The form -->
    <!-- .lazy update dataObj after onChange-->
    <!-- v-on:change="onChange"-->
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
    <!-- <highlight-code lang="json" class="highlight-code">
      {{ viewObj }}
    </highlight-code> -->
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
    widgetName: String
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
      switchMap((viewId) =>
        argoQuery.getMaterializedView(viewId)
      )
    );
    return {
      dataObj: dataObj$,
      viewObj: viewObj$,
    };
  },

  methods: {
    async onChange() {
      try {
        console.log(this.dataObj);

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

    async viewIdHandeler() {
      if (this.viewId === "5ucwmdby4wox") {
        const mergedProps = await argoQuery.getMergedAncestorProperties(
          this.dataObj.classId
        );
        this.viewObj = mergedProps;
      } else if (this.viewId)
        this.viewObj = await argoQuery.getMaterializedView(this.viewId);
    },
    onEditButton() {
      if (this.formMode === "Readonly Dense") this.formMode = "Readonly Full";
      else if (this.formMode === "Readonly Full")
        this.formMode = "Edit Permitted";
      else if (this.formMode === "Edit Permitted") this.formMode = "Edit Full";
      else this.formMode = "Readonly Dense";
    },
    async onClassView() {
      debugger;
      const mergedProps = await argoQuery.getMergedAncestorProperties(
        this.dataObj.classId
      );
      debugger;
      this.viewObj = mergedProps;
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
