<template>
  <div v-if="dataObj && viewObj">
    <!-- The form -->
    <!-- .lazy update dataObj after onChange-->
    <!-- v-on:change="onChange" -->
    <ar-sub-form
      ref="schemaForm"
      class="ar-json-schema-form"
      v-model.lazy="dataObj"
      :properties="viewObj.properties"
      :requiredArr="viewObj.required"
      :form-read-only="formReadOnly"
      :omit-empty-fields="omitEmptyFields"
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
    <highlight-code lang="json" class="highlight-code">
      {{ viewObj }}
    </highlight-code>
  </div>
</template>

<script>
import { db, argoQuery } from "../../services/dexieServices";
import { liveQuery } from "dexie";
import { pluck, switchMap } from "rxjs/operators";
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
      formReadOnly: true,
      omitEmptyFields: false,
      valid: false,
      viewObj: {},
    };
  },
  subscriptions() {

    // Watch the selectedObjId as observable
    const selectedObjId$ = this.$watchAsObservable("selectedObjId", {
      immediate: true,
    }).pipe(pluck("newValue"));

    // Whenever selectedObjId changes, reset the live query with the new selectedObjId
    const dataObj$ = selectedObjId$.pipe(
      switchMap((selectedObjId) => {
        console.log('selectedObjId',selectedObjId)
        return liveQuery(() => db.state.where({ _id:  selectedObjId ? selectedObjId : '' }).first())
      })
    )

    // Whenever dataObj changes, fetch the getMergedAncestorProperties promise with the new classId
    const viewObj$ = dataObj$.pipe(
      switchMap(
        (dataObj) =>
          argoQuery.getMergedAncestorProperties(
            dataObj.classId ? dataObj.classId : ""
          )
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

    onEditButton() {
      if (this.formReadOnly) {
        if (this.omitEmptyFields) {
          this.omitEmptyFields = false;
          this.formReadOnly = false;
        } else {
          this.omitEmptyFields = true;
          this.formReadOnly = true;
        }
      } else {
        this.formReadOnly = true;
        this.omitEmptyFields = false;
      }
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
