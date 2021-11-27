<template>
  <div v-if="dataObj && viewObj">
    <!-- The form -->
    <ar-sub-form
      ref="schemaForm"
      class="json-schema-form"
      v-model="dataObj"
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
      @click="formReadOnly = !formReadOnly"
    ></el-button>
  </div>
</template>

<script>
import SubForm from "./controls/SubForm"
import PoucdbServices from "../../services/pouchdbServices"
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-form", 
  mixins: [WidgetMixin], 
  components: {
    'ar-sub-form': SubForm
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
      viewObj: {}
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonautdb",
        selector: { _id: this.selectedObjId },
        first: true,
      };
    },
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

    async viewIdHandeler() {
      if (this.viewId) this.viewObj = await PoucdbServices.getMaterializedView(this.viewId)
      console.log('MaterializedView')
      console.dir(this.viewObj)
    }
  },
  watch: {
    // immediate: true doesn't work. Too early. Pouch hasn't been initialized yet
    // Thats why we need both mounted and watch
    viewId: 'viewIdHandeler'
  },
  mounted: function (){
    this.viewIdHandeler()
  }
}
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
.json-schema-form {
  max-width: 750px;
  padding: 10px;
}
</style>

