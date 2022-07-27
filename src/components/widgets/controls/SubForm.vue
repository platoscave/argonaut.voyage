<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import toolbarSymbols from "~/assets/toolbar-symbols.svg";

// import ControlSelector from "./ControlSelector";
// /* eslint-disable vue/no-unused-components */
// // on behalf of the control selector
import { ElInput } from "element-plus";
import FormArray from "./FormArray.vue";
import Image from "./Image.vue";
import Input from "./Input.vue";
import Json from "./Json.vue";
import NestedObject from "./NestedObject.vue";
import Number from "./Number.vue";
import TableArray from "./TableArray.vue";
import SelectStringQuery from "./SelectStringQuery.vue";
import SelectStringEnum from "./SelectStringEnum.vue";
import SelectArrayQuery from "./SelectArrayQuery.vue";
import SubForm from "./SubForm.vue";
import TiptapEditor from "./TiptapEditor.vue";

// For some reason I can only add default to requiredArr.
// As soon as I addd others I get wierd compiler erros. I'm clueless.
const props = defineProps({
  hashLevel: Number,
  modelValue: Object,
  properties: Object,
  requiredArr: { type: Array, default: () => [] },
  formMode: String,
})

// const props = defineProps({
//   hashLevel: { type: Number, default: 0 },
//   modelValue: { type: Object, default: () => {} },
//   properties: { type: Object, default: () => {} },
//   requiredArr: { type: Array, default: () => [] },
//   formMode: { type: String, default: "Readonly Dense" },
// })

const formEl = ref(null);

const validate = () => {
  return formEl.value.validate();
};
const resetFields = () => {
  formEl.value.resetFields();
};

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

const dynamicComp = [
  { name: "ElInput", comp: ElInput },
  { name: "FormArray", comp: FormArray },
  { name: "Image", comp: Image },
  { name: "Input", comp: Input },
  { name: "Json", comp: Json },
  { name: "NestedObject", comp: NestedObject },
  { name: "Number", comp: Number },
  { name: "SelectArrayQuery", comp: SelectArrayQuery },
  { name: "SelectStringEnum", comp: SelectStringEnum },
  { name: "SelectStringQuery", comp: SelectStringQuery },
  { name: "SubForm", comp: SubForm },
  { name: "TableArray", comp: TableArray },
  { name: "TiptapEditor", comp: TiptapEditor },
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
        if (property.contentMediaType === "text/html") return "TiptapEditor";
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
      else return "Input";
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
        else return "FormArray";
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
  <!-- Validation rules are provided by a Computed 
  :model and :rules are needed for validation rules. Do not mess with them! You will spend a week trying to figure out why it doesn't work-->
  <el-form
    ref="formEl"
    :model="modelValue"
    :rules="validationRules"
    labelWidth="100px"
    labelPosition="left"
    size="small"
    :show-message="formMode.startsWith('Edit')"
  >
    <div v-for="(property, propertyName) in properties" :key="propertyName">
      <!-- Skip form item if formMode is Readonly Dense and modelValue is empty -->
      <!-- :prop is needed for validation rules! -->
      <el-form-item
        v-if="
          !(
            (
              formMode === 'Readonly Dense' &&
              (!modelValue[propertyName] || // empty modelValue
                (property.type === 'array' &&
                  !modelValue[propertyName].length) || // empty array
                (property.type === 'object' &&
                  !Object.keys(modelValue[propertyName]).length))
            ) // empty object
          )
        "
        :prop="propertyName"
      >
        <!-- Label with tooltip. If no description is provided then :label from above is used. -->
        <template #label>
          <span>{{ property.title + " " }}</span>
          <el-tooltip
            effect="light"
            v-if="property.description"
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
        <!-- 
            The control
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
          v-model="modelValue[propertyName]"
          :property="property"
          :readonly="formMode.startsWith('Readonly')"
          :required="requiredArr.includes(propertyName)"
          :hash-level="hashLevel"
          :form-mode="formMode"
        ></component>
      </el-form-item>
    </div>
  </el-form>
</template>
<!--
<script>
import ControlSelector from "./ControlSelector";
/* eslint-disable vue/no-unused-components */
// on behalf of the control selector
import SelectStringEnum from "./SelectStringEnum";
import SubForm from "./SubForm";
import Image from "./Image";
import Json from "./Json";
import NestedObject from "./NestedObject";
import Number from "./Number";
import FormArray from "./FormArray";
import TableArray from "./TableArray";
import SelectArrayEnum from "./SelectArrayEnum";
import SelectStringQuery from "./SelectStringQuery";
import SelectArrayQuery from "./SelectArrayQuery";
import Tiptap from "./TiptapEditor";

export default {
  name: "ar-sub-form",
  components: {
    "ar-control-selector": ControlSelector,
    "ar-select-string-enum": SelectStringEnum,
    "ar-sub-form": SubForm,
    "ar-image": Image,
    "ar-json": Json,
    "ar-nested-object": NestedObject,
    "ar-number": Number,
    "ar-view-form-array": FormArray,
    "ar-view-table-array": TableArray,
    "ar-select-array-enum": SelectArrayEnum,
    "ar-select-string-query": SelectStringQuery,
    "ar-select-array-query": SelectArrayQuery,
    "ar-tiptap": Tiptap,
  },
  props: {
    modelValue: {
      type: Object,
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
    validationRules: function () {
      // no rules for readonly
      if (
        this.formMode === "Readonly Dense" ||
        this.formMode === "Readonly Full"
      )
        return {};

      let rulesObj = {};
      for (var propertyName in this.properties) {
        const property = this.properties[propertyName];

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
      return this.$refs["formEl"].validate();
    },
    resetFields() {
      this.$refs["formEl"].resetFields();
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
.ar-json-schema-form {
  max-width: 750px;
}
.icon {
  margin-left: 5px;
}
.ar-control >>> .el-input__wrapper {
  background-color: #ffffff08;
  box-shadow: 0 0 0 1px #00adff42;
  /* box-shadow: none; */
}

/* Checkbox Boolean*/
Xlabel.el-checkbox.ar-control {
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

/* Label height */
X.ar-json-schema-form >>> label {
  line-height: 24px;
}

/* Item bottom margin */
.Xar-json-schema-form >>> .el-form-item {
  margin-bottom: 6px;
}

/* Description */
X.ar-json-schema-form >>> .el-form-item__content {
  line-height: 24px;
}

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
  /* border-color: #67c23a88; */
  border-color: none;
}
</style>
