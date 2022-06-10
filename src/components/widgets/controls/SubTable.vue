<template>
  <el-table
    class="elementUiTable"
    :data="value"
    style="width: 100%"
    highlight-current-row
    @current-change="
      (currentRow) =>
        updateNextLevelHash({ _id: currentRow._id, pageId: currentRow.pageId })
    "
  >
    <!-- :prop is needed for validation rules -->
    <el-table-column
      v-for="(property, propertyName) in properties"
      :key="propertyName"
      :label="property.title"
      :prop="propertyName"
    >
      <!-- Label with tooltip. If no description is provided then :label from above is used. -->
      <span v-if="property.description" slot="label">
        <span>{{ property.title + " " }}</span>
        <el-tooltip :content="property.description">
          <i class="el-icon-info"></i>
        </el-tooltip>
      </span>

      <!-- The control -->
      <template slot-scope="scope">
        <!-- 
          ar-control-selector is a functional component that that replaces itself with a control component
          depending on property type. It also performs some magic on certain property.attrs
          - readonly is used by standard input elements to disable input and by css to remove blue border
          - required is used by Selects to optionaly add a clear button (or a None option in the case of radio buttons)
          - hash-level is used by Selects with a argoQuery (to get selectedObjectId from hash)
          - property and form-mode are passed in case we're creating a subForm
          - We use the v-model pattern to send/recieve data to/from child components. 
            Below, we watch for changes to value and emit input events accordingly.
          -->
        <ar-control-selector
            class="ar-control"
            v-model="scope.row[propertyName]"
            :property="property"
            :readonly="formMode.startsWith('Readonly')"
            :required="requiredArr.includes(propertyName)"
            :hash-level="hashLevel"
            :form-mode="formMode"
        ></ar-control-selector>
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
/* eslint-disable vue/no-unused-components */
import WidgetMixin from "../../../lib/widgetMixin";
import ControlSelector from "./ControlSelector";
import SelectStringEnum from "./SelectStringEnum";
import SubForm from "./SubForm";
import Image from "./Image";
import Json from "./Json";
import NestedObject from "./NestedObject";
import Number from "./Number";
import FormArray from "./FormArray";
import SelectArrayEnum from "./SelectArrayEnum";
import SelectStringQuery from "./SelectStringQuery";
import SelectArrayQuery from "./SelectArrayQuery";
import Tiptap from "./TiptapEditor";

export default {
  name: "ar-sub-table",
  mixins: [WidgetMixin],
  components: {
    "ar-control-selector": ControlSelector,
    "ar-select-string-enum": SelectStringEnum,
    "ar-sub-form": SubForm,
    "ar-image": Image,
    "ar-json": Json,
    "ar-nested-object": NestedObject,
    "ar-number": Number,
    "ar-view-form-array": FormArray,
    "ar-select-array-enum": SelectArrayEnum,
    "ar-select-string-query": SelectStringQuery,
    "ar-select-array-query": SelectArrayQuery,
    "ar-tiptap": Tiptap,
  },
  props: {
    value: {
      type: Array,
      default: () => {},
    },
    properties: {
      type: Object,
      default: () => {},
    },
    requiredArr: {
      type: Array,
      default: () => [],
    },
    formMode: String,
    hashLevel: Number,
  },
  computed: {
    // Create the validation rules Object
    validationRules: function() {
      // no rules for readonly
      if (
        this.formMode === "Readonly Dense" ||
        this.formMode === "Readonly Full"
      )
        return {};

      let rulesObj = {};
      for (var propertyName in this.properties) {
        const property = this.properties[propertyName];

        // no rules for readonly
        if (property.readonly) continue;

        let rulesArr = [];

        if (this.requiredArr.includes(propertyName)) {
          rulesArr.push({
            required: true,
            message: property.title + " is required.",
          });
        }

        if (property.minLength) {
          rulesArr.push({
            min: property.minLength,
            message:
              "Please enter at least " + property.minLength + " characters.",
          });
        }

        // email
        if (property.format) {
          if (property.format === "email") {
            rulesArr.push({
              type: "email",
              message:
                "Please enter a valid email address. eg: name@provider.com",
            });
          } else if (property.format === "uri") {
            rulesArr.push({
              type: "url",
              message: "Please enter a valid url. eg: https://provider.com",
            });
          }
        }

        if (property.pattern) {
          rulesArr.push({
            pattern: property.pattern,
            message: " Input must comply with: " + property.pattern,
          });
        }

        rulesObj[propertyName] = rulesArr;
      }

      return rulesObj;
    },
  },

  methods: {
    validate() {
      return this.$refs["elementUiTable"].validate();
    },
    resetFields() {
      this.$refs["elementUiTable"].resetFields();
    },
  },
  
  watch: {
    value: {
      handler(newVal) {
        this.$emit("input", newVal);
      },
      deep: true,
    },
  },
};
</script>

<style scoped>
/* Input Control */
.ar-control >>> input {
  background-color: #ffffff08;
  border-color: #00adff42;
  font-size: 16px;
  height: 30px;
}
/* TODO how do we get rid of hover? */
.Xar-control >>> .el-input__inner:hover {
  border-style: none;
}

/* Checkbox Boolean*/
label.el-checkbox.ar-control {
  background-color: #ffffff08;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
  border-color: #00adff42;
  border-style: solid;
  border-width: 1px;
  font-size: 16px;
  line-height: 24px;
}

/* Select 
.ar-control >>> .el-input > input {
  background-color: #ffffff08;
  border-color: #00adff42;
  font-size: 16px;
  height: 30px;
}*/

/* Textarea */
.ar-control >>> .el-textarea__inner {
  background-color: #ffffff08;
  border-color: #00adff42;
  /* TODO must resize textarea
  font-size: 16px;
  line-height: 30px; */
}

/* Readonly border style */
.ar-control >>> input[readonly],
label.el-checkbox.ar-control[readonly],
.ar-control >>> .el-textarea__inner[readonly] {
  border-style: none;
}

/* Placeholder color */
.ar-control >>> .el-textarea__inner::placeholder,
.ar-control >>> .el-input__inner::placeholder {
  color: #666 !important;
}

/* Charachter counter color*/
.ar-control >>> .el-input__count-inner,
.ar-control >>> .el-input__count {
  color: #666;
}

/* info icon color*/
.el-icon-info {
  color: #00adffb3;
}
</style>
<style>
/* Error success borders: lighter */
.el-form-item.is-error .el-input__inner,
.el-form-item.is-error .el-input__inner:focus,
.el-form-item.is-error .el-textarea__inner,
.el-form-item.is-error .el-textarea__inner:focus {
  border-color: #f56c6c88;
}
.el-form-item.is-success .el-input__inner,
.el-form-item.is-success .el-input__inner:focus,
.el-form-item.is-success .el-textarea__inner,
.el-form-item.is-success .el-textarea__inner:focus {
  border-color: #67c23a88;
}
</style>
<style>
.el-table__body tr > td {
  padding: 3px;
  vertical-align: top;
}
.el-table .cell {
  padding: 3px;
}
.el-table th {
  padding: 0 0 0 16px;
}
</style>
