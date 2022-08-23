<script setup lang="ts">
import { ref, reactive, computed, toRefs, watch } from "vue";
import {
  useHashDissect,
  updateNextLevelHash,
} from "~/composables/useHashDissect";import toolbarSymbols from "~/assets/toolbar-symbols.svg";

import Html from "./Html.vue";
import Image from "./Image.vue";
import Json from "./Json.vue";
import NestedObject from "./NestedObject.vue";
import Number from "./Number.vue";
import ObjectsArray from "./ObjectsArray.vue";
import TableArray from "./TableArray.vue";
import SelectStringQuery from "./SelectStringQuery.vue";
import SelectStringEnum from "./SelectStringEnum.vue";
import SelectArrayQuery from "./SelectArrayQuery.vue";
import String from "./String.vue";
import SubForm from "./SubForm.vue";

// For some reason I can only add default to requiredArr.
// As soon as I addd others I get wierd compiler erros. I'm clueless.
const props = defineProps({
  hashLevel: Number,
  modelValue: Array,
  properties: Object,
  requiredArr: { type: Array, default: () => [] },
  formMode: String,
});
// const props = defineProps({
//   hashLevel: { type: Number, default: 0 },
//   modelValue: { type: Object, default: () => {} },
//   properties: { type: Object, default: () => {} },
//   requiredArr: { type: Array, default: () => [] },
//   formMode: { type: String, default: "Readonly Dense" },
// })
const emit = defineEmits(["update:modelValue"]);

const tableEl = ref(null);

const formModelValue = reactive([]);
watch(
  () => props.modelValue,
  (current) => {
    //if (!deepEqual(formfields, current))
    Object.assign(formModelValue, current);
    // console.log('Old formModelValue', formModelValue)

    //   Object.keys(formModelValue).forEach((key) => delete formModelValue[key]);
    //   Object.keys(current).forEach((key) => (formModelValue[key] = current[key]));
    console.log("SF Updated Model Value", formModelValue.name);
  },
  { deep: true, immediate: true }
);

watch(
  formModelValue,
  (current, previous) => {
    //console.log( 'current', current)
    //if (!deepEqual(current, previous))
    //emit('update:modelValue', current)
    console.log("SF Updated Form Value", formModelValue.name);
    emit("update:modelValue", current);
  },
  { deep: true }
);

// methodes possibly called from outside, so pass on to our form
const validate = () => {
  return tableEl.value.validate();
};
const resetFields = () => {
  tableEl.value.resetFields();
};
defineExpose({ validate, resetFields });

