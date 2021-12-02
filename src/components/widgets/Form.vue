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
import SubForm from "./controls/SubForm";
import PoucdbServices from "../../services/pouchdbServices";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-form",
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
  pouch: {
    dataObj: function() {
      return {
        database: "argonautdb",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
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
      if (this.viewId)
        this.viewObj = await PoucdbServices.getMaterializedView(this.viewId);
      /* console.log("MaterializedView");
      console.dir(this.viewObj); */
    },
    onEditButton() {
      if (this.formReadOnly) {
        if (this.omitEmptyFields) {
          this.omitEmptyFields = false;
          this.formReadOnly = false;
        }
        else {
          this.omitEmptyFields = true;
          this.formReadOnly = true;
        }
      } else {
        this.formReadOnly = true;
        this.omitEmptyFields = false;
      }
    },
  },
  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    viewId: "viewIdHandeler",

/*     dataObj: {
      handler: "onChange",
      deep: true
    } */
  },
  mounted: function() {
    this.viewIdHandeler();
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
