<template>
  <div v-if="dataObj && viewObj">
    <ar-jsonschema-form
      ref="schemaForm"
      class="json-schema-form"
      v-model="dataObj"
      :schema="viewObj"
      :form-read-only="readonly"
      :omit-empty-fields="omitEmptyFields"
      v-on:change="onChange"
    >
    </ar-jsonschema-form>
    <el-button
      class="fab"
      icon="el-icon-edit"
      circle
      @click="readonly = !readonly"
    ></el-button>
  </div>
</template>

<script>
import JsonSchemaForm from './JsonSchemaForm';
import QueryMixin from "../../lib/queryMixin";
import WidgetMixin from "../../lib/widgetMixin";

export default {
  name: "ar-form", 
  mixins: [WidgetMixin, QueryMixin], 
  components: {
    'ar-jsonschema-form': JsonSchemaForm
  },
  props: {
    hashLevel: Number,
    viewId: String,
  },
  data() {
    return {
      selectedObjId: null,
      readonly: true,
      omitEmptyFields: false,
      valid: false,
      viewObj: {}
    };
  },
  pouch: {
    dataObj: function () {
      return {
        database: "argonaut",
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
        this.$argonaut.upsert(this.selectedObjId, () => {
          return newDataObj
        }).catch((err) =>
          this.$message({ showClose: true, message: err, type: "error" })
        );
      } catch (err) {
        this.valid = false;
      }
    },

    async viewIdHandeler() {
      if (this.viewId) this.viewObj = await this.getMaterializedView(this.viewId)
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
pre {
  text-align: left;
}
.json-schema-form {
  max-width: 750px;
  padding: 10px;
}
.json-schema-form  >>> code {
  background:  #ffffff08;
  line-height: 20px;
  font-size: 14px;
}
.json-schema-form >>> .control-background {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-color: #00adff66;
  border-style: solid;
  border-width: 1px;
  min-height: 30px;
}
.json-schema-form >>> .subform-background {
  background-color: #ffffff08;
  padding: 10px;
  min-height: 30px;
  border-radius: 4px;
}
.json-schema-form >>> .el-form-item--small.el-form-item:last-child {
  margin-bottom: 0px;
}
.json-schema-form >>> .el-icon-info {
  color: #00adffb3;
}
.json-schema-form >>> .el-form-item__content{
  font-size: 16px;
}
.json-schema-form >>> .el-input__inner {
  background-color: #ffffff08;
  border-color: #00adff66;
  font-size: 16px;
}
.json-schema-form >>> .el-textarea__inner {
  background-color: #ffffff08;
  border-color: #00adff66;
}
.json-schema-form >>> .el-select.el-select--small {
  border-radius: 4px;
  border-color: #00adff66;
  border-style: solid;
  border-width: 1px;
}
.json-schema-form >>> .el-tag {
  background-color: #ffffff08;
}
.json-schema-form >>> .el-select__tags-text {
  color: #00adff;
}
.json-schema-form >>> .el-input__inner::placeholder {
  color: #00adff66;
}
.json-schema-form >>> input[readonly] {
  border-width: 0px;
}
.json-schema-form >>> textarea[readonly] {
  border-width: 0px;
}
.json-schema-form >>> div[readonly] {
  border-width: 0px;
}
.json-schema-form >>> p {
  line-height: 24px;
}
.json-schema-form >>> h1 {
  margin-block-start: 0.5em;
  margin-block-end: 0.5em;
}
.json-schema-form >>> h2 {
  margin-block-start: 0.5em;
  margin-block-end: 0.5em;
}
.json-schema-form >>> h3 {
  margin-block-start: 0.5em;
  margin-block-end: 0.5em;
}

/* For the array of objects */
.json-schema-form >>> .subform-margin-bottom {
  margin-bottom: 10px;
}
.json-schema-form >>> .selected {
  border-color: #eee;
  border-style: solid;
  border-width: 1px;
}
.json-schema-form >>> .subform-margin-bottom:hover {
  cursor: pointer;
}
.json-schema-form >>> .drop-separator {
  background-color: #00adff66;
  height: 1px;
  border: none;
}
</style>