const validationRules = computed(() => {
  // no rules for readonly
  if (props.formMode === "Readonly Dense" || props.formMode === "Readonly Full")
    return {};

  let rulesObj = {};
  for (var propertyName in props.properties) {
    const property = props.properties[propertyName];

    let rulesArr = [];

    if (props.requiredArr.includes(propertyName)) {
      rulesArr.push({
        required: true,
        message: property.title + " is required.",
      });
    }

    if (property.minLength) {
      rulesArr.push({
        min: property.minLength,
        message: "Please enter at least " + property.minLength + " characters.",
      });
    }

    // email
    if (property.format) {
      if (property.format === "email") {
        rulesArr.push({
          type: "email",
          message: "Please enter a valid email address. eg: name@provider.com",
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
});

const notReadonlyDenseAndEmpty = (
  formMode: string,
  dataObj: object[],
  type: string
) => {
  if (
    formMode === "Readonly Dense" &&
    (!dataObj || // modelValue is empty
      (type === "array" && !dataObj.length) || // modelValue is an array and is empty
      (type === "object" && !Object.keys(dataObj).length)) // modelValue is an object and is empty
  )
    return false;
  return true;
};

const dynamicComp = [
  { name: "Html", comp: Html },
  { name: "Image", comp: Image },
  { name: "Json", comp: Json },
  { name: "NestedObject", comp: NestedObject },
  { name: "Number", comp: Number },
  { name: "ObjectsArray", comp: ObjectsArray },
  { name: "SelectArrayQuery", comp: SelectArrayQuery },
  { name: "SelectStringEnum", comp: SelectStringEnum },
  { name: "SelectStringQuery", comp: SelectStringQuery },
  { name: "String", comp: String },
  { name: "SubForm", comp: SubForm },
  { name: "TableArray", comp: TableArray },
];
interface IProperty {
  type: string;
  contentMediaType: string;
  argoQuery: object;
  enum: string[];
  format: string;
  properties: object;
  items: {
    type: string;
    properties: object;
    argoQuery: object;
  };
  displayAs: string;
}
const getComponent = (property: IProperty) => {
  // Determin the control type
  const getControlName = () => {
    if (property.type === "string") {
      if (property.contentMediaType) {
        // HTML
        if (property.contentMediaType === "text/html") return "Html";
        // Image
        else if (property.contentMediaType.startsWith("image/")) return "Image";
        // Javascript, Json
        else return "Json";
      }

      // Select
      else if (property.argoQuery) return "SelectStringQuery";
      // Enumeration
      else if (property.enum) return "SelectStringEnum";
      // Date time
      else if (property.format === "date-time") return "ElDatePicker";
      // Text
      else return "String";
    }

    // Number
    else if (property.type === "number") return "Number";
    // Integer
    else if (property.type === "integer") return "Number";
    // Boolean
    else if (property.type === "boolean") return "ElCheckbox";
    // Object
    else if (property.type === "object" && property.properties)
      return "NestedObject";
    // Array
    else if (property.type === "array" && property.items) {
      // objects
      if (property.items.type === "object" && property.items.properties) {
        // objects in a table
        if (property.displayAs === "Table") return "TableArray";
        // objects in a subform
        else return "ObjectsArray";
      }

      // multi select
      else if (property.items.type === "string") {
        if (property.items.argoQuery) return "SelectArrayQuery";
        else return "Json";
      }
    }

    // unknown
    return "Json";
  };

  const nameComp = dynamicComp.find((item) => item.name === getControlName());
  if (!nameComp) console.error(`controlName not declared: ${getControlName()}`);
  return nameComp.comp;
};
</script>

<template>
    <!-- row-key="_id" -->
  <el-table
    class="tableEl"
    :data="modelValue"
    style="width: 100%"
    highlight-current-row
    @current-change="
      (currentRow) =>
        updateNextLevelHash(hashLevel, currentRow._id, currentRow.treeVars.nodesPageId )
    "
  >
    <!-- :prop is needed for validation rules -->
    <el-table-column
      v-for="(property, propertyName) in properties"
      :key="propertyName"
      :label="property.title"
      :prop="propertyName"
    >
      <!-- Header with tooltip. -->
      <template #header>
        <span>{{ property.title + " " }}</span>
        <el-tooltip
          v-if="property.description"
          effect="light"
          :content="property.description"
          raw-content
        >
          <svg class="icon" height="1em" width="1em" color="blue">
            <use
              xmlns:xlink="http://www.w3.org/1999/xlink"
              :xlink:href="'toolbar-symbols.svg#el-icon-info'"
            ></use>
          </svg>
        </el-tooltip>
      </template>

      <!-- The control -->
      <template #default="scope">
        <!-- 
          ar-control-selector is a functional component that that replaces itself with a control component
          depending on property type. It also performs some magic on certain property.attrs
          - readonly is used by standard input elements to disable input and by css to remove blue border
          - required is used by Selects to optionaly add a clear button (or a None option in the case of radio buttons)
          - hash-level is used by Selects with a argoQuery (to get selectedObjectId from hash)
          - property and form-mode are passed in case we're creating a subForm
          - We use the v-model pattern to send/recieve data to/from child components. 
            Below, we watch for changes to modelValue and emit input events accordingly.
          -->
        <component
          :is="getComponent(property)"
          class="ar-control"
          v-model="scope.row[propertyName]"
          :property="property"
          :readonly="formMode.startsWith('Readonly')"
          :required="requiredArr.includes(propertyName)"
          :hash-level="hashLevel"
          :form-mode="formMode"
        ></component>
        <!-- <ar-control-selector
            class="ar-control"
            v-model="scope.row[propertyName]"
            :property="property"
            :readonly="formMode.startsWith('Readonly')"
            :required="requiredArr.includes(propertyName)"
            :hash-level="hashLevel"
            :form-mode="formMode"
        ></ar-control-selector> -->
      </template>
    </el-table-column>
  </el-table>
</template>
<!--
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
    modelValue: {
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
      return this.$refs["tableEl"].validate();
    },
    resetFields() {
      this.$refs["tableEl"].resetFields();
    },
  },
  
  watch: {
    modelValue: {
      handler(newVal) {
        this.$emit("input", newVal);
      },
      deep: true,
    },
  },
};
</script>
-->
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
